# 技术点车型数据 API 传递验证文档

## 概述

本文档说明如何验证技术点关联车型数据是否可以通过 API 正确传递到本项目数据库。

## 数据库变更

已为 `tech_points` 表添加以下字段：

- `tpd_id` (VARCHAR): TPD2 项目的原始 ID，用于同步锚点
- `car_models_info` (TEXT/JSONB): JSON 格式存储车型信息数组
- `resources_info` (TEXT/JSONB): JSON 格式存储资源信息数组
- `knowledge_info` (TEXT/JSONB): JSON 格式存储知识点详情

## 数据格式

### CarModelInfo 接口

```typescript
interface CarModelInfo {
  id?: number;
  name: string;
  brand?: string;
  brand_id?: number;
  series?: string;
  launch_date?: string;
  status?: string;
  application_status?: string;
  implementation_date?: string;
  notes?: string;
}
```

### ResourceInfo 接口

```typescript
interface ResourceInfo {
  type: 'pdf' | 'link' | 'image' | 'video' | 'document' | 'other';
  name: string;
  url?: string;
  file_path?: string;
  description?: string;
  size?: number;
  created_at?: string;
}
```

## API 使用示例

### 1. 创建技术点（包含车型信息）

```bash
POST /api/v1/tech-points
Content-Type: application/json

{
  "name": "刀片电池技术",
  "description": "磷酸铁锂刀片电池技术",
  "tech_type": "technology",
  "priority": "high",
  "status": "active",
  "tpd_id": "tpd_001",
  "car_models_info": [
    {
      "name": "汉EV",
      "brand": "比亚迪",
      "brand_id": 1,
      "series": "汉",
      "launch_date": "2020-07-01",
      "status": "active",
      "application_status": "production",
      "implementation_date": "2020-07-01",
      "notes": "首款搭载刀片电池的车型"
    }
  ],
  "resources_info": [
    {
      "type": "pdf",
      "name": "技术白皮书",
      "url": "https://example.com/tech-whitepaper.pdf"
    }
  ]
}
```

### 2. 更新技术点（更新车型信息）

```bash
PUT /api/v1/tech-points/:id
Content-Type: application/json

{
  "car_models_info": [
    {
      "name": "汉EV",
      "brand": "比亚迪",
      "status": "active"
    },
    {
      "name": "唐EV",
      "brand": "比亚迪",
      "status": "active"
    }
  ]
}
```

### 3. 获取技术点（包含车型信息）

```bash
GET /api/v1/tech-points/:id
```

响应示例：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "刀片电池技术",
    "tpd_id": "tpd_001",
    "car_models_info": [
      {
        "name": "汉EV",
        "brand": "比亚迪",
        "status": "active"
      }
    ],
    "resources_info": [...],
    ...
  }
}
```

## 运行测试脚本

### 执行数据库迁移

```bash
cd backend
npm run ts-node src/scripts/migrations/003_add_tpd_fields_to_tech_points.ts
```

### 运行验证测试

```bash
cd backend
npm run ts-node src/scripts/test-tech-point-car-models-api.ts
```

测试脚本将验证：

1. ✅ 创建技术点时包含车型信息
2. ✅ 通过 tpd_id 查找技术点
3. ✅ 更新技术点的车型信息
4. ✅ 数据正确保存到数据库
5. ✅ 数据正确从数据库读取

## TPD2 同步

当从 TPD2 同步技术点数据时，`TPDSyncService` 会自动：

1. 从 TPD2 API 获取技术点详情（包含 `carModels` 数据）
2. 将 `carModels` 转换为 `CarModelInfo[]` 格式
3. 保存到 `car_models_info` JSON 字段
4. 使用 `tpd_id` 作为同步锚点，避免重复创建

### 同步 API

```bash
POST /api/v1/tech-points/sync
```

## 注意事项

1. **数据格式**: 确保传入的 `car_models_info` 是有效的 JSON 数组
2. **字段验证**: `name` 字段是必需的，其他字段可选
3. **tpd_id**: 用于 TPD2 同步，建议在创建时设置
4. **向后兼容**: 现有的关联表 `tech_point_car_models` 仍然保留，但新数据优先使用 JSON 字段

## 故障排查

### 问题：车型数据没有保存

**检查项：**
1. 确认数据库迁移已执行
2. 检查 API 请求的 Content-Type 是否为 `application/json`
3. 查看后端日志是否有错误信息

### 问题：读取时车型数据为空

**检查项：**
1. 确认数据已正确保存（检查数据库）
2. 检查 `parseJsonFields` 方法是否正确解析 JSON
3. 查看数据库字段类型是否正确（SQLite 为 TEXT，PostgreSQL 为 JSONB）

## 相关文件

- `backend/src/models/TechPoint.ts` - 技术点模型
- `backend/src/services/tpdSyncService.ts` - TPD2 同步服务
- `backend/src/types/database.ts` - 类型定义
- `backend/src/scripts/migrations/003_add_tpd_fields_to_tech_points.ts` - 数据库迁移脚本
