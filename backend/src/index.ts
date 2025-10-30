import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import workflowRoutes from './routes/workflow';
import apiRoutes from './routes';
import difyProxyRoutes from './routes/dify-proxy';
import { testConnection } from './config/database';
import { Logger } from './utils/logger';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8088;

// 中间件
app.use(cors());
app.use(express.json());

// 生产环境静态文件服务：直接从 frontend/dist 提供资源
const distDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distDir, {
  maxAge: 0,
  etag: true,
  lastModified: true,
}));

// 添加请求日志中间件
app.use((req, res, next) => {
  Logger.request({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  Logger.debug('Request details', {
    body: req.body,
    headers: req.headers,
  });
  next();
});

// 路由配置（API 保持 /api/v1 前缀）
app.use('/api/v1', apiRoutes);

// Dify API 代理路由
app.use('/api/dify', difyProxyRoutes);

// API 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Todify2 Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// SPA Fallback：除 /api/* 外的所有路由都返回 index.html
app.get(/^(\/(?!api).*)$/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.exception(err, `${req.method} ${req.url}`);
  Logger.error('Request details', {
    url: req.url,
    method: req.method,
    body: req.body,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message || 'Unknown error'
  });
});

// 启动服务器前测试数据库连接
async function startServer() {
  try {
    Logger.info('正在测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    Logger.info('Database connection successful');

    const server = app.listen(port, "0.0.0.0", () => {
      Logger.info(`Backend server is running on http://0.0.0.0:${port}`);
      Logger.info('Server is ready to accept connections');
    });

    // 保持进程运行
    server.keepAliveTimeout = 0;
    server.headersTimeout = 0;

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      Logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        Logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      Logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        Logger.info('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    Logger.exception(error as Error, 'Server startup failed');
    process.exit(1);
  }
}

startServer();