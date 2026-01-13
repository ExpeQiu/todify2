import { Router, Request, Response } from 'express';
import { SourceInformationService } from '../services/sourceInformationService';
import { CreateSourceInformationDTO, UpdateSourceInformationDTO } from '../types/database';
import { ProjectModel } from '../models/Project';
import { db } from '../config/database';

const router = Router();
const sourceInformationService = new SourceInformationService();

// 初始化数据库表（可选，通常在应用启动时调用）
router.post('/init', async (req: Request, res: Response) => {
  try {
    await sourceInformationService.initializeTable();
    res.json({
      success: true,
      message: '来源信息表初始化成功'
    });
  } catch (error) {
    console.error('初始化来源信息表失败:', error);
    res.status(500).json({
      success: false,
      message: '初始化来源信息表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 创建来源信息
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateSourceInformationDTO = req.body;
    
    // 验证必填字段
    if (!data.source_id || !data.title || !data.type) {
      return res.status(400).json({
        success: false,
        message: 'source_id、title和type为必填字段'
      });
    }

    // 验证type字段
    if (!['knowledge_base', 'external'].includes(data.type)) {
      return res.status(400).json({
        success: false,
        message: 'type必须是knowledge_base或external'
      });
    }

    const sourceInformation = await sourceInformationService.createSourceInformation(data);
    
    res.status(201).json({
      success: true,
      data: sourceInformation,
      message: '来源信息创建成功'
    });
  } catch (error) {
    console.error('创建来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '创建来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 批量创建来源信息
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const dataList: CreateSourceInformationDTO[] = req.body;
    
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的来源信息数组'
      });
    }

    // 验证每个数据项
    for (const data of dataList) {
      if (!data.source_id || !data.title || !data.type) {
        return res.status(400).json({
          success: false,
          message: '每个来源信息必须包含source_id、title和type字段'
        });
      }
    }

    const results = await sourceInformationService.createSourceInformationBatch(dataList);
    
    res.status(201).json({
      success: true,
      data: results,
      message: `成功创建${results.length}条来源信息`
    });
  } catch (error) {
    console.error('批量创建来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取来源信息列表（必须在参数路由之前）
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const orderBy = req.query.orderBy as string || 'created_at';
    const orderDirection = (req.query.orderDirection as string || 'DESC').toUpperCase();
    const pageType = req.query.pageType as string;
    const conversationId = req.query.conversationId as string;
    const type = req.query.type as string;
    const status = req.query.status as string || 'active';
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

    // 如果提供了 projectId，使用项目级查询
    if (projectId) {
      const sourceInformationList = await sourceInformationService.getSourceInformationByProjectId(projectId);
      res.json({
        success: true,
        data: sourceInformationList,
        pagination: {
          page: 1,
          pageSize: sourceInformationList.length,
          total: sourceInformationList.length,
          totalPages: 1
        }
      });
      return;
    }

    const where: Record<string, any> = {};
    if (pageType) where.page_type = pageType;
    if (conversationId) where.conversation_id = conversationId;
    if (type) where.type = type;
    if (status) where.status = status;

    const options = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy,
      orderDirection: orderDirection as 'ASC' | 'DESC',
      where: Object.keys(where).length > 0 ? where : undefined
    };

    const result = await sourceInformationService.getSourceInformationList(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取来源信息列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取来源信息列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据对话ID获取来源信息列表（必须在 /:id 之前）
router.get('/conversation/:conversationId', async (req: Request, res: Response) => {
  try {
    // 确保表已初始化
    try {
      await sourceInformationService.initializeTable();
    } catch (initError: any) {
      // 如果表已存在，忽略错误
      if (!initError?.message?.includes('already exists') && 
          !initError?.message?.includes('duplicate')) {
        console.warn('初始化表时出现警告，继续执行:', initError?.message);
      }
    }

    const { conversationId } = req.params;

    const sourceInformationList = await sourceInformationService.getSourceInformationByConversationId(conversationId);
    
    res.json({
      success: true,
      data: sourceInformationList
    });
  } catch (error) {
    console.error('获取对话来源信息列表失败:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      success: false,
      message: '获取对话来源信息列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据项目ID获取来源信息列表（必须在 /:id 之前）
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    // 确保表已初始化
    try {
      await sourceInformationService.initializeTable();
    } catch (initError: any) {
      // 如果表已存在，忽略错误
      if (!initError?.message?.includes('already exists') && 
          !initError?.message?.includes('duplicate')) {
        console.warn('初始化表时出现警告，继续执行:', initError?.message);
      }
    }

    const projectId = parseInt(req.params.projectId);
    
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: '无效的项目ID'
      });
    }

    const sourceInformationList = await sourceInformationService.getSourceInformationByProjectId(projectId);
    
    res.json({
      success: true,
      data: sourceInformationList
    });
  } catch (error) {
    console.error('获取项目来源信息列表失败:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      success: false,
      message: '获取项目来源信息列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据页面类型获取来源信息列表（必须在 /:id 之前）
router.get('/page-type/:pageType', async (req: Request, res: Response) => {
  try {
    // 确保表已初始化
    try {
      await sourceInformationService.initializeTable();
    } catch (initError: any) {
      // 如果表已存在，忽略错误
      if (!initError?.message?.includes('already exists') && 
          !initError?.message?.includes('duplicate')) {
        console.warn('初始化表时出现警告，继续执行:', initError?.message);
      }
    }

    const { pageType } = req.params;

    const sourceInformationList = await sourceInformationService.getSourceInformationByPageType(pageType);
    
    res.json({
      success: true,
      data: sourceInformationList
    });
  } catch (error) {
    console.error('获取页面类型来源信息列表失败:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : error);
    res.status(500).json({
      success: false,
      message: '获取页面类型来源信息列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据source_id获取来源信息（必须在 /:id 之前）
router.get('/source-id/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;

    const sourceInformation = await sourceInformationService.getSourceInformationBySourceId(sourceId);
    
    if (!sourceInformation) {
      return res.status(404).json({
        success: false,
        message: '来源信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: sourceInformation
    });
  } catch (error) {
    console.error('获取来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据ID获取来源信息（必须在最后，因为会匹配任何路径）
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的来源信息ID'
      });
    }

    const sourceInformation = await sourceInformationService.getSourceInformationById(id);
    
    if (!sourceInformation) {
      return res.status(404).json({
        success: false,
        message: '来源信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: sourceInformation
    });
  } catch (error) {
    console.error('获取来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新来源信息
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const data: UpdateSourceInformationDTO = req.body;
  
  console.log(`[更新来源信息] 请求 ID: ${id}`);
  console.log(`[更新来源信息] 请求数据:`, JSON.stringify(data, null, 2));
  
  try {
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的来源信息ID'
      });
    }

    // 验证 project_id 是否存在（如果提供了）
    if (data.project_id !== undefined && data.project_id !== null) {
      console.log(`[更新来源信息] 验证项目ID: ${data.project_id}`);
      const projectModel = new ProjectModel(db);
      const project = await projectModel.findById(data.project_id);
      if (!project) {
        console.error(`[更新来源信息] 项目ID ${data.project_id} 不存在`);
        return res.status(400).json({
          success: false,
          message: `项目ID ${data.project_id} 不存在`,
          error: {
            code: 'INVALID_PROJECT_ID',
            message: `项目ID ${data.project_id} 不存在`
          }
        });
      }
      console.log(`[更新来源信息] 项目验证通过: ${project.name}`);
    }

    console.log(`[更新来源信息] 开始更新数据库...`);
    const sourceInformation = await sourceInformationService.updateSourceInformation(id, data);
    
    if (!sourceInformation) {
      console.error(`[更新来源信息] 更新后未找到来源信息 id=${id}`);
      return res.status(404).json({
        success: false,
        message: '来源信息不存在'
      });
    }
    
    console.log(`[更新来源信息] 更新成功 id=${id}`);
    res.json({
      success: true,
      data: sourceInformation,
      message: '来源信息更新成功'
    });
  } catch (error: any) {
    console.error('[更新来源信息] 更新失败:', error);
    console.error('[更新来源信息] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    console.error('[更新来源信息] 请求参数:', { id, data });
    
    // 检查是否是外键约束错误
    const errorMessage = error?.message || '未知错误';
    let userMessage = '更新来源信息失败';
    
    if (errorMessage.includes('FOREIGN KEY constraint failed') || 
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('FOREIGN KEY constraint')) {
      userMessage = '项目ID不存在或无效，请检查项目关联';
    } else if (errorMessage.includes('no such column')) {
      userMessage = '数据库字段不存在，请联系管理员';
    } else if (errorMessage.includes('UNIQUE constraint failed')) {
      userMessage = '数据唯一性约束冲突';
    } else if (errorMessage.includes('SQLITE_CONSTRAINT')) {
      userMessage = '数据库约束错误，请检查数据有效性';
    }
    
    res.status(500).json({
      success: false,
      message: userMessage,
      error: {
        code: error?.code || 'DATABASE_ERROR',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          errno: error?.errno,
          sqlState: error?.sqlState,
          sqlMessage: error?.sqlMessage,
          stack: error?.stack?.split('\n').slice(0, 5).join('\n') // 只返回前5行堆栈
        } : undefined
      }
    });
  }
});

// 根据source_id更新来源信息
router.put('/source-id/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;
    const data: UpdateSourceInformationDTO = req.body;

    const sourceInformation = await sourceInformationService.updateSourceInformationBySourceId(sourceId, data);
    
    if (!sourceInformation) {
      return res.status(404).json({
        success: false,
        message: '来源信息不存在'
      });
    }
    
    res.json({
      success: true,
      data: sourceInformation,
      message: '来源信息更新成功'
    });
  } catch (error) {
    console.error('更新来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除来源信息
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的来源信息ID'
      });
    }

    const success = await sourceInformationService.deleteSourceInformation(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '来源信息不存在或删除失败'
      });
    }
    
    res.json({
      success: true,
      message: '来源信息删除成功'
    });
  } catch (error) {
    console.error('删除来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '删除来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据source_id删除来源信息
router.delete('/source-id/:sourceId', async (req: Request, res: Response) => {
  try {
    const { sourceId } = req.params;

    const success = await sourceInformationService.deleteSourceInformationBySourceId(sourceId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '来源信息不存在或删除失败'
      });
    }
    
    res.json({
      success: true,
      message: '来源信息删除成功'
    });
  } catch (error) {
    console.error('删除来源信息失败:', error);
    res.status(500).json({
      success: false,
      message: '删除来源信息失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;

