# 清除并同步技术点车辆关联脚本

## 功能说明

此脚本用于：
1. **清除所有技术点的车辆关联** - 删除 `tech_point_car_models` 表中的所有记录
2. **从TPD2同步最新的车辆关联信息** - 从TPD2项目API获取所有技术点及其关联的车型信息，并重新建立关联

## 使用方法

### 方式一：使用 ts-node 直接运行

```bash
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/clear-and-sync-car-models-from-tpd2.ts
```

### 方式二：编译后运行

```bash
cd backend
npm run build
node dist/scripts/clear-and-sync-car-models-from-tpd2.js
```

## 环境变量配置

确保设置了正确的TPD2 API地址：

```bash
export TPD_API_BASE_URL=http://localhost:3004/api/external/v1
```

或者在 `.env` 文件中配置：

```
TPD_API_BASE_URL=http://localhost:3004/api/external/v1
```

## 执行流程

1. **连接数据库** - 连接到todify3数据库
2. **清除现有关联** - 删除所有 `tech_point_car_models` 表中的记录
3. **从TPD2获取数据** - 分页获取所有技术点及其详细信息（包含关联车型）
4. **同步车辆关联** - 为每个技术点：
   - 查找或创建品牌
   - 查找或创建车型
   - 建立技术点与车型的关联关系

## 输出信息

脚本会输出详细的执行日志：

```
🚀 开始清除并同步技术点车辆关联...

✅ 数据库连接成功

🗑️  开始清除所有技术点的车辆关联...
✅ 已清除所有车辆关联，剩余关联数: 0

📡 开始从TPD2获取技术点数据...
  📄 已获取第 1 页，共 50 条技术点
✅ 从TPD2获取完成，共 50 条技术点

🔄 开始同步车辆关联...
  ✅ 技术点名称: 3 个车型关联
  ✅ 技术点名称: 2 个车型关联
  ...

📊 同步完成统计:
  - 成功同步: 45 个技术点
  - 失败: 5 个技术点
  - 总计关联: 120 个车型

✅ 所有操作完成！
```

## 注意事项

1. **数据备份** - 执行前建议备份数据库，因为会清除所有现有关联
2. **TPD2 API可用性** - 确保TPD2 API服务正在运行且可访问
3. **网络连接** - 需要能够访问TPD2 API地址
4. **执行时间** - 根据技术点数量，可能需要较长时间执行

## 错误处理

- 如果某个技术点不存在，会记录警告但继续处理其他技术点
- 如果某个车型数据无效（缺少品牌或名称），会跳过该车型
- 如果已存在关联，会忽略重复关联错误

## 相关文件

- `backend/src/scripts/clear-and-sync-car-models-from-tpd2.ts` - 主脚本文件
- `backend/src/models/TechPoint.ts` - 技术点模型（包含关联方法）
- `backend/src/services/tpdSyncService.ts` - TPD2同步服务

