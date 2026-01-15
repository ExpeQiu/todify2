/**
 * 数据迁移脚本：统一 source_information 表的关联方式
 * 
 * 功能：
 * 1. 将 page_type='project-{id}' 格式的记录迁移到 project_id 字段
 * 2. 将 project_source_informations 关联表中的关系同步到 project_id 字段
 * 3. 确保数据迁移的幂等性（可重复执行）
 * 
 * 使用方法：
 * npm run migrate:source-relations
 */

import { DatabaseManager, db } from '../config/database';

interface MigrationResult {
  success: boolean;
  migratedFromPageType: number;
  migratedFromRelationTable: number;
  errors: string[];
}

/**
 * 执行数据迁移
 */
async function migrateSourceRelations(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedFromPageType: 0,
    migratedFromRelationTable: 0,
    errors: [],
  };

  try {
    console.log('开始迁移 source_information 关联关系...');

    // 步骤1: 迁移 page_type='project-{id}' 格式的记录
    try {
      const pageTypeSql = `
        UPDATE source_information
        SET project_id = CAST(SUBSTR(page_type, 9) AS INTEGER)
        WHERE page_type LIKE 'project-%'
          AND project_id IS NULL
          AND SUBSTR(page_type, 9) GLOB '[0-9]*'
      `;
      
      const pageTypeResult = await db.query(pageTypeSql);
      const changes = (pageTypeResult as any).changes || 0;
      result.migratedFromPageType = changes;
      console.log(`✓ 从 page_type 迁移了 ${changes} 条记录`);
    } catch (error: any) {
      const errorMsg = `迁移 page_type 失败: ${error.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
      // 如果 project_id 字段不存在，这是预期的错误
      if (!error.message?.includes('no such column: project_id')) {
        result.success = false;
      }
    }

    // 步骤2: 从关联表同步关系
    try {
      const relationSql = `
        UPDATE source_information
        SET project_id = (
          SELECT psi.project_id
          FROM project_source_informations psi
          WHERE psi.source_information_id = source_information.id
          LIMIT 1
        )
        WHERE id IN (
          SELECT si.id
          FROM source_information si
          INNER JOIN project_source_informations psi ON si.id = psi.source_information_id
          WHERE si.project_id IS NULL
        )
      `;
      
      const relationResult = await db.query(relationSql);
      const changes = (relationResult as any).changes || 0;
      result.migratedFromRelationTable = changes;
      console.log(`✓ 从关联表迁移了 ${changes} 条记录`);
    } catch (error: any) {
      const errorMsg = `迁移关联表失败: ${error.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
      // 如果关联表不存在，这是预期的错误
      if (!error.message?.includes('no such table: project_source_informations')) {
        result.success = false;
      }
    }

    // 步骤3: 验证迁移结果
    try {
      const verifySql = `
        SELECT 
          COUNT(*) as total,
          COUNT(project_id) as with_project_id,
          COUNT(CASE WHEN page_type LIKE 'project-%' THEN 1 END) as with_page_type
        FROM source_information
        WHERE status = 'active'
      `;
      
      const verifyResult = await db.query(verifySql);
      const stats = Array.isArray(verifyResult) ? verifyResult[0] : verifyResult;
      
      console.log('\n迁移统计:');
      console.log(`  总记录数: ${stats.total}`);
      console.log(`  有 project_id: ${stats.with_project_id}`);
      console.log(`  仍有 page_type 格式: ${stats.with_page_type}`);
    } catch (error: any) {
      console.warn(`验证统计失败: ${error.message}`);
    }

    console.log('\n迁移完成！');
    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`迁移过程出错: ${error.message}`);
    console.error('迁移失败:', error);
    return result;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 确保数据库连接已建立
    await db.connect();
    console.log('数据库连接已建立\n');

    const result = await migrateSourceRelations();
    
    // 关闭数据库连接
    await db.close();
    
    if (result.success) {
      console.log('\n✓ 迁移成功完成');
      console.log(`  从 page_type 迁移: ${result.migratedFromPageType} 条`);
      console.log(`  从关联表迁移: ${result.migratedFromRelationTable} 条`);
      if (result.errors.length > 0) {
        console.log(`  警告: ${result.errors.length} 个非致命错误`);
        result.errors.forEach(err => console.log(`    - ${err}`));
      }
      process.exit(0);
    } else {
      console.error('\n✗ 迁移失败');
      result.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('执行迁移脚本失败:', error);
    if (db) {
      await db.close().catch(() => {});
    }
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { migrateSourceRelations };
