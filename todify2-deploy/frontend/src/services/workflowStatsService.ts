import axios from 'axios';

// 工作流统计数据接口
export interface WorkflowStatsOverview {
  overview: {
    totalUsage: number;
    totalSessions: number;
    completionRate: number;
    avgSatisfaction: number;
    avgSessionDuration: number;
    avgCompletionRate: number;
  };
  nodeStats: NodeUsageStat[];
  nodeAdoptionRates: NodeAdoptionRate[];
  workflowStats: WorkflowCompletionStats;
  commonExitPoints: CommonExitPoint[];
  contentProcessingDistribution: ContentProcessingDistribution;
  timeRange: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export interface NodeUsageStat {
  node_id: string;
  node_name: string;
  node_type: string;
  total_usage: number;
  total_sessions: number;
  total_users: number;
  avg_response_time: number;
  avg_quality_score: number;
  total_likes: number;
  total_dislikes: number;
  total_regenerations: number;
  total_adoptions: number;
  total_edits: number;
  adoption_rate: number;
  edit_rate: number;
}

export interface NodeAdoptionRate {
  nodeId: string;
  nodeName: string;
  adoptionRate: number;
  editRate: number;
  totalUsage: number;
  avgResponseTime: number;
  avgQualityScore: number;
}

export interface WorkflowCompletionStats {
  total_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  error_sessions: number;
  avg_session_duration: number;
  avg_completion_rate: number;
  avg_satisfaction_score: number;
}

export interface CommonExitPoint {
  exit_node_id: string;
  exit_reason: string;
  exit_count: number;
  avg_duration_before_exit: number;
  avg_completion_rate: number;
}

export interface ContentProcessingDistribution {
  [nodeId: string]: {
    [processingType: string]: {
      count: number;
      avgEditRatio: number;
      avgSatisfactionScore: number;
    };
  };
}

export interface AIQAFeedback {
  id: number;
  message_id: string;
  node_id: string;
  session_id: string;
  user_id?: string;
  feedback_type: 'like' | 'dislike' | 'adopt' | 'regenerate' | 'edit';
  feedback_value: number;
  feedback_comment?: string;
  response_time?: number;
  content_length?: number;
  content_quality_score?: number;
  query_text?: string;
  response_text?: string;
  context_data?: string;
  created_at: string;
}

export interface NodeFeedbackStats {
  feedback: AIQAFeedback[];
  stats: {
    total: number;
    likes: number;
    dislikes: number;
    adopts: number;
    regenerates: number;
    edits: number;
    avgRating: number;
    avgResponseTime: number;
    avgContentLength: number;
  };
}

export interface WorkflowNodeUsage {
  id?: number;
  node_id: string;
  node_name: string;
  node_type: string;
  session_id: string;
  user_id?: string;
  usage_count: number;
  total_time_spent: number;
  avg_response_time: number;
  success_count: number;
  failure_count: number;
  total_characters: number;
  avg_characters: number;
  content_quality_score: number;
  likes_count: number;
  dislikes_count: number;
  regenerations_count: number;
  adoptions_count: number;
  edits_count: number;
  is_workflow_mode: boolean;
  is_standalone_mode: boolean;
  previous_node_id?: string;
  next_node_id?: string;
  first_used_at?: string;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowSessionStats {
  id?: number;
  session_id: string;
  user_id?: string;
  session_start_time?: string;
  session_end_time?: string;
  session_duration: number;
  total_nodes_visited: number;
  completed_nodes: number;
  skipped_nodes: number;
  node_visit_sequence?: string;
  node_completion_status?: string;
  exit_node_id?: string;
  exit_reason?: string;
  exit_time?: string;
  workflow_path?: string;
  path_efficiency_score: number;
  overall_satisfaction_score?: number;
  user_feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NodeContentProcessing {
  id?: number;
  node_id: string;
  session_id: string;
  message_id?: string;
  processing_type: 'direct_adopt' | 'edit_adopt' | 'regenerate' | 'abandon';
  processing_time?: number;
  original_content_length?: number;
  final_content_length?: number;
  edit_ratio: number;
  edit_count: number;
  edit_types?: string;
  edit_duration: number;
  user_satisfaction_score?: number;
  user_behavior_data?: string;
  created_at?: string;
}

// DTO接口
export interface CreateWorkflowNodeUsageDTO {
  node_id: string;
  node_name: string;
  node_type: string;
  session_id: string;
  user_id?: string;
  usage_count?: number;
  total_time_spent?: number;
  avg_response_time?: number;
  success_count?: number;
  failure_count?: number;
  total_characters?: number;
  avg_characters?: number;
  content_quality_score?: number;
  likes_count?: number;
  dislikes_count?: number;
  regenerations_count?: number;
  adoptions_count?: number;
  edits_count?: number;
  is_workflow_mode?: boolean;
  is_standalone_mode?: boolean;
  previous_node_id?: string;
  next_node_id?: string;
}

export interface CreateAIQAFeedbackDTO {
  message_id: string;
  node_id: string;
  session_id: string;
  user_id?: string;
  feedback_type: 'like' | 'dislike' | 'adopt' | 'regenerate' | 'edit';
  feedback_value?: number;
  feedback_comment?: string;
  response_time?: number;
  content_length?: number;
  content_quality_score?: number;
  query_text?: string;
  response_text?: string;
  context_data?: string;
}

export interface CreateWorkflowSessionStatsDTO {
  session_id: string;
  user_id?: string;
  session_duration?: number;
  total_nodes_visited?: number;
  completed_nodes?: number;
  skipped_nodes?: number;
  node_visit_sequence?: string;
  node_completion_status?: string;
  exit_node_id?: string;
  exit_reason?: string;
  exit_time?: string;
  workflow_path?: string;
  path_efficiency_score?: number;
  overall_satisfaction_score?: number;
  user_feedback?: string;
}

export interface CreateNodeContentProcessingDTO {
  node_id: string;
  session_id: string;
  message_id?: string;
  processing_type: 'direct_adopt' | 'edit_adopt' | 'regenerate' | 'abandon';
  processing_time?: number;
  original_content_length?: number;
  final_content_length?: number;
  edit_ratio?: number;
  edit_count?: number;
  edit_types?: string;
  edit_duration?: number;
  user_satisfaction_score?: number;
  user_behavior_data?: string;
}

/**
 * 工作流统计服务类
 */
export class WorkflowStatsService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  // ==============================================
  // 工作流节点使用统计相关方法
  // ==============================================

  /**
   * 记录工作流节点使用统计
   */
  async recordNodeUsage(data: CreateWorkflowNodeUsageDTO): Promise<WorkflowNodeUsage> {
    try {
      const response = await axios.post(`${this.baseURL}/workflow-stats/node-usage`, data);
      return response.data.data;
    } catch (error) {
      console.error('记录节点使用统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取节点使用统计概览
   */
  async getNodeUsageOverview(nodeId?: string, days: number = 7): Promise<NodeUsageStat[]> {
    try {
      const params = new URLSearchParams();
      if (nodeId) params.append('nodeId', nodeId);
      params.append('days', days.toString());

      const response = await axios.get(`${this.baseURL}/workflow-stats/node-usage/overview?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('获取节点使用统计概览失败:', error);
      throw error;
    }
  }

  // ==============================================
  // AI问答评价相关方法
  // ==============================================

  /**
   * 记录AI问答评价
   */
  async recordAIQAFeedback(data: CreateAIQAFeedbackDTO): Promise<AIQAFeedback> {
    try {
      const response = await axios.post(`${this.baseURL}/workflow-stats/feedback`, data);
      return response.data.data;
    } catch (error) {
      console.error('记录AI问答评价失败:', error);
      throw error;
    }
  }

  /**
   * 获取节点评价统计
   */
  async getNodeFeedbackStats(nodeId: string, limit: number = 100): Promise<NodeFeedbackStats> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/feedback/${nodeId}?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('获取节点评价统计失败:', error);
      throw error;
    }
  }

  // ==============================================
  // 工作流会话统计相关方法
  // ==============================================

  /**
   * 记录工作流会话统计
   */
  async recordSessionStats(data: CreateWorkflowSessionStatsDTO): Promise<WorkflowSessionStats> {
    try {
      const response = await axios.post(`${this.baseURL}/workflow-stats/session`, data);
      return response.data.data;
    } catch (error) {
      console.error('记录工作流会话统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取工作流完成率统计
   */
  async getWorkflowCompletionStats(days: number = 7): Promise<WorkflowCompletionStats> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/session/completion?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取工作流完成率统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取常见退出点统计
   */
  async getCommonExitPoints(days: number = 7): Promise<CommonExitPoint[]> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/session/exit-points?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取常见退出点统计失败:', error);
      throw error;
    }
  }

  // ==============================================
  // 节点内容处理统计相关方法
  // ==============================================

  /**
   * 记录节点内容处理统计
   */
  async recordContentProcessing(data: CreateNodeContentProcessingDTO): Promise<NodeContentProcessing> {
    try {
      const response = await axios.post(`${this.baseURL}/workflow-stats/content-processing`, data);
      return response.data.data;
    } catch (error) {
      console.error('记录节点内容处理统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容采纳率统计
   */
  async getContentAdoptionStats(days: number = 7): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/content-processing/adoption?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取内容采纳率统计失败:', error);
      throw error;
    }
  }

  // ==============================================
  // 综合统计方法
  // ==============================================

  /**
   * 获取综合统计概览
   */
  async getOverallStats(days: number = 7): Promise<WorkflowStatsOverview> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/overview?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('获取综合统计概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时统计汇总
   */
  async getRealTimeStats(date?: string, nodeId?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (nodeId) params.append('nodeId', nodeId);

      const response = await axios.get(`${this.baseURL}/workflow-stats/realtime?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('获取实时统计汇总失败:', error);
      throw error;
    }
  }

  /**
   * 导出统计数据
   */
  async exportStats(days: number = 7, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseURL}/workflow-stats/export?days=${days}&format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('导出统计数据失败:', error);
      throw error;
    }
  }

  // ==============================================
  // 工具方法
  // ==============================================

  /**
   * 下载统计数据文件
   */
  async downloadStats(days: number = 7, format: 'json' | 'csv' = 'json'): Promise<void> {
    try {
      const blob = await this.exportStats(days, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow-stats-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载统计数据失败:', error);
      throw error;
    }
  }

  /**
   * 格式化响应时间
   */
  formatResponseTime(seconds: number): string {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    } else if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  }

  /**
   * 格式化数字
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  }

  /**
   * 格式化百分比
   */
  formatPercentage(num: number): string {
    return `${(num * 100).toFixed(1)}%`;
  }

  /**
   * 获取节点类型显示名称
   */
  getNodeDisplayName(nodeType: string): string {
    const nodeNames: { [key: string]: string } = {
      'ai_qa': 'AI问答',
      'ai_search': 'AI搜索',
      'tech_package': '技术包装',
      'promotion_strategy': '推广策略',
      'core_draft': '核心稿件',
      'speech': '演讲稿'
    };
    return nodeNames[nodeType] || nodeType;
  }

  /**
   * 获取反馈类型显示名称
   */
  getFeedbackDisplayName(feedbackType: string): string {
    const feedbackNames: { [key: string]: string } = {
      'like': '点赞',
      'dislike': '点踩',
      'adopt': '采纳',
      'regenerate': '重新生成',
      'edit': '编辑'
    };
    return feedbackNames[feedbackType] || feedbackType;
  }

  /**
   * 获取处理类型显示名称
   */
  getProcessingDisplayName(processingType: string): string {
    const processingNames: { [key: string]: string } = {
      'direct_adopt': '直接采纳',
      'edit_adopt': '编辑后采纳',
      'regenerate': '重新生成',
      'abandon': '放弃'
    };
    return processingNames[processingType] || processingType;
  }
}

// 导出服务实例
export const workflowStatsService = new WorkflowStatsService();
