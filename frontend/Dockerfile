# 前端 Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories || \
    sed -i 's|http://dl-cdn.alpinelinux.org|https://mirrors.aliyun.com|g' /etc/apk/repositories

RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

# 门户网关：/todify-api/ → 后端 /api/
ARG VITE_API_BASE_URL=/todify-api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Geelyhub 统一登录地址
ARG VITE_GEELYHUB_LOGIN_URL=http://47.113.225.93:7777/login
ENV VITE_GEELYHUB_LOGIN_URL=${VITE_GEELYHUB_LOGIN_URL}

RUN npm run build

# 生产环境镜像（使用 nginx 服务静态文件）
FROM nginx:alpine

RUN apk add --no-cache curl

# 复制构建产物到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
