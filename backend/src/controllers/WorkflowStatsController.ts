import { Request, Response } from 'express';
import { WorkflowStatsModel } from '../models/WorkflowStats';

/**
 * 工作流统计控制器
 */
export class WorkflowStatsController {
  private workflowStatsModel: WorkflowStatsModel;

  constructor() {
    this.workflowStatsModel = new WorkflowStatsModel();
  }

  // ==============================================
  // 工作流节点使用统计相关接口
  // ==============================================

  /**
   * 记录工作流节点使用统计
   */
  async recordNodeUsage(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      const result = await this.workflowStatsModel.upsertWorkflowNodeUsage(data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '节点使用统计记录成功'
      });
    } catch (error: any) {
      console.error('记录节点使用统计失败:', error);
      res.status(500).json({
        success: false,
        message: '记录节点使用统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取节点使用统计概览
   */
  async getNodeUsageOverview(req: Request, res: Response): Promise<void> {
    try {
      const { nodeId, days = 7 } = req.query;
      
      const result = await this.workflowStatsModel.getNodeUsageOverview(
        nodeId as string,
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        data: result,
        message: '获取节点使用统计概览成功'
      });
    } catch (error: any) {
      console.error('获取节点使用统计概览失败:', error);
      res.status(500).json({
        success: false,
        message: '获取节点使用统计概览失败',
        error: error.message
      });
    }
  }

  // ==============================================
  // AI问答评价相关接口
  // ==============================================

  /**
   * 记录AI问答评价
   */
  async recordAIQAFeedback(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      const result = await this.workflowStatsModel.createAIQAFeedback(data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'AI问答评价记录成功'
      });
    } catch (error: any) {
      console.error('记录AI问答评价失败:', error);
      res.status(500).json({
        success: false,
        message: '记录AI问答评价失败',
        error: error.message
      });
    }
  }

  /**
   * 获取节点评价统计
   */
  async getNodeFeedbackStats(req: Request, res: Response): Promise<void> {
    try {
      const { nodeId, limit = 100 } = req.query;
      
      if (!nodeId) {
        res.status(400).json({
          success: false,
          message: '节点ID不能为空'
        });
        return;
      }
      
      const result = await this.workflowStatsModel.getAIQAFeedbackByNode(
        nodeId as string,
        parseInt(limit as string)
      );
      
      // 计算评价统计
      const stats = {
        total: result.length,
        likes: result.filter(f => f.feedback_type === 'like').length,
        dislikes: result.filter(f => f.feedback_type === 'dislike').length,
        adopts: result.filter(f => f.feedback_type === 'adopt').length,
        regenerates: result.filter(f => f.feedback_type === 'regenerate').length,
        edits: result.filter(f => f.feedback_type === 'edit').length,
        avgRating: result.reduce((sum, f) => sum + (f.feedback_value || 0), 0) / result.length || 0,
        avgResponseTime: result.reduce((sum, f) => sum + (f.response_time || 0), 0) / result.length || 0,
        avgContentLength: result.reduce((sum, f) => sum + (f.content_length || 0), 0) / result.length || 0
      };
      
      res.json({
        success: true,
        data: {
          feedback: result,
          stats
        },
        message: '获取节点评价统计成功'
      });
    } catch (error: any) {
      console.error('获取节点评价统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取节点评价统计失败',
        error: error.message
      });
    }
  }

  // ==============================================
  // 工作流会话统计相关接口
  // ==============================================

  /**
   * 记录工作流会话统计
   */
  async recordSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      const result = await this.workflowStatsModel.upsertWorkflowSessionStats(data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '工作流会话统计记录成功'
      });
    } catch (error: any) {
      console.error('记录工作流会话统计失败:', error);
      res.status(500).json({
        success: false,
        message: '记录工作流会话统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取工作流完成率统计
   */
  async getWorkflowCompletionStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      
      const result = await this.workflowStatsModel.getWorkflowCompletionStats(
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        data: result,
        message: '获取工作流完成率统计成功'
      });
    } catch (error: any) {
      console.error('获取工作流完成率统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取工作流完成率统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取常见退出点统计
   */
  async getCommonExitPoints(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      
      const result = await this.workflowStatsModel.getCommonExitPoints(
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        data: result,
        message: '获取常见退出点统计成功'
      });
    } catch (error: any) {
      console.error('获取常见退出点统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取常见退出点统计失败',
        error: error.message
      });
    }
  }

  // ==============================================
  // 节点内容处理统计相关接口
  // ==============================================

  /**
   * 记录节点内容处理统计
   */
  async recordContentProcessing(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      
      const result = await this.workflowStatsModel.createNodeContentProcessing(data);
      
      res.status(201).json({
        success: true,
        data: result,
        message: '节点内容处理统计记录成功'
      });
    } catch (error: any) {
      console.error('记录节点内容处理统计失败:', error);
      res.status(500).json({
        success: false,
        message: '记录节点内容处理统计失败',
        error: error.message
      });
    }
  }

  /**
   * 获取内容采纳率统计
   */
  async getContentAdoptionStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      
      const result = await this.workflowStatsModel.getContentAdoptionStats(
        parseInt(days as string)
      );
      
      res.json({
        success: true,
        data: result,
        message: '获取内容采纳率统计成功'
      });
    } catch (error: any) {
      console.error('获取内容采纳率统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取内容采纳率统计失败',
        error: error.message
      });
    }
  }

  // ==============================================
  // 综合统计接口
  // ==============================================

  /**
   * 获取综合统计概览
   */
  async getOverallStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      
      // 并行获取各种统计数据
      const [
        nodeUsageOverview,
        workflowCompletionStats,
        commonExitPoints,
        contentAdoptionStats
      ] = await Promise.all([
        this.workflowStatsModel.getNodeUsageOverview(undefined, parseInt(days as string)),
        this.workflowStatsModel.getWorkflowCompletionStats(parseInt(days as string)),
        this.workflowStatsModel.getCommonExitPoints(parseInt(days as string)),
        this.workflowStatsModel.getContentAdoptionStats(parseInt(days as string))
      ]);
      
      // 计算综合指标
      const totalUsage = nodeUsageOverview.reduce((sum, node) => sum + node.total_usage, 0);
      const totalSessions = workflowCompletionStats.total_sessions || 0;
      const completionRate = workflowCompletionStats.completed_sessions / totalSessions * 100 || 0;
      const avgSatisfaction = workflowCompletionStats.avg_satisfaction_score || 0;
      
      // 计算各节点的采纳率
      const nodeAdoptionRates = nodeUsageOverview.map(node => ({
        nodeId: node.node_id,
        nodeName: node.node_name,
        adoptionRate: node.adoption_rate * 100 || 0,
        editRate: node.edit_rate * 100 || 0,
        totalUsage: node.total_usage,
        avgResponseTime: node.avg_response_time,
        avgQualityScore: node.avg_quality_score
      }));
      
      // 计算内容处理类型分布
      const contentProcessingDistribution = contentAdoptionStats.reduce((acc, item) => {
        if (!acc[item.node_id]) {
          acc[item.node_id] = {};
        }
        acc[item.node_id][item.processing_type] = {
          count: item.count,
          avgEditRatio: item.avg_edit_ratio,
          avgSatisfactionScore: item.avg_satisfaction_score
        };
        return acc;
      }, {} as any);
      
      const result = {
        overview: {
          totalUsage,
          totalSessions,
          completionRate: Math.round(completionRate * 100) / 100,
          avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
          avgSessionDuration: workflowCompletionStats.avg_session_duration || 0,
          avgCompletionRate: workflowCompletionStats.avg_completion_rate * 100 || 0
        },
        nodeStats: nodeUsageOverview,
        nodeAdoptionRates,
        workflowStats: workflowCompletionStats,
        commonExitPoints,
        contentProcessingDistribution,
        timeRange: {
          days: parseInt(days as string),
          startDate: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      };
      
      res.json({
        success: true,
        data: result,
        message: '获取综合统计概览成功'
      });
    } catch (error: any) {
      console.error('获取综合统计概览失败:', error);
      res.status(500).json({
        success: false,
        message: '获取综合统计概览失败',
        error: error.message
      });
    }
  }

  /**
   * 获取实时统计汇总
   */
  async getRealTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const { date, nodeId } = req.query;
      
      const result = await this.workflowStatsModel.getWorkflowStatsSummary(
        date as string,
        nodeId as string
      );
      
      res.json({
        success: true,
        data: result,
        message: '获取实时统计汇总成功'
      });
    } catch (error: any) {
      console.error('获取实时统计汇总失败:', error);
      res.status(500).json({
        success: false,
        message: '获取实时统计汇总失败',
        error: error.message
      });
    }
  }

  /**
   * 获取统计数据导出
   */
  async exportStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7, format = 'json' } = req.query;
      
      // 获取所有统计数据
      const [
        nodeUsageOverview,
        workflowCompletionStats,
        commonExitPoints,
        contentAdoptionStats
      ] = await Promise.all([
        this.workflowStatsModel.getNodeUsageOverview(undefined, parseInt(days as string)),
        this.workflowStatsModel.getWorkflowCompletionStats(parseInt(days as string)),
        this.workflowStatsModel.getCommonExitPoints(parseInt(days as string)),
        this.workflowStatsModel.getContentAdoptionStats(parseInt(days as string))
      ]);
      
      const exportData = {
        exportTime: new Date().toISOString(),
        timeRange: {
          days: parseInt(days as string),
          startDate: new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        nodeUsageOverview,
        workflowCompletionStats,
        commonExitPoints,
        contentAdoptionStats
      };
      
      if (format === 'csv') {
        // 这里可以实现CSV导出逻辑
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=workflow-stats.csv');
        res.send('CSV export not implemented yet');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=workflow-stats.json');
        res.json(exportData);
      }
    } catch (error: any) {
      console.error('导出统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '导出统计数据失败',
        error: error.message
      });
    }
  }
}
