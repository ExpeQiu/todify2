// 数据库相关类型定义

// 基础状态枚举
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

// 车型状态枚举
export enum CarModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

// 车系状态枚举
export enum CarSeriesStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

// 技术点类型枚举
export enum TechType {
  FEATURE = 'feature',
  TECHNOLOGY = 'technology',
  INNOVATION = 'innovation',
  IMPROVEMENT = 'improvement'
}

// 优先级枚举
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 知识点类型枚举
export enum KnowledgeType {
  CONCEPT = 'concept',
  PRINCIPLE = 'principle',
  APPLICATION = 'application',
  CASE_STUDY = 'case_study',
  BEST_PRACTICE = 'best_practice'
}

// 难度级别枚举
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  MEDIUM = 'medium',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// 应用状态枚举
export enum ApplicationStatus {
  PLANNED = 'planned',
  DEVELOPING = 'developing',
  TESTING = 'testing',
  PRODUCTION = 'production',
  DISCONTINUED = 'discontinued'
}

// 材料类型枚举
export enum MaterialType {
  GENERAL = 'general',
  MARKETING = 'marketing',
  TECHNICAL = 'technical',
  PRESENTATION = 'presentation'
}

// 目标受众枚举
export enum TargetAudience {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  MARKETING = 'marketing',
  EXECUTIVE = 'executive',
  INDUSTRY = 'industry',
  ACADEMIC = 'academic',
  MEDIA = 'media',
  INVESTORS = 'investors'
}

// 内容状态枚举
export enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  DELIVERED = 'delivered'
}

// 策略类型枚举
export enum StrategyType {
  COMPREHENSIVE = 'comprehensive',
  MARKETING = 'marketing',
  PR = 'pr',
  SOCIAL_MEDIA = 'social_media',
  EVENT = 'event'
}

// 通稿类型枚举
export enum ReleaseType {
  GENERAL = 'general',
  PRODUCT_LAUNCH = 'product_launch',
  TECHNOLOGY_BREAKTHROUGH = 'technology_breakthrough',
  PARTNERSHIP = 'partnership',
  AWARD = 'award'
}

// 演讲类型枚举
export enum SpeechType {
  CONFERENCE = 'conference',
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  KEYNOTE = 'keynote',
  PANEL = 'panel'
}

// 基础实体接口
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// 技术分类接口
export interface TechCategory extends BaseEntity {
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  status: Status;
}

// 车型接口
export interface CarModel extends BaseEntity {
  brand: string;
  series: string;
  model: string;
  year?: number;
  engine_type?: string;
  fuel_type?: string;
  market_segment?: string;
  status: CarModelStatus;
  metadata?: Record<string, any>;
}

// 车系接口
export interface CarSeries extends BaseEntity {
  brand: string;
  series: string;
  description?: string;
  launch_year?: number;
  end_year?: number;
  market_segment?: string;
  status: CarSeriesStatus;
  metadata?: Record<string, any>;
}

// 知识点接口
export interface KnowledgePoint extends BaseEntity {
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
  status: Status;
  created_by?: string;
}

// 车型信息接口（用于 JSON 存储）
export interface CarModelInfo {
  id?: number;
  name: string;
  brand?: string;
  brand_id?: number;
  series?: string;
  launch_date?: string;
  status?: string;
  application_status?: string;
  implementation_date?: string;
  notes?: string;
}

// 资源信息接口（用于 JSON 存储）
export interface ResourceInfo {
  type: 'pdf' | 'link' | 'image' | 'video' | 'document' | 'other';
  name: string;
  url?: string;
  file_path?: string;
  description?: string;
  size?: number;
  created_at?: string;
}

// 知识点信息接口（用于 JSON 存储）
export interface KnowledgeInfo {
  title?: string;
  content?: string;
  knowledge_type?: string;
  difficulty_level?: string;
  tags?: string[];
  prerequisites?: string[];
  learning_objectives?: string[];
  examples?: string[];
  references?: string[];
}

