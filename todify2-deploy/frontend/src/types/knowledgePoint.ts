// 知识点相关类型定义

export interface KnowledgePoint {
  id: number;
  tech_point_id: number;
  title: string;
  content: string;
  knowledge_type: KnowledgeType;
  difficulty_level: DifficultyLevel;
  tags: string[];
  prerequisites: string[];
  learning_objectives: string[];
  examples: string[];
  references: string[];
  status: KnowledgeStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export enum KnowledgeType {
  CONCEPT = 'concept',
  PROCEDURE = 'procedure',
  PRINCIPLE = 'principle',
  FACT = 'fact',
  EXAMPLE = 'example'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum KnowledgeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 创建知识点的表单数据
export interface CreateKnowledgePointFormData {
  tech_point_id: number;
  title: string;
  content: string;
  knowledge_type: KnowledgeType;
  difficulty_level: DifficultyLevel;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives?: string[];
  examples?: string[];
  references?: string[];
  status?: KnowledgeStatus;
  created_by?: string;
}

// 更新知识点的表单数据
export interface UpdateKnowledgePointFormData {
  title?: string;
  content?: string;
  knowledge_type?: KnowledgeType;
  difficulty_level?: DifficultyLevel;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives?: string[];
  examples?: string[];
  references?: string[];
  status?: KnowledgeStatus;
}

// 知识点查询参数
export interface KnowledgePointQueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}