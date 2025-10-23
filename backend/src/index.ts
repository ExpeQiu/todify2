import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import workflowRoutes from './routes/workflow';
import apiRoutes from './routes';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 8088;

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
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

// 路由配置（API 保持 /api/v1 前缀）
app.use('/api/v1', apiRoutes);

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
app.use((err: any, req: any, res: any, next: any) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message || 'Unknown error'
  });
});

// 启动服务器前测试数据库连接
async function startServer() {
  try {
    console.log('正在测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }
    console.log('Database connection successful');
    
    const server = app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
      console.log('Server is ready to accept connections');
    });

    // 保持进程运行
    server.keepAliveTimeout = 0;
    server.headersTimeout = 0;

    // 优雅关闭处理
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();