/**
 * 初始化独立页面默认AI角色
 * 创建5个独立页面AI角色配置
 */

import { DatabaseManager } from '../config/database';

const db = new DatabaseManager();

interface IndependentPageRole {
  id: string;
  name: string;
  description: string;
  apiKey: string;
}

/**
 * 独立页面角色配置列表
 */
const INDEPENDENT_PAGE_ROLES: IndependentPageRole[] = [
  {
    id: 'independent-page-ai-search',
    name: 'AI问答',
    description: '智能问答和搜索功能',
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
 * 初始化独立页面AI角色
 */
async function initIndependentPageRoles() {
  try {
    console.log('🚀 开始初始化独立页面AI角色...');
    
    // 确保数据库连接
    await db.connect();
    
    // 检查ai_roles表是否存在
    const checkTableSql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='ai_roles'
    `;
    const tableExists = await db.query(checkTableSql);
    
    if (tableExists.length === 0) {
      console.log('⚠️  ai_roles表不存在，正在创建...');
      // 读取并执行创建表的SQL
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const sqlPath = join(__dirname, 'create-ai-role-tables.sql');
      const sql = readFileSync(sqlPath, 'utf-8');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await db.query(statement);
        } catch (error) {
          // 忽略已存在的错误
          if (!(error instanceof Error && error.message.includes('already exists'))) {
            throw error;
          }
        }
      }
    }
    
    // Dify API配置
    const apiUrl = 'http://47.113.225.93:9999/v1';
    
    // 遍历每个角色配置
    for (const role of INDEPENDENT_PAGE_ROLES) {
      try {
        // 检查角色是否已存在
        const checkSql = 'SELECT id FROM ai_roles WHERE id = ?';
        const existing = await db.query(checkSql, [role.id]);
        
        if (existing.length > 0) {
          console.log(`⚠️  角色 ${role.name} (${role.id}) 已存在，跳过创建`);
          continue;
        }
        
        // 准备Dify配置
        const difyConfig = {
          apiUrl: apiUrl,
          apiKey: role.apiKey,
          connectionType: 'chatflow' as const,
        };
        
        // 插入角色
        const insertSql = `
          INSERT INTO ai_roles (
            id, name, description, avatar, system_prompt, dify_config, enabled, source,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        const params = [
          role.id,
          role.name,
          role.description,
          null, // avatar
          null, // system_prompt
          JSON.stringify(difyConfig),
          1, // enabled
          'independent-page', // source
        ];
        
        await db.query(insertSql, params);
        console.log(`✅ 成功创建角色: ${role.name} (${role.id})`);
      } catch (error) {
        console.error(`❌ 创建角色 ${role.name} 失败:`, error);
        // 继续创建其他角色
      }
    }
    
    console.log('🎉 独立页面AI角色初始化完成！');
    
    // 显示创建的记录
    const listSql = `
      SELECT id, name, source, enabled 
      FROM ai_roles 
      WHERE source = 'independent-page'
      ORDER BY name
    `;
    const roles = await db.query(listSql);
    
    console.log('\n📋 已创建的独立页面AI角色:');
    console.table(roles);
    
    // 关闭数据库连接
    await db.close();
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    await db.close();
    throw error;
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  initIndependentPageRoles()
    .then(() => {
      console.log('\n✨ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { initIndependentPageRoles };

