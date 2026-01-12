#!/bin/bash

# 验证 Docker 项目中的数据导入情况

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DOCKER_DIR="$PROJECT_ROOT/docker"
DB_PATH="$BACKEND_DIR/data/todify4.db"

# 日志函数
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 检查 Docker 服务状态
check_docker_services() {
    section "检查 Docker 服务状态"
    
    if ! docker compose -f "$DOCKER_DIR/docker-compose.yml" ps | grep -q "todify4-backend.*Up"; then
        error "Docker 后端服务未运行"
        return 1
    fi
    
    info "Docker 服务运行正常"
    docker compose -f "$DOCKER_DIR/docker-compose.yml" ps
    return 0
}

# 检查数据库文件
check_database_file() {
    section "检查数据库文件"
    
    if [ ! -f "$DB_PATH" ]; then
        error "数据库文件不存在: $DB_PATH"
        return 1
    fi
    
    DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
    info "数据库文件存在: $DB_PATH"
    info "数据库大小: $DB_SIZE"
    
    # 检查数据库是否可访问
    if ! sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1; then
        error "数据库文件无法访问"
        return 1
    fi
    
    info "数据库可正常访问"
    return 0
}

# 检查数据表和数据量
check_table_data() {
    section "检查数据表和数据量"
    
    # 关键表列表
    TABLES=(
        "brands:品牌"
        "tech_categories:技术分类"
        "tech_points:技术点"
        "ai_roles:AI角色"
        "car_models:车型"
        "car_series:车系"
        "article_types:文章类型"
        "agent_workflows:工作流"
    )
    
    info "数据表统计:"
    echo ""
    printf "%-25s %-15s %s\n" "表名" "数据量" "状态"
    echo "----------------------------------------"
    
    for TABLE_INFO in "${TABLES[@]}"; do
        TABLE_NAME=$(echo "$TABLE_INFO" | cut -d: -f1)
        TABLE_DESC=$(echo "$TABLE_INFO" | cut -d: -f2)
        
        # 检查表是否存在
        TABLE_EXISTS=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='$TABLE_NAME';" 2>/dev/null)
        
        if [ -z "$TABLE_EXISTS" ]; then
            printf "%-25s %-15s %s\n" "$TABLE_NAME ($TABLE_DESC)" "N/A" "表不存在"
        else
            COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $TABLE_NAME;" 2>/dev/null || echo "0")
            if [ "$COUNT" -gt 0 ]; then
                printf "%-25s %-15s %s\n" "$TABLE_NAME ($TABLE_DESC)" "$COUNT" "✓ 有数据"
            else
                printf "%-25s %-15s %s\n" "$TABLE_NAME ($TABLE_DESC)" "0" "⚠ 空表"
            fi
        fi
    done
    
    echo ""
}

# 检查 API 端点
check_api_endpoints() {
    section "检查 API 端点"
    
    BASE_URL="http://localhost:8113"
    ENDPOINTS=(
        "/api/v1/brands:品牌列表"
        "/api/v1/tech-categories:技术分类列表"
        "/api/v1/ai-roles:AI角色列表"
        "/api/v1/car-models:车型列表"
    )
    
    info "API 端点测试:"
    echo ""
    printf "%-40s %-15s %s\n" "端点" "状态" "数据量"
    echo "----------------------------------------------------------------"
    
    for ENDPOINT_INFO in "${ENDPOINTS[@]}"; do
        ENDPOINT=$(echo "$ENDPOINT_INFO" | cut -d: -f1)
        DESC=$(echo "$ENDPOINT_INFO" | cut -d: -f2)
        URL="${BASE_URL}${ENDPOINT}"
        
        # 测试 API
        RESPONSE=$(curl -s -w "\n%{http_code}" "$URL" 2>/dev/null || echo -e "\n000")
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "200" ]; then
            # 尝试解析 JSON 获取数据量
            if command -v python3 &> /dev/null; then
                COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "?")
            else
                COUNT="?"
            fi
            
            if [ "$COUNT" != "?" ] && [ "$COUNT" -gt 0 ]; then
                printf "%-40s %-15s %s\n" "$ENDPOINT ($DESC)" "✓ 正常" "$COUNT 条"
            else
                printf "%-40s %-15s %s\n" "$ENDPOINT ($DESC)" "✓ 正常" "0 条"
            fi
        else
            printf "%-40s %-15s %s\n" "$ENDPOINT ($DESC)" "✗ 失败 ($HTTP_CODE)" "N/A"
        fi
    done
    
    echo ""
}

