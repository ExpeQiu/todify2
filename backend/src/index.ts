import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import workflowRoutes from './routes/workflow';
import apiRoutes from './routes';
import { testConnection } from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// 路由
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1', apiRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Todify2 Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// 全局错误处理中间件
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
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
    
    app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();