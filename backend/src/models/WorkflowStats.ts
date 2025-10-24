import { DatabaseManager } from '../config/database';

// 工作流节点使用统计接口
export interface WorkflowNodeUsage {
  id?: number;
  node_id: string;
  node_name: string;
  node_type: string;
  session_id: string;
  user_id?: string;
  
  // 使用统计
  usage_count: number;
  total_time_spent: number;
  avg_response_time: number;
  success_count: number;
  failure_count: number;
  
  // 内容统计
  total_characters: number;
  avg_characters: number;
  content_quality_score: number;
  
  // 用户交互统计
  likes_count: number;
  dislikes_count: number;
  regenerations_count: number;
  adoptions_count: number;
  edits_count: number;
  
  // 工作流上下文
  is_workflow_mode: boolean;
  is_standalone_mode: boolean;
  previous_node_id?: string;
  next_node_id?: string;
  
  // 时间戳
  first_used_at?: string;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

// AI问答评价接口
export interface AIQAFeedback {
  id?: number;
  message_id: string;
  node_id: string;
  session_id: string;
  user_id?: string;
  
  // 评价类型
  feedback_type: 'like' | 'dislike' | 'adopt' | 'regenerate' | 'edit';
  feedback_value: number;
  feedback_comment?: string;
  
  // 内容分析
  response_time?: number;
  content_length?: number;
  content_quality_score?: number;
  
  // 上下文信息
  query_text?: string;
  response_text?: string;
  context_data?: string;
  
  created_at?: string;
}

// 工作流会话统计接口
export interface WorkflowSessionStats {
  id?: number;
  session_id: string;
  user_id?: string;
  
  // 会话基本信息
  session_start_time?: string;
  session_end_time?: string;
  session_duration: number;
  
  // 工作流完整性统计
  total_nodes_visited: number;
  completed_nodes: number;
  skipped_nodes: number;
  
  // 节点访问记录
  node_visit_sequence?: string;
  node_completion_status?: string;
  
  // 跳出点分析
  exit_node_id?: string;
  exit_reason?: string;
  exit_time?: string;
  
  // 工作流路径分析
  workflow_path?: string;
  path_efficiency_score: number;
  
  // 用户满意度
  overall_satisfaction_score?: number;
  user_feedback?: string;
  
  created_at?: string;
  updated_at?: string;
}

// 节点内容处理统计接口
export interface NodeContentProcessing {
  id?: number;
  node_id: string;
  session_id: string;
  message_id?: string;
  
  // 内容处理类型
  processing_type: 'direct_adopt' | 'edit_adopt' | 'regenerate' | 'abandon';
  processing_time?: number;
  
  // 内容分析
  original_content_length?: number;
  final_content_length?: number;
  edit_ratio: number;
  
  // 编辑详情
  edit_count: number;
  edit_types?: string;
  edit_duration: number;
  
  // 用户行为
  user_satisfaction_score?: number;
  user_behavior_data?: string;
  
  created_at?: string;
}

// 实时统计汇总接口
export interface WorkflowStatsSummary {
  id?: number;
  stat_date: string;
  node_id: string;
  
  // 使用统计
  total_usage_count: number;
  unique_users: number;
  avg_response_time: number;
  success_rate: number;
  
  // 内容统计
  total_characters: number;
  avg_characters: number;
  avg_content_quality: number;
  
  // 用户交互统计
  total_likes: number;
  total_dislikes: number;
  total_regenerations: number;
  total_adoptions: number;
  total_edits: number;
  
  // 采纳率统计
  direct_adoption_rate: number;
  edit_adoption_rate: number;
  abandonment_rate: number;
  
  // 工作流统计
  workflow_completion_rate: number;
  avg_session_duration: number;
  common_exit_points?: string;
  
  created_at?: string;
  updated_at?: string;
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
 * 工作流统计数据模型类
 */
export class WorkflowStatsModel {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      this.db = new DatabaseManager();
    }
    await this.db.connect();
  }

  // ==============================================
  // 工作流节点使用统计相关方法
  // ==============================================

