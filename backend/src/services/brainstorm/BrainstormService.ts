import {
  brainstormSessionModel,
  brainstormParticipantModel,
  brainstormMessageModel,
  aiRoleModel,
} from '../../models';
import {
  BrainstormSessionDTO,
  CreateBrainstormSessionDTO,
  UpdateBrainstormSessionDTO,
  BrainstormParticipantDTO,
  AddParticipantDTO,
  BrainstormMessageDTO,
} from '../../models/Brainstorm';

/**
 * 头脑风暴业务服务
 */
export class BrainstormService {
  /**
   * 创建会话
   */
  async createSession(data: CreateBrainstormSessionDTO): Promise<BrainstormSessionDTO> {
    // 验证参与者角色是否存在
    for (const roleId of data.participantRoleIds) {
      const role = await aiRoleModel.getById(roleId);
      if (!role) {
        throw new Error(`AI角色不存在: ${roleId}`);
      }
      if (!role.enabled) {
        throw new Error(`AI角色未启用: ${roleId}`);
      }
    }

    const session = await brainstormSessionModel.create(data);
    
    // 加载参与者信息
    const participants = await brainstormParticipantModel.getBySessionId(session.id);
    session.participants = participants;
    
    return session;
  }

  /**
   * 获取会话列表
   */
  async listSessions(options: {
    creatorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<BrainstormSessionDTO[]> {
    const sessions = await brainstormSessionModel.list(options);
    
    // 为每个会话加载参与者和消息数量
    for (const session of sessions) {
      const participants = await brainstormParticipantModel.getBySessionId(session.id);
      session.participants = participants;
      
      const messages = await brainstormMessageModel.getBySessionId(session.id);
      session.messageCount = messages.length;
    }
    
    return sessions;
  }

  /**
   * 获取会话详情
   */
  async getSessionById(id: string): Promise<BrainstormSessionDTO> {
    const session = await brainstormSessionModel.getById(id);
    
    // 加载参与者
    const participants = await brainstormParticipantModel.getBySessionId(session.id);
    session.participants = participants;
    
    // 加载消息数量
    const messages = await brainstormMessageModel.getBySessionId(session.id);
    session.messageCount = messages.length;
    
    return session;
  }

  /**
   * 更新会话
   */
  async updateSession(id: string, data: UpdateBrainstormSessionDTO): Promise<BrainstormSessionDTO> {
    return await brainstormSessionModel.update(id, data);
  }

  /**
   * 删除会话
   */
  async deleteSession(id: string): Promise<void> {
    await brainstormSessionModel.delete(id);
  }

  /**
   * 添加参与者
   */
  async addParticipant(sessionId: string, data: AddParticipantDTO): Promise<BrainstormParticipantDTO> {
    // 验证会话存在
    await brainstormSessionModel.getById(sessionId);
    
    // 验证角色存在
    const role = await aiRoleModel.getById(data.aiRoleId);
    if (!role) {
      throw new Error(`AI角色不存在: ${data.aiRoleId}`);
    }
    if (!role.enabled) {
      throw new Error(`AI角色未启用: ${data.aiRoleId}`);
    }

    // 检查是否已存在
    const existing = await brainstormParticipantModel.getBySessionId(sessionId);
    const alreadyExists = existing.some(p => p.aiRoleId === data.aiRoleId);
    if (alreadyExists) {
      throw new Error(`参与者已存在: ${data.aiRoleId}`);
    }

    // 确定排序
    const sortOrder = data.sortOrder ?? existing.length;

    return await brainstormParticipantModel.create({
      sessionId,
      aiRoleId: data.aiRoleId,
      displayName: data.displayName,
      roleType: data.roleType,
      sortOrder,
    });
  }

  /**
   * 获取会话的参与者列表
   */
  async getParticipants(sessionId: string): Promise<BrainstormParticipantDTO[]> {
    return await brainstormParticipantModel.getBySessionId(sessionId);
  }

  /**
   * 删除参与者
   */
  async removeParticipant(participantId: number): Promise<void> {
    await brainstormParticipantModel.delete(participantId);
  }

  /**
   * 获取会话的消息列表
   */
  async getMessages(
    sessionId: string,
    options: {
      roundNumber?: number;
      afterMessageId?: string;
      limit?: number;
    } = {}
  ): Promise<BrainstormMessageDTO[]> {
    return await brainstormMessageModel.getBySessionId(sessionId, options);
  }

  /**
   * 获取会话的最大轮次
   */
  async getMaxRoundNumber(sessionId: string): Promise<number> {
    return await brainstormMessageModel.getMaxRoundNumber(sessionId);
  }

  /**
   * 更新会话总结
   */
  async updateSummary(sessionId: string, summary: string): Promise<void> {
    await brainstormSessionModel.updateSummary(sessionId, summary);
  }

  /**
   * 添加用户消息
   */
  async addUserMessage(
    sessionId: string,
    content: string,
    replyToId?: string,
    userId?: string
  ): Promise<BrainstormMessageDTO> {
    // 验证会话存在
    const session = await brainstormSessionModel.getById(sessionId);
    
    // 获取当前最大轮次
    const maxRound = await brainstormMessageModel.getMaxRoundNumber(sessionId);
    const roundNumber = maxRound + 1; // 用户消息作为新的一轮

    return await brainstormMessageModel.create({
      sessionId,
      participantId: null, // 用户消息没有 participantId
      roundNumber,
      content,
      replyToId,
      messageType: 'user',
      metadata: {
        userId,
      },
    });
  }
}

// 导出单例
export const brainstormService = new BrainstormService();

