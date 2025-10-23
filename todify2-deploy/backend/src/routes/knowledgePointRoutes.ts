import { Router, Request, Response } from 'express';
import { KnowledgePointService } from '../services/knowledgePointService';
import { CreateKnowledgePointDTO, UpdateKnowledgePointDTO } from '../types/database';

const router = Router();
const knowledgePointService = new KnowledgePointService();

// 创建知识点
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateKnowledgePointDTO = req.body;
    
    // 验证必填字段
    if (!data.tech_point_id || !data.title || !data.content) {
      return res.status(400).json({
        success: false,
        message: '技术点ID、标题和内容为必填字段'
      });
    }

    const knowledgePoint = await knowledgePointService.createKnowledgePoint(data);
    
    res.status(201).json({
      success: true,
      data: knowledgePoint,
      message: '知识点创建成功'
    });
  } catch (error) {
    console.error('创建知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '创建知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据技术点ID获取知识点列表
router.get('/tech-point/:techPointId', async (req: Request, res: Response) => {
  try {
    const techPointId = parseInt(req.params.techPointId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const orderBy = req.query.orderBy as string || 'created_at';
    const orderDirection = (req.query.orderDirection as string || 'DESC').toUpperCase();

    if (isNaN(techPointId)) {
      return res.status(400).json({
        success: false,
        message: '无效的技术点ID'
      });
    }

    const options = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy,
      orderDirection: orderDirection as 'ASC' | 'DESC'
    };

    const result = await knowledgePointService.getKnowledgePointsByTechPointId(techPointId, options);
    
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
    console.error('获取知识点列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 根据ID获取知识点详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的知识点ID'
      });
    }

    const knowledgePoint = await knowledgePointService.getKnowledgePointById(id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }
    
    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    console.error('获取知识点详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新知识点
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateKnowledgePointDTO = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的知识点ID'
      });
    }

    const knowledgePoint = await knowledgePointService.updateKnowledgePoint(id, data);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }
    
    res.json({
      success: true,
      data: knowledgePoint,
      message: '知识点更新成功'
    });
  } catch (error) {
    console.error('更新知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '更新知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除知识点
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的知识点ID'
      });
    }

    const success = await knowledgePointService.deleteKnowledgePoint(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在或删除失败'
      });
    }
    
    res.json({
      success: true,
      message: '知识点删除成功'
    });
  } catch (error) {
    console.error('删除知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '删除知识点失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;