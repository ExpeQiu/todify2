import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { FieldMappingConfig as FieldMappingConfigType } from '../types/aiSearch';
import { logger } from '@/shared/lib/logger';

export interface ConversationRecord {
  id: string;
  title: string;
  sources: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string; // JSON string
  outputs?: string; // JSON string
  created_at: string;
}

export interface OutputContentRecord {
  id: string;
  type: 'ppt' | 'script' | 'mindmap' | 'other';
  title: string;
  content: string; // JSON string
  message_id: string;
  conversation_id: string;
  created_at: string;
}

/**
 * AI问答服务
 */
export class AiSearchService {
  /**
   * 初始化数据库表
   */
  async initializeTables(): Promise<void> {
    try {
      // 创建AI问答对话表
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_search_conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          sources TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建AI问答消息表
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_search_messages (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          sources TEXT,
          outputs TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES ai_search_conversations(id) ON DELETE CASCADE
        )
      `);

      // 创建输出内容表
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_search_outputs (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('ppt', 'script', 'mindmap', 'other')),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          message_id TEXT NOT NULL,
          conversation_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES ai_search_messages(id) ON DELETE CASCADE,
          FOREIGN KEY (conversation_id) REFERENCES ai_search_conversations(id) ON DELETE CASCADE
        )
      `);

      // 创建索引
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_search_messages_conversation_id 
        ON ai_search_messages(conversation_id)
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_search_outputs_conversation_id 
        ON ai_search_outputs(conversation_id)
      `);
      
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_search_outputs_message_id 
        ON ai_search_outputs(message_id)
      `);

