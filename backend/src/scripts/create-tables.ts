import { DatabaseManager } from '../config/database';

const db = new DatabaseManager();

const createTablesSQL = `
-- 技术分类表
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
  FOREIGN KEY (parent_id) REFERENCES tech_categories(id)
);

-- 车型表
CREATE TABLE IF NOT EXISTS car_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand VARCHAR(255) NOT NULL,
  series VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INTEGER,
  engine_type VARCHAR(100),
  fuel_type VARCHAR(100),
  market_segment VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata TEXT, -- JSON格式存储额外信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 车系表
CREATE TABLE IF NOT EXISTS car_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand VARCHAR(255) NOT NULL,
  series VARCHAR(255) NOT NULL,
  description TEXT,
  launch_year INTEGER,
  end_year INTEGER,
  market_segment VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata TEXT, -- JSON格式存储额外信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand, series)
);

-- 技术点表
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
  tags TEXT, -- JSON数组格式
  technical_details TEXT, -- JSON格式存储技术细节
  benefits TEXT, -- JSON数组格式存储优势
  applications TEXT, -- JSON数组格式存储应用场景
  keywords TEXT, -- JSON数组格式存储关键词
  source_url VARCHAR(500),
  created_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES tech_categories(id),
  FOREIGN KEY (parent_id) REFERENCES tech_points(id)
);

-- 技术点与车型关联表
CREATE TABLE IF NOT EXISTS tech_point_car_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tech_point_id INTEGER NOT NULL,
  car_model_id INTEGER NOT NULL,
  application_status VARCHAR(50) NOT NULL DEFAULT 'planned',
  implementation_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
  FOREIGN KEY (car_model_id) REFERENCES car_models(id),
  UNIQUE(tech_point_id, car_model_id)
);

-- 技术包装材料表
CREATE TABLE IF NOT EXISTS tech_packaging_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tech_point_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  material_type VARCHAR(50) NOT NULL,
  target_audience VARCHAR(50) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'zh',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  generation_params TEXT, -- JSON格式存储生成参数
  dify_task_id VARCHAR(255),
  created_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tech_point_id) REFERENCES tech_points(id)
);

-- 技术推广策略表
CREATE TABLE IF NOT EXISTS tech_promotion_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  strategy_type VARCHAR(50) NOT NULL,
  target_market VARCHAR(255),
  timeline TEXT, -- JSON格式存储时间线
  budget_range VARCHAR(100),
  kpi_metrics TEXT, -- JSON格式存储KPI指标
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  generation_params TEXT, -- JSON格式存储生成参数
  dify_task_id VARCHAR(255),
  created_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技术新闻稿表
CREATE TABLE IF NOT EXISTS tech_press_releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  content TEXT NOT NULL,
  summary TEXT,
  release_type VARCHAR(50) NOT NULL,
  target_media TEXT, -- JSON数组格式
  publication_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  seo_keywords TEXT, -- JSON数组格式
  generation_params TEXT, -- JSON格式存储生成参数
  dify_task_id VARCHAR(255),
  created_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  published_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技术演讲稿表
CREATE TABLE IF NOT EXISTS tech_speeches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  speech_type VARCHAR(50) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  target_audience VARCHAR(50) NOT NULL,
  event_name VARCHAR(255),
  event_date DATE,
  speaker_notes TEXT,
  slides_outline TEXT, -- JSON格式存储幻灯片大纲
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  generation_params TEXT, -- JSON格式存储生成参数
  dify_task_id VARCHAR(255),
  created_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  delivered_by VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 推广策略与技术点关联表
CREATE TABLE IF NOT EXISTS promotion_tech_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_id INTEGER NOT NULL,
  tech_point_id INTEGER NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id),
  FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
  UNIQUE(promotion_id, tech_point_id)
);

-- 新闻稿与技术点关联表
CREATE TABLE IF NOT EXISTS press_tech_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  press_release_id INTEGER NOT NULL,
  tech_point_id INTEGER NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id),
  FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
  UNIQUE(press_release_id, tech_point_id)
);

-- 演讲稿与技术点关联表
CREATE TABLE IF NOT EXISTS speech_tech_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speech_id INTEGER NOT NULL,
  tech_point_id INTEGER NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speech_id) REFERENCES tech_speeches(id),
  FOREIGN KEY (tech_point_id) REFERENCES tech_points(id),
  UNIQUE(speech_id, tech_point_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);
CREATE INDEX IF NOT EXISTS idx_car_models_brand ON car_models(brand);
CREATE INDEX IF NOT EXISTS idx_car_models_year ON car_models(year);
CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);
CREATE INDEX IF NOT EXISTS idx_car_series_brand ON car_series(brand);
CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
CREATE INDEX IF NOT EXISTS idx_car_series_brand_series ON car_series(brand, series);
CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_id ON tech_points(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_tech_type ON tech_points(tech_type);
CREATE INDEX IF NOT EXISTS idx_tech_points_priority ON tech_points(priority);
CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_point_id ON tech_point_car_models(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_model_id ON tech_point_car_models(car_model_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_point_id ON tech_packaging_materials(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_status ON tech_packaging_materials(status);
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_promotion_id ON promotion_tech_points(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_tech_points_tech_point_id ON promotion_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_press_tech_points_press_release_id ON press_tech_points(press_release_id);
CREATE INDEX IF NOT EXISTS idx_press_tech_points_tech_point_id ON press_tech_points(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_speech_id ON speech_tech_points(speech_id);
CREATE INDEX IF NOT EXISTS idx_speech_tech_points_tech_point_id ON speech_tech_points(tech_point_id);
`;

async function createTables() {
  try {
    console.log('开始连接数据库...');
    await db.connect();
    console.log('数据库连接成功');

    console.log('开始创建数据库表...');
    
    // 分割SQL语句并逐个执行
    const statements = createTablesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }

    console.log('数据库表创建成功！');
    
    // 验证表是否创建成功
    const tables = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('已创建的表:');
    tables.forEach((table: any) => {
      console.log(`- ${table.name}`);
    });

  } catch (error) {
    console.error('创建数据库表失败:', error);
    throw error;
  } finally {
    await db.close();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTables().catch(console.error);
}

export { createTables };