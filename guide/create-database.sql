-- Todify2 数据库创建脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS todify2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todify2;

-- 1. 技术分类表
CREATE TABLE tech_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    parent_id BIGINT COMMENT '父分类ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order),
    FOREIGN KEY (parent_id) REFERENCES tech_categories(id) ON DELETE SET NULL
);

-- 2. 车型车系表
CREATE TABLE car_models (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    brand VARCHAR(50) NOT NULL COMMENT '品牌',
    series VARCHAR(100) NOT NULL COMMENT '车系',
    model VARCHAR(100) NOT NULL COMMENT '车型',
    year_start INT COMMENT '起始年份',
    year_end INT COMMENT '结束年份',
    description TEXT COMMENT '描述',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_brand_series (brand, series),
    INDEX idx_model (model),
    INDEX idx_year (year_start, year_end)
);

-- 3. 技术点表
CREATE TABLE tech_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL COMMENT '技术点名称',
    description TEXT COMMENT '技术点描述',
    tech_category_id BIGINT NOT NULL COMMENT '技术分类ID',
    parent_id BIGINT COMMENT '父技术点ID（支持子技术点）',
    technical_details JSON COMMENT '技术详情（JSON格式）',
    difficulty_level ENUM('初级', '中级', '高级', '专家') DEFAULT '中级' COMMENT '技术难度',
    maturity_level ENUM('概念', '开发中', '测试', '量产', '成熟') DEFAULT '开发中' COMMENT '技术成熟度',
    priority INT DEFAULT 0 COMMENT '优先级',
    tags JSON COMMENT '标签（JSON数组）',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (tech_category_id),
    INDEX idx_parent (parent_id),
    INDEX idx_priority (priority),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_maturity (maturity_level),
    FOREIGN KEY (tech_category_id) REFERENCES tech_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_id) REFERENCES tech_points(id) ON DELETE SET NULL
);-- 4. 技术点与车型关联表
CREATE TABLE tech_point_car_models (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tech_point_id BIGINT NOT NULL COMMENT '技术点ID',
    car_model_id BIGINT NOT NULL COMMENT '车型ID',
    application_status ENUM('计划中', '开发中', '测试中', '已应用', '已停用') DEFAULT '计划中' COMMENT '应用状态',
    start_date DATE COMMENT '开始应用日期',
    end_date DATE COMMENT '停止应用日期',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_tech_car (tech_point_id, car_model_id),
    INDEX idx_tech_point (tech_point_id),
    INDEX idx_car_model (car_model_id),
    INDEX idx_status (application_status),
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE,
    FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE
);

-- 5. 技术包装材料表
CREATE TABLE tech_packaging_materials (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tech_point_id BIGINT NOT NULL COMMENT '关联的技术点ID',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content LONGTEXT NOT NULL COMMENT '包装内容',
    content_type ENUM('文档', '图片', '视频', '演示') DEFAULT '文档' COMMENT '内容类型',
    target_audience ENUM('技术人员', '市场人员', '客户', '媒体', '通用') DEFAULT '通用' COMMENT '目标受众',
    language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本号',
    status ENUM('草稿', '审核中', '已发布', '已归档') DEFAULT '草稿' COMMENT '状态',
    dify_task_id VARCHAR(100) COMMENT 'Dify任务ID',
    generation_params JSON COMMENT '生成参数',
    created_by BIGINT COMMENT '创建人ID',
    reviewed_by BIGINT COMMENT '审核人ID',
    published_at TIMESTAMP NULL COMMENT '发布时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tech_point (tech_point_id),
    INDEX idx_status (status),
    INDEX idx_type (content_type),
    INDEX idx_audience (target_audience),
    INDEX idx_dify_task (dify_task_id),
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);-- 6. 技术推广策略表
CREATE TABLE tech_promotion_strategies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '策略标题',
    content LONGTEXT NOT NULL COMMENT '策略内容',
    strategy_type ENUM('市场推广', '技术推广', '品牌推广', '产品推广') DEFAULT '技术推广' COMMENT '策略类型',
    target_market VARCHAR(100) COMMENT '目标市场',
    budget_range VARCHAR(50) COMMENT '预算范围',
    timeline VARCHAR(100) COMMENT '时间计划',
    success_metrics JSON COMMENT '成功指标',
    status ENUM('草稿', '审核中', '已批准', '执行中', '已完成', '已暂停') DEFAULT '草稿' COMMENT '状态',
    dify_task_id VARCHAR(100) COMMENT 'Dify任务ID',
    generation_params JSON COMMENT '生成参数',
    created_by BIGINT COMMENT '创建人ID',
    approved_by BIGINT COMMENT '批准人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (strategy_type),
    INDEX idx_status (status),
    INDEX idx_dify_task (dify_task_id)
);

