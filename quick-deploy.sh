#!/bin/bash

# Todify2 快速部署脚本
# 使用方法: ./quick-deploy.sh [start|stop|restart|status|update]

set -e

# 配置变量
PROJECT_DIR="/root/todify2-deploy"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
NGINX_CONFIG="/etc/nginx/sites-available/todify2"
SERVICE_SCRIPT="$PROJECT_DIR/manage-service.sh"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查端口监听
    echo "=== 端口监听状态 ==="
    netstat -tulnp | grep -E ':(3001|3003|8088)' || log_warning "部分端口未监听"
    
    # 检查API健康状态
    echo "=== API健康检查 ==="
    if curl -s http://localhost:3003/api/health > /dev/null; then
        log_success "后端API正常"
    else
        log_error "后端API异常"
    fi
    
    if curl -s http://47.113.225.93:8088/api/health > /dev/null; then
        log_success "Nginx代理正常"
    else
        log_error "Nginx代理异常"
    fi
    
    # 检查进程
    echo "=== 进程状态 ==="
    ps aux | grep -E 'node.*backend|node.*frontend|nginx' | grep -v grep || log_warning "部分进程未运行"
}

# 启动服务
start_services() {
    log_info "启动Todify2服务..."
    
    # 检查目录是否存在
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    
    # 启动后端服务
    log_info "启动后端服务..."
    cd "$BACKEND_DIR"
    if [ ! -f ".env" ]; then
        log_error "后端环境变量文件不存在"
        exit 1
    fi
    npm run dev > backend.log 2>&1 &
    sleep 3
    
    # 启动前端服务
    log_info "启动前端服务..."
    cd "$FRONTEND_DIR"
    npm run dev > frontend.log 2>&1 &
    sleep 3
    
    # 检查Nginx配置
    if [ -f "$NGINX_CONFIG" ]; then
        log_info "重载Nginx配置..."
        nginx -t && systemctl reload nginx
    else
        log_warning "Nginx配置文件不存在: $NGINX_CONFIG"
    fi
    
    # 等待服务启动
    sleep 5
    check_services
    
    log_success "服务启动完成！"
    log_info "访问地址: http://47.113.225.93:8088"
}

# 停止服务
stop_services() {
    log_info "停止Todify2服务..."
    
    # 停止Node.js进程
    pkill -f "node.*backend" || true
    pkill -f "node.*frontend" || true
    
    sleep 2
    
    log_success "服务停止完成！"
}

# 重启服务
restart_services() {
    log_info "重启Todify2服务..."
    stop_services
    sleep 2
    start_services
}

# 更新部署
update_deployment() {
    log_info "更新部署..."
    
    # 停止服务
    stop_services
    
    # 更新依赖
    log_info "更新前端依赖..."
    cd "$FRONTEND_DIR"
    npm install
    
    log_info "更新后端依赖..."
    cd "$BACKEND_DIR"
    npm install
    
    # 重新构建前端
    log_info "重新构建前端..."
    cd "$FRONTEND_DIR"
    npm run build
    
    # 启动服务
    start_services
    
    log_success "更新部署完成！"
}

# 创建服务管理脚本
create_service_script() {
    log_info "创建服务管理脚本..."
    
    cat > "$SERVICE_SCRIPT" << 'EOF'
#!/bin/bash

case "$1" in
    start)
        echo "启动Todify2服务..."
        cd /root/todify2-deploy/backend && npm run dev > backend.log 2>&1 &
        cd /root/todify2-deploy/frontend && npm run dev > frontend.log 2>&1 &
        echo "服务启动完成"
        ;;
    stop)
        echo "停止Todify2服务..."
        pkill -f "node.*backend"
        pkill -f "node.*frontend"
        echo "服务停止完成"
        ;;
    restart)
        echo "重启Todify2服务..."
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        echo "检查服务状态..."
        netstat -tulnp | grep -E ':(3001|3003|8088)'
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF
    
    chmod +x "$SERVICE_SCRIPT"
    log_success "服务管理脚本创建完成: $SERVICE_SCRIPT"
}

# 设置自动启动
setup_autostart() {
    log_info "设置自动启动..."
    
    # 创建服务管理脚本
    create_service_script
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "@reboot $SERVICE_SCRIPT start") | crontab -
    (crontab -l 2>/dev/null; echo "*/1 * * * * $SERVICE_SCRIPT status") | crontab -
    
    log_success "自动启动设置完成！"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 检查服务状态
    check_services
    
    # 测试API
    log_info "测试API功能..."
    
    # 测试健康检查API
    if curl -s http://47.113.225.93:8088/api/health | grep -q "running"; then
        log_success "健康检查API正常"
    else
        log_error "健康检查API异常"
    fi
    
    # 测试Dify代理API
    if curl -s -X POST http://47.113.225.93:8088/api/dify/chat-messages \
        -H "Content-Type: application/json" \
        -d '{"appType":"default-ai-search","query":"测试","inputs":{}}' | grep -q "answer"; then
        log_success "Dify代理API正常"
    else
        log_warning "Dify代理API可能异常"
    fi
    
    log_success "部署验证完成！"
}

# 显示帮助信息
show_help() {
    echo "Todify2 快速部署脚本"
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    检查服务状态"
    echo "  update    更新部署"
    echo "  verify    验证部署"
    echo "  autostart 设置自动启动"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start     # 启动服务"
    echo "  $0 status    # 检查状态"
    echo "  $0 restart   # 重启服务"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_services
            ;;
        update)
            update_deployment
            ;;
        verify)
            verify_deployment
            ;;
        autostart)
            setup_autostart
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
