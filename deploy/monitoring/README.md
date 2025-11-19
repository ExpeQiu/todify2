# 监控部署指南

本文档说明如何部署和配置 Todify3 的监控系统（Prometheus + Grafana + Alertmanager）。

## 前置要求

- Docker 和 Docker Compose（推荐）
- 或直接安装 Prometheus、Grafana、Alertmanager

## 快速开始（Docker Compose）

### 1. 准备配置文件

确保以下文件在 `deploy/monitoring/` 目录下：
- `prometheus.yml` - Prometheus 配置
- `prometheus-alerts.yml` - 告警规则
- `alertmanager.yml` - Alertmanager 配置
- `grafana-dashboard.json` - Grafana 仪表板
- `grafana-datasource.yml` - Grafana 数据源配置
- `docker-compose.yml` - Docker Compose 配置

### 2. 修改配置

**prometheus.yml**:
```yaml
scrape_configs:
  - job_name: 'todify-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']  # 如果后端在宿主机上
        # 或使用实际的后端地址
```

**alertmanager.yml**:
配置通知渠道（Slack、邮件、Webhook 等）

### 3. 启动服务

```bash
cd deploy/monitoring
docker-compose up -d
```

### 4. 访问服务

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Alertmanager**: http://localhost:9093

### 5. 导入 Grafana 仪表板

1. 登录 Grafana
2. 进入 Dashboards > Import
3. 上传 `grafana-dashboard.json` 或粘贴 JSON 内容
4. 选择 Prometheus 数据源
5. 点击 Import

## 手动部署

### Prometheus

1. **下载 Prometheus**:
   ```bash
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   ```

2. **配置**:
   复制 `prometheus.yml` 和 `prometheus-alerts.yml` 到 Prometheus 目录

3. **启动**:
   ```bash
   ./prometheus --config.file=prometheus.yml
   ```

### Grafana

1. **安装 Grafana**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y software-properties-common
   sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
   sudo apt-get update
   sudo apt-get install grafana
   
   # 或使用 Docker
   docker run -d -p 3000:3000 grafana/grafana
   ```

2. **配置数据源**:
   - 登录 Grafana (http://localhost:3000)
   - 进入 Configuration > Data Sources
   - 添加 Prometheus 数据源
   - URL: http://localhost:9090

3. **导入仪表板**:
   - 使用 `grafana-dashboard.json` 文件

### Alertmanager

1. **下载 Alertmanager**:
   ```bash
   wget https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz
   tar xvfz alertmanager-*.tar.gz
   cd alertmanager-*
   ```

2. **配置**:
   复制 `alertmanager.yml` 到 Alertmanager 目录

3. **启动**:
   ```bash
   ./alertmanager --config.file=alertmanager.yml
   ```

## 告警规则说明

### 告警类型

1. **HighErrorRate** - HTTP 错误率 > 5%
2. **HighResponseTime** - P95 响应时间 > 2 秒
3. **HighMemoryUsage** - 内存使用率 > 90%
4. **HighActiveConnections** - 活跃连接数 > 1000
5. **ServiceDown** - 服务不可用
6. **LowRequestRate** - 请求率异常低
7. **HighEventLoopLag** - 事件循环延迟 > 0.5 秒

### 配置通知渠道

编辑 `alertmanager.yml`，配置以下通知方式之一：

**Slack**:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'Todify3 告警'
```

**邮件**:
```yaml
email_configs:
  - to: 'admin@example.com'
    from: 'alertmanager@example.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'alertmanager@example.com'
    auth_password: 'password'
```

**Webhook**:
```yaml
webhook_configs:
  - url: 'http://your-webhook-url'
    send_resolved: true
```

## Grafana 仪表板说明

### 面板说明

1. **HTTP 请求率** - 显示每秒请求数
2. **HTTP 响应时间（P95）** - 显示 P50、P95、P99 响应时间
3. **HTTP 错误率** - 显示错误请求占比
4. **活跃连接数** - 显示当前活跃连接数
5. **内存使用量** - 显示堆内存和 RSS 内存使用
6. **CPU 使用率** - 显示事件循环延迟
7. **HTTP 状态码分布** - 饼图显示状态码分布
8. **慢请求统计** - 表格显示最慢的 10 个请求

### 自定义查询

可以在 Grafana 中使用以下 PromQL 查询：

```promql
# 总请求数
sum(rate(http_requests_total[5m]))

# 平均响应时间
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 错误请求数
sum(rate(http_request_errors_total[5m]))

# 特定路由的请求率
sum(rate(http_requests_total{route="/api/workflow/ai-search"}[5m]))
```

## 监控最佳实践

1. **定期检查**:
   - 每天查看 Grafana 仪表板
   - 检查告警历史记录

2. **告警调优**:
   - 根据实际业务调整告警阈值
   - 避免告警风暴（使用抑制规则）

3. **性能优化**:
   - 关注慢请求统计
   - 优化响应时间较长的接口

4. **容量规划**:
   - 监控内存和连接数趋势
   - 提前规划扩容

## 故障排查

### Prometheus 无法抓取指标

1. 检查后端 `/metrics` 端点是否可访问
2. 检查 Prometheus 配置中的 targets 是否正确
3. 查看 Prometheus 日志

### Grafana 无法显示数据

1. 检查数据源配置是否正确
2. 检查 Prometheus 是否正常运行
3. 检查时间范围设置

### 告警未触发

1. 检查告警规则语法是否正确
2. 检查 Alertmanager 是否正常运行
3. 检查告警阈值是否合理

## 下一步

1. **集成更多指标**: 添加数据库、Redis 等指标
2. **自定义仪表板**: 根据业务需求创建更多仪表板
3. **告警优化**: 根据实际使用情况调整告警规则
4. **日志集成**: 集成 ELK 或 Loki 进行日志分析

