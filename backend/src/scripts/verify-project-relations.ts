/**
 * 验证项目关联关系脚本
 * 检查"已关联技术信息"和"AI共创信息"的数据库关联是否有效
 */

import { getDatabaseManager } from '../config/database';
import { logger } from '../shared/lib/logger';

interface VerificationResult {
  table: string;
  exists: boolean;
  hasProjectId: boolean;
  sampleCount: number;
  relationCount: number;
  issues: string[];
}

async function verifyProjectRelations() {
  const db = getDatabaseManager();
  
  try {
    await db.connect();
    logger.info('开始验证项目关联关系...');

    const results: VerificationResult[] = [];

    // 1. 检查 conversations 表是否有 project_id 字段
    logger.info('检查 conversations 表...');
    try {
      const convCheck = await db.query(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name='conversations'
      `);
      
      const convTableExists = convCheck && convCheck.length > 0;
      const hasProjectId = convTableExists && 
        (convCheck[0]?.sql?.includes('project_id') || 
         await checkColumnExists(db, 'conversations', 'project_id'));
      
      const convCount = convTableExists ? await getCount(db, 'conversations') : 0;
      const convWithProjectId = hasProjectId ? 
        await getCount(db, 'conversations', 'project_id IS NOT NULL') : 0;

      results.push({
        table: 'conversations',
        exists: convTableExists,
        hasProjectId: hasProjectId,
        sampleCount: convCount,
        relationCount: convWithProjectId,
        issues: []
      });

      if (!hasProjectId) {
        results[results.length - 1].issues.push('conversations 表缺少 project_id 字段');
      }
    } catch (error: any) {
      results.push({
        table: 'conversations',
        exists: false,
        hasProjectId: false,
        sampleCount: 0,
        relationCount: 0,
        issues: [`检查失败: ${error.message}`]
      });
    }

    // 2. 检查关联表
    const relationTables = [
      { name: 'project_tech_points', description: '项目-技术点关联表' },
      { name: 'project_knowledge_points', description: '项目-知识点关联表' },
      { name: 'project_files', description: '项目-文件关联表' },
      { name: 'project_source_informations', description: '项目-来源信息关联表' }
    ];

    for (const { name, description } of relationTables) {
      logger.info(`检查 ${name} 表...`);
      try {
        const exists = await tableExists(db, name);
        const count = exists ? await getCount(db, name) : 0;
        
        results.push({
          table: name,
          exists: exists,
          hasProjectId: true, // 关联表本身就有 project_id
          sampleCount: count,
          relationCount: count,
          issues: []
        });

        if (!exists) {
          results[results.length - 1].issues.push(`${description}不存在`);
        } else {
          // 检查是否有实际关联数据
          const sampleData = await db.query(`SELECT * FROM ${name} LIMIT 5`);
          if (count > 0 && sampleData.length > 0) {
            logger.info(`${name} 示例数据:`, sampleData);
          }
        }
      } catch (error: any) {
        results.push({
          table: name,
          exists: false,
          hasProjectId: false,
          sampleCount: 0,
          relationCount: 0,
          issues: [`检查失败: ${error.message}`]
        });
      }
    }

    // 3. 检查特定项目的关联数据
    logger.info('检查项目关联数据...');
    try {
      const projects = await db.query('SELECT id, name FROM projects LIMIT 5');
      if (projects && projects.length > 0) {
        for (const project of projects) {
          const projectId = project.id;
          logger.info(`\n检查项目 ${project.name} (ID: ${projectId}) 的关联数据:`);
          
          // 技术点
          const techPoints = await db.query(`
            SELECT COUNT(*) as count FROM project_tech_points WHERE project_id = ?
          `, [projectId]);
          logger.info(`  - 技术点: ${techPoints[0]?.count || 0}`);
          
          // 知识点
          const knowledgePoints = await db.query(`
            SELECT COUNT(*) as count FROM project_knowledge_points WHERE project_id = ?
          `, [projectId]);
          logger.info(`  - 知识点: ${knowledgePoints[0]?.count || 0}`);
          
          // 文件
          const files = await db.query(`
            SELECT COUNT(*) as count FROM project_files WHERE project_id = ?
          `, [projectId]);
          logger.info(`  - 文件: ${files[0]?.count || 0}`);
          
          // 来源信息
          const sources = await db.query(`
            SELECT COUNT(*) as count FROM project_source_informations WHERE project_id = ?
          `, [projectId]);
          logger.info(`  - 来源信息: ${sources[0]?.count || 0}`);
          
          // 对话记录
          const conversations = await db.query(`
            SELECT COUNT(*) as count FROM conversations WHERE project_id = ?
          `, [projectId]);
          logger.info(`  - 对话记录: ${conversations[0]?.count || 0}`);
        }
      }
    } catch (error: any) {
      logger.error('检查项目关联数据失败:', error);
    }

    // 输出汇总报告
    logger.info('\n========== 验证结果汇总 ==========');
    results.forEach(result => {
      logger.info(`\n表: ${result.table}`);
      logger.info(`  存在: ${result.exists ? '✓' : '✗'}`);
      logger.info(`  有 project_id: ${result.hasProjectId ? '✓' : '✗'}`);
      logger.info(`  记录数: ${result.sampleCount}`);
      logger.info(`  关联记录数: ${result.relationCount}`);
      if (result.issues.length > 0) {
        logger.warn(`  问题:`);
        result.issues.forEach(issue => logger.warn(`    - ${issue}`));
      }
    });

    // 检查是否有问题
    const hasIssues = results.some(r => r.issues.length > 0 || !r.exists);
    if (hasIssues) {
      logger.warn('\n⚠️  发现以下问题需要修复:');
      results.forEach(result => {
        if (result.issues.length > 0 || !result.exists) {
          logger.warn(`  - ${result.table}: ${result.issues.join(', ')}`);
        }
      });
    } else {
      logger.info('\n✓ 所有关联关系验证通过！');
    }

  } catch (error) {
    logger.error('验证过程出错:', error);
    throw error;
  } finally {
    await db.close();
  }
}

async function tableExists(db: any, tableName: string): Promise<boolean> {
  try {
    const result = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `, [tableName]);
    return result && result.length > 0;
  } catch {
    return false;
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

async function getCount(db: any, tableName: string, whereClause?: string): Promise<number> {
  try {
    const sql = whereClause 
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await db.query(sql);
    return result[0]?.count || 0;
  } catch {
    return 0;
  }
}

// 运行验证
if (require.main === module) {
  verifyProjectRelations()
    .then(() => {
      logger.info('验证完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('验证失败:', error);
      process.exit(1);
    });
}

export { verifyProjectRelations };





