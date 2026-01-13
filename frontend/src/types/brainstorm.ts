/**
 * 头脑风暴相关类型定义
 */

/**
 * 共识检测配置
 */
export interface ConsensusDetectionConfig {
  enabled: boolean;
  method: 'semantic' | 'voting' | 'hybrid';
  threshold: number;
  minAgreementRatio: number;
  recentRounds: number;
  analyzerRoleId?: string;
}

/**
 * 反思循环配置
 */
export interface ReflectionLoopConfig {
  enabled: boolean;
  maxIterations: number;
  qualityThreshold: number;
  evaluatorRoleId?: string;
  reflectorRoleId?: string;
  reflectionFrequency: number;
}

/**
 * 结构化上下文配置
 */
export interface StructuredContextConfig {
  enabled: boolean;
  summaryFrequency: number;
  summarizerRoleId?: string;
  extractKeyPoints: boolean;
  detectDisagreements: boolean;
  maxContextTokens: number;
}

/**
 * 辩论模式配置
 */
export interface DebateConfig {
  enabled: boolean;
  proRoleIds: string[];
  conRoleIds: string[];
  judgeRoleId?: string;
  rounds: number;
  judgeAfterRounds?: number;
}

/**
 * 会话配置
 */
export interface BrainstormSessionConfig {
  stopConditions: {
    manualStop: boolean;
    maxRounds: number | null;
    consensusDetection: boolean;
    consensusConfig?: ConsensusDetectionConfig;
  };
  discussionMode: 'parallel' | 'round-robin' | 'debate';
  moderatorConfig?: {
    enabled: boolean;
    moderatorRoleId?: string; // 主持人角色ID
  };
  summaryConfig: {
    enabled: boolean;
    provider: 'same-as-agents' | 'custom';
  };
  reflectionLoop?: ReflectionLoopConfig;
  structuredContext?: StructuredContextConfig;
  debateConfig?: DebateConfig;
}

/**
 * 头脑风暴会话
 */
export interface BrainstormSession {
  id: string;
  title: string;
  topic: string;
  description?: string;
  creatorId?: string;
  projectId?: number;
  status: 'draft' | 'active' | 'completed' | 'stopped';
  config: BrainstormSessionConfig;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  participants?: BrainstormParticipant[];
  messageCount?: number;
}

/**
 * 参与者
 */
export interface BrainstormParticipant {
  id: number;
  sessionId: string;
  aiRoleId: string;
  displayName?: string;
  roleType?: string;
  sortOrder: number;
  createdAt: string;
  aiRole?: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
}

/**
 * 讨论消息
 */
export interface BrainstormMessage {
  id: string;
  sessionId: string;
  participantId: number | null; // null 表示用户消息
  roundNumber: number;
  content: string;
  replyToId?: string;
  messageType?: 'agent' | 'user';
  metadata?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
    finishReason?: string;
    error?: string;
    userId?: string;
  };
  createdAt: string;
  participant?: BrainstormParticipant;
}

/**
 * 创建会话DTO
 */
export interface CreateBrainstormSessionDTO {
  title: string;
  topic: string;
  description?: string;
  creatorId?: string;
  projectId?: number;
  config?: Partial<BrainstormSessionConfig>;
  participantRoleIds: string[];
}

/**
 * 更新会话DTO
 */
export interface UpdateBrainstormSessionDTO {
  title?: string;
  topic?: string;
  description?: string;
  config?: Partial<BrainstormSessionConfig>;
  status?: 'draft' | 'active' | 'completed' | 'stopped';
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
 * 会话状态
 */
export interface SessionStatus {
  status: 'draft' | 'active' | 'completed' | 'stopped';
  isActive: boolean;
  currentRound: number;
  messageCount: number;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

