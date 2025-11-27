/**
 * 创建缺失的数据库表
 * 为当前数据库中缺失的表创建表结构
 */

import { DatabaseManager } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = new DatabaseManager();

/**
 * 检查表是否存在
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await db.connect();
    const result = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name = ?
    `, [tableName]);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 执行SQL语句（支持多语句）
 */
async function executeSQL(sql: string): Promise<void> {
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await db.query(statement);
      } catch (error: any) {
        // 忽略表已存在的错误
        if (!error?.message?.includes('already exists') && 
            !error?.message?.includes('duplicate') &&
            !error?.message?.includes('no such table')) {
          console.warn(`⚠️  执行SQL语句失败:`, error?.message);
          console.warn(`SQL: ${statement.substring(0, 100)}...`);
        }
      }
    }
  }
}

/**
 * 从统一架构文件中提取特定表的创建语句
 */
async function createTablesFromUnifiedSchema(): Promise<void> {
  console.log('📋 从统一架构文件创建缺失的表...');
  
  try {
    const schemaPath = join(__dirname, 'unified-database-schema-v2.sql');
    const fullSchema = readFileSync(schemaPath, 'utf-8');
    
    // 需要创建的表及其在架构文件中的位置
    const tablesToCreate = [
      'brands',
      'car_models',
      'car_series',
      'tech_categories',
      'tech_points',
      'page_tool_configs',
      'workflow_stats_summary',
    ];

    // 提取每个表的CREATE TABLE语句
    for (const tableName of tablesToCreate) {
      if (await tableExists(tableName)) {
        console.log(`✅ 表 ${tableName} 已存在，跳过`);
        continue;
      }

      console.log(`📝 创建表 ${tableName}...`);
      
      // 使用正则表达式提取CREATE TABLE语句
      const createTableRegex = new RegExp(
        `CREATE TABLE IF NOT EXISTS ${tableName}[^;]+;`,
        'is'
      );
      const match = fullSchema.match(createTableRegex);
      
      if (match) {
        await executeSQL(match[0]);
        console.log(`✅ 表 ${tableName} 创建成功`);
      } else {
        console.warn(`⚠️  未找到表 ${tableName} 的创建语句`);
      }
    }
  } catch (error) {
    console.error('❌ 从统一架构创建表失败:', error);
    throw error;
  }
}

/**
 * 创建品牌表
 */
async function createBrandsTable(): Promise<void> {
  if (await tableExists('brands')) {
    console.log('✅ brands 表已存在');
    return;
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_en TEXT,
      logo_url TEXT,
      country TEXT,
      founded_year INTEGER,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
    CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
  `;
  
  await executeSQL(sql);
  console.log('✅ brands 表创建成功');
}

/**
 * 创建车型和车系表
 */
async function createCarTables(): Promise<void> {
  if (await tableExists('car_models')) {
    console.log('✅ car_models 表已存在');
  } else {
    const sql = `
      CREATE TABLE IF NOT EXISTS car_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT,
        category TEXT CHECK (category IN ('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'pickup', 'van', 'mpv')),
        launch_year INTEGER,
        end_year INTEGER,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'planned')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
      CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);
    `;
    await executeSQL(sql);
    console.log('✅ car_models 表创建成功');
  }

  if (await tableExists('car_series')) {
    console.log('✅ car_series 表已存在');
  } else {
    const sql = `
      CREATE TABLE IF NOT EXISTS car_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        name_en VARCHAR(255),
        description TEXT,
        launch_year INTEGER,
        end_year INTEGER,
        market_segment VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE CASCADE,
        UNIQUE(model_id, name)
      );
      
      CREATE INDEX IF NOT EXISTS idx_car_series_model_id ON car_series(model_id);
      CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
    `;
    await executeSQL(sql);
    console.log('✅ car_series 表创建成功');
  }
}

/**
 * 创建技术分类和技术点表
 */
async function createTechTables(): Promise<void> {
  if (await tableExists('tech_categories')) {
    console.log('✅ tech_categories 表已存在');
  } else {
    const sql = `
      CREATE TABLE IF NOT EXISTS tech_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id INTEGER,
        level INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES tech_categories(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);
    `;
    await executeSQL(sql);
    console.log('✅ tech_categories 表创建成功');
  }

  if (await tableExists('tech_points')) {
    console.log('✅ tech_points 表已存在');
  } else {
    const sql = `
      CREATE TABLE IF NOT EXISTS tech_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER,
        parent_id INTEGER,
        level INTEGER NOT NULL DEFAULT 1,
        tech_type VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        tags TEXT,
        technical_details TEXT,
        benefits TEXT,
        applications TEXT,
        keywords TEXT,
        source_url VARCHAR(500),
        created_by VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES tech_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES tech_points(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id);
      CREATE INDEX IF NOT EXISTS idx_tech_points_parent_id ON tech_points(parent_id);
      CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status);
    `;
    await executeSQL(sql);
    console.log('✅ tech_points 表创建成功');
  }
}

/**
 * 创建页面工具配置表
 */
async function createPageToolConfigTable(): Promise<void> {
  if (await tableExists('page_tool_configs')) {
    console.log('✅ page_tool_configs 表已存在');
    return;
  }

  try {
    const sqlPath = join(__dirname, 'create-page-tool-config-tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await executeSQL(sql);
    console.log('✅ page_tool_configs 表创建成功');
  } catch (error) {
    console.warn('⚠️  从文件创建 page_tool_configs 失败，使用默认SQL');
    const sql = `
      CREATE TABLE IF NOT EXISTS page_tool_configs (
        page_type TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await executeSQL(sql);
    console.log('✅ page_tool_configs 表创建成功（使用默认结构）');
  }
}