// 技术点接口
export interface TechPoint extends BaseEntity {
  name: string;
  description?: string;
  category_id?: number;
  parent_id?: number;
  level: number;
  tech_type: TechType;
  priority: Priority;
  status: Status;
  tags?: string[];
  technical_details?: Record<string, any>;
  benefits?: string[];
  applications?: string[];
  keywords?: string[];
  source_url?: string;
  created_by?: string;
  // TPD2 同步相关字段
  tpd_id?: string; // TPD2 项目的原始 ID，用于同步锚点
  car_models_info?: CarModelInfo[]; // JSON 格式存储车型信息
  resources_info?: ResourceInfo[]; // JSON 格式存储资源信息
  knowledge_info?: KnowledgeInfo; // JSON 格式存储知识点详情
}

// 技术点与车型关联接口
export interface TechPointCarModel extends BaseEntity {
  tech_point_id: number;
  car_model_id: number;
  application_status: ApplicationStatus;
  implementation_date?: Date;
  notes?: string;
}

// 技术包装材料接口
export interface TechPackagingMaterial extends BaseEntity {
  tech_point_id: number;
  project_id?: number;
  title: string;
  content: string;
  material_type: MaterialType;
  target_audience: TargetAudience;
  language: string;
  status: ContentStatus;
  generation_params?: Record<string, any>;
  dify_task_id?: string;
  created_by?: string;
  reviewed_by?: string;
}

// 技术推广策略接口
export interface TechPromotionStrategy extends BaseEntity {
  title: string;
  content: string;
  project_id?: number;
  strategy_type: StrategyType;
  target_market?: string;
  timeline?: Record<string, any>;
  budget_range?: string;
  kpi_metrics?: Record<string, any>;
  status: ContentStatus;
  generation_params?: Record<string, any>;
  dify_task_id?: string;
  created_by?: string;
  reviewed_by?: string;
}

// 技术通稿接口
export interface TechPressRelease extends BaseEntity {
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  project_id?: number;
  release_type: ReleaseType;
  target_media?: string[];
  publication_date?: Date;
  status: ContentStatus;
  seo_keywords?: string[];
  generation_params?: Record<string, any>;
  dify_task_id?: string;
  created_by?: string;
  reviewed_by?: string;
  published_by?: string;
}

// 技术演讲稿接口
export interface TechSpeech extends BaseEntity {
  title: string;
  content: string;
  speech_type: SpeechType;
  duration_minutes: number;
  target_audience: TargetAudience;
  event_name?: string;
  event_date?: Date;
  speaker_notes?: string;
  slides_outline?: Record<string, any>;
  status: ContentStatus;
  generation_params?: Record<string, any>;
  dify_task_id?: string;
  created_by?: string;
  reviewed_by?: string;
  delivered_by?: string;
}

// 关联表接口
export interface PromotionTechPoint {
  id: number;
  promotion_id: number;
  tech_point_id: number;
  weight: number;
  created_at: Date;
}

export interface PressTechPoint {
  id: number;
  press_release_id: number;
  tech_point_id: number;
  weight: number;
  created_at: Date;
}

export interface SpeechTechPoint {
  id: number;
  speech_id: number;
  tech_point_id: number;
  weight: number;
  created_at: Date;
}

// 数据库查询选项接口
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, any>;
}

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 创建/更新数据传输对象
export type CreateTechCategoryDTO = Omit<TechCategory, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechCategoryDTO = Partial<CreateTechCategoryDTO>;

export type CreateCarModelDTO = Omit<CarModel, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCarModelDTO = Partial<CreateCarModelDTO>;

export type CreateCarSeriesDTO = Omit<CarSeries, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCarSeriesDTO = Partial<CreateCarSeriesDTO>;

export type CreateTechPointDTO = Omit<TechPoint, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechPointDTO = Partial<CreateTechPointDTO>;

export type CreateTechPointCarModelDTO = Omit<TechPointCarModel, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechPointCarModelDTO = Partial<CreateTechPointCarModelDTO>;

export type CreateTechPackagingMaterialDTO = Omit<TechPackagingMaterial, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechPackagingMaterialDTO = Partial<CreateTechPackagingMaterialDTO>;

