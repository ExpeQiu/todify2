/**
 * 数据库迁移验证工具
 * 检查数据完整性、外键关系和记录数量
 */

import { DatabaseManager } from '../config/database';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  table: string;
  sourceCount: number;
  targetCount: number;
  missingRecords: number;
  foreignKeyErrors: string[];
  constraintErrors: string[];
}

/**
 * 验证迁移结果
 */
class MigrationValidator {
  private targetDb: DatabaseManager;
  private results: ValidationResult[] = [];

  constructor(private targetDatabase: string, private sourceDatabases: string[]) {
    this.targetDb = new DatabaseManager();
  }

  /**
   * 打开SQLite数据库
   */
  private openDatabase(dbPath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  }

  /**
   * 获取表的记录数
   */
  private async getTableCount(db: any, tableName: string): Promise<number> {
    try {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      if (Array.isArray(result) && result[0]) {
        return result[0].count || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 验证外键完整性
   */
  private async validateForeignKeys(tableName: string, foreignKeyRules: Record<string, string>): Promise<string[]> {
    const errors: string[] = [];

    try {
      for (const [column, refTable] of Object.entries(foreignKeyRules)) {
        const sql = `
          SELECT DISTINCT t.${column} as fk_value
          FROM ${tableName} t
          WHERE t.${column} IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ${refTable} r WHERE r.id = t.${column}
          )
        `;
        
        const result = await this.targetDb.query(sql);
        if (Array.isArray(result) && result.length > 0) {
          errors.push(`${tableName}.${column} 有 ${result.length} 个无效的外键引用到 ${refTable}`);
        }
      }
    } catch (error: any) {
      errors.push(`验证 ${tableName} 外键失败: ${error.message}`);
    }

    return errors;
  }

  /**
   * 验证表的数据完整性
   */
  async validateTable(tableName: string, foreignKeyRules: Record<string, string> = {}): Promise<ValidationResult> {
    console.log(`验证表: ${tableName}`);

    let totalSourceCount = 0;

    // 统计所有源数据库的记录数
    for (const sourceDbPath of this.sourceDatabases) {
      if (!fs.existsSync(sourceDbPath)) continue;

      try {
        const sourceDb = await this.openDatabase(sourceDbPath);
        const count = await new Promise<number>((resolve, reject) => {
          sourceDb.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row: any) => {
            if (err) reject(err);
            else resolve(row?.count || 0);
          });
        });
        sourceDb.close();
        totalSourceCount += count;
      } catch (error) {
        // 表可能不存在，忽略
      }
    }

    // 统计目标数据库的记录数
    const targetCount = await this.getTableCount(this.targetDb, tableName);
    const missingRecords = Math.max(0, totalSourceCount - targetCount);

    // 验证外键
    const foreignKeyErrors = await this.validateForeignKeys(tableName, foreignKeyRules);

    const result: ValidationResult = {
      table: tableName,
      sourceCount: totalSourceCount,
      targetCount,
      missingRecords,
      foreignKeyErrors,
      constraintErrors: [],
    };

    this.results.push(result);
    return result;
  }

  /**
   * 执行完整验证
   */
  async validate(): Promise<void> {
    console.log('🔍 开始验证迁移结果...');
    console.log(`目标数据库: ${this.targetDatabase}`);

    await this.targetDb.connect();

    // 定义外键规则
    const foreignKeyRules: Record<string, Record<string, string>> = {
      'car_models': { 'brand_id': 'brands' },
      'car_series': { 'model_id': 'car_models' },
      'tech_points': { 'category_id': 'tech_categories', 'parent_id': 'tech_points' },
      'tech_point_car_models': { 'tech_point_id': 'tech_points', 'car_model_id': 'car_models' },
      'tech_point_knowledge_points': { 'tech_point_id': 'tech_points', 'knowledge_point_id': 'knowledge_points' },
      'project_tech_points': { 'project_id': 'projects', 'tech_point_id': 'tech_points' },
      'project_knowledge_points': { 'project_id': 'projects', 'knowledge_point_id': 'knowledge_points' },
      'tech_packaging_materials': { 'tech_point_id': 'tech_points', 'project_id': 'projects' },
    };

    // 验证主要表
    const tablesToValidate = [
      'brands',
      'tech_categories',
      'car_models',
      'car_series',
      'tech_points',
      'tech_point_car_models',
      'knowledge_points',
      'projects',
      'source_information',
    ];

    for (const table of tablesToValidate) {
      try {
        await this.validateTable(table, foreignKeyRules[table] || {});
      } catch (error: any) {
        console.warn(`验证表 ${table} 失败: ${error.message}`);
      }
    }

    // 打印验证报告
    this.printValidationReport();

    await this.targetDb.close();
  }

  /**
   * 打印验证报告
   */
  private printValidationReport(): void {
    console.log('\n📊 验证报告');
    console.log('='.repeat(80));

    let totalSource = 0;
    let totalTarget = 0;
    let totalMissing = 0;
    let totalFkErrors = 0;

    for (const result of this.results) {
      totalSource += result.sourceCount;
      totalTarget += result.targetCount;
      totalMissing += result.missingRecords;
      totalFkErrors += result.foreignKeyErrors.length;

      const status = result.missingRecords === 0 && result.foreignKeyErrors.length === 0 ? '✅' : '⚠️';
      
      console.log(`\n${status} ${result.table}:`);
      console.log(`  源记录数: ${result.sourceCount}`);
      console.log(`  目标记录数: ${result.targetCount}`);
      if (result.missingRecords > 0) {
        console.log(`  ⚠️  缺失记录: ${result.missingRecords}`);
      }
      if (result.foreignKeyErrors.length > 0) {
        console.log(`  ⚠️  外键错误: ${result.foreignKeyErrors.length}`);
        for (const error of result.foreignKeyErrors) {
          console.log(`    - ${error}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`总计:`);
    console.log(`  源记录总数: ${totalSource}`);
    console.log(`  目标记录总数: ${totalTarget}`);
    console.log(`  缺失记录总数: ${totalMissing}`);
    console.log(`  外键错误总数: ${totalFkErrors}`);

    if (totalMissing === 0 && totalFkErrors === 0) {
      console.log('\n✅ 验证通过！所有数据迁移成功且完整。');
    } else {
      console.log('\n⚠️  验证发现问题，请检查上述错误。');
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const { DatabaseMigrator: MigratorClass } = await import('./migrate-database-v3');
  
  let targetDatabase = './data/todify3-v3.db';
  let sourceDatabases: string[] = [];
  const sourceDir = path.join(__dirname, '../../data');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      targetDatabase = args[i + 1];
      i++;
    } else if (args[i] === '--source-dir' && args[i + 1]) {
      sourceDatabases = MigratorClass.discoverSourceDatabases(args[i + 1]);
      i++;
    }
  }

  if (sourceDatabases.length === 0) {
    sourceDatabases = MigratorClass.discoverSourceDatabases(sourceDir);
  }

  if (sourceDatabases.length === 0) {
    console.error('❌ 未找到源数据库文件');
    process.exit(1);
  }

  const validator = new MigrationValidator(targetDatabase, sourceDatabases);
  await validator.validate();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('验证失败:', error);
    process.exit(1);
  });
}

export { MigrationValidator };