-- 7. 技术通稿表
CREATE TABLE tech_press_releases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '通稿标题',
    subtitle VARCHAR(300) COMMENT '副标题',
    content LONGTEXT NOT NULL COMMENT '通稿内容',
    summary TEXT COMMENT '摘要',
    press_type ENUM('新技术发布', '技术突破', '合作公告', '产品发布', '其他') DEFAULT '新技术发布' COMMENT '通稿类型',
    target_media JSON COMMENT '目标媒体列表',
    keywords JSON COMMENT '关键词',
    release_date DATE COMMENT '计划发布日期',
    embargo_date DATETIME COMMENT '禁发时间',
    status ENUM('草稿', '审核中', '已批准', '已发布', '已撤回') DEFAULT '草稿' COMMENT '状态',
    dify_task_id VARCHAR(100) COMMENT 'Dify任务ID',
    generation_params JSON COMMENT '生成参数',
    created_by BIGINT COMMENT '创建人ID',
    approved_by BIGINT COMMENT '批准人ID',
    published_at TIMESTAMP NULL COMMENT '实际发布时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (press_type),
    INDEX idx_status (status),
    INDEX idx_release_date (release_date),
    INDEX idx_dify_task (dify_task_id)
);-- 8. 发布会演讲稿表
CREATE TABLE tech_speeches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '演讲稿标题',
    content LONGTEXT NOT NULL COMMENT '演讲稿内容',
    speech_type ENUM('产品发布会', '技术大会', '媒体见面会', '内部分享', '其他') DEFAULT '产品发布会' COMMENT '演讲类型',
    duration_minutes INT COMMENT '预计时长（分钟）',
    target_audience VARCHAR(200) COMMENT '目标听众',
    event_name VARCHAR(200) COMMENT '活动名称',
    event_date DATE COMMENT '活动日期',
    speaker_notes LONGTEXT COMMENT '演讲者备注',
    slides_url VARCHAR(500) COMMENT 'PPT链接',
    status ENUM('草稿', '审核中', '已批准', '已使用', '已归档') DEFAULT '草稿' COMMENT '状态',
    dify_task_id VARCHAR(100) COMMENT 'Dify任务ID',
    generation_params JSON COMMENT '生成参数',
    created_by BIGINT COMMENT '创建人ID',
    approved_by BIGINT COMMENT '批准人ID',
    used_at TIMESTAMP NULL COMMENT '使用时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (speech_type),
    INDEX idx_status (status),
    INDEX idx_event_date (event_date),
    INDEX idx_dify_task (dify_task_id)
);

-- 9. 推广策略与技术点关联表
CREATE TABLE promotion_tech_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    promotion_id BIGINT NOT NULL COMMENT '推广策略ID',
    tech_point_id BIGINT NOT NULL COMMENT '技术点ID',
    importance_level ENUM('核心', '重要', '一般', '辅助') DEFAULT '重要' COMMENT '重要程度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_promotion_tech (promotion_id, tech_point_id),
    INDEX idx_promotion (promotion_id),
    INDEX idx_tech_point (tech_point_id),
    FOREIGN KEY (promotion_id) REFERENCES tech_promotion_strategies(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);

-- 10. 通稿与技术点关联表
CREATE TABLE press_tech_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    press_id BIGINT NOT NULL COMMENT '通稿ID',
    tech_point_id BIGINT NOT NULL COMMENT '技术点ID',
    mention_type ENUM('主要', '次要', '引用') DEFAULT '主要' COMMENT '提及类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_press_tech (press_id, tech_point_id),
    INDEX idx_press (press_id),
    INDEX idx_tech_point (tech_point_id),
    FOREIGN KEY (press_id) REFERENCES tech_press_releases(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);-- 11. 演讲稿与技术点关联表
CREATE TABLE speech_tech_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    speech_id BIGINT NOT NULL COMMENT '演讲稿ID',
    tech_point_id BIGINT NOT NULL COMMENT '技术点ID',
    presentation_order INT COMMENT '演讲顺序',
    emphasis_level ENUM('重点强调', '详细介绍', '简要提及') DEFAULT '详细介绍' COMMENT '强调程度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_speech_tech (speech_id, tech_point_id),
    INDEX idx_speech (speech_id),
    INDEX idx_tech_point (tech_point_id),
    INDEX idx_order (presentation_order),
    FOREIGN KEY (speech_id) REFERENCES tech_speeches(id) ON DELETE CASCADE,
    FOREIGN KEY (tech_point_id) REFERENCES tech_points(id) ON DELETE CASCADE
);

-- 插入示例数据
-- 技术分类示例数据
INSERT INTO tech_categories (name, description, sort_order) VALUES
('动力系统', '发动机、电机、传动系统等相关技术', 1),
('智能驾驶', '自动驾驶、辅助驾驶相关技术', 2),
('车联网', '车载通信、物联网技术', 3),
('新能源', '电池、充电、能源管理技术', 4),
('安全技术', '主动安全、被动安全技术', 5);

-- 车型车系示例数据
INSERT INTO car_models (brand, series, model, year_start, year_end) VALUES
('比亚迪', '汉', '汉EV', 2020, NULL),
('比亚迪', '汉', '汉DM', 2020, NULL),
('比亚迪', '唐', '唐EV', 2018, NULL),
('比亚迪', '宋', '宋PLUS EV', 2021, NULL),
('特斯拉', 'Model 3', 'Model 3', 2019, NULL);

-- 技术点示例数据
INSERT INTO tech_points (name, description, tech_category_id, difficulty_level, maturity_level, priority) VALUES
('刀片电池技术', '磷酸铁锂刀片电池，提高安全性和能量密度', 4, '高级', '量产', 10),
('DM-i超级混动', '插电式混合动力系统，兼顾性能和经济性', 1, '高级', '量产', 9),
('DiPilot智能驾驶', 'L2+级别智能驾驶辅助系统', 2, '专家', '测试', 8),
('DiLink智能网联', '车机互联系统，支持OTA升级', 3, '中级', '成熟', 7);

-- 技术点与车型关联示例数据
INSERT INTO tech_point_car_models (tech_point_id, car_model_id, application_status, start_date) VALUES
(1, 1, '已应用', '2020-06-01'),
(1, 3, '已应用', '2021-01-01'),
(2, 2, '已应用', '2021-03-01'),
(3, 1, '测试中', '2023-01-01'),
(4, 1, '已应用', '2020-06-01'),
(4, 2, '已应用', '2021-03-01');