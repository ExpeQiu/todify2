# 监控与测试体系文档

## 概述

本文档描述了 Todify2 项目的监控体系和测试配置。

## 监控体系

### 1. 错误追踪

**位置**: `backend/src/shared/infrastructure/monitoring/errorTracking.ts`

**功能**:
- 捕获未处理的异常和 Promise 拒绝
- 记录错误上下文（用户ID、会话ID、请求ID等）
- 支持 Sentry 集成（可选）

**使用示例**:
```typescript
import { errorTracking } from '@/shared/infrastructure/monitoring/errorTracking';

// 捕获异常
errorTracking.captureException(error, {
  level: 'error',
  context: { userId: '123', requestId: 'req-456' },
  tags: { module: 'workflow' },
});

// 捕获消息
errorTracking.captureMessage('重要事件', {
  level: 'info',
  context: { action: 'user_login' },
});
```

**Sentry 集成**（已完成）:
1. ✅ 已安装 `@sentry/node` 和 `@sentry/react`
2. 设置环境变量: `SENTRY_DSN=your-dsn`（后端）或 `VITE_SENTRY_DSN=your-dsn`（前端）
3. ✅ Sentry 已集成到错误追踪服务中，配置 DSN 后自动启用

**详细配置**: 参见 `docs/SENTRY_AND_PROMETHEUS.md`

### 2. 性能监控

**位置**: `backend/src/shared/infrastructure/monitoring/performanceMonitor.ts`

**功能**:
- 自动记录所有 HTTP 请求的性能指标
- 检测慢请求（>1秒）
- 提供性能统计（平均响应时间、P50/P95/P99）

**API 端点**:
```
GET /api/v1/monitoring/performance
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "avgDuration": 150,
    "p50": 120,
    "p95": 300,
    "p99": 500,
    "slowRequests": [
      {
        "method": "POST",
        "path": "/api/workflow/ai-search",
        "duration": 1200,
        "statusCode": 200,
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 3. Prometheus 指标导出

**位置**: `backend/src/shared/infrastructure/monitoring/prometheusMetrics.ts`

**功能**:
- ✅ 自动记录 HTTP 请求指标（持续时间、总数、错误数）
- ✅ 监控活跃连接数和内存使用量
- ✅ 导出 Node.js 默认指标（CPU、内存、事件循环等）
- ✅ 提供 Prometheus 格式的指标端点

**API 端点**:
```
GET /metrics
```

**指标类型**:
- `http_request_duration_seconds` - HTTP 请求持续时间（直方图）
- `http_requests_total` - HTTP 请求总数（计数器）
- `http_request_errors_total` - HTTP 错误请求数（计数器）
- `http_active_connections` - 当前活跃连接数（仪表盘）
- `process_memory_usage_bytes` - 进程内存使用量（仪表盘）
- `nodejs_*` - Node.js 默认指标

**详细配置**: 参见 `docs/SENTRY_AND_PROMETHEUS.md`

### 3. 健康检查

**端点**: `GET /api/health`

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00Z",
  "uptime": 3600
}
```

## 测试体系

### 1. 单元测试

**后端测试**:
- 框架: Vitest
- 配置: `backend/vitest.config.ts`
- 覆盖率目标: 70% (lines, functions, statements), 60% (branches)
- 运行: `npm test` 或 `npm run test:coverage`

**前端测试**:
- 框架: Vitest + React Testing Library
- 配置: `frontend/vitest.config.ts`
- 覆盖率目标: 60% (lines, functions, statements), 50% (branches)
- 运行: `npm test` 或 `npm run test:coverage`

### 2. E2E 测试

**框架**: Playwright

**配置**: `frontend/playwright.config.ts`

**测试文件**: `frontend/e2e/*.spec.ts`

**运行**:
```bash
# 运行所有 E2E 测试
npm run test:e2e

# 以 UI 模式运行
npm run test:e2e:ui
```

### 3. CI/CD

**配置文件**: `.github/workflows/ci.yml`

**工作流**:
1. **Backend Tests**: 运行后端单元测试和生成覆盖率报告
2. **Frontend Tests**: 运行前端单元测试、lint 检查和生成覆盖率报告
3. **Backend Build**: 构建后端应用
4. **Frontend Build**: 构建前端应用
5. **E2E Tests**: 运行端到端测试（可选）

**触发条件**:
- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

## 测试覆盖率报告

### 查看覆盖率

**后端**:
```bash
cd backend
npm run test:coverage
# 打开 coverage/index.html 查看报告
```

**前端**:
```bash
cd frontend
npm run test:coverage
# 打开 coverage/index.html 查看报告
```

### 覆盖率目标

| 项目 | Lines | Functions | Branches | Statements |
|------|-------|-----------|----------|------------|
| 后端 | 70% | 70% | 60% | 70% |
| 前端 | 60% | 60% | 50% | 60% |

## 监控最佳实践

1. **错误追踪**:
   - 所有未处理的错误自动上报
   - 关键业务操作使用 `captureException` 记录
   - 设置用户上下文以便追踪

2. **性能监控**:
   - 定期检查 `/api/v1/monitoring/performance` 端点
   - 关注慢请求列表
   - 设置告警阈值（如 P95 > 500ms）

3. **健康检查**:
   - 配置负载均衡器使用 `/api/health` 端点
   - 设置自动重启机制

## 下一步优化

1. ✅ **Sentry 集成**: 已集成，配置 DSN 即可启用
2. ✅ **Prometheus 集成**: 已集成，访问 `/metrics` 端点即可
3. **Grafana 仪表板**: 创建可视化监控面板
4. **告警规则**: 配置错误率和性能告警
5. **日志聚合**: 集成 ELK 或类似日志聚合系统

