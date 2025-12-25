/**
 * Todify3 数据库迁移工具 v3.0
 * 功能：从多个历史数据库文件合并迁移数据到新数据库
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from '../config/database';

// 迁移配置接口
interface MigrationConfig {
  sourceDatabases: string[]; // 源数据库文件路径列表
  targetDatabase: string; // 目标数据库路径
  backupPath?: string; // 备份目录路径
}

// 表迁移顺序（按依赖关系）
const TABLE_MIGRATION_ORDER = [
  // 第一层：基础数据层
  'brands',
  'tech_categories',
  'car_models',
  'car_series',
  'tech_points',
  // 第二层：关联关系层
  'tech_point_car_models',
  // 第三层：AI内容生成层
  'knowledge_points',
  'tech_point_knowledge_points',
  'knowledge_point_favorites',
  'tech_packaging_materials',
  'tech_promotion_strategies',
  'tech_press_releases',
  'tech_speeches',
  'promotion_tech_points',
  'press_tech_points',
  'speech_tech_points',
  // 第四层：工作流与对话层
  'agent_workflows',
  'workflow_templates',
  'conversations',
  'chat_messages',
  'workflow_executions',
  'knowledge_usage_logs',
  // 第五层：配置与统计层
  'ai_roles',
  'public_page_configs',
  'page_tool_configs',
  'files',
  'workflow_node_usage',
  'ai_qa_feedback',
  'workflow_session_stats',
  'node_content_processing',
  'workflow_stats_summary',
  // 项目管理相关
  'projects',
  'project_sources',
  'project_tech_points',
  'project_knowledge_points',
  'project_files',
  'project_source_informations',
  // 来源信息
  'source_information',
  // 公共知识库
  'public_knowledge_categories',
  'public_knowledge_files',
  // 生成内容关联
  'tech_packaging_conversations',
  'tech_packaging_sources',
  'tech_promotion_conversations',
  'tech_promotion_sources',
  'tech_press_conversations',
  'tech_press_sources',
];

// ID映射记录
interface IdMapping {
  sourceDbName: string;
  sourceTableName: string;
  sourceId: number | string;
  targetId: number | string;
}

/**
 * 数据库迁移工具类
 */
class DatabaseMigrator {
  private targetDb: DatabaseManager;
  private idMappings: Map<string, Map<string | number, string | number>> = new Map();
  private migrationLog: Array<{ table: string; sourceDb: string; count: number; errors: string[] }> = [];

  constructor(private config: MigrationConfig) {
    // 创建目标数据库管理器 - 使用目标数据库路径
    this.targetDb = new DatabaseManager();
    // 临时设置环境变量以使用目标数据库
    process.env.SQLITE_DB_PATH = config.targetDatabase;
  }

  /**
   * 扫描并发现所有源数据库文件
   */
  static discoverSourceDatabases(dataDir: string): string[] {
    const databases: string[] = [];
    
    if (!fs.existsSync(dataDir)) {
      console.warn(`数据目录不存在: ${dataDir}`);
      return databases;
    }

    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      // 过滤掉隐藏文件和资源分叉文件
      if (file.startsWith('.') || file.startsWith('._')) {
        continue;
      }
      if (file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.sqlite3')) {
        const dbPath = path.join(dataDir, file);
        if (fs.statSync(dbPath).isFile()) {
          databases.push(dbPath);
        }
      }
    }

