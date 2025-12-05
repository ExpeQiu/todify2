import { publicKnowledgeModel } from '../models';
import { logger } from '../shared/lib/logger';
import fs from 'fs';
import path from 'path';
import { CreateFileDTO, UpdateFileDTO, CreateCategoryDTO, UpdateCategoryDTO } from '../models/PublicKnowledge';

export class PublicKnowledgeService {
  private uploadDir: string;

  constructor() {
    // 设置上传目录
    this.uploadDir = path.join(process.cwd(), 'backend', 'uploads', 'public-knowledge');
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`创建上传目录: ${this.uploadDir}`);
    }
  }

  /**
   * 获取上传目录路径
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * 生成文件存储路径
   */
  generateFilePath(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const fileName = `${timestamp}-${randomStr}-${sanitizedName}${ext}`;
    return path.join(this.uploadDir, fileName);
  }

  /**
   * 获取文件的相对URL路径
   */
  getFileUrl(filePath: string): string {
    const relativePath = path.relative(path.join(process.cwd(), 'backend'), filePath);
    return `/api/v1/public-knowledge/files/${path.basename(filePath)}`;
  }

  /**
   * 保存上传的文件
   */
  async saveUploadedFile(file: Express.Multer.File, categoryId?: number | null, description?: string, uploadedBy?: number): Promise<any> {
    try {
      const filePath = this.generateFilePath(file.originalname);
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 移动文件到目标位置
      fs.writeFileSync(filePath, file.buffer);

      // 创建文件记录
      const fileData: CreateFileDTO = {
        category_id: categoryId ?? null,
        name: file.originalname,
        file_path: filePath,
        file_type: file.mimetype,
        file_size: file.size,
        description: description,
        uploaded_by: uploadedBy
      };

      const fileRecord = await publicKnowledgeModel.createFile(fileData);
      
      logger.info('文件上传成功', {
        fileId: fileRecord.id,
        fileName: file.originalname,
        filePath: filePath
      });

      return {
        ...fileRecord,
        file_url: this.getFileUrl(filePath)
      };
    } catch (error) {
      logger.error('保存上传文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件（包括物理文件）
   */
  async deleteFileWithPhysicalFile(fileId: number): Promise<boolean> {
    try {
      const file = await publicKnowledgeModel.getFileById(fileId);
      if (!file) {
        throw new Error('文件不存在');
      }

      // 删除物理文件
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
        logger.info('物理文件已删除', { filePath: file.file_path });
      }

      // 删除数据库记录
      await publicKnowledgeModel.deleteFile(fileId);
      
      logger.info('文件删除成功', { fileId });
      return true;
    } catch (error) {
      logger.error('删除文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件流
   */
  async getFileStream(fileId: number): Promise<{ stream: fs.ReadStream; file: any }> {
    const file = await publicKnowledgeModel.getFileById(fileId);
    if (!file) {
      throw new Error('文件不存在');
    }

    if (!fs.existsSync(file.file_path)) {
      throw new Error('物理文件不存在');
    }

    const stream = fs.createReadStream(file.file_path);
    return { stream, file };
  }

  // ==================== 分类相关方法 ====================

  /**
   * 创建分类
   */
  async createCategory(data: CreateCategoryDTO): Promise<any> {
    try {
      return await publicKnowledgeModel.createCategory(data);
    } catch (error) {
      logger.error('创建分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类树
   */
  async getCategoryTree(): Promise<any> {
    try {
      return await publicKnowledgeModel.getCategoryTree();
    } catch (error) {
      logger.error('获取分类树失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(): Promise<any[]> {
    try {
      return await publicKnowledgeModel.getAllCategories();
    } catch (error) {
      logger.error('获取分类列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取分类详情
   */
  async getCategoryById(id: number): Promise<any> {
    try {
      const category = await publicKnowledgeModel.getCategoryById(id);
      if (!category) {
        throw new Error('分类不存在');
      }
      return category;
    } catch (error) {
      logger.error('获取分类详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: UpdateCategoryDTO): Promise<any> {
    try {
      const category = await publicKnowledgeModel.updateCategory(id, data);
      if (!category) {
        throw new Error('分类不存在');
      }
      return category;
    } catch (error) {
      logger.error('更新分类失败:', error);
      throw error;
    }
  }

  /**
   * 删除分类（递归删除子分类和关联文件）
   */
  async deleteCategory(id: number): Promise<boolean> {
    try {
      // 获取所有子分类
      const children = await publicKnowledgeModel.getCategoriesByParentId(id);
      
      // 递归删除子分类
      for (const child of children) {
        await this.deleteCategory(child.id);
      }

      // 获取分类下的所有文件并删除
      const files = await publicKnowledgeModel.getFilesByCategoryId(id);
      for (const file of files) {
        await this.deleteFileWithPhysicalFile(file.id);
      }

      // 删除分类本身
      await publicKnowledgeModel.deleteCategory(id);
      
      logger.info('分类删除成功', { categoryId: id });
      return true;
    } catch (error) {
      logger.error('删除分类失败:', error);
      throw error;
    }
  }

  // ==================== 文件相关方法 ====================

  /**
   * 获取文件列表
   */
  async getFiles(categoryId?: number | null): Promise<any[]> {
    try {
      const files = await publicKnowledgeModel.getAllFiles(categoryId);
      return files.map(file => ({
        ...file,
        file_url: this.getFileUrl(file.file_path)
      }));
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件详情
   */
  async getFileById(id: number): Promise<any> {
    try {
      const file = await publicKnowledgeModel.getFileById(id);
      if (!file) {
        throw new Error('文件不存在');
      }
      return {
        ...file,
        file_url: this.getFileUrl(file.file_path)
      };
    } catch (error) {
      logger.error('获取文件详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件
   */
  async updateFile(id: number, data: UpdateFileDTO): Promise<any> {
    try {
      const file = await publicKnowledgeModel.updateFile(id, data);
      if (!file) {
        throw new Error('文件不存在');
      }
      return {
        ...file,
        file_url: this.getFileUrl(file.file_path)
      };
    } catch (error) {
      logger.error('更新文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(id: number): Promise<boolean> {
    return this.deleteFileWithPhysicalFile(id);
  }
}

export const publicKnowledgeService = new PublicKnowledgeService();
