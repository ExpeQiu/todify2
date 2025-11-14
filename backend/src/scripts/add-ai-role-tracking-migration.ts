/**
 * 添加AI角色和工作流追踪字段的迁移脚本
 * 创建日期: 2025-11-01
 * 目的: 为统计表添加AI角色ID和工作流执行ID字段，建立关联关系
 */

import { DatabaseManager } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

const db = new DatabaseManager();

/**
 * 运行迁移脚本
 */
async function runMigration() {
  try {
    console.log('🚀 开始添加AI角色和工作流追踪字段...');
    
    // 确保数据库连接
    await db.connect();
    
    // 检查ai_roles表是否存在
    const checkAIRolesTable = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ai_roles'
    `;
    const aiRolesTableExists = await db.query(checkAIRolesTable);
    
    if (aiRolesTableExists.length === 0) {
      console.warn('⚠️  ai_roles 表不存在，将仅添加字段，无法建立外键关联。');
    }

    // 检查workflow_executions表是否存在
    const checkWorkflowExecTable = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='workflow_executions'
    `;
    const workflowExecTableExists = await db.query(checkWorkflowExecTable);
    
    if (workflowExecTableExists.length === 0) {
      console.warn('⚠️  workflow_executions 表不存在，将仅添加字段，无法建立外键关联。');
    }

    // 1. 为workflow_node_usage表添加字段
    console.log('📝 步骤1: 为workflow_node_usage表添加字段...');
    
    // 检查ai_role_id字段是否已存在
    const checkAIRoleIdColumn = `
      SELECT COUNT(*) as count FROM pragma_table_info('workflow_node_usage') 
      WHERE name='ai_role_id'
    `;
    const aiRoleIdExists = await db.query(checkAIRoleIdColumn);
    
    if (aiRoleIdExists[0]?.count === 0) {
      await db.query('ALTER TABLE workflow_node_usage ADD COLUMN ai_role_id TEXT');
      console.log('  ✅ 添加ai_role_id字段');
    } else {
      console.log('  ℹ️  ai_role_id字段已存在');
    }

    // 检查workflow_execution_id字段是否已存在
    const checkWorkflowExecIdColumn = `
      SELECT COUNT(*) as count FROM pragma_table_info('workflow_node_usage') 
      WHERE name='workflow_execution_id'
    `;
    const workflowExecIdExists = await db.query(checkWorkflowExecIdColumn);
    
    if (workflowExecIdExists[0]?.count === 0) {
      await db.query('ALTER TABLE workflow_node_usage ADD COLUMN workflow_execution_id TEXT');
      console.log('  ✅ 添加workflow_execution_id字段');
    } else {
      console.log('  ℹ️  workflow_execution_id字段已存在');
    }

    // 2. 为ai_qa_feedback表添加字段
    console.log('📝 步骤2: 为ai_qa_feedback表添加字段...');
    
    const checkAIRoleIdFeedback = `
      SELECT COUNT(*) as count FROM pragma_table_info('ai_qa_feedback') 
      WHERE name='ai_role_id'
    `;
    const aiRoleIdFeedbackExists = await db.query(checkAIRoleIdFeedback);
    
    if (aiRoleIdFeedbackExists[0]?.count === 0) {
      await db.query('ALTER TABLE ai_qa_feedback ADD COLUMN ai_role_id TEXT');
      console.log('  ✅ 添加ai_role_id字段');
    } else {
      console.log('  ℹ️  ai_role_id字段已存在');
    }

    const checkWorkflowExecIdFeedback = `
      SELECT COUNT(*) as count FROM pragma_table_info('ai_qa_feedback') 
      WHERE name='workflow_execution_id'
    `;
    const workflowExecIdFeedbackExists = await db.query(checkWorkflowExecIdFeedback);
    
    if (workflowExecIdFeedbackExists[0]?.count === 0) {
      await db.query('ALTER TABLE ai_qa_feedback ADD COLUMN workflow_execution_id TEXT');
      console.log('  ✅ 添加workflow_execution_id字段');
    } else {
      console.log('  ℹ️  workflow_execution_id字段已存在');
    }

    // 3. 为node_content_processing表添加字段
    console.log('📝 步骤3: 为node_content_processing表添加字段...');
    
    const checkAIRoleIdProcessing = `
      SELECT COUNT(*) as count FROM pragma_table_info('node_content_processing') 
      WHERE name='ai_role_id'
    `;
    const aiRoleIdProcessingExists = await db.query(checkAIRoleIdProcessing);
    
    if (aiRoleIdProcessingExists[0]?.count === 0) {
      await db.query('ALTER TABLE node_content_processing ADD COLUMN ai_role_id TEXT');
      console.log('  ✅ 添加ai_role_id字段');
    } else {
      console.log('  ℹ️  ai_role_id字段已存在');
    }

    const checkWorkflowExecIdProcessing = `
      SELECT COUNT(*) as count FROM pragma_table_info('node_content_processing') 
      WHERE name='workflow_execution_id'
    `;
    const workflowExecIdProcessingExists = await db.query(checkWorkflowExecIdProcessing);
    
    if (workflowExecIdProcessingExists[0]?.count === 0) {
      await db.query('ALTER TABLE node_content_processing ADD COLUMN workflow_execution_id TEXT');
      console.log('  ✅ 添加workflow_execution_id字段');
    } else {
      console.log('  ℹ️  workflow_execution_id字段已存在');
    }

    // 4. 创建索引
    console.log('📝 步骤4: 创建索引...');
    
    const indexes = [
      { table: 'workflow_node_usage', column: 'ai_role_id', name: 'idx_workflow_node_usage_ai_role_id' },
      { table: 'workflow_node_usage', column: 'workflow_execution_id', name: 'idx_workflow_node_usage_workflow_execution_id' },
      { table: 'ai_qa_feedback', column: 'ai_role_id', name: 'idx_ai_qa_feedback_ai_role_id' },
      { table: 'ai_qa_feedback', column: 'workflow_execution_id', name: 'idx_ai_qa_feedback_workflow_execution_id' },
      { table: 'node_content_processing', column: 'ai_role_id', name: 'idx_node_content_processing_ai_role_id' },
      { table: 'node_content_processing', column: 'workflow_execution_id', name: 'idx_node_content_processing_workflow_execution_id' }
    ];

    for (const index of indexes) {
      try {
        await db.query(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.column})`);
        console.log(`  ✅ 创建索引: ${index.name}`);
      } catch (error) {
        // 如果索引已存在，SQLite会忽略
        console.log(`  ℹ️  索引 ${index.name} 已存在或创建失败`);
      }
    }

    console.log('🎉 迁移完成！');
    
    // 关闭数据库连接
    await db.close();
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    await db.close();
    throw error;
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { runMigration };








