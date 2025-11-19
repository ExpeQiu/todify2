# Todify3 数据库设计文档

## 概述
基于技术点管理和AI内容生成的数据库架构设计，支持技术点分类管理、车型车系关联以及多种AI生成内容类型。

## 核心实体分析

### 1. 技术点 (TechPoint)
- 系统的核心实体
- 可以有父子关系（支持子技术点）
- 关联技术分类和车型车系
- 作为AI内容生成的基础单元

### 2. 技术分类 (TechCategory)
- 对技术点进行分类管理
- 支持层级结构

### 3. 车型车系 (CarModel)
- 车型和车系信息
- 与技术点多对多关联

### 4. AI生成内容
- 技术包装材料 (TechPackaging)
- 技术推广策略 (TechPromotion)
- 技术通稿 (TechPress)
- 发布会演讲稿 (TechSpeech)

## 数据库表结构设计

### 核心实体表

#### 1. 技术分类表 (tech_categories)
```sql
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
```

#### 2. 车型车系表 (car_models)
```sql
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
```

#### 3. 技术点表 (tech_points)
```sql
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
);
```### 关联关系表

#### 4. 技术点与车型关联表 (tech_point_car_models)
```sql
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
```

### AI生成内容表

#### 5. 技术包装材料表 (tech_packaging_materials)
```sql
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
);
```

#### 6. 技术推广策略表 (tech_promotion_strategies)
```sql
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
```#### 7. 技术通稿表 (tech_press_releases)
```sql
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
);
```

#### 8. 发布会演讲稿表 (tech_speeches)
```sql
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
```### 多对多关联表

#### 9. 推广策略与技术点关联表 (promotion_tech_points)
```sql
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
```

#### 10. 通稿与技术点关联表 (press_tech_points)
```sql
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
);
```

#### 11. 演讲稿与技术点关联表 (speech_tech_points)
```sql
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
```## 数据关系说明

### 核心关系链路

1. **技术分类 → 技术点**
   - 一对多关系：一个技术分类可以包含多个技术点
   - 技术分类支持层级结构（parent_id自关联）

2. **技术点 → 子技术点**
   - 一对多自关联：技术点可以包含多个子技术点
   - 支持多层级的技术点结构

3. **技术点 ↔ 车型车系**
   - 多对多关系：一个技术点可应用于多个车型，一个车型可使用多种技术
   - 通过 `tech_point_car_models` 关联表维护关系
   - 记录应用状态、时间等详细信息

4. **技术点 → AI生成内容**
   - 一对多关系：一个技术点可生成多个包装材料
   - 多对多关系：多个技术点可组合生成推广策略、通稿、演讲稿

### AI内容生成链路

```
单个技术点 → 技术包装材料 (1:N)
多个技术点 → 技术推广策略 (N:N)
多个技术点 → 技术通稿 (N:N)  
多个技术点 → 发布会演讲稿 (N:N)
```

## 字段设计说明

### 通用字段
- `id`: 主键，使用BIGINT自增
- `created_at/updated_at`: 创建和更新时间戳
- `is_active`: 软删除标记
- `dify_task_id`: 与Dify AI系统的任务关联

### JSON字段说明
- `technical_details`: 存储技术点的详细技术参数
- `tags`: 技术点标签数组，便于搜索和分类
- `generation_params`: AI生成时的参数配置
- `success_metrics`: 推广策略的成功指标
- `target_media`: 通稿的目标媒体列表
- `keywords`: 通稿关键词

### 枚举字段设计
- `difficulty_level`: 技术难度等级（初级/中级/高级/专家）
- `maturity_level`: 技术成熟度（概念/开发中/测试/量产/成熟）
- `application_status`: 技术应用状态（计划中/开发中/测试中/已应用/已停用）
- `status`: 内容状态（草稿/审核中/已发布等）

## 索引设计

### 主要索引
1. **外键索引**: 所有外键字段都建立索引，提高关联查询性能
2. **状态索引**: 各种状态字段建立索引，便于状态筛选
3. **时间索引**: 日期时间字段建立索引，支持时间范围查询
4. **复合索引**: 
   - `(brand, series)`: 车型品牌和车系组合查询
   - `(year_start, year_end)`: 车型年份范围查询

### 唯一约束
- `uk_tech_car`: 技术点与车型的唯一关联
- `uk_promotion_tech`: 推广策略与技术点的唯一关联
- `uk_press_tech`: 通稿与技术点的唯一关联
- `uk_speech_tech`: 演讲稿与技术点的唯一关联

## 数据完整性

### 外键约束
- `ON DELETE CASCADE`: 主记录删除时，关联记录自动删除
- `ON DELETE SET NULL`: 主记录删除时，外键设为NULL
- `ON DELETE RESTRICT`: 存在关联记录时，禁止删除主记录

### 业务规则
1. 技术点必须关联技术分类（NOT NULL约束）
2. AI生成内容必须关联至少一个技术点
3. 车型年份范围合理性检查（year_start <= year_end）
4. 状态流转的业务逻辑控制

## 扩展性考虑

### 水平扩展
- 使用BIGINT主键，支持大数据量
- JSON字段存储灵活的扩展属性
- 预留created_by、reviewed_by等用户关联字段

### 垂直扩展
- 技术分类支持无限层级
- 技术点支持父子关系
- 内容类型可通过枚举值扩展

### 国际化支持
- 使用utf8mb4字符集
- language字段支持多语言内容
- 预留多语言扩展能力

## 性能优化建议

1. **分区策略**: 可按创建时间对大表进行分区
2. **读写分离**: AI生成内容表读多写少，适合读写分离
3. **缓存策略**: 技术分类、车型等基础数据适合缓存
4. **归档策略**: 已归档的内容可迁移到历史表

## 安全考虑

1. **数据脱敏**: 敏感的技术详情可加密存储
2. **访问控制**: 通过created_by等字段实现数据权限控制
3. **审计日志**: 重要操作记录操作人和操作时间
4. **备份策略**: 定期备份，特别是AI生成的内容数据