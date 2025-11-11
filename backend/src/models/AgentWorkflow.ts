import { DatabaseManager } from '../config/database';

// ==================== 类型定义 ====================

/**
 * Agent工作流节点
 */
export interface AgentWorkflowNode {
  id: string;
  type: string;
  agentId: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    agentName?: string;
    inputs?: Record<string, any>;
    outputs?: string[];
  };
}

/**
 * Agent工作流连接边
 */
export interface AgentWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string; // JSON字符串
  animated?: boolean;
  label?: string;
  style?: string; // JSON字符串
}

/**
 * Agent工作流
 */
export interface AgentWorkflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: string; // JSON字符串
  edges: string; // JSON字符串
  metadata?: string; // JSON字符串
  published?: number; // 0或1，是否已发布（只有发布的工作流才能被前端页面绑定）
  created_at?: string;
  updated_at?: string;
}

/**
 * 工作流执行实例
 */
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  shared_context: string; // JSON字符串
  node_results: string; // JSON字符串
  start_time?: string;
  end_time?: string;
  duration?: number;
  error?: string; // JSON字符串
  metadata?: string; // JSON字符串
  created_at?: string;
  updated_at?: string;
}

/**
 * 工作流模板
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  workflow_structure: string; // JSON字符串
  metadata?: string; // JSON字符串
  is_public?: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * DTO接口
 */
