import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * 反思循环配置
 */
export interface ReflectionLoopConfig {
  enabled: boolean;
  maxIterations: number;           // 最大迭代次数（默认3）
  qualityThreshold: number;        // 质量阈值 0-1（默认0.7）
  evaluatorRoleId?: string;         // 评审Agent ID（可选，默认使用第一个参与者）
  reflectorRoleId?: string;         // 反思Agent ID（可选，默认使用第一个参与者）
  reflectionFrequency: number;     // 每N轮进行一次反思（默认每3轮）
}

/**
 * 结构化上下文配置
 */
export interface StructuredContextConfig {
  enabled: boolean;
  summaryFrequency: number;        // 每N轮生成一次摘要（默认每3轮）
  summarizerRoleId?: string;        // 摘要Agent ID（可选）
  extractKeyPoints: boolean;        // 是否提取关键观点
  detectDisagreements: boolean;      // 是否检测分歧点
  maxContextTokens: number;         // 最大上下文Token数（默认8000）
}

/**
 * 共识检测配置
 */
export interface ConsensusDetectionConfig {
  enabled: boolean;
  method: 'semantic' | 'voting' | 'hybrid'; // 检测方法
  threshold: number;                  // 共识阈值 0-1（默认0.7）
  minAgreementRatio: number;          // 最小同意比例（默认0.7）
  recentRounds: number;               // 分析最近N轮（默认3轮）
  analyzerRoleId?: string;             // 分析Agent ID（可选）
}

/**
 * 辩论模式配置
 */
export interface DebateConfig {
  enabled: boolean;
  proRoleIds: string[];              // 正方Agent ID列表
  conRoleIds: string[];               // 反方Agent ID列表
  judgeRoleId?: string;                // 裁判Agent ID（可选）
  rounds: number;                      // 辩论轮次（默认3轮）
  judgeAfterRounds?: number;          // 每N轮进行一次评判（默认每轮结束后）
}

/**
 * 头脑风暴会话配置
 */
export interface BrainstormSessionConfig {
  stopConditions: {
    manualStop: boolean;
    maxRounds: number | null;
    consensusDetection: boolean;
    consensusConfig?: ConsensusDetectionConfig; // 共识检测详细配置
  };
  discussionMode: 'parallel' | 'round-robin' | 'debate';
  // 辩论模式配置
  debateConfig?: DebateConfig;
  moderatorConfig?: {
    enabled: boolean;
    moderatorRoleId?: string; // 主持人角色ID
  };
  summaryConfig: {
    enabled: boolean;
    provider: 'same-as-agents' | 'custom';
  };
  // 新增：反思循环配置
  reflectionLoop?: ReflectionLoopConfig;
  // 新增：结构化上下文配置
  structuredContext?: StructuredContextConfig;
}

/**
 * 头脑风暴会话数据库记录
 */
