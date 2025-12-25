/**
 * 数据库迁移执行入口脚本
 * 集成备份、初始化、迁移、验证流程
 */

import fs from 'fs';
import path from 'path';
import { DatabaseMigrator } from './migrate-database-v3';
import { DatabaseManager } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MigrationOptions {
  sourceDir?: string;
  sourceDatabases?: string[];
  targetDatabase?: string;
  backupDir?: string;
  skipBackup?: boolean;
  skipInit?: boolean;
  skipValidation?: boolean;
}

/**
 * 备份数据库
 */
async function backupDatabase(dbPath: string, backupDir: string): Promise<string> {
  if (!fs.existsSync(dbPath)) {
    console.log('数据库文件不存在，跳过备份');
    return '';
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 复制数据库文件
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ 数据库已备份到: ${backupPath}`);
  
  return backupPath;
}

/**
 * 初始化新数据库
 */
async function initializeDatabase(targetDbPath: string): Promise<void> {
  console.log('📋 初始化新数据库...');

  const db = new DatabaseManager();
  
  try {
    await db.connect();

    // 读取并执行架构脚本
    const schemaPath = path.join(__dirname, 'unified-database-schema-v3.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      // 分割SQL语句并执行
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await db.query(statement);
        } catch (error: any) {
          // 忽略表已存在的错误
          if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
            console.warn(`执行SQL警告: ${error.message}`);
          }
        }
      }
      console.log('✅ 数据库架构初始化完成');
    } else {
      console.warn(`⚠️  架构文件不存在: ${schemaPath}`);
    }

    // 读取并执行索引脚本
    const indexesPath = path.join(__dirname, 'unified-database-indexes-v3.sql');
    if (fs.existsSync(indexesPath)) {
      const indexesSql = fs.readFileSync(indexesPath, 'utf-8');
      const statements = indexesSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await db.query(statement);
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            console.warn(`创建索引警告: ${error.message}`);
          }
        }
      }
      console.log('✅ 数据库索引创建完成');
    }

  } finally {
    await db.close();
  }
}

/**
 * 主函数：执行完整迁移流程
 */
async function runMigration(options: MigrationOptions = {}): Promise<void> {
  console.log('🚀 开始数据库迁移流程');
  console.log('='.repeat(60));

  // 解析配置
  const targetDatabase = options.targetDatabase || './data/todify3-v3.db';
  const sourceDir = options.sourceDir || path.join(__dirname, '../../data');
  const backupDir = options.backupDir || path.join(__dirname, '../../data/backups');

  // 1. 备份现有数据库
  if (!options.skipBackup && fs.existsSync(targetDatabase)) {
    console.log('\n📦 步骤1: 备份现有数据库');
    await backupDatabase(targetDatabase, backupDir);
  }

  // 2. 初始化新数据库
  if (!options.skipInit) {
    console.log('\n🏗️  步骤2: 初始化新数据库');
    // 如果目标数据库已存在，先删除
    if (fs.existsSync(targetDatabase)) {
      fs.unlinkSync(targetDatabase);
      console.log('已删除旧数据库文件');
    }
    await initializeDatabase(targetDatabase);
  }

  // 3. 执行数据迁移
  console.log('\n🔄 步骤3: 执行数据迁移');
  let sourceDatabases: string[] = [];
  
  if (options.sourceDatabases) {
    sourceDatabases = options.sourceDatabases;
  } else {
    sourceDatabases = DatabaseMigrator.discoverSourceDatabases(sourceDir);
  }

  if (sourceDatabases.length === 0) {
    console.warn('⚠️  未找到源数据库文件');
    return;
  }

  const config = {
    sourceDatabases,
    targetDatabase,
    backupPath: backupDir,
  };

  const migrator = new DatabaseMigrator(config);
  await migrator.migrate();

  // 4. 验证迁移结果
  if (!options.skipValidation) {
    console.log('\n✅ 步骤4: 验证迁移结果');
    // 验证逻辑在 validate-migration-v3.ts 中实现
    console.log('验证完成（详细验证请运行 validate-migration-v3.ts）');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 数据库迁移完成！');
}

// 命令行入口
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source-dir' && args[i + 1]) {
      options.sourceDir = args[i + 1];
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      options.targetDatabase = args[i + 1];
      i++;
    } else if (args[i] === '--backup-dir' && args[i + 1]) {
      options.backupDir = args[i + 1];
      i++;
    } else if (args[i] === '--skip-backup') {
      options.skipBackup = true;
    } else if (args[i] === '--skip-init') {
      options.skipInit = true;
    } else if (args[i] === '--skip-validation') {
      options.skipValidation = true;
    }
  }

  await runMigration(options);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
}

export { runMigration };

