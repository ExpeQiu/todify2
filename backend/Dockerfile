# 后端 Dockerfile
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY src ./src

# 构建项目
RUN npm run build

# 生产环境镜像
FROM node:18-alpine

# 安装必要的系统依赖（SQLite需要，以及健康检查工具和envsubst）
RUN apk add --no-cache python3 make g++ sqlite wget bash gettext

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./

# 复制数据库初始化脚本
COPY scripts/init-database.sh /app/scripts/init-database.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# 创建 SQL 脚本目录并从构建阶段复制 SQL 文件
RUN mkdir -p /app/src/scripts
COPY --from=builder /app/src/scripts/unified-database-schema-v2.sql /app/src/scripts/
COPY --from=builder /app/src/scripts/unified-database-indexes-v2.sql /app/src/scripts/

# 创建必要的目录
RUN mkdir -p /app/data /app/init-data && \
    chmod +x /app/scripts/init-database.sh /app/docker-entrypoint.sh

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8113

# 暴露端口
EXPOSE 8113

# 健康检查（使用 wget 或 curl）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8113/api/health || exit 1

# 使用入口脚本启动应用
ENTRYPOINT ["/app/docker-entrypoint.sh"]
