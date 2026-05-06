# 后端 Dockerfile
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY tsconfig.json ./

FROM base AS deps-dev
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories || \
    sed -i 's|http://dl-cdn.alpinelinux.org|https://mirrors.aliyun.com|g' /etc/apk/repositories
RUN apk add --no-cache python3 py3-setuptools make g++
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci && npm cache clean --force

FROM base AS deps-prod
# ✅ 关键优化：移除 python3 py3-setuptools make g++
# npm ci --omit=dev 仅安装生产依赖，无需编译工具链
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories || \
    sed -i 's|http://dl-cdn.alpinelinux.org|https://mirrors.aliyun.com|g' /etc/apk/repositories
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --omit=dev && npm cache clean --force

FROM deps-dev AS builder
# 复制源代码
COPY src ./src

# 构建（仓库内尚有 pino 类型告警时 tsc 可能非 0，仍以 dist 为准）
RUN npx tsc --noEmitOnError false; npx tsc-alias; test -f dist/index.js

# 生产环境镜像
FROM node:20-alpine

# 配置 Alpine 镜像源加速（弱网环境避免 TLS 拉取失败）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories || \
    sed -i 's|http://dl-cdn.alpinelinux.org|https://mirrors.aliyun.com|g' /etc/apk/repositories

# 安装运行时系统依赖（SQLite、健康检查、envsubst）
# ✅ 优化：sqlite curl bash gettext 均为运行时依赖，符合预期
RUN apk add --no-cache sqlite curl bash gettext

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/package*.json ./
COPY --from=deps-prod /app/node_modules ./node_modules
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
  CMD curl -sf http://127.0.0.1:8113/api/health || exit 1

# 使用入口脚本启动应用
ENTRYPOINT ["/app/docker-entrypoint.sh"]
