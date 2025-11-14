-- SQLite版本的数据库建表脚本
-- 技术点信息管理系统

-- 1. 技术分类表
CREATE TABLE IF NOT EXISTS tech_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES tech_categories(id)
);

-- 2. 车型车系表
CREATE TABLE IF NOT EXISTS car_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    series TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    engine_type TEXT,
    fuel_type TEXT,
    market_segment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    metadata TEXT, -- JSON格式存储额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 车系表
CREATE TABLE IF NOT EXISTS car_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    brand TEXT NOT NULL,
    series TEXT NOT NULL,
    description TEXT,
    launch_year INTEGER,
    end_year INTEGER,
    market_segment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    metadata TEXT, -- JSON格式存储额外信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES car_models(id),
    UNIQUE(brand, series)
);

-- 4. 技术点表（核心表）
CREATE TABLE IF NOT EXISTS tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    tech_type TEXT DEFAULT 'feature' CHECK (tech_type IN ('feature', 'technology', 'innovation', 'improvement')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    tags TEXT, -- JSON数组格式存储标签
    technical_details TEXT, -- JSON格式存储技术详情
    benefits TEXT, -- JSON数组格式存储优势
    applications TEXT, -- JSON数组格式存储应用场景
    keywords TEXT, -- JSON数组格式存储关键词
    source_url TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES tech_categories(id),
    FOREIGN KEY (parent_id) REFERENCES tech_points(id)
);

-- 5. 技术点与车型关联表（多对多）
CREATE TABLE IF NOT EXISTS tech_point_car_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    car_model_id INTEGER NOT NULL,
    application_status TEXT DEFAULT 'planned' CHECK (application_status IN ('planned', 'developing', 'testing', 'production', 'discontinued')),
    implementation_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE,
    UNIQUE(tech_point_id, car_model_id)
);

-- 6. 知识点表
CREATE TABLE IF NOT EXISTS knowledge_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    knowledge_type TEXT DEFAULT 'concept' CHECK (knowledge_type IN ('concept', 'principle', 'application', 'case_study', 'best_practice')),
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('beginner', 'medium', 'advanced', 'expert')),
    tags TEXT, -- JSON数组格式存储标签
    prerequisites TEXT, -- JSON数组格式存储前置条件
    learning_objectives TEXT, -- JSON数组格式存储学习目标
    examples TEXT, -- JSON数组格式存储示例
    references TEXT, -- JSON数组格式存储参考资料
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);

-- 7. 技术包装材料表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_packaging_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tech_point_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    material_type TEXT DEFAULT 'general' CHECK (material_type IN ('general', 'marketing', 'technical', 'presentation')),
    target_audience TEXT DEFAULT 'general' CHECK (target_audience IN ('general', 'technical', 'marketing', 'executive')),
    language TEXT DEFAULT 'zh-CN',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id TEXT,
    created_by TEXT,
    reviewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);

-- 7. 技术推广策略表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_promotion_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    strategy_type TEXT DEFAULT 'comprehensive' CHECK (strategy_type IN ('comprehensive', 'marketing', 'pr', 'social_media', 'event')),
    target_market TEXT,
    timeline TEXT, -- JSON格式存储时间规划
    budget_range TEXT,
    kpi_metrics TEXT, -- JSON格式存储KPI指标
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'executing', 'completed')),
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id TEXT,
    created_by TEXT,
    reviewed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. 技术通稿表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_press_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    summary TEXT,
    release_type TEXT DEFAULT 'general' CHECK (release_type IN ('general', 'product_launch', 'technology_breakthrough', 'partnership', 'award')),
    target_media TEXT, -- JSON数组格式存储目标媒体
    publication_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    seo_keywords TEXT, -- JSON数组格式存储SEO关键词
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id TEXT,
    created_by TEXT,
    reviewed_by TEXT,
    published_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. 技术演讲稿表（AI生成内容）
CREATE TABLE IF NOT EXISTS tech_speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    speech_type TEXT DEFAULT 'conference' CHECK (speech_type IN ('conference', 'seminar', 'workshop', 'keynote', 'panel')),
    duration_minutes INTEGER DEFAULT 30,
    target_audience TEXT DEFAULT 'industry' CHECK (target_audience IN ('industry', 'academic', 'media', 'investors', 'general')),
    event_name TEXT,
    event_date DATE,
    speaker_notes TEXT,
    slides_outline TEXT, -- JSON格式存储幻灯片大纲
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'delivered')),
    generation_params TEXT, -- JSON格式存储生成参数
    dify_task_id TEXT,
    created_by TEXT,
    reviewed_by TEXT,
    delivered_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. 推广策略与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS promotion_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(promotion_id, tech_point_id)
);

