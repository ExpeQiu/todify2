/**
 * 修复项目关联关系脚本
 * 确保所有关联表都存在且 conversations 表有 project_id 字段
 */

import { getDatabaseManager } from '../config/database';
import { logger } from '../shared/lib/logger';
import * as fs from 'fs';
import * as path from 'path';

async function fixProjectRelations() {
  const db = getDatabaseManager();
  
  try {
    await db.connect();
    logger.info('开始修复项目关联关系...');

    // 1. 确保 conversations 表有 project_id 字段
    logger.info('检查并修复 conversations 表...');
    try {
      const hasProjectId = await checkColumnExists(db, 'conversations', 'project_id');
      if (!hasProjectId) {
        logger.info('为 conversations 表添加 project_id 字段...');
        await db.query('ALTER TABLE conversations ADD COLUMN project_id INTEGER');
        logger.info('✓ 已添加 project_id 字段');
      } else {
        logger.info('✓ conversations 表已有 project_id 字段');
      }

      // 创建索引
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id)
      `);
      logger.info('✓ 已创建索引');
    } catch (error: any) {
      if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
        logger.info('✓ project_id 字段已存在');
      } else {
        logger.error('修复 conversations 表失败:', error);
        throw error;
      }
    }

    // 2. 确保所有关联表存在
    const relationTables = [
      {
        name: 'project_tech_points',
        sql: `
          CREATE TABLE IF NOT EXISTS project_tech_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            tech_point_id INTEGER NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
            UNIQUE(project_id, tech_point_id)
          )
        `
      },
      {
        name: 'project_knowledge_points',
        sql: `
          CREATE TABLE IF NOT EXISTS project_knowledge_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            knowledge_point_id INTEGER NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
            UNIQUE(project_id, knowledge_point_id)
          )
        `
      },
      {
        name: 'project_files',
        sql: `
          CREATE TABLE IF NOT EXISTS project_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            file_id TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
            UNIQUE(project_id, file_id)
          )
        `
      },
      {
        name: 'project_source_informations',
        sql: `
          CREATE TABLE IF NOT EXISTS project_source_informations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            source_information_id INTEGER NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (source_information_id) REFERENCES source_information(id) ON DELETE CASCADE,
            UNIQUE(project_id, source_information_id)
          )
        `
      }
    ];

    for (const { name, sql } of relationTables) {
      logger.info(`检查并创建 ${name} 表...`);
      try {
        await db.query(sql);
        
        // 创建索引
        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_${name}_project_id ON ${name}(project_id)
        `);
        
        logger.info(`✓ ${name} 表已就绪`);
      } catch (error: any) {
        logger.error(`创建 ${name} 表失败:`, error);
        throw error;
      }
    }

    logger.info('\n✓ 所有关联关系已修复完成！');

  } catch (error) {
    logger.error('修复过程出错:', error);
    throw error;
  } finally {
    await db.close();
  }
}

async function checkColumnExists(db: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.query(`PRAGMA table_info(${tableName})`);
    return result.some((col: any) => col.name === columnName);
  } catch {
    return false;
  }
}

// 运行修复
if (require.main === module) {
  fixProjectRelations()
    .then(() => {
      logger.info('修复完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('修复失败:', error);
      process.exit(1);
    });
}

export { fixProjectRelations };





