-- 三层级车系架构数据库迁移脚本 (SQLite版本)

-- 1. 创建品牌表
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

-- 2. 创建更新时间触发器
CREATE TRIGGER IF NOT EXISTS brands_updated_at 
  AFTER UPDATE ON brands
  FOR EACH ROW
  BEGIN
    UPDATE brands SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- 3. 备份原有 car_models 表
CREATE TABLE IF NOT EXISTS car_models_backup AS SELECT * FROM car_models;

-- 4. 从原有数据提取品牌信息并插入品牌表
INSERT OR IGNORE INTO brands (name, status, created_at, updated_at)
SELECT DISTINCT 
  brand,
  'active',
  datetime('now'),
  datetime('now')
FROM car_models
WHERE brand IS NOT NULL AND brand != '';

-- 5. 重命名原有 car_models 表为 car_series_temp
ALTER TABLE car_models RENAME TO car_series_temp;

-- 6. 创建新的车型表
CREATE TABLE car_models (
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

-- 7. 创建车型表更新时间触发器
CREATE TRIGGER IF NOT EXISTS car_models_updated_at 
  AFTER UPDATE ON car_models
  FOR EACH ROW
  BEGIN
    UPDATE car_models SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- 8. 创建车型表索引
CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);

-- 9. 创建新的车系表
CREATE TABLE car_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  generation TEXT,
  launch_year INTEGER,
  end_year INTEGER,
  market_segment TEXT CHECK (market_segment IN ('economy', 'compact', 'mid-size', 'full-size', 'luxury', 'sport', 'premium')),
  body_style TEXT,
  engine_types TEXT, -- JSON格式存储
  fuel_types TEXT,   -- JSON格式存储
  description TEXT,
  metadata TEXT,     -- JSON格式存储
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'planned')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE CASCADE
);

-- 10. 创建车系表更新时间触发器
CREATE TRIGGER IF NOT EXISTS car_series_updated_at 
  AFTER UPDATE ON car_series
  FOR EACH ROW
  BEGIN
    UPDATE car_series SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- 11. 创建车系表索引
CREATE INDEX IF NOT EXISTS idx_car_series_model_id ON car_series(model_id);
CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
CREATE INDEX IF NOT EXISTS idx_car_series_market_segment ON car_series(market_segment);

-- 12. 数据迁移：从原有数据创建车型记录
-- 这里假设原有的 series 字段实际上是车型名称
INSERT INTO car_models (brand_id, name, description, status, created_at, updated_at)
SELECT DISTINCT 
  b.id,
  COALESCE(cst.series, '未知车型'),
  '从原有数据迁移',
  CASE 
    WHEN cst.status = 'active' THEN 'active'
    WHEN cst.status = 'discontinued' THEN 'discontinued'
    ELSE 'active'
  END,
  cst.created_at,
  cst.updated_at
FROM car_series_temp cst
JOIN brands b ON b.name = cst.brand
WHERE cst.series IS NOT NULL AND cst.series != '';

-- 13. 数据迁移：从原有数据创建车系记录
INSERT INTO car_series (
  model_id, 
  name, 
  launch_year, 
  end_year, 
  market_segment,
  description, 
  metadata, 
  status, 
  created_at, 
  updated_at
)
SELECT 
  cm.id,
  COALESCE(cst.model, cst.series || ' 基础版'),
  cst.launch_year,
  cst.end_year,
  CASE 
    WHEN cst.market_segment = 'economy' THEN 'economy'
    WHEN cst.market_segment = 'compact' THEN 'compact'
    WHEN cst.market_segment = 'mid-size' THEN 'mid-size'
    WHEN cst.market_segment = 'full-size' THEN 'full-size'
    WHEN cst.market_segment = 'luxury' THEN 'luxury'
    WHEN cst.market_segment = 'sport' THEN 'sport'
    WHEN cst.market_segment = 'premium' THEN 'premium'
    ELSE 'compact'
  END,
  cst.description,
  cst.metadata,
  CASE 
    WHEN cst.status = 'active' THEN 'active'
    WHEN cst.status = 'discontinued' THEN 'discontinued'
    WHEN cst.status = 'planned' THEN 'planned'
    ELSE 'active'
  END,
  cst.created_at,
  cst.updated_at
