/**
 * 迁移脚本：为 tech_points 表添加 TPD2 同步相关字段
 * 执行日期：2025-12-08
 * 说明：添加 tpd_id, car_models_info, resources_info, knowledge_info 字段
 */

import { DatabaseManager } from '../../config/database';
import { db } from '../../config/database';
import { logger } from '../../shared/lib/logger';

interface MigrationResult {
  success: boolean;
  message: string;
  changes: string[];
}

/**
 * 检查列是否存在
 */
async function columnExists(
  db: DatabaseManager,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const dbType = db.getType();
    
    if (dbType === 'sqlite') {
      // SQLite: 查询 sqlite_master 表
      const result = await db.query(
        `PRAGMA table_info(${tableName})`
      );
      // 确保 result 是数组
      const rows = Array.isArray(result) ? result : [];
      return rows.some((row: any) => row.name === columnName);
    } else {
      // PostgreSQL: 查询 information_schema
      const result = await db.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = $1 AND column_name = $2`,
        [tableName, columnName]
      );
      return result.length > 0;
    }
  } catch (error) {
    logger.error(`检查列是否存在失败: ${error}`);
    return false;
  }
}

/**
 * 执行迁移
 */
export async function migrateAddTPDFields(): Promise<MigrationResult> {
  const changes: string[] = [];
  
  try {
    await db.connect();
    const dbType = db.getType();
    
    logger.info('开始执行迁移：添加 TPD2 同步字段到 tech_points 表');
    
    // 1. 添加 tpd_id 字段
    if (!(await columnExists(db, 'tech_points', 'tpd_id'))) {
      try {
        if (dbType === 'sqlite') {
          await db.query('ALTER TABLE tech_points ADD COLUMN tpd_id VARCHAR(100)');
        } else {
          await db.query('ALTER TABLE tech_points ADD COLUMN IF NOT EXISTS tpd_id VARCHAR(100)');
        }
        changes.push('✅ 添加 tpd_id 字段');
        logger.info('添加 tpd_id 字段成功');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          changes.push('⏭️  tpd_id 字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      changes.push('⏭️  tpd_id 字段已存在');
    }
    
    // 2. 添加 car_models_info 字段
    if (!(await columnExists(db, 'tech_points', 'car_models_info'))) {
      try {
        if (dbType === 'sqlite') {
          await db.query('ALTER TABLE tech_points ADD COLUMN car_models_info TEXT');
        } else {
          await db.query('ALTER TABLE tech_points ADD COLUMN IF NOT EXISTS car_models_info JSONB');
        }
        changes.push('✅ 添加 car_models_info 字段');
        logger.info('添加 car_models_info 字段成功');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          changes.push('⏭️  car_models_info 字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      changes.push('⏭️  car_models_info 字段已存在');
    }
    
    // 3. 添加 resources_info 字段
    if (!(await columnExists(db, 'tech_points', 'resources_info'))) {
      try {
        if (dbType === 'sqlite') {
          await db.query('ALTER TABLE tech_points ADD COLUMN resources_info TEXT');
        } else {
          await db.query('ALTER TABLE tech_points ADD COLUMN IF NOT EXISTS resources_info JSONB');
        }
        changes.push('✅ 添加 resources_info 字段');
        logger.info('添加 resources_info 字段成功');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          changes.push('⏭️  resources_info 字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      changes.push('⏭️  resources_info 字段已存在');
    }
    
    // 4. 添加 knowledge_info 字段
    if (!(await columnExists(db, 'tech_points', 'knowledge_info'))) {
      try {
        if (dbType === 'sqlite') {
          await db.query('ALTER TABLE tech_points ADD COLUMN knowledge_info TEXT');
        } else {
          await db.query('ALTER TABLE tech_points ADD COLUMN IF NOT EXISTS knowledge_info JSONB');
        }
        changes.push('✅ 添加 knowledge_info 字段');
        logger.info('添加 knowledge_info 字段成功');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('already exists')) {
          changes.push('⏭️  knowledge_info 字段已存在');
        } else {
          throw error;
        }
      }
    } else {
      changes.push('⏭️  knowledge_info 字段已存在');
    }
    
    // 5. 创建索引
    try {
      if (dbType === 'sqlite') {
        await db.query('CREATE INDEX IF NOT EXISTS idx_tech_points_tpd_id ON tech_points(tpd_id)');
      } else {
        await db.query('CREATE INDEX IF NOT EXISTS idx_tech_points_tpd_id ON tech_points(tpd_id)');
      }
      changes.push('✅ 创建 tpd_id 索引');
      logger.info('创建 tpd_id 索引成功');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        changes.push('⏭️  tpd_id 索引已存在');
      } else {
        throw error;
      }
    }
    
    logger.info('迁移执行完成', { changes });
    
    return {
      success: true,
      message: '迁移成功完成',
      changes
    };
  } catch (error) {
    logger.error('迁移执行失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '迁移失败',
      changes
    };
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateAddTPDFields()
    .then((result) => {
      console.log('\n迁移结果:');
      console.log(`成功: ${result.success}`);
      console.log(`消息: ${result.message}`);
      console.log('\n变更列表:');
      result.changes.forEach((change) => console.log(`  ${change}`));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('迁移执行异常:', error);
      process.exit(1);
    });
}



