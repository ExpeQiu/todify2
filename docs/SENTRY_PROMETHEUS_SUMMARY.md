# Sentry 和 Prometheus 集成完成总结

## ✅ 已完成的工作

### 1. Sentry 错误追踪集成

#### 后端集成
- ✅ 安装 `@sentry/node` 依赖
- ✅ 更新 `errorTracking.ts` 集成 Sentry SDK
- ✅ 自动初始化（配置 DSN 后自动启用）
- ✅ 支持错误级别分类和上下文记录
- ✅ 自动过滤不重要的错误（如连接拒绝）

**配置方式**:
```env
# backend/.env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### 前端集成
- ✅ 安装 `@sentry/react` 依赖
- ✅ 创建 `frontend/src/shared/lib/sentry.ts` 初始化模块
- ✅ 在 `main.tsx` 中初始化 Sentry
- ✅ 支持浏览器性能追踪和会话回放
- ✅ 自动过滤网络错误和取消的请求

**配置方式**:
```env
# frontend/.env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Prometheus 指标导出

- ✅ 安装 `prom-client` 依赖
- ✅ 创建 `prometheusMetrics.ts` 指标收集模块
- ✅ 集成到 Express 中间件
- ✅ 添加 `/metrics` 端点导出 Prometheus 格式指标

**指标类型**:
- `http_request_duration_seconds` - HTTP 请求持续时间（直方图）
- `http_requests_total` - HTTP 请求总数（计数器）
- `http_request_errors_total` - HTTP 错误请求数（计数器）
- `http_active_connections` - 当前活跃连接数（仪表盘）
- `process_memory_usage_bytes` - 进程内存使用量（仪表盘）
- `nodejs_*` - Node.js 默认指标（CPU、内存、事件循环等）

**访问方式**:
```bash
curl http://localhost:3001/metrics
```

### 3. 文档更新

- ✅ 创建 `docs/SENTRY_AND_PROMETHEUS.md` - 详细配置指南
- ✅ 更新 `docs/MONITORING_AND_TESTING.md` - 添加 Sentry 和 Prometheus 说明

## 📋 使用说明

### Sentry 使用

**后端**:
```typescript
import { errorTracking } from '@/shared/infrastructure/monitoring/errorTracking';

// 捕获异常
errorTracking.captureException(error, {
  level: 'error',
  context: { userId: '123', requestId: 'req-456' },
  tags: { module: 'workflow' },
});

// 设置用户上下文
errorTracking.setUser('user-123', { email: 'user@example.com' });
```

**前端**:
```typescript
import { captureException, setSentryUser } from '@/shared/lib/sentry';

// 捕获异常
try {
  // 一些可能出错的代码
} catch (error) {
  captureException(error as Error, { component: 'WorkflowPage' });
}

// 设置用户上下文
setSentryUser('user-123', { email: 'user@example.com' });
```

### Prometheus 配置

**Prometheus 配置示例** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'todify-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

**Grafana 查询示例**:
```promql
# HTTP 请求率
rate(http_requests_total[5m])

# HTTP 响应时间（P95）
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

## 🔍 验证配置

### 验证 Sentry

1. **后端**:
   - 设置 `SENTRY_DSN` 环境变量
   - 启动服务器，查看日志中是否有 "Sentry 错误追踪已启用"
   - 触发一个错误，检查 Sentry 控制台是否收到错误

2. **前端**:
   - 设置 `VITE_SENTRY_DSN` 环境变量
   - 启动应用，查看浏览器控制台是否有 "Sentry 错误追踪已启用"
   - 触发一个前端错误，检查 Sentry 控制台是否收到错误

### 验证 Prometheus

1. **访问指标端点**:
   ```bash
   curl http://localhost:3001/metrics
   ```

2. **检查指标格式**:
   - 应该返回 Prometheus 格式的文本
   - 包含 `http_request_duration_seconds`、`http_requests_total` 等指标

3. **配置 Prometheus 抓取**:
   - 在 Prometheus 配置中添加上述配置
   - 重启 Prometheus，检查 Targets 页面是否显示为 UP

## 📊 功能特性

### Sentry
- ✅ 自动捕获未处理的异常和 Promise 拒绝
- ✅ 错误上下文记录（用户、请求、会话信息）
- ✅ 错误级别分类（error, warning, info, fatal）
- ✅ 生产环境采样率 10%，开发环境 100%
- ✅ 自动过滤不重要的错误
- ✅ 浏览器性能追踪和会话回放（前端）

### Prometheus
- ✅ HTTP 请求性能指标（持续时间、总数、错误数）
- ✅ 系统资源监控（内存、CPU、事件循环）
- ✅ 活跃连接数监控
- ✅ Prometheus 标准格式导出
- ✅ 支持 Grafana 可视化

## 🎯 下一步建议

1. **配置 Sentry DSN**: 在环境变量中设置 DSN 启用错误追踪
2. **配置 Prometheus**: 设置 Prometheus 抓取配置
3. **创建 Grafana 仪表板**: 可视化监控指标
4. **设置告警规则**: 配置错误率和性能告警
5. **监控最佳实践**: 定期检查 Sentry 和 Prometheus 数据

## 📝 注意事项

1. **Sentry DSN**: 需要从 Sentry 官网获取，免费版有配额限制
2. **Prometheus**: 需要单独部署 Prometheus 服务器
3. **性能影响**: Sentry 和 Prometheus 指标收集对性能影响很小，但建议在生产环境使用合理的采样率
4. **数据隐私**: 确保 Sentry 配置符合数据隐私要求

## ✨ 总结

Sentry 和 Prometheus 集成已完成，所有代码已通过编译检查。配置 DSN 后即可启用 Sentry 错误追踪，访问 `/metrics` 端点即可获取 Prometheus 指标。