export interface CreateAgentWorkflowDTO {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  nodes: AgentWorkflowNode[];
  edges: AgentWorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface UpdateAgentWorkflowDTO {
  name?: string;
  description?: string;
  version?: string;
  nodes?: AgentWorkflowNode[];
  edges?: AgentWorkflowEdge[];
  metadata?: Record<string, any>;
  published?: boolean;
}

export interface CreateWorkflowExecutionDTO {
  id?: string;
  workflow_id: string;
  workflow_name?: string;
  status?: string;
  shared_context?: Record<string, any>;
  node_results?: any[];
  start_time?: string;
  error?: any;
  metadata?: Record<string, any>;
}

export interface CreateWorkflowTemplateDTO {
  id?: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  workflow_structure: any;
  metadata?: Record<string, any>;
  is_public?: boolean;
}

// ==================== 模型类 ====================

/**
 * Agent工作流模型
 */
export class AgentWorkflowModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * 确保数据库连接
   */
  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库管理器未初始化');
    }
    await this.db.connect();
  }

  /**
   * 初始化数据库表
   */
  async initializeTable(): Promise<void> {
    await this.ensureConnection();
    
    // 直接执行CREATE TABLE语句（避免文件系统依赖）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS agent_workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL DEFAULT '1.0.0',
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        metadata TEXT,
        published INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTableSQL);
      
      // 尝试添加 published 字段（如果表已存在且字段不存在）
      try {
        await this.db.query('ALTER TABLE agent_workflows ADD COLUMN published INTEGER DEFAULT 0');
      } catch (error: any) {
        // 忽略字段已存在的错误
        if (!error.message?.includes('duplicate column') && !error.message?.includes('already exists')) {
          console.warn('添加 published 字段时出现警告:', error.message);
        }
      }
    } catch (error: any) {
      // 忽略"表已存在"等错误
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建agent_workflows表时出现警告:', error.message);
      }
    }
    
    // 创建工作流执行表
    const createExecutionTableSQL = `
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        workflow_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        shared_context TEXT NOT NULL DEFAULT '{}',
        node_results TEXT NOT NULL DEFAULT '[]',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        duration INTEGER,
        error TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createExecutionTableSQL);
    } catch (error: any) {
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建workflow_executions表时出现警告:', error.message);
      }
    }

    // 补充缺失字段（向后兼容旧表结构）
    const columnMigrations = [
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN workflow_name TEXT',
        name: 'workflow_name',
      },
      {
        sql: "ALTER TABLE workflow_executions ADD COLUMN shared_context TEXT NOT NULL DEFAULT '{}'",
        name: 'shared_context',
      },
      {
        sql: "ALTER TABLE workflow_executions ADD COLUMN node_results TEXT NOT NULL DEFAULT '[]'",
        name: 'node_results',
      },
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN metadata TEXT',
        name: 'metadata',
      },
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN start_time TIMESTAMP',
        name: 'start_time',
      },
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN end_time TIMESTAMP',
        name: 'end_time',
      },
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN duration INTEGER',
        name: 'duration',
      },
      {
        sql: 'ALTER TABLE workflow_executions ADD COLUMN error TEXT',
        name: 'error',
      },
    ];

    for (const migration of columnMigrations) {
      try {
        await this.db.query(migration.sql);
      } catch (error: any) {
        const message: string | undefined = error?.message;
        if (
          !message ||
          (!message.includes('duplicate column') && !message.includes('already exists'))
        ) {
          console.warn(`添加 workflow_executions.${migration.name} 字段时出现警告:`, message || error);
        }
      }
    }

    // 如果元数据为空，为现有记录填充默认值，避免解析错误
    try {
      await this.db.query(
        `UPDATE workflow_executions 
         SET shared_context = COALESCE(shared_context, '{}'),
             node_results = COALESCE(node_results, '[]'),
             status = COALESCE(status, 'pending'),
             created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
             updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)`
      );
    } catch (error: any) {
      console.warn('更新 workflow_executions 默认值时出现警告:', error?.message || error);
    }
    
    // 创建工作流模板表
    const createTemplateTableSQL = `
      CREATE TABLE IF NOT EXISTS workflow_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        thumbnail TEXT,
        workflow_structure TEXT NOT NULL,
        metadata TEXT,
        is_public INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.db.query(createTemplateTableSQL);
    } catch (error: any) {
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
        console.warn('创建workflow_templates表时出现警告:', error.message);
      }
    }
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_agent_workflows_name ON agent_workflows(name);',
      'CREATE INDEX IF NOT EXISTS idx_agent_workflows_updated ON agent_workflows(updated_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);',
      'CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);',
      'CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);',
    ];
    
    for (const indexSQL of indexes) {
      try {
        await this.db.query(indexSQL);
      } catch (error: any) {
        // 忽略索引已存在的错误
        if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
          console.warn('创建索引时出现警告:', error.message);
        }
      }
    }
  }

  /**
   * 创建Agent工作流
   */
  async create(data: CreateAgentWorkflowDTO): Promise<AgentWorkflow> {
    await this.ensureConnection();

    const id = data.id || `wf_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const version = data.version || '1.0.0';

    const sql = `
      INSERT INTO agent_workflows (
        id, name, description, version, nodes, edges, metadata, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [
      id,
      data.name,
      data.description || null,
      version,
      JSON.stringify(data.nodes),
      JSON.stringify(data.edges),
      data.metadata ? JSON.stringify(data.metadata) : null,
      (data as any).published ? 1 : 0,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as AgentWorkflow;
  }

  /**
   * 根据ID获取工作流
   */
  async getById(id: string): Promise<AgentWorkflow | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM agent_workflows WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      nodes: row.nodes,
      edges: row.edges,
      metadata: row.metadata,
      published: row.published !== undefined ? row.published : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * 获取所有工作流
   */
  async getAll(): Promise<AgentWorkflow[]> {
    try {
      await this.ensureConnection();

      // 先检查表是否存在
      const checkTableSql = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='agent_workflows'
      `;
      const tableCheck = await this.db.query(checkTableSql);
      const hasTable = Array.isArray(tableCheck) 
        ? tableCheck.length > 0 
        : (tableCheck as any)?.rows?.length > 0 || !!tableCheck;

      if (!hasTable) {
        console.warn('⚠️  agent_workflows表不存在，返回空数组');
        return [];
      }

      const sql = 'SELECT * FROM agent_workflows ORDER BY updated_at DESC';
      const result = await this.db.query(sql);
      const rows = Array.isArray(result) ? result : result.rows || [];

      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        version: row.version,
        nodes: row.nodes,
        edges: row.edges,
        metadata: row.metadata,
        published: row.published !== undefined ? row.published : 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      // 如果表不存在或查询失败，返回空数组而不是抛出错误
      console.error('⚠️  获取工作流列表失败，返回空数组:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * 更新工作流
   */
  async update(id: string, data: UpdateAgentWorkflowDTO): Promise<AgentWorkflow> {
    await this.ensureConnection();

    // 获取现有工作流
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`工作流不存在: ${id}`);
    }

    const sql = `
      UPDATE agent_workflows SET
        name = ?,
        description = ?,
        version = ?,
        nodes = ?,
        edges = ?,
        metadata = ?,
        published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      data.name ?? existing.name,
      data.description !== undefined ? data.description : existing.description,
      data.version || existing.version,
      data.nodes ? JSON.stringify(data.nodes) : existing.nodes,
      data.edges ? JSON.stringify(data.edges) : existing.edges,
      data.metadata ? JSON.stringify(data.metadata) : existing.metadata,
      data.published !== undefined ? (data.published ? 1 : 0) : (existing.published !== undefined ? existing.published : 0),
      id,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as AgentWorkflow;
  }

  /**
   * 删除工作流
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();

    const sql = 'DELETE FROM agent_workflows WHERE id = ?';
    const result: any = await this.db.query(sql, [id]);

    return (result.changes && result.changes > 0) || false;
  }

  /**
   * 搜索工作流
   */
  async search(query: string): Promise<AgentWorkflow[]> {
    await this.ensureConnection();

    const sql = `
      SELECT * FROM agent_workflows
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY updated_at DESC
    `;

    const searchPattern = `%${query}%`;
    const result = await this.db.query(sql, [searchPattern, searchPattern]);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      nodes: row.nodes,
      edges: row.edges,
      metadata: row.metadata,
      published: row.published !== undefined ? row.published : 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }
}

/**
 * 工作流执行模型
 */
export class WorkflowExecutionModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库管理器未初始化');
    }
    await this.db.connect();
  }

  /**
   * 创建执行实例
   */
  async create(data: CreateWorkflowExecutionDTO): Promise<WorkflowExecution> {
    await this.ensureConnection();

    const id = data.id || `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const status = data.status || 'pending';

    const sql = `
      INSERT INTO workflow_executions (
        id, workflow_id, workflow_name, status, shared_context, node_results,
        start_time, error, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [
      id,
      data.workflow_id,
      data.workflow_name,
      status,
      data.shared_context ? JSON.stringify(data.shared_context) : '{}',
      data.node_results ? JSON.stringify(data.node_results) : '[]',
      data.start_time || null,
      data.error ? JSON.stringify(data.error) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as WorkflowExecution;
  }

  /**
   * 根据ID获取执行实例
   */
  async getById(id: string): Promise<WorkflowExecution | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_executions WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      workflow_name: row.workflow_name,
      status: row.status,
      shared_context: row.shared_context,
      node_results: row.node_results,
      start_time: row.start_time,
      end_time: row.end_time,
      duration: row.duration,
      error: row.error,
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * 根据工作流ID获取所有执行实例
   */
  async getByWorkflowId(workflowId: string): Promise<WorkflowExecution[]> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_executions WHERE workflow_id = ? ORDER BY created_at DESC';
    const result = await this.db.query(sql, [workflowId]);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: any) => ({
      id: row.id,
      workflow_id: row.workflow_id,
      workflow_name: row.workflow_name,
      status: row.status,
      shared_context: row.shared_context,
      node_results: row.node_results,
      start_time: row.start_time,
      end_time: row.end_time,
      duration: row.duration,
      error: row.error,
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * 更新执行实例
   */
  async update(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    await this.ensureConnection();

    const sql = `
      UPDATE workflow_executions SET
        status = ?,
        shared_context = ?,
        node_results = ?,
        start_time = ?,
        end_time = ?,
        duration = ?,
        error = ?,
        metadata = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`执行实例不存在: ${id}`);
    }

    const params = [
      updates.status ?? existing.status,
      updates.shared_context !== undefined ? updates.shared_context : existing.shared_context,
      updates.node_results !== undefined ? updates.node_results : existing.node_results,
      updates.start_time !== undefined ? updates.start_time : existing.start_time,
      updates.end_time !== undefined ? updates.end_time : existing.end_time,
      updates.duration !== undefined ? updates.duration : existing.duration,
      updates.error !== undefined ? (updates.error ? JSON.stringify(updates.error) : null) : existing.error,
      updates.metadata !== undefined ? (updates.metadata ? JSON.stringify(updates.metadata) : null) : existing.metadata,
      id,
    ];

    await this.db.query(sql, params);

    return await this.getById(id) as WorkflowExecution;
  }
}

/**
 * 工作流模板模型
 */
export class WorkflowTemplateModel {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库管理器未初始化');
    }
    await this.db.connect();
  }

  /**
   * 创建模板
   */
  async create(data: CreateWorkflowTemplateDTO): Promise<WorkflowTemplate> {
    await this.ensureConnection();

    // 确保表存在
    try {
      const checkTableSql = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='workflow_templates'
      `;
      const tableCheck = await this.db.query(checkTableSql);
      const hasTable = Array.isArray(tableCheck) 
        ? tableCheck.length > 0 
        : (tableCheck as any)?.rows?.length > 0 || !!tableCheck;

      if (!hasTable) {
        // 如果表不存在，尝试创建
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS workflow_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            thumbnail TEXT,
            workflow_structure TEXT NOT NULL,
            metadata TEXT,
            is_public INTEGER DEFAULT 0,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await this.db.query(createTableSQL);
      }
    } catch (error: any) {
      console.warn('检查或创建 workflow_templates 表时出现警告:', error.message);
    }

    const id = data.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      // 确保 workflow_structure 可以被序列化
      let workflowStructureStr: string;
      try {
        console.log('验证 workflow_structure:', {
          hasWorkflowStructure: !!data.workflow_structure,
          type: typeof data.workflow_structure,
          isArray: Array.isArray(data.workflow_structure),
          keys: data.workflow_structure && typeof data.workflow_structure === 'object' ? Object.keys(data.workflow_structure) : null,
          value: data.workflow_structure ? JSON.stringify(data.workflow_structure).substring(0, 200) : null,
        });

        if (!data.workflow_structure) {
          console.error('workflow_structure 为空或未定义');
          throw new Error('工作流结构不能为空');
        }

        // 如果已经是字符串，验证它是否是有效的 JSON
        if (typeof data.workflow_structure === 'string') {
          try {
            const parsed = JSON.parse(data.workflow_structure);
            // 验证解析后的对象包含必要的字段
            if (!parsed || typeof parsed !== 'object') {
              throw new Error('工作流结构必须是有效的对象');
            }
            if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
              throw new Error('工作流结构必须包含 nodes 数组');
            }
            workflowStructureStr = data.workflow_structure;
          } catch (parseError) {
            console.error('JSON 解析失败:', parseError);
            throw new Error(`工作流结构 JSON 格式无效: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
        } else {
          // 如果是对象，先验证结构
          if (!data.workflow_structure || typeof data.workflow_structure !== 'object') {
            console.error('workflow_structure 不是有效对象:', typeof data.workflow_structure);
            throw new Error('工作流结构必须是有效的对象');
          }

          // 验证必要字段
          if (!data.workflow_structure.nodes || !Array.isArray(data.workflow_structure.nodes)) {
            console.error('缺少 nodes 字段或不是数组:', {
              hasNodes: !!data.workflow_structure.nodes,
              nodesType: typeof data.workflow_structure.nodes,
              isArray: Array.isArray(data.workflow_structure.nodes),
            });
            throw new Error('工作流结构必须包含 nodes 数组');
          }

          if (!data.workflow_structure.edges || !Array.isArray(data.workflow_structure.edges)) {
            console.error('缺少 edges 字段或不是数组:', {
              hasEdges: !!data.workflow_structure.edges,
              edgesType: typeof data.workflow_structure.edges,
              isArray: Array.isArray(data.workflow_structure.edges),
            });
            throw new Error('工作流结构必须包含 edges 数组');
          }

          // 序列化为 JSON
          const stringified = JSON.stringify(data.workflow_structure);
          console.log('序列化结果:', {
            length: stringified.length,
            preview: stringified.substring(0, 100),
            isEmpty: !stringified || stringified === 'null' || stringified === 'undefined' || stringified === '{}',
          });

          if (!stringified || stringified === 'null' || stringified === 'undefined' || stringified === '{}') {
            throw new Error('工作流结构序列化后为空');
          }
          workflowStructureStr = stringified;
        }

        // 最终验证：确保字符串不为空
        if (!workflowStructureStr || workflowStructureStr.trim() === '') {
          console.error('最终验证失败: workflowStructureStr 为空');
          throw new Error('工作流结构不能为空');
        }

        console.log('workflow_structure 验证通过，长度:', workflowStructureStr.length);
      } catch (error) {
        console.error('工作流结构验证失败:', error);
        throw new Error(`工作流结构序列化失败: ${error instanceof Error ? error.message : String(error)}`);
      }

      // 确保 metadata 可以被序列化
      let metadataStr: string | null = null;
      if (data.metadata) {
        try {
          metadataStr = typeof data.metadata === 'string' 
            ? data.metadata 
            : JSON.stringify(data.metadata);
        } catch (error) {
          console.warn('元数据序列化失败，将使用空值:', error);
          metadataStr = null;
        }
      }

      const sql = `
        INSERT INTO workflow_templates (
          id, name, description, category, thumbnail, workflow_structure,
          metadata, is_public, usage_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const params = [
        id,
        data.name,
        data.description,
        data.category,
        data.thumbnail || null,
        workflowStructureStr,
        metadataStr,
        data.is_public ? 1 : 0,
      ];

      console.log('准备插入模板数据:', {
        id,
        name: data.name,
        description: data.description,
        category: data.category,
        workflowStructureLength: workflowStructureStr.length,
        workflowStructurePreview: workflowStructureStr.substring(0, 100),
        metadataStr: metadataStr ? metadataStr.substring(0, 50) : null,
        isPublic: data.is_public ? 1 : 0,
      });

      await this.db.query(sql, params);

      console.log('模板插入成功，ID:', id);

      // 获取刚创建的模板
      const createdTemplate = await this.getById(id);
      if (!createdTemplate) {
        throw new Error(`模板创建后无法查询到，ID: ${id}`);
      }

      console.log('模板查询成功:', createdTemplate.id);

      return createdTemplate;
    } catch (error: any) {
      console.error('创建模板失败:', error);
      throw new Error(`创建模板失败: ${error.message || String(error)}`);
    }
  }

  /**
   * 根据ID获取模板
   */
  async getById(id: string): Promise<WorkflowTemplate | null> {
    await this.ensureConnection();

    const sql = 'SELECT * FROM workflow_templates WHERE id = ?';
    const result = await this.db.query(sql, [id]);
    const rows = Array.isArray(result) ? result : result.rows || [result];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      thumbnail: row.thumbnail,
      workflow_structure: row.workflow_structure,
      metadata: row.metadata,
      is_public: row.is_public === 1,
      usage_count: row.usage_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * 获取所有模板
   */
  async getAll(category?: string): Promise<WorkflowTemplate[]> {
    await this.ensureConnection();

    let sql = 'SELECT * FROM workflow_templates WHERE 1=1';
    const params: any[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY usage_count DESC, updated_at DESC';

    const result = await this.db.query(sql, params);
    const rows = Array.isArray(result) ? result : result.rows || [];

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      thumbnail: row.thumbnail,
      workflow_structure: row.workflow_structure,
      metadata: row.metadata,
      is_public: row.is_public === 1,
      usage_count: row.usage_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * 增加使用次数
   */
  async incrementUsage(id: string): Promise<void> {
    await this.ensureConnection();

    const sql = 'UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = ?';
    await this.db.query(sql, [id]);
  }

  /**
   * 删除模板
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureConnection();

    const sql = 'DELETE FROM workflow_templates WHERE id = ?';
    const result: any = await this.db.query(sql, [id]);

    return (result.changes && result.changes > 0) || false;
  }
}

