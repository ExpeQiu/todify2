import express from 'express';
import { executionTraceModel } from '../models';
import { formatApiResponse } from '../utils/validation';

const router = express.Router();

/**
 * 获取执行追踪列表
 * GET /api/v1/execution-traces?executionId=xxx&agentId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { executionId, agentId } = req.query;

    let traces;
    if (executionId) {
      traces = await executionTraceModel.getByExecutionId(executionId as string);
    } else if (agentId) {
      traces = await executionTraceModel.getByAgentId(agentId as string);
    } else {
      return res.status(400).json(formatApiResponse(false, null, '请提供executionId或agentId参数'));
    }

    res.json(formatApiResponse(true, traces, '获取执行追踪成功'));
  } catch (error) {
    console.error('获取执行追踪失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取执行追踪失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取单个执行追踪详情
 * GET /api/v1/execution-traces/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trace = await executionTraceModel.getById(id);
    
    if (!trace) {
      return res.status(404).json(formatApiResponse(false, null, '执行追踪不存在'));
    }
    
    res.json(formatApiResponse(true, trace, '获取执行追踪详情成功'));
  } catch (error) {
    console.error('获取执行追踪详情失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取执行追踪详情失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

