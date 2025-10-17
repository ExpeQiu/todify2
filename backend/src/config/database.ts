import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// 数据库类型
export type DatabaseType = 'sqlite' | 'postgresql';

// 数据库配置接口
interface DatabaseConfig {
  type: DatabaseType;
  sqlite?: {
    path: string;
  };
  postgresql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

// 获取数据库配置
export function getDatabaseConfig(): DatabaseConfig {
  const dbType = (process.env.DB_TYPE || 'sqlite') as DatabaseType;
  
  const config: DatabaseConfig = {
    type: dbType
  };

  if (dbType === 'sqlite') {
    config.sqlite = {
      path: process.env.SQLITE_DB_PATH || './data/todify2.db'
    };
  } else {
    config.postgresql = {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'todify2'
    };
  }

  return config;
}

// SQLite 连接管理
class SQLiteManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 确保数据目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite连接失败:', err);
          reject(err);
        } else {
          console.log('✅ SQLite数据库连接成功');
          resolve();
        }
      });
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        this.db!.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        this.db!.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            lastID: this.lastID, 
            changes: this.changes 
          });
        });
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close(() => {
          console.log('SQLite数据库连接已关闭');
          resolve();
        });
      });
    }
  }
}

// PostgreSQL 连接管理
class PostgreSQLManager {
  private pool: Pool | null = null;

  constructor(config: any) {
    this.pool = new Pool(config);
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool!.connect();
      console.log('✅ PostgreSQL数据库连接成功');
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL连接失败:', error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('PostgreSQL查询错误:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('PostgreSQL数据库连接已关闭');
    }
  }
}

// 数据库管理器
export class DatabaseManager {
  private sqliteManager: SQLiteManager | null = null;
  private postgresManager: PostgreSQLManager | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = getDatabaseConfig();
    this.initializeManager();
  }

  private initializeManager(): void {
    if (this.config.type === 'sqlite' && this.config.sqlite) {
      this.sqliteManager = new SQLiteManager(this.config.sqlite.path);
    } else if (this.config.type === 'postgresql' && this.config.postgresql) {
      this.postgresManager = new PostgreSQLManager(this.config.postgresql);
    }
  }

  async connect(): Promise<void> {
    if (this.config.type === 'sqlite' && this.sqliteManager) {
      await this.sqliteManager.connect();
    } else if (this.config.type === 'postgresql' && this.postgresManager) {
      await this.postgresManager.connect();
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (this.config.type === 'sqlite' && this.sqliteManager) {
      return await this.sqliteManager.query(sql, params);
    } else if (this.config.type === 'postgresql' && this.postgresManager) {
      return await this.postgresManager.query(sql, params);
    }
    throw new Error('数据库管理器未初始化');
  }

  async close(): Promise<void> {
    if (this.config.type === 'sqlite' && this.sqliteManager) {
      await this.sqliteManager.close();
    } else if (this.config.type === 'postgresql' && this.postgresManager) {
      await this.postgresManager.close();
    }
  }

  getType(): DatabaseType {
    return this.config.type;
  }

  // 事务支持（简化版本）
  async transaction(): Promise<{
    query: (sql: string, params?: any[]) => Promise<any>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
  }> {
    // 简化的事务实现，实际项目中需要更完善的事务管理
    return {
      query: async (sql: string, params: any[] = []) => {
        return await this.query(sql, params);
      },
      commit: async () => {
        // 在实际实现中，这里应该提交事务
        return Promise.resolve();
      },
      rollback: async () => {
        // 在实际实现中，这里应该回滚事务
        return Promise.resolve();
      }
    };
  }
}

// 导出单例数据库管理器
export const db = new DatabaseManager();

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    await db.connect();
    console.log('✅ SQLite数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return false;
  }
}

// 执行查询的便捷函数
export async function query(sql: string, params?: any[]): Promise<any> {
  return await db.query(sql, params || []);
}