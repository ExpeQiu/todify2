/**
 * 检查所有服务和数据库表的对应关系
 * 验证每个模型、路由、服务是否与数据库表正确对应
 */

import { DatabaseManager } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new DatabaseManager();

interface TableInfo {
  name: string;
  exists: boolean;
  recordCount?: number;
}

interface ModelInfo {
  name: string;
  modelFile: string;
  routeFile?: string;
  serviceFile?: string;
  tableName?: string;
}

/**
 * 获取数据库中的所有表
 */
async function getDatabaseTables(): Promise<string[]> {
  try {
    await db.connect();
    const result = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    return Array.isArray(result) ? result.map((r: any) => r.name) : [];
  } catch (error) {
    console.error('获取数据库表失败:', error);
    return [];
  }
}

/**
 * 获取表的记录数
 */
async function getTableRecordCount(tableName: string): Promise<number> {
  try {
    const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    if (Array.isArray(result) && result.length > 0) {
      return (result[0] as any).count || 0;
    }
    return 0;
  } catch (error) {
    return -1; // 表不存在或查询失败
  }
}

/**
 * 定义所有已知的模型和它们的表名映射
 */
const MODEL_TABLE_MAPPING: Record<string, string> = {
  'AIRole': 'ai_roles',
  'AgentWorkflow': 'agent_workflows',
  'WorkflowExecution': 'workflow_executions',
  'WorkflowTemplate': 'workflow_templates',
  'PublicPageConfig': 'public_page_configs',
  'PageToolConfig': 'page_tool_configs',
  'TechCategory': 'tech_categories',
  'TechPoint': 'tech_points',
  'CarModel': 'car_models',
  'CarSeries': 'car_series',
  'Brand': 'brands',
  'WorkflowStats': 'workflow_stats_summary',
  'AiSearch': 'ai_search_conversations',
  'AiSearchMessage': 'ai_search_messages',
  'AiSearchOutput': 'ai_search_outputs',
  'File': 'files',
};

/**
 * 定义服务和表的对应关系
 */
const SERVICE_TABLE_MAPPING: Record<string, string[]> = {
  'AiSearchService': ['ai_search_conversations', 'ai_search_messages', 'ai_search_outputs', 'ai_search_field_mappings'],
  'FileService': ['files'],
  'AgentWorkflowService': ['agent_workflows', 'workflow_executions'],
  'ChatMessageService': ['conversations', 'chat_messages'],
};

/**
 * 主检查函数
 */
async function checkDatabaseServiceMapping() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('   数据库表与服务对应关系检查');
    console.log('═══════════════════════════════════════════');
    console.log('');

    await db.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 获取所有数据库表
    const dbTables = await getDatabaseTables();
    console.log(`📊 数据库中的表（共 ${dbTables.length} 个）：`);
    dbTables.forEach(table => console.log(`   - ${table}`));
    console.log('');

    // 2. 检查每个表的记录数
    console.log('📈 表记录统计：');
    const tableStats: Array<{ name: string; count: number }> = [];
    for (const table of dbTables) {
      const count = await getTableRecordCount(table);
      if (count >= 0) {
        tableStats.push({ name: table, count });
        console.log(`   - ${table}: ${count} 条记录`);
      }
    }
    console.log('');

    // 3. 检查模型对应的表
    console.log('🔍 模型与表对应关系：');
    const modelChecks: Array<{ model: string; table: string; exists: boolean; count: number }> = [];
    
    for (const [model, table] of Object.entries(MODEL_TABLE_MAPPING)) {
      const exists = dbTables.includes(table);
      const count = exists ? await getTableRecordCount(table) : -1;
      modelChecks.push({ model, table, exists, count });
      
      if (exists) {
        console.log(`   ✅ ${model} -> ${table} (${count} 条记录)`);
      } else {
        console.log(`   ❌ ${model} -> ${table} (表不存在)`);
      }
    }
    console.log('');

    // 4. 检查服务对应的表
    console.log('🛠️  服务与表对应关系：');
    for (const [service, tables] of Object.entries(SERVICE_TABLE_MAPPING)) {
      console.log(`   ${service}:`);
      for (const table of tables) {
        const exists = dbTables.includes(table);
        const count = exists ? await getTableRecordCount(table) : -1;
        if (exists) {
          console.log(`     ✅ ${table} (${count} 条记录)`);
        } else {
          console.log(`     ❌ ${table} (表不存在)`);
        }
      }
    }
    console.log('');

    // 5. 检查未使用的表
    console.log('🔎 数据库中未映射的表：');
    const mappedTables = new Set([
      ...Object.values(MODEL_TABLE_MAPPING),
      ...Object.values(SERVICE_TABLE_MAPPING).flat(),
    ]);
    
    const unmappedTables = dbTables.filter(table => !mappedTables.has(table));
    if (unmappedTables.length === 0) {
      console.log('   ✅ 所有表都有对应的模型或服务');
    } else {
      for (const table of unmappedTables) {
        const count = await getTableRecordCount(table);
        console.log(`   ⚠️  ${table} (${count} 条记录) - 未找到对应的模型或服务`);
      }
    }
    console.log('');

    // 6. 检查缺失的表
    console.log('⚠️  模型中定义但数据库中不存在的表：');
    const missingTables: string[] = [];
    for (const [model, table] of Object.entries(MODEL_TABLE_MAPPING)) {
      if (!dbTables.includes(table)) {
        missingTables.push(table);
        console.log(`   ❌ ${model} -> ${table} (表不存在)`);
      }
    }
    
    if (missingTables.length === 0) {
      console.log('   ✅ 所有模型对应的表都存在');
    }
    console.log('');

    // 7. 生成总结报告
    console.log('═══════════════════════════════════════════');
    console.log('   检查总结');
    console.log('═══════════════════════════════════════════');
    console.log(`总表数: ${dbTables.length}`);
    console.log(`已映射的表: ${dbTables.filter(t => mappedTables.has(t)).length}`);
    console.log(`未映射的表: ${unmappedTables.length}`);
    console.log(`缺失的表: ${missingTables.length}`);
    console.log('');

    // 8. 生成详细报告
    const report = {
      timestamp: new Date().toISOString(),
      database: './data/todify2.db',
      totalTables: dbTables.length,
      tables: tableStats,
      models: modelChecks,
      unmappedTables,
      missingTables,
    };

    console.log('📄 详细报告已生成（见下方 JSON）\n');
    console.log(JSON.stringify(report, null, 2));

  } catch (error) {
    console.error('❌ 检查失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabaseServiceMapping()
    .then(() => {
      console.log('\n✨ 检查完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 检查失败:', error);
      process.exit(1);
    });
}

export { checkDatabaseServiceMapping };

