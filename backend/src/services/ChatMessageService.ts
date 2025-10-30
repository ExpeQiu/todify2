import { query } from '../config/database';
import { DifyWorkflowResponse, DifyChatResponse } from './DifyClient';

export interface ConversationRecord {
  id?: number;
  conversation_id: string;
  user_id?: string;
  session_name?: string;
  app_type: string;
  status?: 'active' | 'archived' | 'deleted';
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessageRecord {
  id?: number;
  message_id: string;
  conversation_id: string;
  task_id?: string;
  message_type: 'user' | 'assistant';
  content: string;
  query?: string;
  inputs?: string;
  app_type: string;
  dify_event?: string;
  dify_mode?: string;
  dify_answer?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  total_price?: string;
  currency?: string;
  latency?: number;
  retriever_resources?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowExecutionRecord {
  id?: number;
  workflow_run_id: string;
  task_id: string;
  message_id?: string;
  workflow_id?: string;
  app_type: string;
  status: string;
  error_message?: string;
  inputs?: string;
  outputs?: string;
  elapsed_time?: number;
  total_tokens?: number;
  total_steps?: number;
  started_at?: string;
  finished_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChatMessageService {
  /**
   * 创建或更新对话会话
   */
  static async upsertConversation(conversation: ConversationRecord): Promise<ConversationRecord> {
    const existingConversation = await this.getConversationById(conversation.conversation_id);
    
    if (existingConversation) {
      // 更新现有对话
      const updateSql = `
        UPDATE conversations 
        SET session_name = ?, app_type = ?, status = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ?
      `;
      await query(updateSql, [
        conversation.session_name,
        conversation.app_type,
        conversation.status || 'active',
        conversation.metadata,
        conversation.conversation_id
      ]);
      return await this.getConversationById(conversation.conversation_id) as ConversationRecord;
    } else {
      // 创建新对话
      const insertSql = `
        INSERT INTO conversations (conversation_id, user_id, session_name, app_type, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(insertSql, [
        conversation.conversation_id,
        conversation.user_id,
        conversation.session_name,
        conversation.app_type,
        conversation.status || 'active',
        conversation.metadata
      ]);
      return await this.getConversationById(conversation.conversation_id) as ConversationRecord;
    }
  }

  /**
   * 根据conversation_id获取对话
   */
  static async getConversationById(conversationId: string): Promise<ConversationRecord | null> {
    const sql = 'SELECT * FROM conversations WHERE conversation_id = ?';
    const rows = await query(sql, [conversationId]) as ConversationRecord[];
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 保存聊天消息
   */
  static async saveChatMessage(message: ChatMessageRecord): Promise<ChatMessageRecord> {
    const sql = `
      INSERT INTO chat_messages (
        message_id, conversation_id, task_id, message_type, content, query, inputs, app_type,
        dify_event, dify_mode, dify_answer, prompt_tokens, completion_tokens, total_tokens,
        total_price, currency, latency, retriever_resources, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      message.message_id,
      message.conversation_id,
      message.task_id,
      message.message_type,
      message.content,
      message.query,
      message.inputs,
      message.app_type,
      message.dify_event,
      message.dify_mode,
      message.dify_answer,
      message.prompt_tokens || 0,
      message.completion_tokens || 0,
      message.total_tokens || 0,
      message.total_price,
      message.currency || 'USD',
      message.latency || 0,
      message.retriever_resources,
      message.status || 'completed',
      message.error_message
    ]);

    return await this.getChatMessageById(message.message_id) as ChatMessageRecord;
  }

  /**
   * 根据message_id获取聊天消息
   */
  static async getChatMessageById(messageId: string): Promise<ChatMessageRecord | null> {
    const sql = 'SELECT * FROM chat_messages WHERE message_id = ?';
    const rows = await query(sql, [messageId]) as ChatMessageRecord[];
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 保存工作流执行记录
   */
  static async saveWorkflowExecution(execution: WorkflowExecutionRecord): Promise<WorkflowExecutionRecord> {
    const sql = `
      INSERT INTO workflow_executions (
        workflow_run_id, task_id, message_id, workflow_id, app_type, status, error_message,
        inputs, outputs, elapsed_time, total_tokens, total_steps, started_at, finished_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      execution.workflow_run_id,
      execution.task_id,
      execution.message_id,
      execution.workflow_id,
      execution.app_type,
      execution.status,
      execution.error_message,
      execution.inputs,
      execution.outputs,
      execution.elapsed_time || 0,
      execution.total_tokens || 0,
      execution.total_steps || 0,
      execution.started_at,
      execution.finished_at
    ]);

    return await this.getWorkflowExecutionById(execution.workflow_run_id) as WorkflowExecutionRecord;
  }

  /**
   * 根据workflow_run_id获取工作流执行记录
   */
  static async getWorkflowExecutionById(workflowRunId: string): Promise<WorkflowExecutionRecord | null> {
    const sql = 'SELECT * FROM workflow_executions WHERE workflow_run_id = ?';
    const rows = await query(sql, [workflowRunId]) as WorkflowExecutionRecord[];
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 保存Dify聊天响应到数据库
   */
  static async saveDifyChatResponse(
    response: DifyChatResponse,
    userQuery: string,
    appType: string,
    inputs?: Record<string, unknown>
  ): Promise<{ conversation: ConversationRecord; userMessage: ChatMessageRecord; assistantMessage: ChatMessageRecord }> {
    // 1. 创建或更新对话会话
    const conversation = await this.upsertConversation({
      conversation_id: response.conversation_id,
      app_type: appType,
      session_name: userQuery.substring(0, 50) + (userQuery.length > 50 ? '...' : ''),
      status: 'active'
    });

    // 2. 保存用户消息
    const userMessage = await this.saveChatMessage({
      message_id: `user_${response.id}_${Date.now()}`,
      conversation_id: response.conversation_id,
      task_id: response.task_id,
      message_type: 'user',
      content: userQuery,
      query: userQuery,
      inputs: inputs ? JSON.stringify(inputs) : undefined,
      app_type: appType,
      status: 'completed'
    });

    // 3. 保存AI助手消息
    const assistantMessage = await this.saveChatMessage({
      message_id: response.id,
      conversation_id: response.conversation_id,
      task_id: response.task_id,
      message_type: 'assistant',
      content: response.answer,
      app_type: appType,
      dify_event: response.event,
      dify_mode: response.mode,
      dify_answer: response.answer,
      prompt_tokens: response.metadata?.usage?.prompt_tokens,
      completion_tokens: response.metadata?.usage?.completion_tokens,
      total_tokens: response.metadata?.usage?.total_tokens,
      total_price: response.metadata?.usage?.total_price,
      currency: response.metadata?.usage?.currency,
      latency: response.metadata?.usage?.latency,
      retriever_resources: response.metadata?.retriever_resources ? JSON.stringify(response.metadata.retriever_resources) : undefined,
      status: 'completed'
    });

    return { conversation, userMessage, assistantMessage };
  }

  /**
   * 保存Dify工作流响应到数据库
   */
  static async saveDifyWorkflowResponse(
    response: DifyWorkflowResponse,
    userQuery: string,
    appType: string,
    inputs?: Record<string, unknown>,
    existingConversationId?: string
  ): Promise<{ conversation: ConversationRecord; workflowExecution: WorkflowExecutionRecord }> {
    // 使用传入的conversation_id或生成新的对话ID
    const conversationId = existingConversationId || response.workflow_run_id;
    
    // 创建或更新对话记录
    const conversation = await this.upsertConversation({
      conversation_id: conversationId,
      session_name: userQuery || `${appType}工作流`,
      app_type: existingConversationId ? 'ai-search' : appType, // 如果是关联的工作流，保持原始类型
      status: 'active',
      metadata: inputs ? JSON.stringify(inputs) : undefined
    });

    // 保存工作流执行记录
    const workflowExecution = await this.saveWorkflowExecution({
      workflow_run_id: response.workflow_run_id,
      task_id: response.task_id,
      workflow_id: response.data?.workflow_id,
      app_type: appType,
      status: response.data?.status || 'completed',
      error_message: response.data?.error || undefined,
      inputs: inputs ? JSON.stringify(inputs) : undefined,
      outputs: response.data?.outputs ? JSON.stringify(response.data.outputs) : undefined,
      elapsed_time: response.data?.elapsed_time,
      total_tokens: response.data?.total_tokens,
      total_steps: response.data?.total_steps,
      started_at: response.data?.created_at ? new Date(response.data.created_at * 1000).toISOString() : undefined,
      finished_at: response.data?.finished_at ? new Date(response.data.finished_at * 1000).toISOString() : undefined
    });

    return { conversation, workflowExecution };
  }

  /**
   * 获取对话历史消息
   */
  static async getConversationMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ChatMessageRecord[]> {
    const sql = `
      SELECT * FROM chat_messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC 
      LIMIT ? OFFSET ?
    `;
    const rows = await query(sql, [conversationId, limit, offset]);
    return rows as ChatMessageRecord[];
  }

  /**
   * 获取用户的对话列表
   */
  static async getUserConversations(userId?: string, appType?: string, limit: number = 20, offset: number = 0): Promise<ConversationRecord[]> {
    let sql = 'SELECT * FROM conversations WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }

    if (appType) {
      sql += ' AND app_type = ?';
      params.push(appType);
    }

    sql += ' AND status != ? ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push('deleted', limit, offset);

    const rows = await query(sql, params);
    return rows as ConversationRecord[];
  }

  /**
   * 记录知识点使用情况
   */
  static async logKnowledgeUsage(
    messageId: string,
    knowledgePointIds: number[],
    contextSummary?: Record<string, unknown>
  ): Promise<void> {
    const sql = `
      INSERT INTO knowledge_usage_logs (message_id, knowledge_point_ids, context_summary, context_length)
      VALUES (?, ?, ?, ?)
    `;
    
    await query(sql, [
      messageId,
      JSON.stringify(knowledgePointIds),
      contextSummary ? JSON.stringify(contextSummary) : null,
      contextSummary ? JSON.stringify(contextSummary).length : 0
    ]);
  }
}