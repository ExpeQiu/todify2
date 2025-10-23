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

// 静态文件服务 - 提供前端构建文件
app.use('/static', express.static(path.join(__dirname, '../../frontend/dist')));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

// 路由配置
app.use('/api/v1', apiRoutes);

// 前端页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.get('/static/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// API 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Todify2 Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
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