-- 11. 通稿与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS press_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    press_release_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (press_release_id) REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(press_release_id, tech_point_id)
);

-- 12. 演讲稿与技术点关联表（多对多）
CREATE TABLE IF NOT EXISTS speech_tech_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    speech_id INTEGER NOT NULL,
    tech_point_id INTEGER NOT NULL,
    weight REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (speech_id) REFERENCES tech_speeches(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    UNIQUE(speech_id, tech_point_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tech_categories_parent_id ON tech_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_tech_categories_status ON tech_categories(status);

CREATE INDEX IF NOT EXISTS idx_car_series_brand ON car_series(brand);
CREATE INDEX IF NOT EXISTS idx_car_series_status ON car_series(status);
CREATE INDEX IF NOT EXISTS idx_car_series_market_segment ON car_series(market_segment);

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

-- 插入示例数据
INSERT OR IGNORE INTO tech_categories (id, name, description, parent_id, level) VALUES
(1, '动力系统', '发动机、电机、传动系统等动力相关技术', NULL, 1),
(2, '智能驾驶', '自动驾驶、辅助驾驶等智能化技术', NULL, 1),
(3, '车身结构', '车身设计、材料、安全结构等', NULL, 1),
(4, '内饰科技', '座舱、娱乐系统、人机交互等', NULL, 1),
(5, '新能源技术', '电池、充电、能源管理等', 1, 2),
(6, '传统动力', '燃油发动机、混合动力等', 1, 2);

INSERT OR IGNORE INTO car_series (id, model_id, brand, series, description, launch_year, market_segment, status) VALUES
(1, 1, '吉利', 'P7', '吉利P7系列，定位中高端纯电动轿车', 2023, 'Mid-size Sedan', 'active'),
(2, 1, '吉利', '博越', '吉利博越系列，紧凑型SUV', 2016, 'Compact SUV', 'active'),
(3, 2, '吉利', '星瑞', '吉利星瑞系列，中型轿车', 2020, 'Mid-size Sedan', 'active'),
(4, 3, '吉利', '几何', '几何系列，纯电动车型', 2019, 'Compact Sedan', 'active');

INSERT OR IGNORE INTO car_models (id, brand, series, model, year, engine_type, fuel_type, market_segment) VALUES
(1, '吉利', '博越', '博越Pro', 2024, '1.5T', 'Gasoline', 'Compact SUV'),
(2, '吉利', '星瑞', '星瑞L', 2024, '2.0T', 'Gasoline', 'Mid-size Sedan'),
(3, '吉利', '几何', '几何A', 2024, 'Electric', 'Electric', 'Compact Sedan'),
(4, '吉利', '极氪', '极氪001', 2024, 'Electric', 'Electric', 'Luxury Sedan');

INSERT OR IGNORE INTO tech_points (id, name, description, category_id, tech_type, priority, status) VALUES
(1, '雷神动力', '高效能混合动力系统，提供强劲动力和优异燃油经济性', 1, 'technology', 'high', 'active'),
(2, 'L2+智能驾驶', '具备自适应巡航、车道保持、自动泊车等功能的智能驾驶系统', 2, 'feature', 'high', 'active'),
(3, '笼式车身结构', '高强度钢材打造的安全车身结构，提供全方位碰撞保护', 3, 'technology', 'critical', 'active'),
(4, '银河OS车机系统', '基于安卓深度定制的智能车机系统，支持语音控制和生态应用', 4, 'feature', 'medium', 'active');

INSERT OR IGNORE INTO tech_point_car_models (tech_point_id, car_model_id, application_status, implementation_date) VALUES
(1, 1, 'production', '2024-01-01'),
(1, 2, 'production', '2024-03-01'),
(2, 1, 'production', '2024-01-01'),
(2, 2, 'production', '2024-03-01'),
(3, 1, 'production', '2024-01-01'),
(3, 2, 'production', '2024-03-01'),
(4, 1, 'production', '2024-01-01'),
(4, 2, 'production', '2024-03-01');