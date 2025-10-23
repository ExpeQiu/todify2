import express from 'express';
import { WorkflowStatsController } from '../controllers/WorkflowStatsController';

const router = express.Router();
const workflowStatsController = new WorkflowStatsController();

// ==============================================
// 工作流节点使用统计路由
// ==============================================

/**
 * @route POST /api/workflow-stats/node-usage
 * @desc 记录工作流节点使用统计
 */
router.post('/node-usage', (req, res) => {
  workflowStatsController.recordNodeUsage(req, res);
});

/**
 * @route GET /api/workflow-stats/node-usage/overview
 * @desc 获取节点使用统计概览
 * @query nodeId - 节点ID（可选）
 * @query days - 统计天数（默认7天）
 */
router.get('/node-usage/overview', (req, res) => {
  workflowStatsController.getNodeUsageOverview(req, res);
});

// ==============================================
// AI问答评价统计路由
// ==============================================

/**
 * @route POST /api/workflow-stats/feedback
 * @desc 记录AI问答评价
 */
router.post('/feedback', (req, res) => {
  workflowStatsController.recordAIQAFeedback(req, res);
});

/**
 * @route GET /api/workflow-stats/feedback/:nodeId
 * @desc 获取节点评价统计
 * @param nodeId - 节点ID
 * @query limit - 限制数量（默认100）
 */
router.get('/feedback/:nodeId', (req, res) => {
  workflowStatsController.getNodeFeedbackStats(req, res);
});

// ==============================================
// 工作流会话统计路由
// ==============================================

/**
 * @route POST /api/workflow-stats/session
 * @desc 记录工作流会话统计
 */
router.post('/session', (req, res) => {
  workflowStatsController.recordSessionStats(req, res);
});

/**
 * @route GET /api/workflow-stats/session/completion
 * @desc 获取工作流完成率统计
 * @query days - 统计天数（默认7天）
 */
router.get('/session/completion', (req, res) => {
  workflowStatsController.getWorkflowCompletionStats(req, res);
});

/**
 * @route GET /api/workflow-stats/session/exit-points
 * @desc 获取常见退出点统计
 * @query days - 统计天数（默认7天）
 */
router.get('/session/exit-points', (req, res) => {
  workflowStatsController.getCommonExitPoints(req, res);
});

// ==============================================
// 节点内容处理统计路由
// ==============================================

/**
 * @route POST /api/workflow-stats/content-processing
 * @desc 记录节点内容处理统计
 */
router.post('/content-processing', (req, res) => {
  workflowStatsController.recordContentProcessing(req, res);
});

/**
 * @route GET /api/workflow-stats/content-processing/adoption
 * @desc 获取内容采纳率统计
 * @query days - 统计天数（默认7天）
 */
router.get('/content-processing/adoption', (req, res) => {
  workflowStatsController.getContentAdoptionStats(req, res);
});

// ==============================================
// 综合统计路由
// ==============================================

/**
 * @route GET /api/workflow-stats/overview
 * @desc 获取综合统计概览
 * @query days - 统计天数（默认7天）
 */
router.get('/overview', (req, res) => {
  workflowStatsController.getOverallStats(req, res);
});

/**
 * @route GET /api/workflow-stats/realtime
 * @desc 获取实时统计汇总
 * @query date - 统计日期（可选）
 * @query nodeId - 节点ID（可选）
 */
router.get('/realtime', (req, res) => {
  workflowStatsController.getRealTimeStats(req, res);
});

/**
 * @route GET /api/workflow-stats/export
 * @desc 导出统计数据
 * @query days - 统计天数（默认7天）
 * @query format - 导出格式（json/csv，默认json）
 */
router.get('/export', (req, res) => {
  workflowStatsController.exportStats(req, res);
});

export default router;