# 检查前端访问
check_frontend_access() {
    section "检查前端访问"
    
    FRONTEND_URL="http://localhost:8118"
    NGINX_URL="http://localhost:8118"
    
    info "测试前端访问:"
    
    # 测试 Nginx 代理
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NGINX_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        info "✓ Nginx 代理正常 ($NGINX_URL)"
    else
        warn "✗ Nginx 代理异常 (HTTP $HTTP_CODE)"
    fi
    
    # 测试 API 代理
    API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NGINX_URL/api/v1/health" 2>/dev/null || echo "000")
    if [ "$API_CODE" = "200" ]; then
        info "✓ API 代理正常 ($NGINX_URL/api/v1/health)"
    else
        warn "✗ API 代理异常 (HTTP $API_CODE)"
    fi
    
    echo ""
}

# 显示数据对比
show_data_comparison() {
    section "数据对比 (todify3.db vs todify4.db)"
    
    SOURCE_DB="$BACKEND_DIR/data/todify3.db"
    TARGET_DB="$DB_PATH"
    
    if [ ! -f "$SOURCE_DB" ]; then
        warn "源数据库不存在，跳过对比"
        return
    fi
    
    TABLES=("brands" "tech_categories" "tech_points" "ai_roles" "car_models")
    
    info "数据对比:"
    echo ""
    printf "%-20s %-15s %-15s %s\n" "表名" "源数据库" "目标数据库" "状态"
    echo "----------------------------------------------------------------"
    
    for TABLE in "${TABLES[@]}"; do
        SOURCE_COUNT=$(sqlite3 "$SOURCE_DB" "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
        TARGET_COUNT=$(sqlite3 "$TARGET_DB" "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
        
        if [ "$SOURCE_COUNT" = "$TARGET_COUNT" ]; then
            STATUS="✓ 一致"
        elif [ "$TARGET_COUNT" -gt "$SOURCE_COUNT" ]; then
            STATUS="⚠ 目标更多"
        else
            STATUS="✗ 目标较少"
        fi
        
        printf "%-20s %-15s %-15s %s\n" "$TABLE" "$SOURCE_COUNT" "$TARGET_COUNT" "$STATUS"
    done
    
    echo ""
}

# 生成报告
generate_report() {
    section "数据导入验证报告"
    
    echo "验证时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "数据库路径: $DB_PATH"
    echo "Docker 服务: $(docker compose -f "$DOCKER_DIR/docker-compose.yml" ps --format 'table {{.Name}}\t{{.Status}}' | grep todify4 | wc -l | tr -d ' ') 个服务运行中"
    echo ""
    
    # 统计总数据量
    TOTAL_BRANDS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM brands;" 2>/dev/null || echo "0")
    TOTAL_CATEGORIES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tech_categories;" 2>/dev/null || echo "0")
    TOTAL_TECH_POINTS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM tech_points;" 2>/dev/null || echo "0")
    TOTAL_AI_ROLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM ai_roles;" 2>/dev/null || echo "0")
    
    echo "关键数据统计:"
    echo "  - 品牌: $TOTAL_BRANDS 个"
    echo "  - 技术分类: $TOTAL_CATEGORIES 个"
    echo "  - 技术点: $TOTAL_TECH_POINTS 个"
    echo "  - AI角色: $TOTAL_AI_ROLES 个"
    echo ""
}

# 主函数
main() {
    section "Docker 数据导入验证"
    
    check_docker_services || exit 1
    check_database_file || exit 1
    check_table_data
    check_api_endpoints
    check_frontend_access
    show_data_comparison
    generate_report
    
    section "验证完成"
    info "如果前端仍看不到数据，请尝试:"
    info "1. 清除浏览器缓存"
    info "2. 检查浏览器控制台错误信息"
    info "3. 确认前端 API 配置正确 (VITE_API_BASE_URL)"
    info "4. 检查 Nginx 代理配置"
}

main