export interface BrainstormSession {
  id: string;
  title: string;
  topic: string;
  description?: string;
  creator_id?: string;
  project_id?: string;
  status: 'draft' | 'active' | 'completed' | 'stopped';
  config: string; // JSON字符串
  summary?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

/**
 * 头脑风暴会话DTO（前端格式）
 */
export interface BrainstormSessionDTO {
  id: string;
  title: string;
  topic: string;
  description?: string;
  creatorId?: string;
  projectId?: number;
  status: 'draft' | 'active' | 'completed' | 'stopped';
  config: BrainstormSessionConfig;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  participants?: BrainstormParticipantDTO[];
  messageCount?: number;
}

/**
 * 创建头脑风暴会话DTO
 */
export interface CreateBrainstormSessionDTO {
  id?: string; // 可选ID，如果不提供则自动生成
  title: string;
  topic: string;
  description?: string;
  creatorId?: string;
  projectId?: number;
  config?: Partial<BrainstormSessionConfig>;
  participantRoleIds: string[]; // AI角色ID列表
}

/**
 * 更新头脑风暴会话DTO
 */
export interface UpdateBrainstormSessionDTO {
  title?: string;
  topic?: string;
  description?: string;
  config?: Partial<BrainstormSessionConfig>;
  status?: 'draft' | 'active' | 'completed' | 'stopped';
  summary?: string;
}

/**
 * 参与者数据库记录
 */
export interface BrainstormParticipant {
  id: number;
  session_id: string;
  ai_role_id: string;
  display_name?: string;
  role_type?: string;
  sort_order: number;
  created_at?: string;
}

/**
 * 参与者DTO
 */
export interface BrainstormParticipantDTO {
  id: number;
  sessionId: string;
  aiRoleId: string;
  displayName?: string;
  roleType?: string;
  sortOrder: number;
  createdAt: Date;
  aiRole?: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
}

/**
 * 添加参与者DTO
 */
export interface AddParticipantDTO {
  aiRoleId: string;
  displayName?: string;
  roleType?: string;
  sortOrder?: number;
}

/**
 * 讨论消息数据库记录
 */
export interface BrainstormMessage {
  id: string;
  session_id: string;
  participant_id: number | null; // null 表示用户消息
  round_number: number;
  content: string;
  reply_to_id?: string;
  metadata?: string; // JSON字符串
  message_type?: 'agent' | 'user'; // 消息类型
  created_at?: string;
}

/**
 * 结构化上下文（用于高效传递历史信息）
 */
export interface StructuredContext {
  summary: string;                  // 压缩摘要
  keyPoints: Array<{                // 关键观点列表
    participantId: string;
    participantName: string;
    point: string;
    confidence?: number;
    supportingEvidence?: string[];
    roundNumber: number;
  }>;
  disagreements?: Array<{           // 当前分歧点
    topic: string;
    positions: Record<string, string>; // participantId -> position
  }>;
  consensus?: string[];              // 已达成共识
  lastSummaryRound: number;          // 上次摘要的轮次
  tokenEstimate: number;             // Token估算
}

/**
 * 评审结果
 */
export interface EvaluationResult {
  score: number;                     // 质量评分 0-1
  feedback: string;                  // 评审反馈
  strengths: string[];               // 优点
  weaknesses: string[];              // 不足
  suggestions: string[];             // 改进建议
}

/**
 * 反思结果
 */
export interface ReflectionResult {
  analysis: string;                  // 反思分析
  improvementSuggestions: Array<{    // 改进建议
    targetParticipantId?: string;    // 针对的参与者（可选）
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nextRoundFocus: string;            // 下一轮讨论重点
}

/**
 * 讨论消息DTO
 */
export interface BrainstormMessageDTO {
  id: string;
  sessionId: string;
  participantId: number | null; // null 表示用户消息
  roundNumber: number;
  content: string;
  replyToId?: string;
  messageType?: 'agent' | 'user' | 'evaluation' | 'reflection' | 'summary';
  metadata?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
    finishReason?: string;
    userId?: string; // 用户ID（如果是用户消息）
    evaluationScore?: number; // 评审分数
    reflectionIteration?: number; // 反思迭代次数
    debateSide?: 'pro' | 'con';
  };
  createdAt: Date;
  participant?: BrainstormParticipantDTO;
}

// ==================== 模型类 ====================

/**
 * 头脑风暴会话模型
 */
export class BrainstormSessionModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    
    // 读取 SQL 文件并执行
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../../scripts/create-brainstorm-tables.sql');
    
