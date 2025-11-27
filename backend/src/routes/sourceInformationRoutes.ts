import { Router, Request, Response } from 'express';
import { SourceInformationService } from '../services/sourceInformationService';
import { CreateSourceInformationDTO, UpdateSourceInformationDTO } from '../types/database';

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
  try {
    const id = parseInt(req.params.id);
    const data: UpdateSourceInformationDTO = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的来源信息ID'
      });
    }

    const sourceInformation = await sourceInformationService.updateSourceInformation(id, data);
    
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

