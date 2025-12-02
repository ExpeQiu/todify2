# Todify3 自动启动配置指南

## 概述

本文档说明如何配置 Todify3 项目的自动启动机制，确保服务器重启后服务能够自动启动。

## 自动启动机制

Todify3 使用 **PM2** 作为进程管理器，并通过 **systemd** 实现开机自动启动。

### 架构说明

```
系统启动
  ↓
systemd (pm2-root.service)
  ↓
PM2 进程管理器
  ↓
恢复保存的进程列表 (pm2 resurrect)
  ↓
启动 todify3-backend 和 todify3-frontend
```

## 配置步骤

### 1. 服务器端配置（首次部署）

在服务器上运行自动配置脚本：

```bash
# 上传 setup-autostart.sh 到服务器
scp setup-autostart.sh root@47.113.225.93:/root/todify3/

# SSH登录服务器
ssh root@47.113.225.93

# 运行配置脚本
cd /root/todify3
chmod +x setup-autostart.sh
./setup-autostart.sh
```

### 2. 手动配置步骤

如果自动脚本不可用，可以手动执行以下步骤：

```bash
# 1. 确保PM2已安装
npm install -g pm2

# 2. 进入项目目录
cd /root/todify3

# 3. 启动服务（如果未启动）
pm2 start ecosystem.config.js

# 4. 保存当前进程列表
pm2 save

# 5. 配置PM2自动启动
pm2 startup systemd -u root --hp /root

# 6. 启用systemd服务
systemctl enable pm2-root.service

# 7. 验证配置
systemctl status pm2-root.service
```

## 服务管理

### 使用PM2命令

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs todify3-backend
pm2 logs todify3-frontend

# 重启服务
pm2 restart todify3-backend
pm2 restart todify3-frontend

# 停止服务
pm2 stop todify3-backend
pm2 stop todify3-frontend

# 删除服务
pm2 delete todify3-backend
pm2 delete todify3-frontend
```

### 使用服务管理脚本

项目提供了便捷的服务管理脚本：

```bash
# 启动服务
./scripts/start-services.sh start

# 停止服务
./scripts/start-services.sh stop

# 重启服务
./scripts/start-services.sh restart

# 查看状态
./scripts/start-services.sh status

# 查看日志
./scripts/start-services.sh logs
```

### 使用systemd命令

```bash
# 查看PM2服务状态
systemctl status pm2-root.service

# 启动PM2服务
systemctl start pm2-root.service

# 停止PM2服务
systemctl stop pm2-root.service

# 重启PM2服务
systemctl restart pm2-root.service
```

## 验证自动启动

### 方法1：模拟重启测试

```bash
# 停止所有PM2进程
pm2 kill

# 手动触发PM2恢复
pm2 resurrect

# 检查服务是否恢复
pm2 list
```

### 方法2：实际重启测试

```bash
# 重启服务器
reboot

# 重启后SSH登录，检查服务状态
pm2 list
systemctl status pm2-root.service
```

## 故障排查

### 问题1：服务未自动启动

**症状**: 服务器重启后，服务未启动

**解决方案**:

```bash
# 1. 检查systemd服务状态
systemctl status pm2-root.service

# 2. 检查PM2保存的进程列表
cat /root/.pm2/dump.pm2

# 3. 手动恢复进程
pm2 resurrect

# 4. 重新配置自动启动
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root.service
```

### 问题2：PM2服务启动失败

**症状**: `systemctl status pm2-root.service` 显示失败

**解决方案**:

```bash
# 1. 查看详细错误日志
journalctl -u pm2-root.service -n 50

# 2. 检查PM2路径
which pm2

# 3. 检查systemd服务文件
cat /etc/systemd/system/pm2-root.service

# 4. 重新生成systemd服务文件
pm2 unstartup systemd
pm2 startup systemd -u root --hp /root
```

### 问题3：服务启动但端口未监听

**症状**: PM2显示服务在线，但端口未监听

**解决方案**:

```bash
# 1. 检查端口占用
ss -tulnp | grep ":2201\|:2203"

# 2. 查看服务日志
pm2 logs todify3-backend --lines 50
pm2 logs todify3-frontend --lines 50

# 3. 重启服务
pm2 restart todify3-backend todify3-frontend
```

## 配置文件说明

### ecosystem.config.js

PM2配置文件，定义了服务的启动参数：

```javascript
module.exports = {
  apps: [
    {
      name: 'todify3-backend',
      script: './backend/dist/index.js',
      cwd: '/root/todify3',
      env: {
        NODE_ENV: 'production',
        PORT: 2203,
        SQLITE_DB_PATH: '/root/todify3/backend/data/todify3.db',
        DB_TYPE: 'sqlite'
      },
      autorestart: true,  // 自动重启
      // ...
    }
  ]
};
```

### systemd服务文件

位置: `/etc/systemd/system/pm2-root.service`

关键配置:
- `ExecStart`: 启动时执行 `pm2 resurrect` 恢复进程
- `Restart=on-failure`: 失败时自动重启
- `After=network.target`: 在网络启动后启动

## 最佳实践

1. **定期保存PM2配置**: 每次修改服务后运行 `pm2 save`
2. **监控服务状态**: 定期检查 `pm2 list` 和 `systemctl status pm2-root.service`
3. **日志管理**: 定期清理日志文件，避免磁盘空间不足
4. **测试重启**: 在非生产环境测试自动启动功能

## 相关文件

- `ecosystem.config.js`: PM2配置文件
- `setup-autostart.sh`: 自动启动配置脚本
- `scripts/start-services.sh`: 服务管理脚本
- `/etc/systemd/system/pm2-root.service`: systemd服务文件
- `/root/.pm2/dump.pm2`: PM2保存的进程列表

## 参考资源

- [PM2官方文档](https://pm2.keymetrics.io/docs/usage/startup/)
- [systemd服务管理](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