  /**
   * 创建或更新工作流节点使用统计
   */
  async upsertWorkflowNodeUsage(data: CreateWorkflowNodeUsageDTO): Promise<WorkflowNodeUsage> {
    await this.ensureConnection();

    // 首先检查是否已存在相同的node_id和session_id的记录
    const existingRecord = await this.getWorkflowNodeUsageByNodeAndSession(data.node_id, data.session_id);
    
    if (existingRecord) {
      // 如果存在，则更新记录
      const updateSql = `
        UPDATE workflow_node_usage SET
          usage_count = usage_count + ?,
          total_time_spent = total_time_spent + ?,
          avg_response_time = (avg_response_time * usage_count + ?) / (usage_count + ?),
          success_count = success_count + ?,
          failure_count = failure_count + ?,
          total_characters = total_characters + ?,
          avg_characters = (avg_characters * usage_count + ?) / (usage_count + ?),
          content_quality_score = (content_quality_score * usage_count + ?) / (usage_count + ?),
          likes_count = likes_count + ?,
          dislikes_count = dislikes_count + ?,
          regenerations_count = regenerations_count + ?,
          adoptions_count = adoptions_count + ?,
          edits_count = edits_count + ?,
          last_used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE node_id = ? AND session_id = ?
      `;

      const updateParams = [
        data.usage_count || 1,
        data.total_time_spent || 0,
        data.avg_response_time || 0, data.usage_count || 1,
        data.success_count || 0,
        data.failure_count || 0,
        data.total_characters || 0,
        data.avg_characters || 0, data.usage_count || 1,
        data.content_quality_score || 0, data.usage_count || 1,
        data.likes_count || 0,
        data.dislikes_count || 0,
        data.regenerations_count || 0,
        data.adoptions_count || 0,
        data.edits_count || 0,
        data.node_id,
        data.session_id
      ];

      await this.db.query(updateSql, updateParams);
    } else {
      // 如果不存在，则插入新记录
      const insertSql = `
        INSERT INTO workflow_node_usage (
          node_id, node_name, node_type, session_id, user_id,
          usage_count, total_time_spent, avg_response_time, success_count, failure_count,
          total_characters, avg_characters, content_quality_score,
          likes_count, dislikes_count, regenerations_count, adoptions_count, edits_count,
          is_workflow_mode, is_standalone_mode, previous_node_id, next_node_id,
          last_used_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const insertParams = [
        data.node_id, data.node_name, data.node_type, data.session_id, data.user_id,
        data.usage_count || 1, data.total_time_spent || 0, data.avg_response_time || 0,
        data.success_count || 0, data.failure_count || 0,
        data.total_characters || 0, data.avg_characters || 0, data.content_quality_score || 0,
        data.likes_count || 0, data.dislikes_count || 0, data.regenerations_count || 0,
        data.adoptions_count || 0, data.edits_count || 0,
        data.is_workflow_mode || false, data.is_standalone_mode || false,
        data.previous_node_id, data.next_node_id
      ];

      await this.db.query(insertSql, insertParams);
    }

    return await this.getWorkflowNodeUsageByNodeAndSession(data.node_id, data.session_id) as WorkflowNodeUsage;
  }

  /**
   * 根据节点ID和会话ID获取使用统计
   */
  async getWorkflowNodeUsageByNodeAndSession(nodeId: string, sessionId: string): Promise<WorkflowNodeUsage | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_node_usage WHERE node_id = ? AND session_id = ?';
    const result = await this.db.query(sql, [nodeId, sessionId]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.length > 0 ? rows[0] as WorkflowNodeUsage : null;
  }

  /**
   * 获取所有工作流节点使用统计
   */
  async getAllWorkflowNodeUsage(): Promise<WorkflowNodeUsage[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_node_usage ORDER BY created_at DESC';
    const result = await this.db.query(sql);
    return Array.isArray(result) ? result : result.rows || [];
  }

  // ==============================================
  // AI问答评价相关方法
  // ==============================================

  /**
   * 创建AI问答评价记录
   */
  async createAIQAFeedback(data: CreateAIQAFeedbackDTO): Promise<AIQAFeedback> {
    await this.ensureConnection();

    const sql = `
      INSERT INTO ai_qa_feedback (
        message_id, node_id, session_id, user_id, feedback_type,
        feedback_value, feedback_comment, response_time, content_length,
        content_quality_score, query_text, response_text, context_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.message_id, data.node_id, data.session_id, data.user_id, data.feedback_type,
      data.feedback_value || 0, data.feedback_comment, data.response_time, data.content_length,
      data.content_quality_score, data.query_text, data.response_text, data.context_data
    ];

    await this.db.query(sql, params);

    return await this.getAIQAFeedbackByMessage(data.message_id) as AIQAFeedback;
  }

  /**
   * 根据消息ID获取评价记录
   */
  async getAIQAFeedbackByMessage(messageId: string): Promise<AIQAFeedback | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM ai_qa_feedback WHERE message_id = ?';
    const result = await this.db.query(sql, [messageId]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.length > 0 ? rows[0] as AIQAFeedback : null;
  }

  /**
   * 获取节点的所有评价记录
   */
  async getAIQAFeedbackByNode(nodeId: string, limit: number = 100): Promise<AIQAFeedback[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM ai_qa_feedback WHERE node_id = ? ORDER BY created_at DESC LIMIT ?';
    const result = await this.db.query(sql, [nodeId, limit]);
    return Array.isArray(result) ? result : result.rows || [];
  }

  // ==============================================
  // 工作流会话统计相关方法
  // ==============================================

  /**
   * 创建或更新工作流会话统计
   */
  async upsertWorkflowSessionStats(data: CreateWorkflowSessionStatsDTO): Promise<WorkflowSessionStats> {
    await this.ensureConnection();

    const sql = `
      INSERT INTO workflow_session_stats (
        session_id, user_id, session_start_time, session_end_time, session_duration,
        total_nodes_visited, completed_nodes, skipped_nodes, node_visit_sequence,
        node_completion_status, exit_node_id, exit_reason, exit_time,
        workflow_path, path_efficiency_score, overall_satisfaction_score, user_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        session_end_time = COALESCE(?, session_end_time),
        session_duration = COALESCE(?, session_duration),
        total_nodes_visited = COALESCE(?, total_nodes_visited),
        completed_nodes = COALESCE(?, completed_nodes),
        skipped_nodes = COALESCE(?, skipped_nodes),
        node_visit_sequence = COALESCE(?, node_visit_sequence),
        node_completion_status = COALESCE(?, node_completion_status),
        exit_node_id = COALESCE(?, exit_node_id),
        exit_reason = COALESCE(?, exit_reason),
        exit_time = COALESCE(?, exit_time),
        workflow_path = COALESCE(?, workflow_path),
        path_efficiency_score = COALESCE(?, path_efficiency_score),
        overall_satisfaction_score = COALESCE(?, overall_satisfaction_score),
        user_feedback = COALESCE(?, user_feedback),
        updated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      data.session_id, data.user_id, null, null, data.session_duration || 0,
      data.total_nodes_visited || 0, data.completed_nodes || 0, data.skipped_nodes || 0, data.node_visit_sequence,
      data.node_completion_status, data.exit_node_id, data.exit_reason, data.exit_time,
      data.workflow_path, data.path_efficiency_score || 0, data.overall_satisfaction_score, data.user_feedback,
      // 更新参数
      null, data.session_duration, data.total_nodes_visited, data.completed_nodes,
      data.skipped_nodes, data.node_visit_sequence, data.node_completion_status, data.exit_node_id,
      data.exit_reason, data.exit_time, data.workflow_path, data.path_efficiency_score,
      data.overall_satisfaction_score, data.user_feedback
    ];

    await this.db.query(sql, params);

    return await this.getWorkflowSessionStatsBySession(data.session_id) as WorkflowSessionStats;
  }

  /**
   * 根据会话ID获取会话统计
   */
  async getWorkflowSessionStatsBySession(sessionId: string): Promise<WorkflowSessionStats | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_session_stats WHERE session_id = ?';
    const result = await this.db.query(sql, [sessionId]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.length > 0 ? rows[0] as WorkflowSessionStats : null;
  }

  // ==============================================
  // 节点内容处理统计相关方法
  // ==============================================

  /**
   * 创建节点内容处理记录
   */
  async createNodeContentProcessing(data: CreateNodeContentProcessingDTO): Promise<NodeContentProcessing> {
    await this.ensureConnection();

    const sql = `
      INSERT INTO node_content_processing (
        node_id, session_id, message_id, processing_type, processing_time,
        original_content_length, final_content_length, edit_ratio, edit_count,
        edit_types, edit_duration, user_satisfaction_score, user_behavior_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.node_id, data.session_id, data.message_id, data.processing_type, data.processing_time,
      data.original_content_length, data.final_content_length, data.edit_ratio || 0, data.edit_count || 0,
      data.edit_types, data.edit_duration || 0, data.user_satisfaction_score, data.user_behavior_data
    ];

    await this.db.query(sql, params);

    const result = await this.db.query('SELECT last_insert_rowid() as id');
    const insertId = Array.isArray(result) ? result[0].id : result.id;

    return await this.getNodeContentProcessingById(insertId) as NodeContentProcessing;
  }

  /**
   * 根据ID获取节点内容处理记录
   */
  async getNodeContentProcessingById(id: number): Promise<NodeContentProcessing | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM node_content_processing WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    return rows.length > 0 ? rows[0] as NodeContentProcessing : null;
  }

