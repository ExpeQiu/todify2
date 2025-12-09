/**
 * 为 knowledge_points 表添加 tech_point_id 字段
 * 如果字段已存在，则跳过
 */

import { DatabaseManager, db } from '../config/database';

async function addTechPointIdToKnowledgePoints(): Promise<void> {
  try {
    console.log('🔗 正在连接数据库...');
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    const dbType = db.getType();
    console.log(`📊 数据库类型: ${dbType}\n`);

    // 检查字段是否已存在
    let columnExists = false;
    if (dbType === 'sqlite') {
      // SQLite 检查字段是否存在
      const tableInfo = await db.query('PRAGMA table_info(knowledge_points)');
      const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
      columnExists = columns.some((col: any) => col.name === 'tech_point_id');
    } else {
      // PostgreSQL 检查字段是否存在
      const checkResult = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'knowledge_points' 
          AND column_name = 'tech_point_id'
        )
      `);
      columnExists = checkResult[0]?.exists === true;
    }

    if (columnExists) {
      console.log('✅ tech_point_id 字段已存在，无需添加');
      return;
    }

    console.log('📝 正在添加 tech_point_id 字段...');

    // 添加字段
    if (dbType === 'sqlite') {
      // SQLite 不支持直接添加 NOT NULL 字段，先添加可空字段
      await db.query(`
        ALTER TABLE knowledge_points 
        ADD COLUMN tech_point_id INTEGER
      `);
      
      // 添加外键约束（SQLite 需要重新创建表）
      console.log('⚠️  SQLite 需要手动添加外键约束');
      console.log('   建议使用以下 SQL 重新创建表或手动添加外键');
    } else {
      // PostgreSQL
      await db.query(`
        ALTER TABLE knowledge_points 
        ADD COLUMN tech_point_id INTEGER,
        ADD CONSTRAINT fk_knowledge_points_tech_point 
        FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
      `);
    }

    // 添加索引
    try {
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_points_tech_point_id 
        ON knowledge_points(tech_point_id)
      `);
      console.log('✅ 已添加索引');
    } catch (error: any) {
      console.warn('⚠️  添加索引失败:', error.message);
    }

    // 添加其他可能缺失的字段（根据 KnowledgePointService 需要的字段）
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
          if (dbType === 'sqlite') {
            await db.query(`
              ALTER TABLE knowledge_points 
              ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
            `);
          } else {
            await db.query(`
              ALTER TABLE knowledge_points 
              ADD COLUMN ${field.name} ${field.type} DEFAULT ${field.default}
            `);
          }
          console.log(`✅ 已添加字段: ${field.name}`);
        } catch (error: any) {
          console.warn(`⚠️  添加字段 ${field.name} 失败:`, error.message);
        }
      }
    }

    console.log('\n✅ 迁移完成！');
  } catch (error: any) {
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    await db.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行迁移
if (require.main === module) {
  addTechPointIdToKnowledgePoints()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { addTechPointIdToKnowledgePoints };
