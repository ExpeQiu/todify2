import { apiClient, type ApiResponse } from "@/shared/lib/api/apiClient";
import type {
  BrainstormSession,
  CreateBrainstormSessionDTO,
  UpdateBrainstormSessionDTO,
  AddParticipantDTO,
  BrainstormParticipant,
  BrainstormMessage,
  SessionStatus,
} from "@/types/brainstorm";

/**
 * 头脑风暴 API 服务
 */
export const brainstormService = {
  /**
   * 创建会话
   */
  async createSession(data: CreateBrainstormSessionDTO): Promise<BrainstormSession> {
    const response = await apiClient.post<ApiResponse<BrainstormSession>>(
      "/brainstorm/sessions",
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "创建会话失败");
    }
    return response.data;
  },

  /**
   * 获取会话列表
   */
  async listSessions(options: {
    creatorId?: string;
    projectId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<BrainstormSession[]> {
    const params = new URLSearchParams();
    if (options.creatorId) params.append("creatorId", options.creatorId);
    if (options.projectId !== undefined) params.append("projectId", options.projectId.toString());
    if (options.status) params.append("status", options.status);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.offset) params.append("offset", options.offset.toString());

    const response = await apiClient.get<ApiResponse<BrainstormSession[]>>(
      `/brainstorm/sessions?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取会话列表失败");
    }
    return response.data;
  },

  /**
   * 获取会话详情
   */
  async getSession(id: string): Promise<BrainstormSession> {
    const response = await apiClient.get<ApiResponse<BrainstormSession>>(
      `/brainstorm/sessions/${id}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取会话详情失败");
    }
    return response.data;
  },

  /**
   * 更新会话
   */
  async updateSession(
    id: string,
    data: UpdateBrainstormSessionDTO
  ): Promise<BrainstormSession> {
    const response = await apiClient.patch<ApiResponse<BrainstormSession>>(
      `/brainstorm/sessions/${id}`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "更新会话失败");
    }
    return response.data;
  },

  /**
   * 删除会话
   */
  async deleteSession(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/brainstorm/sessions/${id}`
    );
    if (!response.success) {
      throw new Error(response.error || response.message || "删除会话失败");
    }
  },

  /**
   * 添加参与者
   */
  async addParticipant(
    sessionId: string,
    data: AddParticipantDTO
  ): Promise<BrainstormParticipant> {
    const response = await apiClient.post<ApiResponse<BrainstormParticipant>>(
      `/brainstorm/sessions/${sessionId}/participants`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "添加参与者失败");
    }
    return response.data;
  },

  /**
   * 获取参与者列表
   */
  async getParticipants(sessionId: string): Promise<BrainstormParticipant[]> {
    const response = await apiClient.get<ApiResponse<BrainstormParticipant[]>>(
      `/brainstorm/sessions/${sessionId}/participants`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取参与者列表失败");
    }
    return response.data;
  },

  /**
   * 删除参与者
   */
  async removeParticipant(sessionId: string, participantId: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/brainstorm/sessions/${sessionId}/participants/${participantId}`
    );
    if (!response.success) {
      throw new Error(response.error || response.message || "删除参与者失败");
    }
  },

  /**
   * 启动讨论
   */
  async startSession(sessionId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>(
      `/brainstorm/sessions/${sessionId}/start`
    );
    if (!response.success) {
      throw new Error(response.error || response.message || "启动讨论失败");
    }
  },

  /**
   * 停止讨论
   */
  async stopSession(sessionId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<null>>(
      `/brainstorm/sessions/${sessionId}/stop`
    );
    if (!response.success) {
      throw new Error(response.error || response.message || "停止讨论失败");
    }
  },

  /**
   * 获取消息列表
   */
  async getMessages(
    sessionId: string,
    options: {
      roundNumber?: number;
      afterMessageId?: string;
      limit?: number;
    } = {}
  ): Promise<BrainstormMessage[]> {
    const params = new URLSearchParams();
    if (options.roundNumber) params.append("roundNumber", options.roundNumber.toString());
    if (options.afterMessageId) params.append("afterMessageId", options.afterMessageId);
    if (options.limit) params.append("limit", options.limit.toString());

    const response = await apiClient.get<ApiResponse<BrainstormMessage[]>>(
      `/brainstorm/sessions/${sessionId}/messages?${params.toString()}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取消息列表失败");
    }
    return response.data;
  },

  /**
   * 获取讨论总结
   */
  async getSummary(sessionId: string): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ summary: string }>>(
      `/brainstorm/sessions/${sessionId}/summary`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取讨论总结失败");
    }
    return response.data.summary;
  },

  /**
   * 添加用户消息
   */
  async addUserMessage(
    sessionId: string,
    content: string,
    replyToId?: string,
    userId?: string
  ): Promise<BrainstormMessage> {
    const response = await apiClient.post<ApiResponse<BrainstormMessage>>(
      `/brainstorm/sessions/${sessionId}/user-messages`,
      { content, replyToId, userId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "添加用户消息失败");
    }
    return response.data;
  },

  /**
   * 获取会话状态
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await apiClient.get<ApiResponse<SessionStatus>>(
      `/brainstorm/sessions/${sessionId}/status`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || "获取会话状态失败");
    }
    return response.data;
  },
};