  // ==============================================
  // 统计汇总相关方法
  // ==============================================

  /**
   * 获取实时统计汇总
   */
  async getWorkflowStatsSummary(date?: string, nodeId?: string): Promise<WorkflowStatsSummary[]> {
    await this.ensureConnection();

    let sql = 'SELECT * FROM workflow_stats_summary WHERE 1=1';
    const params: any[] = [];

    if (date) {
      sql += ' AND stat_date = ?';
      params.push(date);
    }

    if (nodeId) {
      sql += ' AND node_id = ?';
      params.push(nodeId);
    }

    sql += ' ORDER BY stat_date DESC, node_id';

    const result = await this.db.query(sql, params);
    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * 获取节点使用统计概览
   */
  async getNodeUsageOverview(nodeId?: string, days: number = 7): Promise<any> {
    await this.ensureConnection();

    const sql = `
      SELECT 
        node_id,
        node_name,
        node_type,
        SUM(usage_count) as total_usage,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT user_id) as total_users,
        AVG(avg_response_time) as avg_response_time,
        AVG(content_quality_score) as avg_quality_score,
        SUM(likes_count) as total_likes,
        SUM(dislikes_count) as total_dislikes,
        SUM(regenerations_count) as total_regenerations,
        SUM(adoptions_count) as total_adoptions,
        SUM(edits_count) as total_edits,
        AVG(CAST(adoptions_count AS FLOAT) / usage_count) as adoption_rate,
        AVG(CAST(edits_count AS FLOAT) / usage_count) as edit_rate
      FROM workflow_node_usage 
      WHERE created_at >= datetime('now', '-${days} days')
      ${nodeId ? 'AND node_id = ?' : ''}
      GROUP BY node_id, node_name, node_type
      ORDER BY total_usage DESC
    `;

    const params = nodeId ? [nodeId] : [];
    const result = await this.db.query(sql, params);
    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * 获取工作流完成率统计
   */
  async getWorkflowCompletionStats(days: number = 7): Promise<any> {
    await this.ensureConnection();

    const sql = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN exit_reason = 'completion' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN exit_reason = 'user_abandon' THEN 1 END) as abandoned_sessions,
        COUNT(CASE WHEN exit_reason = 'error' THEN 1 END) as error_sessions,
        AVG(session_duration) as avg_session_duration,
        AVG(CAST(completed_nodes AS FLOAT) / total_nodes_visited) as avg_completion_rate,
        AVG(overall_satisfaction_score) as avg_satisfaction_score
      FROM workflow_session_stats 
      WHERE session_start_time >= datetime('now', '-${days} days')
    `;

    const result = await this.db.query(sql);
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * 获取常见退出点统计
   */
  async getCommonExitPoints(days: number = 7): Promise<any[]> {
    await this.ensureConnection();

    const sql = `
      SELECT 
        exit_node_id,
        exit_reason,
        COUNT(*) as exit_count,
        AVG(session_duration) as avg_duration_before_exit,
        AVG(CAST(completed_nodes AS FLOAT) / total_nodes_visited) as avg_completion_rate
      FROM workflow_session_stats 
      WHERE session_start_time >= datetime('now', '-${days} days')
        AND exit_node_id IS NOT NULL
      GROUP BY exit_node_id, exit_reason
      ORDER BY exit_count DESC
    `;

    const result = await this.db.query(sql);
    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * 获取内容采纳率统计
   */
  async getContentAdoptionStats(days: number = 7): Promise<any> {
    await this.ensureConnection();

    const sql = `
      SELECT 
        node_id,
        processing_type,
        COUNT(*) as count,
        AVG(edit_ratio) as avg_edit_ratio,
        AVG(user_satisfaction_score) as avg_satisfaction_score
      FROM node_content_processing 
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY node_id, processing_type
      ORDER BY node_id, processing_type
    `;

    const result = await this.db.query(sql);
    return Array.isArray(result) ? result : result.rows || [];
  }
}