    try {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      // 按分号分割 SQL 语句
      const statements = sql
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await this.db.query(statement);
        } catch (error: any) {
          // 忽略"表已存在"等错误
          if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
            console.warn('执行 SQL 语句时出现警告:', error.message);
          }
        }
      }
    } catch (error: any) {
      // 如果文件不存在，使用内联 SQL
      if (error.code === 'ENOENT') {
        await this.initializeTableInline();
      } else {
        throw error;
      }
    }
  }

  /**
   * 内联初始化表（当 SQL 文件不存在时使用）
   */
  private async initializeTableInline(): Promise<void> {
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS brainstorm_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        description TEXT,
        creator_id TEXT,
        project_id INTEGER,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'stopped')),
        config TEXT,
        summary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS brainstorm_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        ai_role_id TEXT NOT NULL,
        display_name TEXT,
        role_type TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS brainstorm_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        participant_id INTEGER NOT NULL,
        round_number INTEGER NOT NULL DEFAULT 1,
        content TEXT NOT NULL,
        reply_to_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES brainstorm_participants(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_id) REFERENCES brainstorm_messages(id) ON DELETE SET NULL
      );
    `;

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_status ON brainstorm_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_created_at ON brainstorm_sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_creator_id ON brainstorm_sessions(creator_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_project_id ON brainstorm_sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_session_id ON brainstorm_participants(session_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_ai_role_id ON brainstorm_participants(ai_role_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_participants_sort_order ON brainstorm_participants(sort_order);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_session_id ON brainstorm_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_participant_id ON brainstorm_messages(participant_id);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_round_number ON brainstorm_messages(round_number);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_created_at ON brainstorm_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_brainstorm_messages_reply_to_id ON brainstorm_messages(reply_to_id);
    `;

    try {
      // 执行创建表语句
      const tableStatements = createTablesSQL.split(';').filter(s => s.trim().length > 0);
      for (const statement of tableStatements) {
        try {
          await this.db.query(statement);
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            console.warn('创建表时出现警告:', error.message);
          }
        }
      }

      // 执行创建索引语句
      const indexStatements = createIndexesSQL.split(';').filter(s => s.trim().length > 0);
      for (const statement of indexStatements) {
        try {
          await this.db.query(statement);
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            console.warn('创建索引时出现警告:', error.message);
          }
        }
      }

      // 迁移：添加 project_id 字段（如果不存在）
      await this.migrateAddProjectId();
    } catch (error: any) {
      console.warn('初始化头脑风暴表时出现警告:', error.message);
    }
  }

  /**
   * 迁移：添加 project_id 字段
   */
  private async migrateAddProjectId(): Promise<void> {
    try {
      const dbType = this.db.getType();
      
      // 检查字段是否已存在
      let columnExists = false;
      if (dbType === 'sqlite') {
        const tableInfo = await this.db.query('PRAGMA table_info(brainstorm_sessions)');
        const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
        columnExists = columns.some((col: any) => col.name === 'project_id');
      } else {
        const checkResult = await this.db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'brainstorm_sessions' 
            AND column_name = 'project_id'
          )
        `);
        columnExists = checkResult[0]?.exists === true;
      }

      if (!columnExists) {
        if (dbType === 'sqlite') {
          await this.db.query('ALTER TABLE brainstorm_sessions ADD COLUMN project_id INTEGER');
        } else {
          await this.db.query('ALTER TABLE brainstorm_sessions ADD COLUMN IF NOT EXISTS project_id INTEGER');
        }
        
        // 创建索引
        await this.db.query('CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_project_id ON brainstorm_sessions(project_id)');
        console.log('✅ 已添加 project_id 字段到 brainstorm_sessions 表');
      }
    } catch (error: any) {
      // 忽略字段已存在的错误
      if (!error.message?.includes('duplicate column') && !error.message?.includes('already exists')) {
        console.warn('添加 project_id 字段时出现警告:', error.message);
      }
    }
  }


  /**
   * 创建会话
   */
  async create(data: CreateBrainstormSessionDTO): Promise<BrainstormSessionDTO> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();
    
    const defaultConfig: BrainstormSessionConfig = {
      stopConditions: {
        manualStop: true,
        maxRounds: 5,
        consensusDetection: false,
        consensusConfig: {
          enabled: false,
          method: 'hybrid',
          threshold: 0.7,
          minAgreementRatio: 0.7,
          recentRounds: 3,
        },
      },
      discussionMode: 'parallel',
      summaryConfig: {
        enabled: true,
        provider: 'same-as-agents',
      },
      reflectionLoop: {
        enabled: false,
        maxIterations: 3,
        qualityThreshold: 0.7,
        reflectionFrequency: 3,
      },
      structuredContext: {
        enabled: true,
        summaryFrequency: 3,
        extractKeyPoints: true,
        detectDisagreements: true,
        maxContextTokens: 8000,
      },
      debateConfig: {
        enabled: false,
        proRoleIds: [],
        conRoleIds: [],
        rounds: 3,
      },
    };

    const config = { ...defaultConfig, ...data.config };
    
    const sql = `
      INSERT INTO brainstorm_sessions 
      (id, title, topic, description, creator_id, project_id, status, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `;
    
    await this.db.query(sql, [
      id,
      data.title,
      data.topic,
      data.description || null,
      data.creatorId || null,
      data.projectId || null,
      JSON.stringify(config),
      now,
      now,
    ]);

    // 添加参与者
    if (data.participantRoleIds.length > 0) {
      const participantModel = new BrainstormParticipantModel(this.db);
      for (let i = 0; i < data.participantRoleIds.length; i++) {
        await participantModel.create({
          sessionId: id,
          aiRoleId: data.participantRoleIds[i],
          sortOrder: i,
        });
      }
    }

    return this.getById(id);
  }

  /**
   * 根据ID获取会话
   */
  async getById(id: string): Promise<BrainstormSessionDTO> {
    const sql = `
      SELECT * FROM brainstorm_sessions WHERE id = ?
    `;
    const rows = await this.db.query(sql, [id]);
    
    if (rows.length === 0) {
      throw new Error(`会话不存在: ${id}`);
    }

    return this.toDTO(rows[0]);
  }

  /**
   * 获取会话列表
   */
  async list(options: {
    creatorId?: string;
    projectId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<BrainstormSessionDTO[]> {
    let sql = 'SELECT * FROM brainstorm_sessions WHERE 1=1';
    const params: any[] = [];

    if (options.creatorId) {
      sql += ' AND creator_id = ?';
      params.push(options.creatorId);
    }

    if (options.projectId !== undefined) {
      sql += ' AND project_id = ?';
      params.push(options.projectId);
    }

    if (options.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = await this.db.query(sql, params);
    return rows.map((row: any) => this.toDTO(row));
  }

  /**
   * 更新会话
   */
  async update(id: string, data: UpdateBrainstormSessionDTO): Promise<BrainstormSessionDTO> {
    const existing = await this.getById(id);
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }

    if (data.topic !== undefined) {
      updates.push('topic = ?');
      params.push(data.topic);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
      
      if (data.status === 'completed' || data.status === 'stopped') {
        updates.push('completed_at = ?');
        params.push(new Date().toISOString());
      }
    }

    if (data.config !== undefined) {
      const currentConfig = existing.config;
      const mergedConfig = { ...currentConfig, ...data.config };
      updates.push('config = ?');
      params.push(JSON.stringify(mergedConfig));
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `UPDATE brainstorm_sessions SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.query(sql, params);

    return this.getById(id);
  }

  /**
   * 更新总结
   */
  async updateSummary(id: string, summary: string): Promise<void> {
    const sql = `
      UPDATE brainstorm_sessions 
      SET summary = ?, updated_at = ?
      WHERE id = ?
    `;
    await this.db.query(sql, [summary, new Date().toISOString(), id]);
  }

  /**
   * 删除会话
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM brainstorm_sessions WHERE id = ?';
    await this.db.query(sql, [id]);
  }

  /**
   * 转换为DTO
   */
  private toDTO(row: BrainstormSession): BrainstormSessionDTO {
    let config: BrainstormSessionConfig;
    try {
      config = JSON.parse(row.config || '{}');
    } catch {
      config = {
        stopConditions: {
          manualStop: true,
          maxRounds: 5,
          consensusDetection: false,
          consensusConfig: {
            enabled: false,
            method: 'hybrid',
            threshold: 0.7,
            minAgreementRatio: 0.7,
            recentRounds: 3,
          },
        },
        discussionMode: 'parallel',
        summaryConfig: {
          enabled: true,
          provider: 'same-as-agents',
        },
        reflectionLoop: {
          enabled: false,
          maxIterations: 3,
          qualityThreshold: 0.7,
          reflectionFrequency: 3,
        },
        structuredContext: {
          enabled: true,
          summaryFrequency: 3,
          extractKeyPoints: true,
          detectDisagreements: true,
          maxContextTokens: 8000,
        },
        debateConfig: {
          enabled: false,
          proRoleIds: [],
          conRoleIds: [],
          rounds: 3,
        },
      };
    }

    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      description: row.description,
      creatorId: row.creator_id,
      projectId: row.project_id ? parseInt(row.project_id, 10) : undefined,
      status: row.status,
      config,
      summary: row.summary,
      createdAt: new Date(row.created_at || Date.now()),
      updatedAt: new Date(row.updated_at || Date.now()),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 参与者模型
 */
export class BrainstormParticipantModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建参与者
   */
  async create(data: {
    sessionId: string;
    aiRoleId: string;
    displayName?: string;
    roleType?: string;
    sortOrder?: number;
  }): Promise<BrainstormParticipantDTO> {
    const sql = `
      INSERT INTO brainstorm_participants 
      (session_id, ai_role_id, display_name, role_type, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await this.db.query(sql, [
      data.sessionId,
      data.aiRoleId,
      data.displayName || null,
      data.roleType || null,
      data.sortOrder ?? 0,
      new Date().toISOString(),
    ]);

    const id = result.lastID || result.insertId;
    return this.getById(id);
  }

  /**
   * 根据ID获取参与者
   */
  async getById(id: number): Promise<BrainstormParticipantDTO> {
    const sql = 'SELECT * FROM brainstorm_participants WHERE id = ?';
    const rows = await this.db.query(sql, [id]);
    
    if (rows.length === 0) {
      throw new Error(`参与者不存在: ${id}`);
    }

    return this.toDTO(rows[0]);
  }

  /**
   * 获取会话的所有参与者
   */
  async getBySessionId(sessionId: string): Promise<BrainstormParticipantDTO[]> {
    const sql = `
      SELECT p.*, r.name as ai_role_name, r.description as ai_role_description, r.avatar as ai_role_avatar
      FROM brainstorm_participants p
      LEFT JOIN ai_roles r ON p.ai_role_id = r.id
      WHERE p.session_id = ?
      ORDER BY p.sort_order ASC, p.created_at ASC
    `;
    const rows = await this.db.query(sql, [sessionId]);
    return rows.map((row: any) => this.toDTOWithRole(row));
  }

  /**
   * 删除参与者
   */
  async delete(id: number): Promise<void> {
    const sql = 'DELETE FROM brainstorm_participants WHERE id = ?';
    await this.db.query(sql, [id]);
  }

  /**
   * 删除会话的所有参与者
   */
  async deleteBySessionId(sessionId: string): Promise<void> {
    const sql = 'DELETE FROM brainstorm_participants WHERE session_id = ?';
    await this.db.query(sql, [sessionId]);
  }

  /**
   * 转换为DTO
   */
  private toDTO(row: BrainstormParticipant): BrainstormParticipantDTO {
    return {
      id: row.id,
      sessionId: row.session_id,
      aiRoleId: row.ai_role_id,
      displayName: row.display_name,
      roleType: row.role_type,
      sortOrder: row.sort_order,
      createdAt: new Date(row.created_at || Date.now()),
    };
  }

  /**
   * 转换为DTO（包含角色信息）
   */
  private toDTOWithRole(row: any): BrainstormParticipantDTO {
    const dto = this.toDTO(row);
    if (row.ai_role_name) {
      dto.aiRole = {
        id: row.ai_role_id,
        name: row.ai_role_name,
        description: row.ai_role_description || '',
        avatar: row.ai_role_avatar,
      };
    }
    return dto;
  }
}

/**
 * 讨论消息模型
 */
export class BrainstormMessageModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 创建消息
   */
  async create(data: {
    sessionId: string;
    participantId: number | null; // null 表示用户消息
    roundNumber: number;
    content: string;
    replyToId?: string;
    messageType?: 'agent' | 'user' | 'evaluation' | 'reflection' | 'summary';
    metadata?: any;
  }): Promise<BrainstormMessageDTO> {
    const id = this.generateId();
    const sql = `
      INSERT INTO brainstorm_messages 
      (id, session_id, participant_id, round_number, content, reply_to_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.query(sql, [
      id,
      data.sessionId,
      data.participantId,
      data.roundNumber,
      data.content,
      data.replyToId || null,
      data.metadata ? JSON.stringify({ ...data.metadata, messageType: data.messageType || 'agent' }) : JSON.stringify({ messageType: data.messageType || 'agent' }),
      new Date().toISOString(),
    ]);

    return this.getById(id);
  }

  /**
   * 批量创建消息（带事务保护）
   */
  async createBatch(messages: Array<{
    sessionId: string;
    participantId: number | null;
    roundNumber: number;
    content: string;
    replyToId?: string;
    messageType?: 'agent' | 'user' | 'evaluation' | 'reflection' | 'summary';
    metadata?: any;
  }>): Promise<BrainstormMessageDTO[]> {
    const results: BrainstormMessageDTO[] = [];
    // 使用顺序创建确保数据一致性（SQLite 不支持真正的批量插入事务）
    for (const msg of messages) {
      try {
        const result = await this.create(msg);
        results.push(result);
      } catch (error) {
        console.error('批量创建消息失败:', error);
        // 继续处理其他消息，不中断整个批次
      }
    }
    return results;
  }

  /**
   * 根据ID获取消息
   */
  async getById(id: string): Promise<BrainstormMessageDTO> {
    const sql = `
      SELECT m.*, p.ai_role_id, p.display_name, p.role_type
      FROM brainstorm_messages m
      LEFT JOIN brainstorm_participants p ON m.participant_id = p.id
      WHERE m.id = ?
    `;
    const rows = await this.db.query(sql, [id]);
    
    if (rows.length === 0) {
      throw new Error(`消息不存在: ${id}`);
    }

    return this.toDTO(rows[0]);
  }

  /**
   * 获取会话的所有消息
   */
  async getBySessionId(
    sessionId: string,
    options: {
      roundNumber?: number;
      afterMessageId?: string;
      limit?: number;
    } = {}
  ): Promise<BrainstormMessageDTO[]> {
    let sql = `
      SELECT m.*, p.ai_role_id, p.display_name, p.role_type
      FROM brainstorm_messages m
      LEFT JOIN brainstorm_participants p ON m.participant_id = p.id
      WHERE m.session_id = ?
    `;
    const params: any[] = [sessionId];

    if (options.roundNumber !== undefined) {
      sql += ' AND m.round_number = ?';
      params.push(options.roundNumber);
    }

    if (options.afterMessageId) {
      sql += ' AND m.created_at > (SELECT created_at FROM brainstorm_messages WHERE id = ?)';
      params.push(options.afterMessageId);
    }

    sql += ' ORDER BY m.round_number ASC, m.created_at ASC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = await this.db.query(sql, params);
    return rows.map((row: any) => this.toDTO(row));
  }

  /**
   * 获取会话的最大轮次
   */
  async getMaxRoundNumber(sessionId: string): Promise<number> {
    const sql = `
      SELECT MAX(round_number) as max_round
      FROM brainstorm_messages
      WHERE session_id = ?
    `;
    const rows = await this.db.query(sql, [sessionId]);
    return rows[0]?.max_round || 0;
  }

  /**
   * 转换为DTO
   */
  private toDTO(row: any): BrainstormMessageDTO {
    let metadata: any = undefined;
    if (row.metadata) {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        // 忽略解析错误
      }
    }

    const dto: BrainstormMessageDTO = {
      id: row.id,
      sessionId: row.session_id,
      participantId: row.participant_id,
      roundNumber: row.round_number,
      content: row.content,
      replyToId: row.reply_to_id,
      messageType: metadata?.messageType || (row.participant_id ? 'agent' : 'user'),
      metadata,
      createdAt: new Date(row.created_at || Date.now()),
    };

    // 只有 Agent 消息才有 participant 信息
    if (row.ai_role_id && row.participant_id) {
      dto.participant = {
        id: row.participant_id,
        sessionId: row.session_id,
        aiRoleId: row.ai_role_id,
        displayName: row.display_name,
        roleType: row.role_type,
        sortOrder: 0,
        createdAt: new Date(row.created_at || Date.now()),
        aiRole: {
          id: row.ai_role_id,
          name: row.display_name || '未知',
          description: '',
        },
      };
    }

    return dto;
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

