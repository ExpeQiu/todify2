import { db } from '../config/database';

/**
 * ChatMessageService
 * 提供对话和消息的数据库操作服务
 */

interface ConversationData {
  conversation_id: string;
  app_type?: string;
  session_name?: string;
  status?: string;
  project_id?: number;
  user_id?: string;
  metadata?: string;
}

interface ChatMessageData {
  message_id: string;
  conversation_id: string;
  message_type: string;
  content: string;
  query?: string;
  app_type?: string;
  status?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface WorkflowResponseData {
  result: any;
  query: string;
  category: string;
  inputs?: any;
  conversationId?: string;
}

export interface ConversationRecord {
  id?: number;
  conversation_id: string;
  user_id?: string;
  session_name?: string;
  app_type: string;
  status?: string;
  project_id?: number;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChatMessageService {

  /**
   * 创建或更新对话会话
   */
  static async upsertConversation(data: ConversationData): Promise<void> {
    try {
      const sql = `
        INSERT INTO conversations (
          conversation_id, user_id, session_name, app_type, status, project_id, metadata, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(conversation_id) DO UPDATE SET
          user_id = COALESCE(excluded.user_id, user_id),
          session_name = COALESCE(excluded.session_name, session_name),
          app_type = COALESCE(excluded.app_type, app_type),
          status = COALESCE(excluded.status, status),
          project_id = COALESCE(excluded.project_id, project_id),
          metadata = COALESCE(excluded.metadata, metadata),
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await db.query(sql, [
        data.conversation_id,
        data.user_id || null,
        data.session_name || null,
        data.app_type,
        data.status || 'active',
        data.project_id || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]);
    } catch (error) {
      console.error('保存对话会话失败:', error);
      // 如果表不存在，静默失败（兼容性处理）
    }
  }

  /**
   * 保存聊天消息
   */
  static async saveChatMessage(data: ChatMessageData): Promise<void> {
    try {
      const sql = `
        INSERT INTO chat_messages (
          message_id, conversation_id, message_type, content, query, app_type, status,
          prompt_tokens, completion_tokens, total_tokens, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(message_id) DO UPDATE SET
          content = excluded.content,
          query = COALESCE(excluded.query, query),
          status = COALESCE(excluded.status, status),
          prompt_tokens = COALESCE(excluded.prompt_tokens, prompt_tokens),
          completion_tokens = COALESCE(excluded.completion_tokens, completion_tokens),
          total_tokens = COALESCE(excluded.total_tokens, total_tokens),
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await db.query(sql, [
        data.message_id,
        data.conversation_id,
        data.message_type,
        data.content,
        data.query || null,
        data.app_type,
        data.status || 'completed',
        data.prompt_tokens || 0,
        data.completion_tokens || 0,
        data.total_tokens || 0
      ]);
    } catch (error) {
      console.error('保存聊天消息失败:', error);
      // 如果表不存在，静默失败（兼容性处理）
    }
  }

  /**
   * 获取对话消息
   */
  static async getConversationMessages(
    conversationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const sql = `
        SELECT * FROM chat_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await db.query(sql, [conversationId, limit, offset]);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('获取对话消息失败:', error);
      return [];
    }
  }

  /**
   * 获取用户的对话列表
   */
  static async getUserConversations(
    userId?: string,
    appType?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ConversationRecord[]> {
    try {
      let sql = 'SELECT * FROM conversations WHERE status != ?';
      const params: any[] = ['deleted'];

      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }

      if (appType) {
        sql += ' AND app_type = ?';
        params.push(appType);
      }

      sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.query(sql, params);
      const results = Array.isArray(rows) ? rows : [];
      
      return results.map((row: any) => {
        let metadata = null;
        if (row.metadata && typeof row.metadata === 'string') {
          try {
            metadata = JSON.parse(row.metadata);
          } catch (e) {
            metadata = null;
          }
        }
        
        return {
          id: row.id,
          conversation_id: row.conversation_id,
          user_id: row.user_id,
          session_name: row.session_name,
          app_type: row.app_type,
          status: row.status,
          project_id: row.project_id,
          metadata,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      });
    } catch (error) {
      console.error('获取用户对话列表失败:', error);
      return [];
    }
  }

  /**
   * 根据项目ID获取对话列表
   */
  static async getConversationsByProjectId(
    projectId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationRecord[]> {
    try {
      const sql = `
        SELECT * FROM conversations
        WHERE project_id = ? AND status != 'deleted'
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await db.query(sql, [projectId, limit, offset]);
      const results = Array.isArray(rows) ? rows : [];
      
      return results.map((row: any) => {
        let metadata = null;
        if (row.metadata && typeof row.metadata === 'string') {
          try {
            metadata = JSON.parse(row.metadata);
          } catch (e) {
            metadata = null;
          }
        }
        
        return {
          id: row.id,
          conversation_id: row.conversation_id,
          user_id: row.user_id,
          session_name: row.session_name,
          app_type: row.app_type,
          status: row.status,
          project_id: row.project_id,
          metadata,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      });
    } catch (error) {
      console.error('获取项目对话列表失败:', error);
      return [];
    }
  }

  /**
   * 根据对话ID获取对话详情
   */
  static async getConversationById(conversationId: string): Promise<ConversationRecord | null> {
    try {
      const sql = 'SELECT * FROM conversations WHERE conversation_id = ?';
      const rows = await db.query(sql, [conversationId]);
      const result = Array.isArray(rows) ? rows[0] : rows;
      
      if (!result) return null;

      let metadata = null;
      if (result.metadata && typeof result.metadata === 'string') {
        try {
          metadata = JSON.parse(result.metadata);
        } catch (e) {
          metadata = null;
        }
      }

      return {
        id: result.id,
        conversation_id: result.conversation_id,
        user_id: result.user_id,
        session_name: result.session_name,
        app_type: result.app_type,
        status: result.status,
        project_id: result.project_id,
        metadata,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    } catch (error) {
      console.error('获取对话详情失败:', error);
      return null;
    }
  }

  /**
   * 保存 Dify 工作流响应（占位符，不实际保存）
   */
  static async saveDifyWorkflowResponse(
    result: any,
    query: string,
    category: string,
    inputs?: any,
    conversationId?: string
  ): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }

  /**
   * 保存 Dify 聊天响应（占位符，不实际保存）
   */
  static async saveDifyChatResponse(
    result: any,
    query: string,
    category: string,
    inputs?: any
  ): Promise<void> {
    // 已移除聊天功能，此方法仅用于兼容性
    return Promise.resolve();
  }
}

