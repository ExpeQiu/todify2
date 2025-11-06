import express from 'express';
import { agentWorkflowService } from '../services/AgentWorkflowService';
import { formatApiResponse } from '../utils/validation';

const router = express.Router();

/**
 * 获取执行详情
 * GET /api/v1/executions/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = await agentWorkflowService.getExecutionById(id);
    
    if (!execution) {
      return res.status(404).json(formatApiResponse(false, null, '执行记录不存在'));
    }
    
    res.json(formatApiResponse(true, execution, '获取执行详情成功'));
  } catch (error) {
    console.error('获取执行详情失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取执行详情失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

