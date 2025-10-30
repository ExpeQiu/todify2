import sqlite3 from 'sqlite3';
import { Pool, PoolClient } from 'pg';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

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
          Logger.error('SQLite连接失败', { error: err.message, path: this.dbPath });
          reject(err);
        } else {
          Logger.info('SQLite数据库连接成功', { path: this.dbPath });
          resolve();
        }
      });
    });
  }

  async query(sql: string, params: unknown[] = []): Promise<unknown> {
    if (!this.db) {
      throw new Error('数据库未连接');
    }

    Logger.database('Executing query', { sql, params });

    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith('select')) {
        this.db!.all(sql, params, (err, rows) => {
          if (err) {
            Logger.error('SQLite query error', { sql, error: err.message });
            reject(err);
          } else {
            Logger.debug('SQLite query result', {
              rowCount: rows.length,
              firstRows: rows.slice(0, 3),
            });
            resolve(rows);
          }
        });
      } else {
        this.db!.run(sql, params, function(err) {
          if (err) {
            Logger.error('SQLite execution error', { sql, error: err.message });
            reject(err);
          } else {
            Logger.debug('SQLite execution result', {
              changes: this.changes,
              lastID: this.lastID,
            });
            resolve({
              lastID: this.lastID,
              changes: this.changes
            });
          }
        });
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close(() => {
          Logger.info('SQLite数据库连接已关闭');
          resolve();
        });
      });
    }
  }
}

// PostgreSQL 连接管理
class PostgreSQLManager {
  private pool: Pool | null = null;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.pool = new Pool(config);
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool!.connect();
      Logger.info('PostgreSQL数据库连接成功');
      client.release();
    } catch (error) {
      Logger.error('PostgreSQL连接失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async query(sql: string, params: unknown[] = []): Promise<unknown> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }

    try {
      Logger.database('Executing PostgreSQL query', { sql, params });
      const result = await this.pool.query(sql, params);
      Logger.debug('PostgreSQL query result', { rowCount: result.rowCount });
      return result.rows;
    } catch (error) {
      Logger.error('PostgreSQL查询错误', {
        sql,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      Logger.info('PostgreSQL数据库连接已关闭');
    }
  }

  getPool(): Pool | null {
    return this.pool;
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

  async query(sql: string, params: unknown[] = []): Promise<unknown> {
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

  // 事务支持
  async transaction(): Promise<{
    query: (sql: string, params?: unknown[]) => Promise<unknown>;
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
  }> {
    if (this.config.type === 'sqlite') {
      await this.query('BEGIN TRANSACTION');
      Logger.debug('Transaction started');

      return {
        query: async (sql: string, params: unknown[] = []) => {
          return await this.query(sql, params);
        },
        commit: async () => {
          await this.query('COMMIT');
          Logger.debug('Transaction committed');
        },
        rollback: async () => {
          await this.query('ROLLBACK');
          Logger.debug('Transaction rolled back');
        }
      };
    } else if (this.config.type === 'postgresql' && this.postgresManager) {
      const pool = this.postgresManager.getPool();
      if (!pool) {
        throw new Error('PostgreSQL pool not initialized');
      }

      const client = await pool.connect();
      await client.query('BEGIN');
      Logger.debug('PostgreSQL transaction started');

      return {
        query: async (sql: string, params: unknown[] = []) => {
          const result = await client.query(sql, params);
          return result.rows;
        },
        commit: async () => {
          await client.query('COMMIT');
          client.release();
          Logger.debug('PostgreSQL transaction committed');
        },
        rollback: async () => {
          await client.query('ROLLBACK');
          client.release();
          Logger.debug('PostgreSQL transaction rolled back');
        }
      };
    }

    throw new Error('数据库管理器未初始化');
  }
}

// 导出单例数据库管理器
export const db = new DatabaseManager();

// 测试数据库连接
export async function testConnection(): Promise<boolean> {
  try {
    await db.connect();
    Logger.info('数据库连接测试成功', { type: db.getType() });
    return true;
  } catch (error) {
    Logger.error('数据库连接测试失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// 执行查询的便捷函数
export async function query(sql: string, params?: unknown[]): Promise<unknown> {
  return await db.query(sql, params || []);
}
