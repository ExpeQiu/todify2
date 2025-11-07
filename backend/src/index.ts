import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes';
import difyProxyRoutes from './routes/dify-proxy';
import { testConnection } from './config/database';
import { publicPageConfigModel, aiRoleModel } from './models';
import { logger } from './shared/lib/logger';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3003;

// 中间件
app.use(cors());
app.use(express.json());

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

// 公开访问接口（通过token获取配置和角色）
app.get('/api/v1/public/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const config = await publicPageConfigModel.getByAccessToken(token);
    
    if (!config) {
      return res.status(404).json({ success: false, message: '配置不存在或已禁用', data: null });
    }

    // 获取角色列表
    let roles: any[] = [];
    
    if (config.displayMode === 'all') {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => r.enabled);
    } else if (config.displayMode === 'workflow' && config.workflowId) {
      // 从工作流中提取角色
      const { agentWorkflowModel } = await import('./models');
      const workflow = await agentWorkflowModel.getById(config.workflowId);
      if (workflow) {
        const workflowNodes = JSON.parse(workflow.nodes);
        const agentIds = workflowNodes.map((node: any) => node.agentId).filter(Boolean);
        const allRoles = await aiRoleModel.getAll();
        roles = allRoles.filter(r => agentIds.includes(r.id) && r.enabled);
      }
    } else if (config.displayMode === 'custom' && config.roleIds && config.roleIds.length > 0) {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => config.roleIds!.includes(r.id) && r.enabled);
    }
    
    res.json({ success: true, message: '获取公开配置成功', data: { config, roles } });
  } catch (error) {
    logger.error('获取公开配置失败', { error });
    res.status(500).json({
      success: false,
      message: '获取公开配置失败',
      error: error instanceof Error ? error.message : '未知错误',
      data: null
    });
  }
});

// 公开访问接口（通过address获取配置和角色）
app.get('/api/v1/public-by-address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const config = await publicPageConfigModel.getByAddress(address);
    
    if (!config) {
      return res.status(404).json({ success: false, message: '配置不存在或已禁用', data: null });
    }

    // 获取角色列表
    let roles: any[] = [];
    
    if (config.displayMode === 'all') {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => r.enabled);
    } else if (config.displayMode === 'workflow' && config.workflowId) {
      // 从工作流中提取角色
      const { agentWorkflowModel } = await import('./models');
      const workflow = await agentWorkflowModel.getById(config.workflowId);
      if (workflow) {
        const workflowNodes = JSON.parse(workflow.nodes);
        const agentIds = workflowNodes.map((node: any) => node.agentId).filter(Boolean);
        const allRoles = await aiRoleModel.getAll();
        roles = allRoles.filter(r => agentIds.includes(r.id) && r.enabled);
      }
    } else if (config.displayMode === 'custom' && config.roleIds && config.roleIds.length > 0) {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => config.roleIds!.includes(r.id) && r.enabled);
    } else if (config.displayMode === 'role' && config.roleIds && config.roleIds.length > 0) {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => config.roleIds!.includes(r.id) && r.enabled);
    }
    
    res.json({ success: true, message: '获取公开配置成功', data: { config, roles } });
  } catch (error) {
    logger.error('获取公开配置失败', { error });
    res.status(500).json({
      success: false,
      message: '获取公开配置失败',
      error: error instanceof Error ? error.message : '未知错误',
      data: null
    });
  }
});

// 公开访问接口（通过configId获取配置和角色）
app.get('/api/v1/public-config/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const config = await publicPageConfigModel.getById(configId);
    
    if (!config || !config.isActive) {
      return res.status(404).json({ success: false, message: '配置不存在或已禁用', data: null });
    }

    // 获取角色列表
    let roles: any[] = [];
    
    if (config.displayMode === 'all') {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => r.enabled);
    } else if (config.displayMode === 'workflow' && config.workflowId) {
      // 从工作流中提取角色
      const { agentWorkflowModel } = await import('./models');
      const workflow = await agentWorkflowModel.getById(config.workflowId);
      if (workflow) {
        const workflowNodes = JSON.parse(workflow.nodes);
        const agentIds = workflowNodes.map((node: any) => node.agentId).filter(Boolean);
        const allRoles = await aiRoleModel.getAll();
        roles = allRoles.filter(r => agentIds.includes(r.id) && r.enabled);
      }
    } else if (config.displayMode === 'custom' && config.roleIds && config.roleIds.length > 0) {
      const allRoles = await aiRoleModel.getAll();
      roles = allRoles.filter(r => config.roleIds!.includes(r.id) && r.enabled);
    }
    
    res.json({ success: true, message: '获取公开配置成功', data: { config, roles } });
  } catch (error) {
    logger.error('获取公开配置失败', { error });
    res.status(500).json({
      success: false,
      message: '获取公开配置失败',
      error: error instanceof Error ? error.message : '未知错误',
      data: null
    });
  }
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
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('全局错误处理', {
    error: err,
    stack: err?.stack,
    requestUrl: req.url,
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
    
    // 初始化Agent工作流数据库表
    try {
      const { agentWorkflowModel } = await import('./models');
      await agentWorkflowModel.initializeTable();
      logger.info('Agent工作流数据库表初始化成功');
    } catch (error) {
      logger.warn('Agent工作流数据库表初始化警告', { error });
      // 不阻止服务器启动，表会在首次使用时自动创建
    }
    
    // 初始化公开页面配置数据库表
    try {
      const { publicPageConfigModel } = await import('./models');
      await publicPageConfigModel.initializeTable();
      logger.info('公开页面配置数据库表初始化成功');
    } catch (error) {
      logger.warn('公开页面配置数据库表初始化警告', { error });
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
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();