/**
 * 清空技术点数据库数据
 * 按照外键约束顺序删除所有技术点相关的数据
 */

import { DatabaseManager } from '../config/database';

const db = new DatabaseManager();

/**
 * 清空技术点相关的所有数据
 */
async function clearTechPointsData(): Promise<void> {
  try {
    console.log('🔗 正在连接数据库...');
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    const dbType = db.getType();
    console.log(`📊 数据库类型: ${dbType}\n`);

    // 定义需要清空的表，按照外键依赖顺序
    const tablesToClear = [
      // 关联表（有外键约束）
      'tech_point_knowledge_points',
      'tech_point_car_models',
      'promotion_tech_points',
      'press_tech_points',
      'speech_tech_points',
      'tech_packaging_materials',
      // 主表
      'tech_points',
    ];

    console.log('🗑️  开始清空技术点数据...\n');

    let totalDeleted = 0;

    for (const tableName of tablesToClear) {
      try {
        // 先检查表是否存在
        let tableExists = false;
        if (dbType === 'sqlite') {
          const checkResult = await db.query(
            `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
            [tableName]
          );
          tableExists = Array.isArray(checkResult) && checkResult.length > 0;
        } else {
          // PostgreSQL
          const checkResult = await db.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [tableName]
          );
          tableExists = checkResult[0]?.exists === true;
        }

        if (!tableExists) {
          console.log(`⏭️  表 ${tableName} 不存在，跳过`);
          continue;
        }

        // 获取删除前的记录数
        let countBefore = 0;
        if (dbType === 'sqlite') {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          countBefore = countResult[0]?.count || 0;
        } else {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          countBefore = parseInt(countResult[0]?.count || '0');
        }

        if (countBefore === 0) {
          console.log(`✅ 表 ${tableName} 已经是空的`);
          continue;
        }

        // 执行删除
        const deleteSql = `DELETE FROM ${tableName}`;
        await db.query(deleteSql);

        totalDeleted += countBefore;
        console.log(`✅ 已清空表 ${tableName}，删除了 ${countBefore} 条记录`);
      } catch (error: any) {
        console.error(`❌ 清空表 ${tableName} 时出错:`, error.message);
        // 继续处理下一个表
      }
    }

    console.log(`\n✨ 完成！总共删除了 ${totalDeleted} 条记录`);

    // 显示清空后的统计
    console.log('\n📊 清空后的数据统计:');
    for (const tableName of tablesToClear) {
      try {
        let count = 0;
        if (dbType === 'sqlite') {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          count = countResult[0]?.count || 0;
        } else {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          count = parseInt(countResult[0]?.count || '0');
        }
        console.log(`  - ${tableName}: ${count} 条记录`);
      } catch (error) {
        // 表可能不存在，忽略错误
      }
    }

  } catch (error: any) {
    console.error('❌ 清空数据时出错:', error.message);
    throw error;
  } finally {
    await db.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行清空操作
if (require.main === module) {
  clearTechPointsData()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { clearTechPointsData };
