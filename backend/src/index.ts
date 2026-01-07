import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes';
import difyProxyRoutes from './routes/dify-proxy';
import { testConnection } from './config/database';
import { aiRoleModel } from './models';
import { logger } from './shared/lib/logger';
import { errorTracking } from './shared/infrastructure/monitoring/errorTracking';

// 导入监控模块
import { performanceMonitor as _performanceMonitor } from './shared/infrastructure/monitoring/performanceMonitor';
import { prometheusMetrics as _prometheusMetrics } from './shared/infrastructure/monitoring/prometheusMetrics';

// 确保模块正确加载
const performanceMonitor = _performanceMonitor || null;
const prometheusMetrics = _prometheusMetrics || null;

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3003;

// 初始化错误追踪
errorTracking.init();

// 中间件
app.use(cors());
app.use(express.json());

// 性能监控中间件（放在最前面）
if (performanceMonitor && typeof performanceMonitor.middleware === 'function') {
  app.use(performanceMonitor.middleware());
} else {
  logger.warn('性能监控中间件未正确加载，跳过');
}

// Prometheus 指标中间件（放在性能监控之后）
if (prometheusMetrics && typeof prometheusMetrics.middleware === 'function') {
  app.use(prometheusMetrics.middleware());
} else {
  logger.warn('Prometheus 指标中间件未正确加载，跳过');
}

// 添加请求日志中间件（放在最前面，但要在路由之前）
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info('收到请求', {
    timestamp,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.body,
    authorization: req.get('Authorization')?.substring(0, 20),
    contentType: req.get('Content-Type'),
  });
  next();
});

// API 路由必须放在静态文件服务之前
// 路由配置（API 保持 /api/v1 前缀）
app.use('/api/v1', apiRoutes);

// Dify API 代理路由
app.use('/api/dify', difyProxyRoutes);


// API 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Todify3 Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 性能监控 API
app.get('/api/v1/monitoring/performance', (req, res) => {
  try {
    const stats = performanceMonitor.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    errorTracking.captureException(error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取性能统计失败',
      },
    });
  }
});

// Prometheus 指标端点
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    const metrics = await prometheusMetrics.getMetrics();
    res.send(metrics);
  } catch (error) {
    errorTracking.captureException(error instanceof Error ? error : new Error(String(error)));
    res.status(500).send('# Error generating metrics\n');
  }
});

// 公共知识库文件服务（注释掉，统一使用预览API）
// 静态文件服务会与预览API路由冲突，所以移除静态文件服务
// 所有文件访问都通过预览API: /api/v1/public-knowledge/files/:id/preview
// const publicKnowledgeUploadDir = path.join(__dirname, '../uploads/public-knowledge');
// app.use('/api/v1/public-knowledge/files', express.static(publicKnowledgeUploadDir, {
//   maxAge: 86400000, // 1 day
//   etag: true,
//   lastModified: true,
// }));

// 生产环境静态文件服务：直接从 frontend/dist 提供资源
// 注意：必须在 API 路由之后，否则会拦截 API 请求
// 仅在非开发环境或明确需要时才启用静态文件服务
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  const distDir = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distDir, {
    maxAge: 0,
    etag: true,
    lastModified: true,
  }));

  // SPA Fallback：除 /api/* 外的所有路由都返回 index.html
  app.get(/^(\/(?!api).*)$/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// 全局错误处理中间件
// 注意：这个中间件必须放在所有路由之后，且必须有4个参数 (err, req, res, next)
app.use((err: any, req: any, res: any, next: any) => {
  // 如果响应已经发送，则委托给默认的 Express 错误处理
  if (res.headersSent) {
    return next(err);
  }

  // 记录错误详情
  logger.error('全局错误处理', {
    error: err,
    stack: err?.stack,
    requestUrl: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    path: req.path,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // 发送到错误追踪
  errorTracking.captureException(
    err instanceof Error ? err : new Error(String(err)),
    {
      context: {
        metadata: {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query,
        },
      },
    }
  );

  // 根据错误类型返回不同的状态码
  const statusCode = err.statusCode || err.status || 500;
  const errorMessage =
    process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message || 'Unknown error';

  res.status(statusCode).json({
    success: false,
    message: 'Internal server error',
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err?.stack }),
  });
});

// 启动服务器前测试数据库连接
async function startServer() {
  try {
    logger.info('正在测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    logger.info('数据库连接成功');
    
    // 初始化AI角色数据库表
    try {
      const { aiRoleModel } = await import('./models');
      await aiRoleModel.initializeTable();
      logger.info('AI角色数据库表初始化成功');
    } catch (error) {
      logger.warn('AI角色数据库表初始化警告', { error });
      // 不阻止服务器启动，表会在首次使用时自动创建
    }
    
    // 初始化公共知识库数据库表
    try {
      const { publicKnowledgeModel } = await import('./models');
      await publicKnowledgeModel.initializeTable();
      logger.info('公共知识库数据库表初始化成功');
    } catch (error) {
      logger.warn('公共知识库数据库表初始化警告', { error });
      // 不阻止服务器启动，表会在首次使用时自动创建
    }
    
    // 初始化头脑风暴数据库表
    try {
      const { brainstormSessionModel } = await import('./models');
      await brainstormSessionModel.initializeTable();
      logger.info('头脑风暴数据库表初始化成功');
    } catch (error) {
      logger.warn('头脑风暴数据库表初始化警告', { error });
      // 不阻止服务器启动，表会在首次使用时自动创建
    }
    
    // 初始化文章类型数据库表
    try {
      const { articleTypeModel } = await import('./models');
      await articleTypeModel.initializeTable();
      logger.info('文章类型数据库表初始化成功');
    } catch (error) {
      logger.warn('文章类型数据库表初始化警告', { error });
      // 不阻止服务器启动，表会在首次使用时自动创建
    }
    
    
    const server = app.listen(port, "0.0.0.0", () => {
      logger.info('Backend server 已启动', { url: `http://0.0.0.0:${port}` });
    });

    // 保持进程运行
    server.keepAliveTimeout = 0;
    server.headersTimeout = 0;

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    errorTracking.captureException(error instanceof Error ? error : new Error(String(error)), {
      level: 'fatal',
    });
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();