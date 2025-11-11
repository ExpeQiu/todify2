# 监控系统完整部署指南

## 📦 已完成的配置

### 配置文件清单

1. ✅ `prometheus.yml` - Prometheus 主配置
2. ✅ `prometheus-alerts.yml` - 告警规则
3. ✅ `alertmanager.yml` - Alertmanager 配置
4. ✅ `grafana-dashboard.json` - Grafana 仪表板
5. ✅ `grafana-datasource.yml` - Grafana 数据源配置
6. ✅ `docker-compose.yml` - Docker Compose 部署配置
7. ✅ `README.md` - 详细部署文档

## 🚀 快速开始

### 1. 启动监控栈

```bash
cd deploy/monitoring
docker-compose up -d
```

### 2. 验证服务

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f prometheus
docker-compose logs -f grafana
docker-compose logs -f alertmanager
```

### 3. 访问服务

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Alertmanager**: http://localhost:9093

### 4. 导入 Grafana 仪表板

1. 登录 Grafana (http://localhost:3000)
2. 进入 **Dashboards** > **Import**
3. 点击 **Upload JSON file**
4. 选择 `grafana-dashboard.json`
5. 选择 **Prometheus** 数据源
6. 点击 **Import**

## 📊 监控面板

### 包含的面板

1. **HTTP 请求率** - 实时请求速率
2. **HTTP 响应时间** - P50/P95/P99 响应时间
3. **HTTP 错误率** - 错误请求占比
4. **活跃连接数** - 当前活跃连接
5. **内存使用量** - 堆内存和 RSS
6. **事件循环延迟** - Node.js 性能指标
7. **HTTP 状态码分布** - 状态码统计
8. **慢请求统计** - Top 10 慢请求

## 🔔 告警规则

### 已配置的告警

| 告警名称 | 严重程度 | 触发条件 | 持续时间 |
|---------|---------|---------|---------|
| HighErrorRate | warning | 错误率 > 5% | 5分钟 |
| HighResponseTime | warning | P95 > 2秒 | 5分钟 |
| HighMemoryUsage | warning | 内存 > 90% | 5分钟 |
| HighActiveConnections | warning | 连接数 > 1000 | 5分钟 |
| ServiceDown | critical | 服务不可用 | 1分钟 |
| LowRequestRate | info | 请求率 < 0.1 req/s | 10分钟 |
| HighEventLoopLag | warning | 延迟 > 0.5秒 | 5分钟 |

### 配置告警通知

编辑 `alertmanager.yml`，取消注释并配置通知渠道：

**Slack 示例**:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
    title: 'Todify2 告警'
```

**邮件示例**:
```yaml
email_configs:
  - to: 'admin@example.com'
    from: 'alertmanager@example.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'alertmanager@example.com'
    auth_password: 'password'
```

## 🔧 配置调整

### 修改 Prometheus 抓取目标

编辑 `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'todify-backend'
    static_configs:
      - targets: ['your-backend-host:3001']  # 修改为实际地址
```

### 修改告警阈值

编辑 `prometheus-alerts.yml`，调整 `expr` 中的阈值：

```yaml
# 例如：将错误率阈值从 5% 改为 10%
expr: |
  (
    sum(rate(http_request_errors_total[5m])) by (route, method)
    /
    sum(rate(http_requests_total[5m])) by (route, method)
  ) > 0.10  # 改为 0.10 (10%)
```

## 📈 监控最佳实践

1. **定期检查仪表板**
   - 每天查看关键指标
   - 关注趋势变化

2. **告警调优**
   - 根据实际业务调整阈值
   - 避免告警疲劳

3. **性能优化**
   - 关注慢请求统计
   - 优化响应时间长的接口

4. **容量规划**
   - 监控资源使用趋势
   - 提前规划扩容

## 🐛 故障排查

### Prometheus 无法抓取指标

1. 检查后端 `/metrics` 端点是否可访问
2. 检查 `prometheus.yml` 中的 targets 配置
3. 查看 Prometheus 日志: `docker-compose logs prometheus`

### Grafana 无法显示数据

1. 检查数据源配置是否正确
2. 检查 Prometheus 是否正常运行
3. 检查时间范围设置

### 告警未触发

1. 检查告警规则语法
2. 检查 Alertmanager 是否正常运行
3. 在 Prometheus 的 Alerts 页面查看告警状态

## 📝 下一步

1. ✅ **配置通知渠道** - 设置 Slack、邮件或 Webhook
2. ✅ **调整告警阈值** - 根据实际业务调整
3. **添加自定义指标** - 根据业务需求添加
4. **创建更多仪表板** - 为不同团队创建专门仪表板
5. **集成日志系统** - 集成 ELK 或 Loki

## ✨ 总结

监控系统已完全配置完成，包括：
- ✅ Prometheus 指标收集
- ✅ Grafana 可视化仪表板
- ✅ Alertmanager 告警管理
- ✅ Docker Compose 一键部署
- ✅ 完整的文档和配置

使用 `docker-compose up -d` 即可启动完整的监控栈！

