import express from 'express';
import { performanceMetricModel } from '../models';
import { formatApiResponse } from '../utils/validation';

const router = express.Router();

/**
 * 获取性能指标统计
 * GET /api/v1/performance-metrics/statistics?executionId=xxx&metricType=xxx&startTime=xxx&endTime=xxx
 */
router.get('/statistics', async (req, res) => {
  try {
    const { executionId, metricType, startTime, endTime } = req.query;

    const statistics = await performanceMetricModel.getStatistics(
      executionId as string | undefined,
      metricType as string | undefined,
      startTime as string | undefined,
      endTime as string | undefined
    );

    res.json(formatApiResponse(true, statistics, '获取性能统计成功'));
  } catch (error) {
    console.error('获取性能统计失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取性能统计失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 根据执行ID获取性能指标
 * GET /api/v1/performance-metrics/execution/:executionId
 */
router.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const metrics = await performanceMetricModel.getByExecutionId(executionId);
    
    res.json(formatApiResponse(true, metrics, '获取性能指标成功'));
  } catch (error) {
    console.error('获取性能指标失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取性能指标失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

