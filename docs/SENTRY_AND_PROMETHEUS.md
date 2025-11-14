# Sentry 和 Prometheus 集成指南

## Sentry 错误追踪集成

### 后端配置

1. **安装依赖**（已完成）
   ```bash
   cd backend
   npm install @sentry/node
   ```

2. **配置环境变量**
   
   在 `backend/.env` 文件中添加：
   ```env
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   NODE_ENV=production
   ```

3. **功能说明**
   
   - ✅ 自动捕获未处理的异常和 Promise 拒绝
   - ✅ 自动记录错误上下文（请求信息、用户信息等）
   - ✅ 支持错误级别分类（error, warning, info, fatal）
   - ✅ 自动过滤不重要的错误（如连接拒绝）
   - ✅ 生产环境采样率 10%，开发环境 100%

4. **使用示例**
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
   
   // 设置标签
   errorTracking.setTag('environment', 'production');
   ```

### 前端配置

1. **安装依赖**（已完成）
   ```bash
   cd frontend
   npm install @sentry/react
   ```

2. **配置环境变量**
   
   在 `frontend/.env` 文件中添加：
   ```env
   VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

3. **功能说明**
   
   - ✅ 自动捕获前端错误和未处理的 Promise 拒绝
   - ✅ 浏览器性能追踪（Browser Tracing）
   - ✅ 会话回放（Session Replay）
   - ✅ 自动过滤网络错误和取消的请求
   - ✅ 生产环境采样率 10%，开发环境 100%

4. **使用示例**
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

## Prometheus 指标导出

### 配置

1. **安装依赖**（已完成）
   ```bash
   cd backend
   npm install prom-client
   ```

2. **功能说明**
   
   - ✅ HTTP 请求持续时间（直方图）
   - ✅ HTTP 请求总数（计数器）
   - ✅ HTTP 错误请求数（计数器）
   - ✅ 活跃连接数（仪表盘）
   - ✅ 内存使用量（仪表盘）
   - ✅ Node.js 默认指标（CPU、内存、事件循环等）

3. **指标端点**
   
   ```
   GET /metrics
   ```
   
   返回 Prometheus 格式的指标文本。

4. **指标示例**
   ```
   # HTTP 请求持续时间
   http_request_duration_seconds_bucket{method="GET",route="/api/health",status_code="200",le="0.1"} 10
   http_request_duration_seconds_bucket{method="GET",route="/api/health",status_code="200",le="0.5"} 50
   http_request_duration_seconds_sum{method="GET",route="/api/health",status_code="200"} 2.5
   http_request_duration_seconds_count{method="GET",route="/api/health",status_code="200"} 100
   
   # HTTP 请求总数
   http_requests_total{method="GET",route="/api/health",status_code="200"} 100
   
   # 内存使用量
   process_memory_usage_bytes{type="heap_used"} 52428800
   process_memory_usage_bytes{type="heap_total"} 104857600
   ```

### Prometheus 配置示例

在 Prometheus 配置文件中添加：

```yaml
scrape_configs:
  - job_name: 'todify-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana 仪表板示例

可以创建以下面板：

1. **HTTP 请求率**
   ```
   rate(http_requests_total[5m])
   ```

2. **HTTP 响应时间（P95）**
   ```
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

3. **错误率**
   ```
   rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
   ```

4. **内存使用**
   ```
   process_memory_usage_bytes{type="heap_used"}
   ```

## 环境变量配置

### 后端 (.env)

```env
# Sentry 配置
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 环境配置
NODE_ENV=production
```

### 前端 (.env)

```env
# Sentry 配置
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 验证配置

### 验证 Sentry

1. **后端**：
   - 启动服务器，查看日志中是否有 "Sentry 错误追踪已启用"
   - 触发一个错误，检查 Sentry 控制台是否收到错误

2. **前端**：
   - 启动应用，查看浏览器控制台是否有 "Sentry 错误追踪已启用"
   - 触发一个前端错误，检查 Sentry 控制台是否收到错误

### 验证 Prometheus

1. **访问指标端点**：
   ```bash
   curl http://localhost:3001/metrics
   ```

2. **检查指标格式**：
   - 应该返回 Prometheus 格式的文本
   - 包含 `http_request_duration_seconds`、`http_requests_total` 等指标

3. **配置 Prometheus 抓取**：
   - 在 Prometheus 配置中添加上述配置
   - 重启 Prometheus，检查 Targets 页面是否显示为 UP

## 最佳实践

1. **Sentry**:
   - 生产环境使用较低的采样率（10%）以减少成本
   - 开发环境使用 100% 采样率以便调试
   - 定期检查 Sentry 控制台，设置告警规则

2. **Prometheus**:
   - 设置合理的抓取间隔（15-30秒）
   - 配置告警规则监控关键指标
   - 定期清理旧数据以节省存储空间

3. **监控指标**:
   - 关注错误率（error rate）
   - 监控响应时间（P95/P99）
   - 跟踪内存使用情况
   - 监控活跃连接数

## 故障排查

### Sentry 未工作

1. 检查环境变量是否正确设置
2. 检查 DSN 格式是否正确
3. 查看日志中是否有 Sentry 初始化错误
4. 检查网络连接是否正常

### Prometheus 无法抓取指标

1. 检查 `/metrics` 端点是否可访问
2. 检查 Prometheus 配置中的 targets 是否正确
3. 检查防火墙设置
4. 查看 Prometheus 日志中的错误信息

