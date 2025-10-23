import { DatabaseManager } from '../config/database';
import { 
  KnowledgePoint, 
  CreateKnowledgePointDTO, 
  UpdateKnowledgePointDTO,
  PaginatedResult,
  QueryOptions 
} from '../types/database';

export class KnowledgePointService {
  private db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager();
  }

  // 创建知识点
  async createKnowledgePoint(data: CreateKnowledgePointDTO): Promise<KnowledgePoint> {
    const sql = `
      INSERT INTO knowledge_points (
        tech_point_id, title, content, knowledge_type, difficulty_level,
        tags, prerequisites, learning_objectives, examples, references,
        status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.tech_point_id,
      data.title,
      data.content,
      data.knowledge_type,
      data.difficulty_level,
      JSON.stringify(data.tags || []),
      JSON.stringify(data.prerequisites || []),
      JSON.stringify(data.learning_objectives || []),
      JSON.stringify(data.examples || []),
      JSON.stringify(data.references || []),
      data.status || 'active',
      data.created_by
    ];

    const result = await this.db.query(sql, params);
    const knowledgePointId = result.lastID || result.insertId;
    
    const knowledgePoint = await this.getKnowledgePointById(knowledgePointId);
    if (!knowledgePoint) {
      throw new Error('Failed to create knowledge point');
    }
    
    return knowledgePoint;
  }

  // 根据ID获取知识点
  async getKnowledgePointById(id: number): Promise<KnowledgePoint | null> {
    const sql = `
      SELECT * FROM knowledge_points WHERE id = ?
    `;
    
    const result = await this.db.query(sql, [id]);
    const row = Array.isArray(result) ? result[0] : result;
    
    if (!row) return null;
    
    return this.formatKnowledgePoint(row);
  }

  // 根据技术点ID获取知识点列表
  async getKnowledgePointsByTechPointId(
    techPointId: number, 
    options: QueryOptions = {}
  ): Promise<PaginatedResult<KnowledgePoint>> {
    const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total FROM knowledge_points 
      WHERE tech_point_id = ? AND status != 'archived'
    `;
    const countResult = await this.db.query(countSql, [techPointId]);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.total;
    
    // 获取数据
    const sql = `
      SELECT * FROM knowledge_points 
      WHERE tech_point_id = ? AND status != 'archived'
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    const result = await this.db.query(sql, [techPointId, limit, offset]);
    const rows = Array.isArray(result) ? result : [result];
    
    const data = rows.map(row => this.formatKnowledgePoint(row));
    
    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 更新知识点
  async updateKnowledgePoint(id: number, data: UpdateKnowledgePointDTO): Promise<KnowledgePoint | null> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      params.push(data.content);
    }
    if (data.knowledge_type !== undefined) {
      updates.push('knowledge_type = ?');
      params.push(data.knowledge_type);
    }
    if (data.difficulty_level !== undefined) {
      updates.push('difficulty_level = ?');
      params.push(data.difficulty_level);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(data.tags));
    }
    if (data.prerequisites !== undefined) {
      updates.push('prerequisites = ?');
      params.push(JSON.stringify(data.prerequisites));
    }
    if (data.learning_objectives !== undefined) {
      updates.push('learning_objectives = ?');
      params.push(JSON.stringify(data.learning_objectives));
    }
    if (data.examples !== undefined) {
      updates.push('examples = ?');
      params.push(JSON.stringify(data.examples));
    }
    if (data.references !== undefined) {
      updates.push('references = ?');
      params.push(JSON.stringify(data.references));
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (updates.length === 0) {
      return await this.getKnowledgePointById(id);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `
      UPDATE knowledge_points 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;
    
    await this.db.query(sql, params);
    return await this.getKnowledgePointById(id);
  }

  // 删除知识点
  async deleteKnowledgePoint(id: number): Promise<boolean> {
    const sql = `DELETE FROM knowledge_points WHERE id = ?`;
    const result = await this.db.query(sql, [id]);
    
    return (result.changes || result.affectedRows) > 0;
  }

  // 格式化知识点数据
  private formatKnowledgePoint(row: any): KnowledgePoint {
    return {
      id: row.id,
      tech_point_id: row.tech_point_id,
      title: row.title,
      content: row.content,
      knowledge_type: row.knowledge_type,
      difficulty_level: row.difficulty_level,
      tags: this.parseJSON(row.tags),
      prerequisites: this.parseJSON(row.prerequisites),
      learning_objectives: this.parseJSON(row.learning_objectives),
      examples: this.parseJSON(row.examples),
      references: this.parseJSON(row.references),
      status: row.status,
      created_by: row.created_by,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // 解析JSON字符串
  private parseJSON(jsonString: string | null): any[] {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  }
}