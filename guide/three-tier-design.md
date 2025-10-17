# 三层级车系架构设计

## 概述
将原有的两层级结构（品牌-车系）调整为三层级结构（品牌-车型-车系），以更好地反映汽车行业的实际层级关系。

## 层级关系
```
品牌 (Brand)
├── 车型 (Model) 
    ├── 车系 (Series)
```

## 数据库设计

### 1. 品牌表 (brands)
```sql
CREATE TABLE brands (
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
```

### 2. 车型表 (car_models)
```sql
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
```

### 3. 车系表 (car_series)
```sql
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
```

## 数据示例

### 品牌数据
- 奥迪 (Audi)
- 宝马 (BMW)
- 奔驰 (Mercedes-Benz)

### 车型数据
- 奥迪 A 系列
- 奥迪 Q 系列
- 宝马 1 系列
- 宝马 3 系列
- 宝马 X 系列

### 车系数据
- 奥迪 A 系列 -> A3, A4, A6, A8
- 奥迪 Q 系列 -> Q3, Q5, Q7, Q8
- 宝马 3 系列 -> 3系轿车, 3系旅行车, 3系GT

## API 接口设计

### 品牌相关接口
- GET /api/v1/brands - 获取品牌列表
- POST /api/v1/brands - 创建品牌
- PUT /api/v1/brands/:id - 更新品牌
- DELETE /api/v1/brands/:id - 删除品牌

### 车型相关接口
- GET /api/v1/models - 获取车型列表
- GET /api/v1/brands/:brandId/models - 获取指定品牌的车型
- POST /api/v1/models - 创建车型
- PUT /api/v1/models/:id - 更新车型
- DELETE /api/v1/models/:id - 删除车型

### 车系相关接口
- GET /api/v1/series - 获取车系列表
- GET /api/v1/models/:modelId/series - 获取指定车型的车系
- POST /api/v1/series - 创建车系
- PUT /api/v1/series/:id - 更新车系
- DELETE /api/v1/series/:id - 删除车系

## 前端组件结构

### 页面组织
```
CarManagement/
├── BrandManagement.tsx      # 品牌管理页面
├── ModelManagement.tsx      # 车型管理页面
├── SeriesManagement.tsx     # 车系管理页面
└── HierarchyView.tsx        # 层级视图页面
```

### 组件层级
```
HierarchyView
├── BrandList
│   ├── BrandCard
│   └── ModelList
│       ├── ModelCard
│       └── SeriesList
│           └── SeriesCard
```

## 迁移策略

### 1. 数据迁移
1. 创建新的三个表
2. 从现有 car_models 表提取品牌数据到 brands 表
3. 重构 car_models 表数据到新的 car_models 和 car_series 表
4. 更新外键关系

### 2. 代码迁移
1. 更新后端模型和类型定义
2. 重构 API 接口
3. 更新前端类型定义
4. 重构前端组件

### 3. 向后兼容
- 保留原有 API 接口一段时间
- 提供数据格式转换工具
- 逐步迁移前端页面