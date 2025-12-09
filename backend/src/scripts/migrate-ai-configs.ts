/**
 * AI配置信息迁移脚本
 * 用于恢复或初始化所有AI角色配置到数据库
 */

import { DatabaseManager } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new DatabaseManager();

/**
 * 独立页面AI角色配置
 */
interface IndependentPageRole {
  id: string;
  name: string;
  description: string;
  apiKey: string;
}

/**
 * 智能工作流AI角色配置
 */
interface SmartWorkflowRole {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  connectionType: 'chatflow' | 'workflow';
}

/**
 * 默认AI角色配置列表
 */
const INDEPENDENT_PAGE_ROLES: IndependentPageRole[] = [
  {
    id: 'independent-page-ai-search',
    name: 'AI问答',
    description: '智能问答和搜索功能',
    apiKey: 'app-HC8dx24idIWm1uva66VmHXsm',
  },
  {
    id: 'project-resources-ai-qa',
    name: 'AI问答助手',
    description: '基于项目资源进行智能问答',
    apiKey: 'app-HC8dx24idIWm1uva66VmHXsm',
  },
  {
    id: 'independent-page-tech-package',
    name: '技术包装',
    description: '技术内容包装工作流',
    apiKey: 'app-GgD3uUNDWOFu7DlBgSVkIrIt',
  },
  {
    id: 'independent-page-tech-strategy',
    name: '技术策略',
    description: '技术策略生成工作流',
    apiKey: 'app-DesVds4LQch6k7Unu7KpBCS4',
  },
  {
    id: 'independent-page-core-draft',
    name: '技术通稿',
    description: '核心内容生成工作流',
    apiKey: 'app-c7HLp8OGiTgnpvg5cIYqQCYZ',
  },
  {
    id: 'independent-page-speech',
    name: '发布会演讲稿',
    description: '技术发布内容生成工作流',
    apiKey: 'app-iAiKRQ7h8zCwkz2TBkezgtGs',
  },
];

/**
 * 智能工作流AI角色配置（可选，如果需要的话）
 */
const SMART_WORKFLOW_ROLES: SmartWorkflowRole[] = [
  {
    id: 'smart-workflow-ai-search',
    name: '智能工作流-AI问答',
    description: '智能工作流中的AI问答节点',
    apiKey: 'app-HC8dx24idIWm1uva66VmHXsm',
    connectionType: 'chatflow',
  },
  {
    id: 'smart-workflow-tech-package',
    name: '智能工作流-技术包装',
    description: '智能工作流中的技术包装节点',
    apiKey: 'app-GgD3uUNDWOFu7DlBgSVkIrIt',
    connectionType: 'workflow',
  },
  {
    id: 'smart-workflow-tech-strategy',
    name: '智能工作流-技术策略',
    description: '智能工作流中的技术策略节点',
    apiKey: 'app-DesVds4LQch6k7Unu7KpBCS4',
    connectionType: 'workflow',
  },
  {
    id: 'smart-workflow-core-draft',
    name: '智能工作流-技术通稿',
    description: '智能工作流中的技术通稿节点',
    apiKey: 'app-c7HLp8OGiTgnpvg5cIYqQCYZ',
    connectionType: 'workflow',
  },
  {
    id: 'smart-workflow-speech',
    name: '智能工作流-发布会演讲稿',
    description: '智能工作流中的发布会演讲稿节点',
    apiKey: 'app-iAiKRQ7h8zCwkz2TBkezgtGs',
    connectionType: 'workflow',
  },
];

/**
 * Dify API基础URL
 * 从环境变量读取，如果没有则使用默认值
 * 注意：如果使用代理，应该是相对路径如 '/api/dify'
 */
const DIFY_API_BASE_URL = process.env.DIFY_BASE_URL || process.env.DIFY_API_BASE_URL || process.env.DIFY_API_URL || 'http://47.113.225.93:9999/v1';

/**
 * 创建ai_roles表（如果不存在）
 */