      // 创建字段映射配置表
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_search_field_mappings (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL UNIQUE,
          config TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      logger.error('初始化AI问答数据库表失败', { error });
      throw error;
    }
  }

  /**
   * 创建对话
   */
  async createConversation(title: string, sources: any[]): Promise<ConversationRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.query(
      `INSERT INTO ai_search_conversations (id, title, sources, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, title, JSON.stringify(sources), now, now]
    );

    return {
      id,
      title,
      sources: JSON.stringify(sources),
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * 获取对话列表
   */
  async getConversations(): Promise<ConversationRecord[]> {
    try {
      const rows = await db.query(
        `SELECT * FROM ai_search_conversations 
         ORDER BY updated_at DESC`
      ) as any[];

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        sources: row.sources,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      logger.error('获取对话列表失败', { error });
      // 如果表不存在，返回空数组
      return [];
    }
  }

  /**
   * 获取对话详情（包含消息）
   */
  async getConversation(id: string): Promise<any | null> {
    const conversationRows = await db.query(
      `SELECT * FROM ai_search_conversations WHERE id = ?`,
      [id]
    ) as any[];

    if (conversationRows.length === 0) {
      return null;
    }

    const conversation = conversationRows[0];
    const messageRows = await db.query(
      `SELECT * FROM ai_search_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC`,
      [id]
    ) as any[];

    return {
      id: conversation.id,
      title: conversation.title,
      sources: JSON.parse(conversation.sources || '[]'),
      messages: messageRows.map((row) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        sources: row.sources ? JSON.parse(row.sources) : [],
        outputs: row.outputs ? JSON.parse(row.outputs) : {},
        createdAt: new Date(row.created_at),
      })),
      createdAt: new Date(conversation.created_at),
      updatedAt: new Date(conversation.updated_at),
    };
  }

  async getMessageById(id: string): Promise<MessageRecord | null> {
    const rows = await db.query(
      `SELECT * FROM ai_search_messages WHERE id = ?`,
      [id]
    ) as any[];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    return {
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      sources: row.sources,
      outputs: row.outputs,
      created_at: row.created_at,
    };
  }

  /**
   * 发送消息
   */
  async sendMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    sources: any[] = [],
    files: any[] = [],
    outputs?: any // 输出字段（用于保存提取的工作流输出）
  ): Promise<MessageRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // 准备outputs字段（包含提取的输出字段）
    const outputsJson = outputs ? JSON.stringify(outputs) : null;
    
    await db.query(
      `INSERT INTO ai_search_messages (id, conversation_id, role, content, sources, outputs, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        conversationId,
        role,
        content,
        sources.length > 0 ? JSON.stringify(sources) : null,
        outputsJson,
        now,
      ]
    );

    // 更新对话的更新时间
    await db.query(
      `UPDATE ai_search_conversations SET updated_at = ? WHERE id = ?`,
      [now, conversationId]
    );

    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      sources: sources.length > 0 ? JSON.stringify(sources) : undefined,
      outputs: outputsJson || undefined,
      created_at: now,
    };
  }

  /**
   * 删除对话
   */
  async deleteConversation(id: string): Promise<void> {
    await db.query(`DELETE FROM ai_search_conversations WHERE id = ?`, [id]);
  }

  /**
   * 生成输出内容
   */
  async generateOutput(
    type: 'ppt' | 'script' | 'mindmap' | 'other',
    conversationId: string,
    messageId: string,
    content: string,
    title?: string
  ): Promise<OutputContentRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const outputTitle = title || `${type}_${new Date().toISOString()}`;

    await db.query(
      `INSERT INTO ai_search_outputs 
       (id, type, title, content, message_id, conversation_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, type, outputTitle, JSON.stringify(content), messageId, conversationId, now]
    );

    // 更新消息的输出字段
    const messageRows = await db.query(
      `SELECT outputs FROM ai_search_messages WHERE id = ?`,
      [messageId]
    ) as any[];

    if (messageRows.length > 0) {
      const existingOutputs = messageRows[0].outputs 
        ? JSON.parse(messageRows[0].outputs) 
        : [];
      existingOutputs.push({
        id,
        type,
        title: outputTitle,
        content,
        createdAt: new Date(now),
      });

      await db.query(
        `UPDATE ai_search_messages 
         SET outputs = ? 
         WHERE id = ?`,
        [JSON.stringify(existingOutputs), messageId]
      );
    }

    return {
      id,
      type,
      title: outputTitle,
      content: JSON.stringify(content),
      message_id: messageId,
      conversation_id: conversationId,
      created_at: now,
    };
  }

  /**
   * 获取输出内容列表
   */
  async getOutputs(conversationId?: string): Promise<OutputContentRecord[]> {
    let sql = `SELECT * FROM ai_search_outputs`;
    const params: any[] = [];

    if (conversationId) {
      sql += ` WHERE conversation_id = ?`;
      params.push(conversationId);
    }

    sql += ` ORDER BY created_at DESC`;

    try {
      const rows = await db.query(sql, params) as any[];

      return rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        message_id: row.message_id,
        conversation_id: row.conversation_id,
        created_at: row.created_at,
      }));
    } catch (error) {
      logger.error('获取输出内容列表失败', { error });
      // 如果表不存在，返回空数组
      return [];
    }
  }
}

/**
 * 字段映射配置服务
 */
export class FieldMappingService {
  /**
   * 保存字段映射配置
   */
  async saveFieldMappingConfig(workflowId: string, config: FieldMappingConfigType): Promise<void> {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      const configJson = JSON.stringify(config);

      // 检查是否已存在
      const existing = await db.query(
        `SELECT id FROM ai_search_field_mappings WHERE workflow_id = ?`,
        [workflowId]
      ) as any[];

      if (existing.length > 0) {
        // 更新
        await db.query(
          `UPDATE ai_search_field_mappings 
           SET config = ?, updated_at = ? 
           WHERE workflow_id = ?`,
          [configJson, now, workflowId]
        );
      } else {
        // 插入
        await db.query(
          `INSERT INTO ai_search_field_mappings (id, workflow_id, config, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [id, workflowId, configJson, now, now]
        );
      }
    } catch (error) {
      logger.error('保存字段映射配置失败', { error });
      throw error;
    }
  }

  /**
   * 获取字段映射配置
   */
  async getFieldMappingConfig(workflowId: string): Promise<FieldMappingConfigType | null> {
    try {
      const rows = await db.query(
        `SELECT * FROM ai_search_field_mappings WHERE workflow_id = ?`,
        [workflowId]
      ) as any[];

      if (rows.length === 0) {
        return null;
      }

      return JSON.parse(rows[0].config);
    } catch (error) {
      logger.error('获取字段映射配置失败', { error });
      return null;
    }
  }
}