export type CreateTechPromotionStrategyDTO = Omit<TechPromotionStrategy, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechPromotionStrategyDTO = Partial<CreateTechPromotionStrategyDTO>;

export type CreateTechPressReleaseDTO = Omit<TechPressRelease, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechPressReleaseDTO = Partial<CreateTechPressReleaseDTO>;

export type CreateTechSpeechDTO = Omit<TechSpeech, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTechSpeechDTO = Partial<CreateTechSpeechDTO>;

export type CreateKnowledgePointDTO = Omit<KnowledgePoint, 'id' | 'created_at' | 'updated_at'>;
export type UpdateKnowledgePointDTO = Partial<CreateKnowledgePointDTO>;

// 来源信息接口
export interface SourceInformation extends BaseEntity {
  source_id: string;
  title: string;
  type: 'knowledge_base' | 'external';
  url?: string;
  description?: string;
  page_type?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
  conversation_id?: string;
  project_id?: number;  // 关联的项目ID（可选）
  metadata?: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  created_by?: string;
}

export type CreateSourceInformationDTO = Omit<SourceInformation, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSourceInformationDTO = Partial<CreateSourceInformationDTO>;

// 项目类型枚举
export enum ProjectType {
  NORMAL = 'normal',
  FEATURED = 'featured'
}

// 项目状态枚举
export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// 项目来源类型枚举
export enum ProjectSourceType {
  FILE = 'file',
  URL = 'url',
  TEXT = 'text',
  TECH_POINT = 'tech_point',
  KNOWLEDGE_POINT = 'knowledge_point'
}

// 项目接口
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  cover_image?: string;
  icon?: string;
  type: ProjectType;
  status: ProjectStatus;
  created_by?: string;
  last_opened_at?: Date;
}

// 项目来源接口
export interface ProjectSource extends BaseEntity {
  project_id: number;
  source_type: ProjectSourceType;
  source_content: string;
  source_title?: string;
  source_description?: string;
  metadata?: Record<string, any>;
}

// 项目创建/更新DTO
export type CreateProjectDTO = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProjectDTO = Partial<CreateProjectDTO>;

// 项目来源创建/更新DTO
export type CreateProjectSourceDTO = Omit<ProjectSource, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProjectSourceDTO = Partial<CreateProjectSourceDTO>;

// 项目关联表接口
export interface ProjectTechPoint extends BaseEntity {
  project_id: number;
  tech_point_id: number;
  notes?: string;
}

export interface ProjectKnowledgePoint extends BaseEntity {
  project_id: number;
  knowledge_point_id: number;
  notes?: string;
}

export interface ProjectFile extends BaseEntity {
  project_id: number;
  file_id: string;
  notes?: string;
}

export interface ProjectSourceInformation extends BaseEntity {
  project_id: number;
  source_information_id: number;
  notes?: string;
}

// 生成内容关联表接口
export interface TechPackagingConversation extends BaseEntity {
  packaging_id: number;
  conversation_id: string;
  notes?: string;
}

export interface TechPackagingSource extends BaseEntity {
  packaging_id: number;
  source_id: number;
  notes?: string;
}

export interface TechPromotionConversation extends BaseEntity {
  promotion_id: number;
  conversation_id: string;
  notes?: string;
}

export interface TechPromotionSource extends BaseEntity {
  promotion_id: number;
  source_id: number;
  notes?: string;
}

export interface TechPressConversation extends BaseEntity {
  press_release_id: number;
  conversation_id: string;
  notes?: string;
}

export interface TechPressSource extends BaseEntity {
  press_release_id: number;
  source_id: number;
  notes?: string;
}

// 项目详情接口（包含关联数据）
export interface ProjectDetails extends Project {
  techPoints?: TechPoint[];
  knowledgePoints?: KnowledgePoint[];
  files?: any[]; // File 类型需要从 files 表获取
  sourceInformations?: SourceInformation[];
  packagingMaterials?: TechPackagingMaterial[];
  promotionStrategies?: TechPromotionStrategy[];
  pressReleases?: TechPressRelease[];
}