import { db } from '@/config/database';
import { logger } from '@/shared/lib/logger';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface FileRecord {
  id: number;
  file_id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  file_hash?: string;
  category: string;
  tags?: string;
  description?: string;
  uploader_id?: string;
  conversation_id?: string;
  usage_count: number;
  last_used_at?: string;
  status: 'active' | 'archived' | 'deleted';
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFileParams {
  original_name: string;
  stored_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  file_hash?: string;
  category?: string;
  tags?: string[];
  description?: string;
  uploader_id?: string;
  conversation_id?: string;
  metadata?: any;
}

export class FileService {
  /**
   * 初始化文件表
   */
  async initializeTable(): Promise<void> {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id TEXT UNIQUE NOT NULL,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_url TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_hash TEXT,
          category TEXT DEFAULT 'general',
          tags TEXT,
          description TEXT,
          uploader_id TEXT,
          conversation_id TEXT,
          usage_count INTEGER DEFAULT 0,
          last_used_at DATETIME,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_files_file_id ON files(file_id);
        CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
        CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
        CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
        CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash);
      `;

      // 执行多个SQL语句
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
        }
      }
      logger.info('文件表初始化成功');
    } catch (error) {
      logger.error('文件表初始化失败:', error);
      throw error;
    }
  }

  /**
   * 计算文件哈希值
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 创建文件记录
   */
  async createFile(params: CreateFileParams): Promise<FileRecord> {
    try {
      // 计算文件哈希值
      let fileHash: string | undefined;
      if (fs.existsSync(params.file_path)) {
        fileHash = await this.calculateFileHash(params.file_path);
        
        // 检查是否已存在相同哈希的文件
        const existing = await this.findByHash(fileHash);
        if (existing) {
          // 如果文件已存在，增加使用次数并返回现有记录
          await this.incrementUsageCount(existing.file_id);
          return existing;
        }
      }

      const fileId = this.generateFileId();
      const tagsJson = params.tags ? JSON.stringify(params.tags) : null;
      const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;

      const sql = `
        INSERT INTO files (
          file_id, original_name, stored_name, file_path, file_url,
          mime_type, file_size, file_hash, category, tags, description,
          uploader_id, conversation_id, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.query(sql, [
        fileId,
        params.original_name,
        params.stored_name,
        params.file_path,
        params.file_url,
        params.mime_type,
        params.file_size,
        fileHash || null,
        params.category || 'general',
        tagsJson,
        params.description || null,
        params.uploader_id || null,
        params.conversation_id || null,
        metadataJson,
      ]);

      const file = await this.getFileByFileId(fileId);
      if (!file) {
        throw new Error('创建文件记录失败');
      }

      logger.info('文件记录创建成功', { fileId, originalName: params.original_name });
      return file;
    } catch (error) {
      logger.error('创建文件记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据文件ID获取文件记录
   */
  async getFileByFileId(fileId: string): Promise<FileRecord | null> {
    try {
      const sql = `SELECT * FROM files WHERE file_id = ? AND status = 'active'`;
      const rows = await db.query(sql, [fileId]);
      return rows.length > 0 ? (rows[0] as FileRecord) : null;
    } catch (error) {
      logger.error('获取文件记录失败:', error);
      return null;
    }
  }

  /**
   * 根据哈希值查找文件
   */
  async findByHash(fileHash: string): Promise<FileRecord | null> {
    try {
      const sql = `SELECT * FROM files WHERE file_hash = ? AND status = 'active' LIMIT 1`;
      const rows = await db.query(sql, [fileHash]);
      return rows.length > 0 ? (rows[0] as FileRecord) : null;
    } catch (error) {
      logger.error('根据哈希查找文件失败:', error);
      return null;
    }
  }

  /**
   * 增加文件使用次数
   */
  async incrementUsageCount(fileId: string): Promise<void> {
    try {
      const sql = `
        UPDATE files 
        SET usage_count = usage_count + 1,
            last_used_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE file_id = ?
      `;
      await db.query(sql, [fileId]);
    } catch (error) {
      logger.error('增加文件使用次数失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有文件列表
   */
  async getAllFiles(options?: {
    category?: string;
    status?: string;
    conversationId?: string;
    pageType?: string; // 页面类型：'tech-package' | 'press-release'
    limit?: number;
    offset?: number;
    excludeGarbled?: boolean; // 排除乱码文件名
  }): Promise<FileRecord[]> {
    try {
      let sql = `SELECT * FROM files WHERE 1=1`;
      const params: any[] = [];

      if (options?.category) {
        sql += ` AND category = ?`;
        params.push(options.category);
      }

      if (options?.status) {
        sql += ` AND status = ?`;
        params.push(options.status);
      } else {
        sql += ` AND status = 'active'`;
      }

      if (options?.conversationId) {
        sql += ` AND conversation_id = ?`;
        params.push(options.conversationId);
      }

      // 按页面类型过滤（通过metadata字段）
      if (options?.pageType) {
        // 只返回metadata中包含指定pageType的文件
        sql += ` AND metadata LIKE ?`;
        params.push(`%"pageType":"${options.pageType}"%`);
      }
      // 如果没有指定pageType，返回所有文件（包括没有metadata的旧文件）

      // 排除乱码文件名
      if (options?.excludeGarbled) {
        sql += ` AND original_name NOT LIKE '%ã€%' AND original_name NOT LIKE '%ç¥%' AND original_name NOT LIKE '%æ%'`;
      }

      sql += ` ORDER BY created_at DESC`;

      if (options?.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
      }

      if (options?.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }

      const rows = await db.query(sql, params);
      
      // 基于文件哈希去重，只保留最新的记录
      const fileMap = new Map<string, FileRecord>();
      for (const row of rows as FileRecord[]) {
        if (row.file_hash) {
          const existing = fileMap.get(row.file_hash);
          if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
            fileMap.set(row.file_hash, row);
          }
        } else {
          // 没有哈希值的文件，使用file_id作为key
          fileMap.set(row.file_id, row);
        }
      }
      
      return Array.from(fileMap.values());
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      return [];
    }
  }

  /**
   * 更新文件信息
   */
  async updateFile(fileId: string, updates: {
    description?: string;
    tags?: string[];
    category?: string;
    metadata?: any;
  }): Promise<FileRecord | null> {
    try {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        params.push(updates.description);
      }

      if (updates.tags !== undefined) {
        setClauses.push('tags = ?');
        params.push(JSON.stringify(updates.tags));
      }

      if (updates.category !== undefined) {
        setClauses.push('category = ?');
        params.push(updates.category);
      }

      if (updates.metadata !== undefined) {
        setClauses.push('metadata = ?');
        params.push(JSON.stringify(updates.metadata));
      }

      if (setClauses.length === 0) {
        return await this.getFileByFileId(fileId);
      }

      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      params.push(fileId);

      const sql = `UPDATE files SET ${setClauses.join(', ')} WHERE file_id = ?`;
      await db.query(sql, params);

      return await this.getFileByFileId(fileId);
    } catch (error) {
      logger.error('更新文件信息失败:', error);
      return null;
    }
  }

  /**
   * 删除文件（软删除）
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const sql = `UPDATE files SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE file_id = ?`;
      await db.query(sql, [fileId]);
      return true;
    } catch (error) {
      logger.error('删除文件失败:', error);
      return false;
    }
  }
}

export const fileService = new FileService();

