import { DatabaseManager } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 数据库迁移工具
 */
export class MigrationTool {
  private db: DatabaseManager;
  private migrationsDir: string;

  constructor(db: DatabaseManager, migrationsDir: string) {
    this.db = db;
    this.migrationsDir = migrationsDir;
  }

  /**
   * 确保迁移记录表存在
   */
  async ensureMigrationsTable(): Promise<void> {
    await this.db.connect();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS database_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL UNIQUE,
        version TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'rolled_back')),
        error_message TEXT
      );
    `;
    
    await this.db.query(createTableSQL);
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_database_migrations_name ON database_migrations(migration_name);',
      'CREATE INDEX IF NOT EXISTS idx_database_migrations_version ON database_migrations(version);',
      'CREATE INDEX IF NOT EXISTS idx_database_migrations_executed_at ON database_migrations(executed_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_database_migrations_status ON database_migrations(status);',
    ];
    
    for (const indexSQL of indexes) {
      try {
        await this.db.query(indexSQL);
      } catch (error: any) {
        console.warn('创建迁移索引时出现警告:', error.message);
      }
    }
  }

  /**
   * 获取已执行的迁移列表
   */
  async getExecutedMigrations(): Promise<string[]> {
    await this.ensureMigrationsTable();
    
    const sql = 'SELECT migration_name FROM database_migrations WHERE status = ? ORDER BY executed_at';
    const result = await this.db.query(sql, ['success']);
    const rows = Array.isArray(result) ? result : result.rows || [];
    
    return rows.map((row: any) => row.migration_name);
  }

  /**
   * 获取待执行的迁移文件列表
   */
  getMigrationFiles(): string[] {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => {
        // 只包含.sql文件，排除隐藏文件和资源分叉文件
        return file.endsWith('.sql') && 
               !file.startsWith('.') && 
               !file.startsWith('_') &&
               file !== 'README.md';
      })
      .sort();
    
    return files;
  }

  /**
   * 执行单个迁移文件
   */
  async executeMigration(migrationFile: string): Promise<void> {
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`迁移文件不存在: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8').trim();
    const startTime = Date.now();
    
    // 如果SQL为空或只包含注释，跳过执行
    const sqlWithoutComments = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .trim();
    
    if (!sqlWithoutComments) {
      console.log(`⚠ 迁移文件 ${migrationFile} 只包含注释，跳过执行`);
      // 仍然记录为成功
      const executionTime = Date.now() - startTime;
      const recordSQL = `
        INSERT OR REPLACE INTO database_migrations (
          migration_name, version, execution_time_ms, status, error_message
        ) VALUES (?, ?, ?, ?, NULL)
      `;
      await this.db.query(recordSQL, [
        migrationFile,
        '1.0.0',
        executionTime,
        'success'
      ]);
      console.log(`✓ 迁移记录成功: ${migrationFile} (${executionTime}ms)`);
      return;
    }
    
    try {
      // 执行迁移SQL
      await this.db.query(sql);
      
      const executionTime = Date.now() - startTime;
      
      // 记录迁移执行（使用INSERT OR REPLACE处理重复）
      const recordSQL = `
        INSERT OR REPLACE INTO database_migrations (
          migration_name, version, execution_time_ms, status, error_message
        ) VALUES (?, ?, ?, ?, NULL)
      `;
      
      await this.db.query(recordSQL, [
        migrationFile,
        '1.0.0', // 可以从文件名或内容中提取版本号
        executionTime,
        'success'
      ]);
      
      console.log(`✓ 迁移执行成功: ${migrationFile} (${executionTime}ms)`);
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // 记录失败（使用INSERT OR REPLACE）
      const recordSQL = `
        INSERT OR REPLACE INTO database_migrations (
          migration_name, version, execution_time_ms, status, error_message
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      await this.db.query(recordSQL, [
        migrationFile,
        '1.0.0',
        executionTime,
        'failed',
        error.message
      ]);
      
      console.error(`✗ 迁移执行失败: ${migrationFile}`, error);
      throw error;
    }
  }

  /**
   * 执行所有待执行的迁移
   */
  async migrate(): Promise<void> {
    await this.ensureMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = this.getMigrationFiles();
    const pendingMigrations = allMigrations.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('没有待执行的迁移');
      return;
    }
    
    console.log(`发现 ${pendingMigrations.length} 个待执行的迁移`);
    
    for (const migrationFile of pendingMigrations) {
      await this.executeMigration(migrationFile);
    }
    
    console.log('所有迁移执行完成');
  }

  /**
   * 获取迁移状态
   */
  async getStatus(): Promise<{
    executed: number;
    pending: number;
    failed: number;
  }> {
    await this.ensureMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = this.getMigrationFiles();
    const pendingMigrations = allMigrations.filter(
      file => !executedMigrations.includes(file)
    );
    
    // 获取失败的迁移
    const failedSQL = 'SELECT COUNT(*) as count FROM database_migrations WHERE status = ?';
    const failedResult: any = await this.db.query(failedSQL, ['failed']);
    const failedCount = Array.isArray(failedResult) 
      ? failedResult[0]?.count || 0
      : failedResult.rows?.[0]?.count || 0;
    
    return {
      executed: executedMigrations.length,
      pending: pendingMigrations.length,
      failed: failedCount
    };
  }
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  (async () => {
    const db = new DatabaseManager();
    const migrationsDir = path.join(__dirname, 'migrations');
    const tool = new MigrationTool(db, migrationsDir);
    
    try {
      await tool.migrate();
      const status = await tool.getStatus();
      console.log('迁移状态:', status);
    } catch (error) {
      console.error('迁移失败:', error);
      process.exit(1);
    } finally {
      await db.close();
    }
  })();
}