/**
 * 创建工作流统计表
 */
async function createWorkflowStatsTables(): Promise<void> {
  if (await tableExists('workflow_stats_summary')) {
    console.log('✅ workflow_stats_summary 表已存在');
    return;
  }

  try {
    const sqlPath = join(__dirname, 'workflow-stats-schema.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await executeSQL(sql);
    console.log('✅ workflow_stats 相关表创建成功');
  } catch (error) {
    console.warn('⚠️  从文件创建工作流统计表失败，使用简化结构');
    // 简化的统计表结构
    const sql = `
      CREATE TABLE IF NOT EXISTS workflow_stats_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT,
        node_name TEXT,
        session_id TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await executeSQL(sql);
    console.log('✅ workflow_stats_summary 表创建成功（使用简化结构）');
  }
}

/**
 * 主函数：创建所有缺失的表
 */
async function createMissingTables() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('   创建缺失的数据库表');
    console.log('═══════════════════════════════════════════');
    console.log('');

    await db.connect();
    console.log('✅ 数据库连接成功\n');

    // 按顺序创建表（考虑外键依赖）
    console.log('📝 开始创建缺失的表...\n');

    // 1. 品牌表（无依赖）
    await createBrandsTable();

    // 2. 车型和车系表（依赖brands）
    await createCarTables();

    // 3. 技术分类和技术点表（无外部依赖）
    await createTechTables();

    // 4. 页面工具配置表（无依赖）
    await createPageToolConfigTable();

    // 5. 工作流统计表（无依赖）
    await createWorkflowStatsTables();

    console.log('\n🎉 所有缺失的表创建完成！');

    // 验证创建结果
    console.log('\n📊 验证创建结果：');
    const tablesToCheck = [
      'brands',
      'car_models',
      'car_series',
      'tech_categories',
      'tech_points',
      'page_tool_configs',
      'workflow_stats_summary',
    ];

    for (const table of tablesToCheck) {
      const exists = await tableExists(table);
      if (exists) {
        const count = await db.query(`SELECT COUNT(*) as count FROM ${table}`) as any[];
        const recordCount = Array.isArray(count) && count.length > 0 ? count[0].count : 0;
        console.log(`   ✅ ${table}: 存在 (${recordCount} 条记录)`);
      } else {
        console.log(`   ❌ ${table}: 不存在`);
      }
    }

  } catch (error) {
    console.error('❌ 创建表失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createMissingTables()
    .then(() => {
      console.log('\n✨ 脚本执行完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { createMissingTables };


