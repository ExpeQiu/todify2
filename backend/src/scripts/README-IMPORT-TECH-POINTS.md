# 技术点数据导入脚本使用说明

本目录包含两个脚本，用于从TPD2项目导入技术点数据到todify3项目。

## 脚本说明

### 1. import-tech-points-from-json.ts
从JSON文件导入技术点数据。支持单个技术点对象或技术点数组。

### 2. import-tech-points-from-tpd2.ts
从TPD2项目的API接口直接获取并导入所有技术点数据。

## 使用方法

### 方法一：从JSON文件导入

如果你已经有TPD2项目导出的JSON文件：

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-json.ts <json-file-path>
```

**示例：**
```bash
# 导入单个技术点JSON文件
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-json.ts ./data/tech-point.json

# 导入技术点数组JSON文件
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-json.ts ./data/tech-points.json
```

**JSON格式示例：**
```json
{
  "id": 37,
  "name": "SEA浩瀚架构",
  "description": "技术点描述...",
  "category_id": 4,
  "category_name": "数字底盘与架构",
  "parent_id": null,
  "level": 1,
  "tech_type": "feature",
  "priority": "medium",
  "status": "draft",
  "tags": null,
  "technical_details": null,
  "benefits": null,
  "applications": null,
  "keywords": null,
  "source_url": null,
  "created_by": null,
  "tech_principle": "技术原理...",
  "tech_value": "技术价值...",
  "tech_boundary": "技术边界...",
  "highlights": ["亮点1", "亮点2"],
  "evidence_measured": ["实测数据1"],
  "evidence_certified": ["认证数据1"],
  "evidence_comparison": ["对比数据1"],
  "associated_car_models": [
    {
      "id": 4,
      "name": "极氪001",
      "brand": "极氪",
      "type": "轿车",
      "car_model_id": 4,
      "relationship": "关联方式：标配",
      "notes": "关联方式：标配"
    }
  ],
  "associated_resources": []
}
```

### 方法二：从TPD2 API导入

如果TPD2项目正在运行，可以直接从API获取数据：

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-tpd2.ts [tpd-api-url]
```

**示例：**
```bash
# 使用默认API地址（http://localhost:3004/api/external/v1）
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-tpd2.ts

# 指定TPD2 API地址
npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-tpd2.ts http://localhost:3004/api/external/v1
```

**环境变量配置：**
你也可以在 `.env` 文件中设置：
```
TPD_API_BASE_URL=http://localhost:3004/api/external/v1
```

## 功能特性

### 自动处理

1. **技术分类**：如果分类不存在，会自动创建
2. **品牌和车型**：如果品牌或车型不存在，会自动创建
3. **技术点更新**：如果技术点已存在（通过名称匹配），会更新而不是创建新记录
4. **关联车型**：自动关联技术点与车型

### 数据映射

- **技术类型**：`feature`, `technology`, `innovation`, `improvement`
- **优先级**：`low`, `medium`, `high`, `critical`
- **状态**：`active`, `inactive`, `draft`, `archived`
- **车型类型**：`轿车` → `sedan`, `SUV` → `suv`, `MPV` → `mpv`, 等

### 技术详情字段合并

脚本会自动将以下字段合并到 `technical_details` 中：
- `tech_principle` - 技术原理
- `tech_value` - 技术价值
- `tech_boundary` - 技术边界
- `highlights` - 亮点
- `evidence_measured` - 实测数据
- `evidence_certified` - 认证数据
- `evidence_comparison` - 对比数据

## 注意事项

1. **数据清空**：导入前建议先清空现有技术点数据（使用 `clear-tech-points-data.ts`）
2. **数据库连接**：确保数据库配置正确（`.env` 文件或环境变量）
3. **API可用性**：使用API导入时，确保TPD2项目正在运行
4. **数据完整性**：导入过程中会显示详细的进度和错误信息

## 错误处理

- 如果某个技术点导入失败，脚本会继续处理其他技术点
- 所有错误会在最后统一显示
- 已存在的关联关系不会重复创建（会忽略错误）

## 输出示例

```
🔗 正在连接数据库...
✅ 数据库连接成功

📊 准备导入 10 个技术点

[1/10] 处理技术点: SEA浩瀚架构
  ✅ 创建技术分类: 数字底盘与架构 (ID: 4)
  ✅ 创建技术点: SEA浩瀚架构 (ID: 1)
    ✅ 创建品牌: 极氪 (ID: 1)
    ✅ 创建车型: 极氪 极氪001 (ID: 1)
    ✅ 关联车型: 极氪 极氪001

...

============================================================
📊 导入完成统计
============================================================
总计: 10 个技术点
成功: 10 个
失败: 0 个

✅ 导入完成！
```
