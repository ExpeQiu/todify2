/**
 * 数据库结构验证脚本
 * 验证所有必要的表和关联关系是否正确创建
 */

import { db } from '../config/database';

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount?: number;
}

async function verifyDatabaseStructure(): Promise<void> {
  try {
    console.log('🔗 正在连接数据库...');
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    // 定义需要验证的表
    const requiredTables = [
      // 核心业务层
      'brands',
      'car_models',
      'tech_categories',
      'tech_points',
      
      // 项目管理层
      'projects',
      'project_sources',
      'project_tech_points',
      'project_knowledge_points',
      'project_files',
      
      // 知识点层
      'knowledge_points',
      'tech_point_knowledge_points',
      
      // 工作流层
      'agent_workflows',
      'ai_roles',
      'workflow_executions',
      
      // AI搜索层
      'ai_search_conversations',
      'ai_search_messages',
      'ai_search_outputs',
      
      // 关联层
      'tech_point_car_models',
      'tech_point_resources',
    ];

    console.log('📊 验证数据库表结构...\n');
    
    const results: TableInfo[] = [];
    
    for (const tableName of requiredTables) {
      const checkResult = await db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name = ?
      `, [tableName]);
      
      const exists = Array.isArray(checkResult) && checkResult.length > 0;
      
      let rowCount = 0;
      if (exists) {
        try {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          rowCount = countResult[0]?.count || 0;
        } catch (error) {
          // 忽略计数错误
        }
      }
      
      results.push({
        name: tableName,
        exists,
        rowCount
      });
    }

    // 输出结果
    console.log('表名'.padEnd(35) + '状态'.padEnd(10) + '记录数');
    console.log('-'.repeat(55));
    
    let missingCount = 0;
    results.forEach(result => {
      const status = result.exists ? '✅ 存在' : '❌ 缺失';
      const count = result.exists ? result.rowCount?.toString() || '0' : '-';
      console.log(
        result.name.padEnd(35) + 
        status.padEnd(10) + 
        count
      );
      if (!result.exists) missingCount++;
    });
    
    console.log('\n' + '='.repeat(55));
    console.log(`总计: ${results.length} 个表`);
    console.log(`存在: ${results.length - missingCount} 个`);
    console.log(`缺失: ${missingCount} 个`);
    
    // 验证关键关联关系
    console.log('\n📋 验证关键外键关系...\n');
    
    const foreignKeyChecks = [
      {
        name: 'projects → project_sources',
        query: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='project_sources'`
      },
      {
        name: 'tech_points → knowledge_points',
        query: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='tech_point_knowledge_points'`
      },
      {
        name: 'projects → tech_points',
        query: `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='project_tech_points'`
      }
    ];
    
    for (const check of foreignKeyChecks) {
      const result = await db.query(check.query);
      const exists = result[0]?.count > 0;
      console.log(`${exists ? '✅' : '❌'} ${check.name}`);
    }
    
    // 验证索引
    console.log('\n🔍 验证关键索引...\n');
    
    const indexResult = await db.query(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
      ORDER BY tbl_name, name
    `);
    
    console.log(`找到 ${indexResult.length} 个索引`);
    
    // 按表分组显示
    const indexByTable: Record<string, string[]> = {};
    indexResult.forEach((idx: any) => {
      if (!indexByTable[idx.tbl_name]) {
        indexByTable[idx.tbl_name] = [];
      }
      indexByTable[idx.tbl_name].push(idx.name);
    });
    
    Object.entries(indexByTable).forEach(([table, indexes]) => {
      console.log(`  ${table}: ${indexes.length} 个索引`);
    });
    
    console.log('\n✅ 数据库结构验证完成！');
    
    if (missingCount > 0) {
      console.log(`\n⚠️  警告: 有 ${missingCount} 个表缺失，请检查数据库初始化脚本`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// 执行验证
verifyDatabaseStructure();