    return databases;
  }

  /**
   * 打开SQLite数据库连接
   */
  private openDatabase(dbPath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  }

  /**
   * 获取数据库的所有表
   */
  private async getTables(db: sqlite3.Database): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        [],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map(row => row.name));
          }
        }
      );
    });
  }

  /**
   * 获取表结构信息
   */
  private async getTableSchema(db: sqlite3.Database, tableName: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.name));
        }
      });
    });
  }

  /**
   * 检查表是否存在
   */
  private async tableExists(db: DatabaseManager, tableName: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 保存ID映射
   */
  private async saveIdMapping(
    sourceDbName: string,
    sourceTableName: string,
    sourceId: number | string,
    targetId: number | string
  ): Promise<void> {
    const key = `${sourceDbName}::${sourceTableName}`;
    if (!this.idMappings.has(key)) {
      this.idMappings.set(key, new Map());
    }
    this.idMappings.get(key)!.set(sourceId, targetId);

    // 保存到数据库
    try {
      await this.targetDb.query(
        `INSERT OR REPLACE INTO id_mappings 
         (source_db_name, source_table_name, source_id, target_id) 
         VALUES (?, ?, ?, ?)`,
        [sourceDbName, sourceTableName, sourceId, targetId]
      );
    } catch (error) {
      console.warn(`保存ID映射失败: ${error}`);
    }
  }

  /**
   * 获取映射后的ID
   */
  private getMappedId(
    sourceDbName: string,
    sourceTableName: string,
    sourceId: number | string
  ): number | string | null {
    const key = `${sourceDbName}::${sourceTableName}`;
    const mapping = this.idMappings.get(key);
    return mapping ? mapping.get(sourceId) || null : null;
  }

  /**
   * 迁移单个表的数据
   */
  private async migrateTable(
    sourceDb: sqlite3.Database,
    sourceDbName: string,
    tableName: string
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // 检查源表是否存在
      const sourceTables = await this.getTables(sourceDb);
      if (!sourceTables.includes(tableName)) {
        console.log(`  ⏭️  表 ${tableName} 在源数据库中不存在，跳过`);
        return { count: 0, errors: [] };
      }

      // 检查目标表是否存在
      if (!(await this.tableExists(this.targetDb, tableName))) {
        console.log(`  ⏭️  表 ${tableName} 在目标数据库中不存在，跳过`);
        return { count: 0, errors: [`目标表 ${tableName} 不存在`] };
      }

      // 获取源表和目标表的字段
      const sourceColumns = await this.getTableSchema(sourceDb, tableName);
      const targetColumns = await this.getTableSchema(
        await this.openDatabase(this.config.targetDatabase),
        tableName
      );

      // 找到共同字段
      const commonColumns = sourceColumns.filter(col => targetColumns.includes(col));
      if (commonColumns.length === 0) {
        return { count: 0, errors: [`表 ${tableName} 没有共同字段`] };
      }

      // 查询源数据
      const selectColumns = commonColumns.join(', ');
      const sourceRows: any[] = await new Promise((resolve, reject) => {
        sourceDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (sourceRows.length === 0) {
        return { count: 0, errors: [] };
      }

      console.log(`  📦 迁移 ${sourceRows.length} 条记录...`);

      // 迁移每条记录
      for (const row of sourceRows) {
        try {
          // 处理ID映射（对于INTEGER主键的表）
          let targetId: number | string | undefined;
          const originalId = row.id;

          if (tableName === 'brands' || tableName === 'tech_categories' || 
              tableName === 'car_models' || tableName === 'tech_points') {
            // 检查是否已存在（基于唯一字段）
            const existing = await this.findExistingRecord(tableName, row, commonColumns);
            if (existing && existing.id !== undefined && existing.id !== null) {
              targetId = existing.id;
              if (originalId !== undefined && originalId !== null && targetId !== undefined && targetId !== null) {
                await this.saveIdMapping(sourceDbName, tableName, originalId, targetId);
              }
              continue; // 跳过已存在的记录
            }
          }

          // 准备插入数据
          const values: any[] = [];
          const placeholders: string[] = [];
          const insertColumns: string[] = [];

          for (const col of commonColumns) {
            let value = row[col];

            // 处理外键映射
            if (this.needsIdMapping(tableName, col)) {
              const mappedId = this.getMappedId(sourceDbName, this.getMappingTable(col), value);
              if (mappedId !== null) {
                value = mappedId;
              } else if (value !== null && value !== undefined) {
                // 外键找不到映射，跳过这条记录
                errors.push(`表 ${tableName} 记录 ID=${originalId}: 外键 ${col}=${value} 找不到映射`);
                continue;
              }
            }

            insertColumns.push(col);
            values.push(value);
            placeholders.push('?');
          }

          if (insertColumns.length === 0) {
            continue;
          }

          // 插入数据
          const insertSql = `INSERT OR IGNORE INTO ${tableName} (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
          const result = await this.targetDb.query(insertSql, values);

          // 获取新插入的ID
          if (targetId === undefined) {
            if (typeof originalId === 'number') {
              const lastInsert = await this.targetDb.query('SELECT last_insert_rowid() as id');
              targetId = Array.isArray(lastInsert) && lastInsert[0] ? lastInsert[0].id : originalId;
            } else {
              targetId = originalId; // TEXT主键直接使用
            }
          }

          // 保存ID映射
          if (originalId !== undefined && originalId !== null && targetId !== undefined && targetId !== null) {
            await this.saveIdMapping(sourceDbName, tableName, originalId, targetId);
          }

          count++;
        } catch (error: any) {
          errors.push(`表 ${tableName} 记录 ID=${row.id}: ${error.message}`);
        }
      }

      console.log(`  ✅ 成功迁移 ${count} 条记录`);
      if (errors.length > 0) {
        console.log(`  ⚠️  有 ${errors.length} 个错误`);
      }

    } catch (error: any) {
      errors.push(`迁移表 ${tableName} 失败: ${error.message}`);
    }

    return { count, errors };
  }

  /**
   * 检查字段是否需要ID映射
   */
  private needsIdMapping(tableName: string, columnName: string): boolean {
    const mappingRules: Record<string, string[]> = {
      'car_models': ['brand_id'],
      'car_series': ['model_id'],
      'tech_points': ['category_id', 'parent_id'],
      'tech_point_car_models': ['tech_point_id', 'car_model_id'],
      'tech_packaging_materials': ['tech_point_id', 'project_id'],
      'project_tech_points': ['project_id', 'tech_point_id'],
      'project_knowledge_points': ['project_id', 'knowledge_point_id'],
      // 添加更多映射规则...
    };

    return mappingRules[tableName]?.includes(columnName) || false;
  }

  /**
   * 获取映射的目标表名
   */
  private getMappingTable(columnName: string): string {
    const mapping: Record<string, string> = {
      'brand_id': 'brands',
      'model_id': 'car_models',
      'category_id': 'tech_categories',
      'tech_point_id': 'tech_points',
      'car_model_id': 'car_models',
      'project_id': 'projects',
      'knowledge_point_id': 'knowledge_points',
      'parent_id': 'tech_points', // 可能需要根据上下文判断
    };

    return mapping[columnName] || '';
  }

  /**
   * 查找已存在的记录（基于唯一字段）
   */
  private async findExistingRecord(
    tableName: string,
    row: any,
    columns: string[]
  ): Promise<any | null> {
    try {
      // 根据表名确定唯一字段
      const uniqueFields: Record<string, string[]> = {
        'brands': ['name'],
        'tech_categories': ['name'],
        'car_models': ['brand_id', 'name'],
        'tech_points': ['name'], // 可能需要结合category_id
      };

      const fields = uniqueFields[tableName];
      if (!fields || fields.length === 0) {
        return null;
      }

      // 构建查询条件
      const conditions: string[] = [];
      const values: any[] = [];

      for (const field of fields) {
        if (columns.includes(field) && row[field] !== null && row[field] !== undefined) {
          conditions.push(`${field} = ?`);
          values.push(row[field]);
        }
      }

      if (conditions.length === 0) {
        return null;
      }

      const sql = `SELECT * FROM ${tableName} WHERE ${conditions.join(' AND ')} LIMIT 1`;
      const result = await this.targetDb.query(sql, values);

      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 执行完整迁移
   */
  async migrate(): Promise<void> {
    console.log('🚀 开始数据库迁移...');
    console.log(`目标数据库: ${this.config.targetDatabase}`);
    console.log(`源数据库数量: ${this.config.sourceDatabases.length}`);

    // 连接目标数据库
    await this.targetDb.connect();

    // 确保id_mappings表存在
    try {
      await this.targetDb.query(`
        CREATE TABLE IF NOT EXISTS id_mappings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_db_name TEXT NOT NULL,
          source_table_name TEXT NOT NULL,
          source_id INTEGER NOT NULL,
          target_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(source_db_name, source_table_name, source_id)
        )
      `);
    } catch (error) {
      console.warn('创建id_mappings表失败:', error);
    }

    // 遍历每个源数据库
    for (const sourceDbPath of this.config.sourceDatabases) {
      const sourceDbName = path.basename(sourceDbPath);
      console.log(`\n📂 处理源数据库: ${sourceDbName}`);

      if (!fs.existsSync(sourceDbPath)) {
        console.warn(`  ⚠️  数据库文件不存在: ${sourceDbPath}`);
        continue;
      }

      let sourceDb: sqlite3.Database | null = null;

      try {
        sourceDb = await this.openDatabase(sourceDbPath);

        // 按顺序迁移表
        for (const tableName of TABLE_MIGRATION_ORDER) {
          console.log(`\n📋 迁移表: ${tableName}`);
          const result = await this.migrateTable(sourceDb, sourceDbName, tableName);
          
          this.migrationLog.push({
            table: tableName,
            sourceDb: sourceDbName,
            count: result.count,
            errors: result.errors,
          });
        }

      } catch (error: any) {
        console.error(`  ❌ 处理数据库 ${sourceDbName} 失败:`, error.message);
      } finally {
        if (sourceDb) {
          await new Promise<void>((resolve) => {
            sourceDb!.close((err) => {
              if (err) console.error('关闭数据库失败:', err);
              resolve();
            });
          });
        }
      }
    }

    // 关闭目标数据库连接
    await this.targetDb.close();

    // 打印迁移报告
    this.printMigrationReport();
  }

  /**
   * 打印迁移报告
   */
  private printMigrationReport(): void {
    console.log('\n📊 迁移报告');
    console.log('='.repeat(60));

    const totalRecords = this.migrationLog.reduce((sum, log) => sum + log.count, 0);
    const totalErrors = this.migrationLog.reduce((sum, log) => sum + log.errors.length, 0);

    console.log(`总迁移记录数: ${totalRecords}`);
    console.log(`总错误数: ${totalErrors}`);

    // 按表分组统计
    const tableStats = new Map<string, { count: number; errors: number }>();
    for (const log of this.migrationLog) {
      if (!tableStats.has(log.table)) {
        tableStats.set(log.table, { count: 0, errors: 0 });
      }
      const stats = tableStats.get(log.table)!;
      stats.count += log.count;
      stats.errors += log.errors.length;
    }

    console.log('\n按表统计:');
    for (const [table, stats] of tableStats.entries()) {
      console.log(`  ${table}: ${stats.count} 条记录, ${stats.errors} 个错误`);
    }

    if (totalErrors > 0) {
      console.log('\n错误详情:');
      for (const log of this.migrationLog) {
        if (log.errors.length > 0) {
          console.log(`\n${log.sourceDb} -> ${log.table}:`);
          for (const error of log.errors.slice(0, 5)) { // 只显示前5个错误
            console.log(`  - ${error}`);
          }
          if (log.errors.length > 5) {
            console.log(`  ... 还有 ${log.errors.length - 5} 个错误`);
          }
        }
      }
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  let sourceDatabases: string[] = [];
  let targetDatabase = './data/todify3-v3.db';

  // 解析命令行参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source-dir' && args[i + 1]) {
      const sourceDir = args[i + 1];
      sourceDatabases = DatabaseMigrator.discoverSourceDatabases(sourceDir);
      i++;
    } else if (args[i] === '--sources' && args[i + 1]) {
      sourceDatabases = args[i + 1].split(',').map(s => s.trim());
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      targetDatabase = args[i + 1];
      i++;
    }
  }

  // 如果没有指定源数据库，使用默认目录
  if (sourceDatabases.length === 0) {
    const defaultDataDir = path.join(__dirname, '../../data');
    sourceDatabases = DatabaseMigrator.discoverSourceDatabases(defaultDataDir);
  }

  if (sourceDatabases.length === 0) {
    console.error('❌ 未找到源数据库文件');
    console.log('用法: ts-node migrate-database-v3.ts --source-dir <目录> --target <目标数据库>');
    process.exit(1);
  }

  const config: MigrationConfig = {
    sourceDatabases,
    targetDatabase,
  };

  const migrator = new DatabaseMigrator(config);
  await migrator.migrate();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
}

export { DatabaseMigrator, MigrationConfig };

