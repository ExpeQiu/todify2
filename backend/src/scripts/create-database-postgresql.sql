-- PostgreSQL版本的数据库建表脚本
-- 技术点信息管理系统

-- 创建数据库（如果需要）
-- CREATE DATABASE todify2;

-- 1. 技术分类表
CREATE TABLE IF NOT EXISTS tech_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES tech_categories(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 车型车系表
CREATE TABLE IF NOT EXISTS car_models (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    series VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    engine_type VARCHAR(50),
    fuel_type VARCHAR(50),
    market_segment VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    metadata JSONB, -- JSON格式存储额外信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 技术点表（核心表）
CREATE TABLE IF NOT EXISTS tech_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES tech_categories(id),
    parent_id INTEGER REFERENCES tech_points(id),
    level INTEGER DEFAULT 1,
    tech_type VARCHAR(20) DEFAULT 'feature' CHECK (tech_type IN ('feature', 'technology', 'innovation', 'improvement')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    tags JSONB, -- JSON数组格式存储标签
    technical_details JSONB, -- JSON格式存储技术详情
    benefits JSONB, -- JSON数组格式存储优势
    applications JSONB, -- JSON数组格式存储应用场景
    keywords JSONB, -- JSON数组格式存储关键词
    source_url VARCHAR(500),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 技术点与车型关联表（多对多）
CREATE TABLE IF NOT EXISTS tech_point_car_models (
    id SERIAL PRIMARY KEY,
    tech_point_id INTEGER NOT NULL REFERENCES tech_points(id) ON DELETE CASCADE,
    car_model_id INTEGER NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
    application_status VARCHAR(20) DEFAULT 'planned' CHECK (application_status IN ('planned', 'developing', 'testing', 'production', 'discontinued')),
    implementation_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tech_point_id, car_model_id)
);

-- 5. 技术包装材料表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_packaging_materials (
    id SERIAL PRIMARY KEY,
    tech_point_id INTEGER NOT NULL REFERENCES tech_points(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    material_type VARCHAR(20) DEFAULT 'general' CHECK (material_type IN ('general', 'marketing', 'technical', 'presentation')),
    target_audience VARCHAR(20) DEFAULT 'general' CHECK (target_audience IN ('general', 'technical', 'marketing', 'executive')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    generation_params JSONB, -- JSON格式存储生成参数
    dify_task_id VARCHAR(100),
    created_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 技术推广策略表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_promotion_strategies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    strategy_type VARCHAR(20) DEFAULT 'comprehensive' CHECK (strategy_type IN ('comprehensive', 'marketing', 'pr', 'social_media', 'event')),
    target_market VARCHAR(200),
    timeline JSONB, -- JSON格式存储时间规划
    budget_range VARCHAR(100),
    kpi_metrics JSONB, -- JSON格式存储KPI指标
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'executing', 'completed')),
    generation_params JSONB, -- JSON格式存储生成参数
    dify_task_id VARCHAR(100),
    created_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 技术通稿表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_press_releases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    content TEXT NOT NULL,
    summary TEXT,
    release_type VARCHAR(30) DEFAULT 'general' CHECK (release_type IN ('general', 'product_launch', 'technology_breakthrough', 'partnership', 'award')),
    target_media JSONB, -- JSON数组格式存储目标媒体
    publication_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    seo_keywords JSONB, -- JSON数组格式存储SEO关键词
    generation_params JSONB, -- JSON格式存储生成参数
    dify_task_id VARCHAR(100),
    created_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    published_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 技术演讲稿表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_speeches (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    speech_type VARCHAR(20) DEFAULT 'conference' CHECK (speech_type IN ('conference', 'seminar', 'workshop', 'keynote', 'panel')),
    duration_minutes INTEGER DEFAULT 30,
    target_audience VARCHAR(20) DEFAULT 'industry' CHECK (target_audience IN ('industry', 'academic', 'media', 'investors', 'general')),
    event_name VARCHAR(200),
    event_date DATE,
    speaker_notes TEXT,
    slides_outline JSONB, -- JSON格式存储幻灯片大纲
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'delivered')),
    generation_params JSONB, -- JSON格式存储生成参数
    dify_task_id VARCHAR(100),
    created_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    delivered_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 推广策略与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS promotion_tech_points (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER NOT NULL REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    tech_point_id INTEGER NOT NULL REFERENCES tech_points(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(promotion_id, tech_point_id)
);

-- 10. 通稿与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS press_tech_points (
    id SERIAL PRIMARY KEY,
    press_release_id INTEGER NOT NULL REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    tech_point_id INTEGER NOT NULL REFERENCES tech_points(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(press_release_id, tech_point_id)
);

-- 11. 演讲稿与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS speech_tech_points (
    id SERIAL PRIMARY KEY,
    speech_id INTEGER NOT NULL REFERENCES tech_speeches(id) ON DELETE CASCADE,
    tech_point_id INTEGER NOT NULL REFERENCES tech_points(id) ON DELETE CASCADE,
    weight DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(speech_id, tech_point_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);

CREATE INDEX IF NOT EXISTS idx_car_models_brand ON car_models(brand);
CREATE INDEX IF NOT EXISTS idx_car_models_series ON car_models(series);
CREATE INDEX IF NOT EXISTS idx_car_models_status ON car_models(status);

CREATE INDEX IF NOT EXISTS idx_tech_points_category_id ON tech_points(category_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_parent_id ON tech_points(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_points_status ON tech_points(status);
CREATE INDEX IF NOT EXISTS idx_tech_points_priority ON tech_points(priority);
CREATE INDEX IF NOT EXISTS idx_tech_points_created_at ON tech_points(created_at);

CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_tech_point_id ON tech_point_car_models(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_point_car_models_car_model_id ON tech_point_car_models(car_model_id);

CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_tech_point_id ON tech_packaging_materials(tech_point_id);
CREATE INDEX IF NOT EXISTS idx_tech_packaging_materials_status ON tech_packaging_materials(status);

CREATE INDEX IF NOT EXISTS idx_tech_promotion_strategies_status ON tech_promotion_strategies(status);
CREATE INDEX IF NOT EXISTS idx_tech_press_releases_status ON tech_press_releases(status);
CREATE INDEX IF NOT EXISTS idx_tech_speeches_status ON tech_speeches(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间触发器
CREATE TRIGGER update_tech_categories_updated_at BEFORE UPDATE ON tech_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_car_models_updated_at BEFORE UPDATE ON car_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_points_updated_at BEFORE UPDATE ON tech_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_point_car_models_updated_at BEFORE UPDATE ON tech_point_car_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_packaging_materials_updated_at BEFORE UPDATE ON tech_packaging_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_promotion_strategies_updated_at BEFORE UPDATE ON tech_promotion_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_press_releases_updated_at BEFORE UPDATE ON tech_press_releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tech_speeches_updated_at BEFORE UPDATE ON tech_speeches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO tech_categories (id, name, description, parent_id, level) VALUES
(1, '动力系统', '发动机、电机、传动系统等动力相关技术', NULL, 1),
(2, '智能驾驶', '自动驾驶、辅助驾驶等智能化技术', NULL, 1),
(3, '车身结构', '车身设计、材料、安全结构等', NULL, 1),
(4, '内饰科技', '座舱、娱乐系统、人机交互等', NULL, 1),
(5, '新能源技术', '电池、充电、能源管理等', 1, 2),
(6, '传统动力', '燃油发动机、混合动力等', 1, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO car_models (id, brand, series, model, year, engine_type, fuel_type, market_segment) VALUES
(1, '吉利', '博越', '博越Pro', 2024, '1.5T', 'Gasoline', 'Compact SUV'),
(2, '吉利', '星瑞', '星瑞L', 2024, '2.0T', 'Gasoline', 'Mid-size Sedan'),
(3, '吉利', '几何', '几何A', 2024, 'Electric', 'Electric', 'Compact Sedan'),
(4, '吉利', '极氪', '极氪001', 2024, 'Electric', 'Electric', 'Luxury Sedan')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tech_points (id, name, description, category_id, tech_type, priority, status) VALUES
(1, '雷神动力', '高效能混合动力系统，提供强劲动力和优异燃油经济性', 1, 'technology', 'high', 'active'),
(2, 'L2+智能驾驶', '具备自适应巡航、车道保持、自动泊车等功能的智能驾驶系统', 2, 'feature', 'high', 'active'),
(3, '笼式车身结构', '高强度钢材打造的安全车身结构，提供全方位碰撞保护', 3, 'technology', 'critical', 'active'),
(4, '银河OS车机系统', '基于安卓深度定制的智能车机系统，支持语音控制和生态应用', 4, 'feature', 'medium', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tech_point_car_models (tech_point_id, car_model_id, application_status, implementation_date) VALUES
(1, 1, 'production', '2024-01-01'),
(1, 2, 'production', '2024-03-01'),
(2, 1, 'production', '2024-01-01'),
(2, 2, 'production', '2024-03-01'),
(3, 1, 'production', '2024-01-01'),
(3, 2, 'production', '2024-03-01'),
(4, 1, 'production', '2024-01-01'),
(4, 2, 'production', '2024-03-01')
ON CONFLICT (tech_point_id, car_model_id) DO NOTHING;

-- 重置序列（如果需要）
SELECT setval('tech_categories_id_seq', (SELECT MAX(id) FROM tech_categories));
SELECT setval('car_models_id_seq', (SELECT MAX(id) FROM car_models));
SELECT setval('tech_points_id_seq', (SELECT MAX(id) FROM tech_points));