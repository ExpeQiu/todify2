// 公共知识库相关类型定义

/**
 * 分类
 */
export interface PublicKnowledgeCategory {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

/**
 * 分类树节点（带子节点）
 */
export interface CategoryTreeNode extends PublicKnowledgeCategory {
  children?: CategoryTreeNode[];
}

/**
 * 文件
 */
export interface PublicKnowledgeFile {
  id: number;
  category_id: number | null;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by?: number;
  created_at: string;
  updated_at?: string;
  file_url?: string; // 前端添加的URL字段
}

/**
 * 创建分类DTO
 */
export interface CreateCategoryDTO {
  name: string;
  parent_id?: number | null;
  sort_order?: number;
}

/**
 * 更新分类DTO
 */
export interface UpdateCategoryDTO {
  name?: string;
  parent_id?: number | null;
  sort_order?: number;
}

/**
 * 创建文件DTO
 */
export interface CreateFileDTO {
  category_id?: number | null;
  description?: string;
  uploaded_by?: number;
}

/**
 * 更新文件DTO
 */
export interface UpdateFileDTO {
  category_id?: number | null;
  name?: string;
  description?: string;
}

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
