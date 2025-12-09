/**
 * 创建 knowledge_points 表（包含 tech_point_id 字段）
 */

import { DatabaseManager, db } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function createKnowledgePointsTable(): Promise<void> {
  try {
    console.log('🔗 正在连接数据库...');
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    const dbType = db.getType();
    console.log(`📊 数据库类型: ${dbType}\n`);

    // 检查表是否已存在
    let tableExists = false;
    if (dbType === 'sqlite') {
      const result = await db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = 'knowledge_points'
      `);
      tableExists = Array.isArray(result) && result.length > 0;
    } else {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'knowledge_points'
        )
      `);
      tableExists = result[0]?.exists === true;
    }

    if (tableExists) {
      console.log('✅ knowledge_points 表已存在');
      
      // 检查是否有 tech_point_id 字段
      let hasTechPointId = false;
      if (dbType === 'sqlite') {
        const tableInfo = await db.query('PRAGMA table_info(knowledge_points)');
        const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
        hasTechPointId = columns.some((col: any) => col.name === 'tech_point_id');
      } else {
        const checkResult = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'knowledge_points' 
            AND column_name = 'tech_point_id'
          )
        `);
        hasTechPointId = checkResult[0]?.exists === true;
      }

      if (!hasTechPointId) {
        console.log('📝 添加 tech_point_id 字段...');
        await db.query(`
          ALTER TABLE knowledge_points 
          ADD COLUMN tech_point_id INTEGER
        `);
        console.log('✅ 已添加 tech_point_id 字段');
      }

      // 检查其他必要字段
      const requiredFields = [
        { name: 'knowledge_type', type: 'TEXT', default: "'concept'" },
        { name: 'difficulty_level', type: 'TEXT', default: "'medium'" },
        { name: 'prerequisites', type: 'TEXT', default: 'NULL' },
        { name: 'learning_objectives', type: 'TEXT', default: 'NULL' },
        { name: 'examples', type: 'TEXT', default: 'NULL' },
        { name: 'references', type: 'TEXT', default: 'NULL' },
      ];

      for (const field of requiredFields) {
        let fieldExists = false;
        if (dbType === 'sqlite') {
          const tableInfo = await db.query('PRAGMA table_info(knowledge_points)');
          const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
          fieldExists = columns.some((col: any) => col.name === field.name);
        } else {
          const checkResult = await db.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'knowledge_points' 
              AND column_name = $1
            )
          `, [field.name]);
          fieldExists = checkResult[0]?.exists === true;
        }

        if (!fieldExists) {
          try {
            await db.query(`
              ALTER TABLE knowledge_points 
              ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
            `);
            console.log(`✅ 已添加字段: ${field.name}`);
          } catch (error: any) {
            console.warn(`⚠️  添加字段 ${field.name} 失败:`, error.message);
          }
        }
      }

      // 添加索引
      try {
        await db.query(`
          CREATE INDEX IF NOT EXISTS idx_knowledge_points_tech_point_id 
          ON knowledge_points(tech_point_id)
        `);
        console.log('✅ 已添加索引');
      } catch (error: any) {
        // 索引可能已存在，忽略错误
      }

      return;
    }

    console.log('📝 创建 knowledge_points 表...');

    // 创建表（包含所有必要字段）
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS knowledge_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tech_point_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        knowledge_type TEXT DEFAULT 'concept',
        difficulty_level TEXT DEFAULT 'medium',
        tags TEXT,
        prerequisites TEXT,
        learning_objectives TEXT,
        examples TEXT,
        "references" TEXT,
        source_query TEXT,
        source_url TEXT,
        source_type TEXT DEFAULT 'import' CHECK (source_type IN ('ai_search', 'manual', 'import')),
        metadata TEXT,
        relevance_score REAL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
        dify_task_id TEXT,
        ai_search_session_id TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
      )
    `;

    await db.query(createTableSql);
    console.log('✅ knowledge_points 表创建成功');

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_knowledge_points_tech_point_id ON knowledge_points(tech_point_id)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_points_title ON knowledge_points(title)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_points_status ON knowledge_points(status)',
      'CREATE INDEX IF NOT EXISTS idx_knowledge_points_created_at ON knowledge_points(created_at)',
    ];

    for (const indexSql of indexes) {
      try {
        await db.query(indexSql);
      } catch (error: any) {
        console.warn(`⚠️  创建索引失败:`, error.message);
      }
    }
    console.log('✅ 索引创建完成');

    // 创建关联表（如果不存在）
    const createRelationTableSql = `
      CREATE TABLE IF NOT EXISTS tech_point_knowledge_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tech_point_id INTEGER NOT NULL,
        knowledge_point_id INTEGER NOT NULL,
        relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('reference', 'support', 'related', 'example')),
        relevance_score REAL,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
        FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
        UNIQUE(tech_point_id, knowledge_point_id)
      )
    `;

    await db.query(createRelationTableSql);
    console.log('✅ tech_point_knowledge_points 关联表创建成功');

    console.log('\n✅ 所有表创建完成！');
  } catch (error: any) {
    console.error('❌ 创建表失败:', error.message);
    throw error;
  } finally {
    await db.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行创建
if (require.main === module) {
  createKnowledgePointsTable()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createKnowledgePointsTable };
