-- 三层级车系架构数据库迁移脚本

-- 1. 创建品牌表
CREATE TABLE IF NOT EXISTS brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '品牌名称',
  name_en VARCHAR(100) COMMENT '英文名称',
  logo_url VARCHAR(500) COMMENT '品牌logo',
  country VARCHAR(50) COMMENT '品牌国家',
  founded_year INT COMMENT '成立年份',
  description TEXT COMMENT '品牌描述',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 备份原有 car_models 表
CREATE TABLE car_models_backup AS SELECT * FROM car_models;

-- 3. 从原有数据提取品牌信息并插入品牌表
INSERT INTO brands (name, status, created_at, updated_at)
SELECT DISTINCT 
  brand,
  'active',
  NOW(),
  NOW()
FROM car_models
WHERE brand IS NOT NULL AND brand != ''
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 4. 重命名原有 car_models 表为 car_series_temp
RENAME TABLE car_models TO car_series_temp;

-- 5. 创建新的车型表
CREATE TABLE car_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '车型名称',
  name_en VARCHAR(100) COMMENT '英文名称',
  category ENUM('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'pickup', 'van', 'mpv') COMMENT '车型类别',
  launch_year INT COMMENT '上市年份',
  end_year INT COMMENT '停产年份',
  description TEXT COMMENT '车型描述',
  status ENUM('active', 'discontinued', 'planned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  INDEX idx_brand_id (brand_id),
  INDEX idx_status (status)
);

-- 6. 创建新的车系表
CREATE TABLE car_series (
  id INT PRIMARY KEY AUTO_INCREMENT,
  model_id INT NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '车系名称',
  name_en VARCHAR(100) COMMENT '英文名称',
  generation VARCHAR(50) COMMENT '世代信息',
  launch_year INT COMMENT '上市年份',
  end_year INT COMMENT '停产年份',
  market_segment ENUM('economy', 'compact', 'mid-size', 'full-size', 'luxury', 'sport', 'premium') COMMENT '市场定位',
  body_style VARCHAR(100) COMMENT '车身样式',
  engine_types JSON COMMENT '发动机类型',
  fuel_types JSON COMMENT '燃料类型',
  description TEXT COMMENT '车系描述',
  metadata JSON COMMENT '额外信息',
  status ENUM('active', 'discontinued', 'planned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES car_models(id) ON DELETE CASCADE,
  INDEX idx_model_id (model_id),
  INDEX idx_status (status),
  INDEX idx_market_segment (market_segment)
);

-- 7. 数据迁移：从原有数据创建车型记录
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

-- 8. 数据迁移：从原有数据创建车系记录
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
  COALESCE(cst.model, CONCAT(cst.series, ' 基础版')),
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

-- 9. 更新技术点关联表（如果存在）
-- 假设有 tech_point_car_models 表需要更新
-- UPDATE tech_point_car_models tpcm
-- JOIN car_series_temp cst ON tpcm.car_model_id = cst.id
-- JOIN brands b ON b.name = cst.brand
-- JOIN car_models cm ON cm.brand_id = b.id AND cm.name = cst.series
-- JOIN car_series cs ON cs.model_id = cm.id
-- SET tpcm.car_series_id = cs.id;

-- 10. 插入示例数据
INSERT INTO brands (name, name_en, country, founded_year, description) VALUES
('奥迪', 'Audi', '德国', 1909, '德国豪华汽车品牌'),
('宝马', 'BMW', '德国', 1916, '德国豪华汽车和摩托车制造商'),
('奔驰', 'Mercedes-Benz', '德国', 1926, '德国豪华汽车品牌'),
('大众', 'Volkswagen', '德国', 1937, '德国汽车制造商'),
('丰田', 'Toyota', '日本', 1937, '日本汽车制造商')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 插入车型示例数据
INSERT INTO car_models (brand_id, name, category, description) 
SELECT b.id, model_name, 'sedan', description FROM brands b
CROSS JOIN (
  SELECT '3系' as model_name, '中型豪华轿车系列' as description WHERE b.name = '宝马'
  UNION ALL
  SELECT 'X系' as model_name, 'SUV系列' as description WHERE b.name = '宝马'
  UNION ALL
  SELECT 'A系' as model_name, '豪华轿车系列' as description WHERE b.name = '奥迪'
  UNION ALL
  SELECT 'Q系' as model_name, 'SUV系列' as description WHERE b.name = '奥迪'
  UNION ALL
  SELECT 'C级' as model_name, '中型豪华轿车系列' as description WHERE b.name = '奔驰'
  UNION ALL
  SELECT 'E级' as model_name, '中大型豪华轿车系列' as description WHERE b.name = '奔驰'
) models
WHERE (b.name = '宝马' AND model_name IN ('3系', 'X系'))
   OR (b.name = '奥迪' AND model_name IN ('A系', 'Q系'))
   OR (b.name = '奔驰' AND model_name IN ('C级', 'E级'));

-- 插入车系示例数据
INSERT INTO car_series (model_id, name, market_segment, description)
SELECT cm.id, series_name, segment, series_desc FROM car_models cm
JOIN brands b ON cm.brand_id = b.id
CROSS JOIN (
  SELECT '320i' as series_name, 'luxury' as segment, '宝马3系入门级车型' as series_desc WHERE b.name = '宝马' AND cm.name = '3系'
  UNION ALL
  SELECT '330i' as series_name, 'luxury' as segment, '宝马3系中配车型' as series_desc WHERE b.name = '宝马' AND cm.name = '3系'
  UNION ALL
  SELECT 'X3' as series_name, 'luxury' as segment, '宝马中型SUV' as series_desc WHERE b.name = '宝马' AND cm.name = 'X系'
  UNION ALL
  SELECT 'X5' as series_name, 'luxury' as segment, '宝马中大型SUV' as series_desc WHERE b.name = '宝马' AND cm.name = 'X系'
  UNION ALL
  SELECT 'A3' as series_name, 'compact' as segment, '奥迪紧凑型豪华轿车' as series_desc WHERE b.name = '奥迪' AND cm.name = 'A系'
  UNION ALL
  SELECT 'A4' as series_name, 'mid-size' as segment, '奥迪中型豪华轿车' as series_desc WHERE b.name = '奥迪' AND cm.name = 'A系'
  UNION ALL
  SELECT 'Q3' as series_name, 'compact' as segment, '奥迪紧凑型SUV' as series_desc WHERE b.name = '奥迪' AND cm.name = 'Q系'
  UNION ALL
  SELECT 'Q5' as series_name, 'mid-size' as segment, '奥迪中型SUV' as series_desc WHERE b.name = '奥迪' AND cm.name = 'Q系'
) series_data
WHERE (b.name = '宝马' AND cm.name = '3系' AND series_name IN ('320i', '330i'))
   OR (b.name = '宝马' AND cm.name = 'X系' AND series_name IN ('X3', 'X5'))
   OR (b.name = '奥迪' AND cm.name = 'A系' AND series_name IN ('A3', 'A4'))
   OR (b.name = '奥迪' AND cm.name = 'Q系' AND series_name IN ('Q3', 'Q5'));

-- 11. 清理临时表（可选，建议保留一段时间用于验证）
-- DROP TABLE car_series_temp;
-- DROP TABLE car_models_backup;

-- 12. 创建视图用于向后兼容（可选）
CREATE OR REPLACE VIEW v_legacy_car_models AS
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