async function createAIRolesTable(): Promise<void> {
  console.log('📋 检查并创建 ai_roles 表...');
  
  try {
    // 检查表是否存在
    const checkTableSql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ai_roles'
    `;
    const tableExists = await db.query(checkTableSql);
    
    if (tableExists.length > 0) {
      console.log('✅ ai_roles 表已存在');
      return;
    }
    
    console.log('⚠️  ai_roles 表不存在，正在创建...');
    
    // 先创建表，然后创建索引
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS ai_roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        avatar TEXT,
        system_prompt TEXT,
        dify_config TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        source TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableSql);
    console.log('✅ ai_roles 表创建成功');
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_name ON ai_roles(name)',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_enabled ON ai_roles(enabled)',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_source ON ai_roles(source)',
      'CREATE INDEX IF NOT EXISTS idx_ai_roles_updated ON ai_roles(updated_at DESC)',
    ];
    
    for (const indexSql of indexes) {
      try {
        await db.query(indexSql);
      } catch (error: any) {
        // 忽略索引已存在的错误
        if (!error?.message?.includes('already exists') && 
            !error?.message?.includes('duplicate')) {
          console.warn(`⚠️  创建索引失败（可能已存在）:`, error?.message);
        }
      }
    }
    
    // 创建触发器
    const triggerSql = `
      CREATE TRIGGER IF NOT EXISTS update_ai_roles_updated_at
      AFTER UPDATE ON ai_roles
      BEGIN
        UPDATE ai_roles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `;
    
    try {
      await db.query(triggerSql);
    } catch (error: any) {
      // 忽略触发器已存在的错误
      if (!error?.message?.includes('already exists') && 
          !error?.message?.includes('duplicate')) {
        console.warn(`⚠️  创建触发器失败（可能已存在）:`, error?.message);
      }
    }
    
    console.log('✅ ai_roles 表创建成功');
  } catch (error) {
    console.error('❌ 创建 ai_roles 表失败:', error);
    throw error;
  }
}

/**
 * 插入或更新AI角色
 */
async function upsertAIRole(
  role: IndependentPageRole | SmartWorkflowRole,
  source: 'independent-page' | 'smart-workflow',
  connectionType: 'chatflow' | 'workflow' = 'chatflow'
): Promise<void> {
  try {
    // 检查角色是否已存在
    const checkSql = 'SELECT id FROM ai_roles WHERE id = ?';
    const existing = await db.query(checkSql, [role.id]);
    
    // 准备Dify配置
    const difyConfig = {
      apiUrl: DIFY_API_BASE_URL,
      apiKey: role.apiKey,
      connectionType: connectionType,
    };
    
    if (existing.length > 0) {
      // 更新现有角色
      const updateSql = `
        UPDATE ai_roles 
        SET name = ?, 
            description = ?, 
            dify_config = ?,
            enabled = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await db.query(updateSql, [
        role.name,
        role.description,
        JSON.stringify(difyConfig),
        role.id,
      ]);
      
      console.log(`🔄 更新角色: ${role.name} (${role.id})`);
    } else {
      // 插入新角色
      const insertSql = `
        INSERT INTO ai_roles (
          id, name, description, avatar, system_prompt, dify_config, enabled, source,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      await db.query(insertSql, [
        role.id,
        role.name,
        role.description,
        null, // avatar
        null, // system_prompt
        JSON.stringify(difyConfig),
        1, // enabled
        source,
      ]);
      
      console.log(`✅ 创建角色: ${role.name} (${role.id})`);
    }
  } catch (error) {
    console.error(`❌ 处理角色 ${role.name} (${role.id}) 失败:`, error);
    throw error;
  }
}

/**
 * 初始化所有AI角色配置
 */
async function initializeAIRoles(): Promise<void> {
  console.log('🚀 开始初始化AI角色配置...');
  console.log(`📍 Dify API Base URL: ${DIFY_API_BASE_URL}`);
  
  try {
    // 1. 创建表
    await createAIRolesTable();
    
    // 2. 初始化独立页面角色
    console.log('\n📝 初始化独立页面AI角色...');
    for (const role of INDEPENDENT_PAGE_ROLES) {
      await upsertAIRole(role, 'independent-page', 'chatflow');
    }
    
    // 3. 初始化智能工作流角色（可选）
    console.log('\n📝 初始化智能工作流AI角色...');
    for (const role of SMART_WORKFLOW_ROLES) {
      await upsertAIRole(role, 'smart-workflow', role.connectionType);
    }
    
    console.log('\n🎉 AI角色配置初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

/**
 * 显示当前AI角色列表
 */
async function displayAIRoles(): Promise<void> {
  try {
    const listSql = `
      SELECT id, name, source, enabled, 
             json_extract(dify_config, '$.apiKey') as api_key,
             created_at
      FROM ai_roles 
      ORDER BY source, name
    `;
    const roles = await db.query(listSql);
    
    if (roles.length === 0) {
      console.log('\n⚠️  当前数据库中没有AI角色配置');
      return;
    }
    
    console.log('\n📋 当前数据库中的AI角色配置:');
    console.table(roles.map((r: any) => ({
      ID: r.id,
      名称: r.name,
      来源: r.source,
      启用: r.enabled === 1 ? '是' : '否',
      'API Key': r.api_key ? r.api_key.substring(0, 20) + '...' : 'N/A',
      创建时间: r.created_at,
    })));
  } catch (error) {
    console.error('❌ 查询AI角色失败:', error);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('   AI配置信息迁移脚本');
    console.log('═══════════════════════════════════════════');
    console.log('');
    
    // 连接数据库
    await db.connect();
    console.log('✅ 数据库连接成功');
    
    // 初始化AI角色
    await initializeAIRoles();
    
    // 显示结果
    await displayAIRoles();
    
    // 关闭数据库连接
    await db.close();
    
    console.log('\n✨ 迁移脚本执行完成！');
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    await db.close();
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  main();
}

export { main as migrateAIConfigs, initializeAIRoles, createAIRolesTable };