FROM car_series_temp cst
JOIN brands b ON b.name = cst.brand
JOIN car_models cm ON cm.brand_id = b.id AND cm.name = COALESCE(cst.series, '未知车型');

-- 14. 插入示例数据
INSERT OR IGNORE INTO brands (name, name_en, country, founded_year, description) VALUES
('奥迪', 'Audi', '德国', 1909, '德国豪华汽车品牌'),
('宝马', 'BMW', '德国', 1916, '德国豪华汽车和摩托车制造商'),
('奔驰', 'Mercedes-Benz', '德国', 1926, '德国豪华汽车品牌'),
('大众', 'Volkswagen', '德国', 1937, '德国汽车制造商'),
('丰田', 'Toyota', '日本', 1937, '日本汽车制造商');

-- 15. 插入车型示例数据
INSERT INTO car_models (brand_id, name, category, description) 
SELECT b.id, '3系', 'sedan', '中型豪华轿车系列' FROM brands b WHERE b.name = '宝马'
UNION ALL
SELECT b.id, 'X系', 'suv', 'SUV系列' FROM brands b WHERE b.name = '宝马'
UNION ALL
SELECT b.id, 'A系', 'sedan', '豪华轿车系列' FROM brands b WHERE b.name = '奥迪'
UNION ALL
SELECT b.id, 'Q系', 'suv', 'SUV系列' FROM brands b WHERE b.name = '奥迪'
UNION ALL
SELECT b.id, 'C级', 'sedan', '中型豪华轿车系列' FROM brands b WHERE b.name = '奔驰'
UNION ALL
SELECT b.id, 'E级', 'sedan', '中大型豪华轿车系列' FROM brands b WHERE b.name = '奔驰';

-- 16. 插入车系示例数据
INSERT INTO car_series (model_id, name, market_segment, description)
SELECT cm.id, '320i', 'luxury', '宝马3系入门级车型' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '宝马' AND cm.name = '3系'
UNION ALL
SELECT cm.id, '330i', 'luxury', '宝马3系中配车型' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '宝马' AND cm.name = '3系'
UNION ALL
SELECT cm.id, 'X3', 'luxury', '宝马中型SUV' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '宝马' AND cm.name = 'X系'
UNION ALL
SELECT cm.id, 'X5', 'luxury', '宝马中大型SUV' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '宝马' AND cm.name = 'X系'
UNION ALL
SELECT cm.id, 'A3', 'compact', '奥迪紧凑型豪华轿车' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '奥迪' AND cm.name = 'A系'
UNION ALL
SELECT cm.id, 'A4', 'mid-size', '奥迪中型豪华轿车' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '奥迪' AND cm.name = 'A系'
UNION ALL
SELECT cm.id, 'Q3', 'compact', '奥迪紧凑型SUV' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '奥迪' AND cm.name = 'Q系'
UNION ALL
SELECT cm.id, 'Q5', 'mid-size', '奥迪中型SUV' 
FROM car_models cm JOIN brands b ON cm.brand_id = b.id 
WHERE b.name = '奥迪' AND cm.name = 'Q系';

-- 17. 创建视图用于向后兼容（可选）
CREATE VIEW IF NOT EXISTS v_legacy_car_models AS
SELECT 
  cs.id,
  b.name as brand,
  cm.name as series,
  cs.name as model,
  cs.description,
  cs.launch_year,
  cs.end_year,
  cs.market_segment,
  cs.status,
  cs.metadata,
  cs.created_at,
  cs.updated_at
FROM car_series cs
JOIN car_models cm ON cs.model_id = cm.id
JOIN brands b ON cm.brand_id = b.id;

-- 18. 清理临时表（可选，建议保留一段时间用于验证）
-- DROP TABLE car_series_temp;
-- DROP TABLE car_models_backup;