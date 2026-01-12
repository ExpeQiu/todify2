import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import { brainstormService } from './BrainstormService';
import {
  brainstormSessionModel,
  brainstormParticipantModel,
  brainstormMessageModel,
} from '../../models';
import {
  BrainstormSessionDTO,
  BrainstormParticipantDTO,
  BrainstormMessageDTO,
} from '../../models/Brainstorm';
import { AgentExecutionResult } from '../agent/AgentOrchestrator';
import { v4 as uuidv4 } from 'uuid';
import { StructuredContextManager } from './StructuredContextManager';
import { ReflectionLoopManager } from './ReflectionLoopManager';
import { ConsensusDetector } from './ConsensusDetector';
import { DebateModeManager } from './DebateModeManager';

/**
 * 头脑风暴编排器
 * 负责并行调度多个 Agent 进行讨论
 */
export class BrainstormOrchestrator {
  private agentOrchestrator: AgentOrchestrator;
  private activeSessions: Map<string, boolean> = new Map();
  private contextManager: StructuredContextManager;
  private reflectionManager: ReflectionLoopManager;
  private consensusDetector: ConsensusDetector;
  private debateManager: DebateModeManager;
  // 存储每个会话的结构化上下文
  private sessionContexts: Map<string, { context: any; lastSummaryRound: number }> = new Map();

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
    this.contextManager = new StructuredContextManager();
    this.reflectionManager = new ReflectionLoopManager();
    this.consensusDetector = new ConsensusDetector();
    this.debateManager = new DebateModeManager();
  }

  /**
   * 启动讨论会话
   */
  async startSession(sessionId: string): Promise<void> {
    // 检查会话是否存在
    const session = await brainstormSessionModel.getById(sessionId);
    
    if (session.status === 'active') {
      throw new Error('会话已在运行中');
    }

    if (session.status === 'completed' || session.status === 'stopped') {
      throw new Error('会话已结束，无法重新启动');
    }

    // 检查参与者
    const participants = await brainstormParticipantModel.getBySessionId(sessionId);
    if (participants.length === 0) {
      throw new Error('会话没有参与者');
    }

    // 更新状态为 active
    await brainstormSessionModel.update(sessionId, { status: 'active' });
    this.activeSessions.set(sessionId, true);

    try {
      // 开始讨论循环
      await this.runDiscussionLoop(sessionId);
    } catch (error) {
      // 发生错误时停止会话
      await brainstormSessionModel.update(sessionId, { status: 'stopped' });
      this.activeSessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * 停止讨论会话
   */
  async stopSession(sessionId: string): Promise<void> {
    this.activeSessions.set(sessionId, false);
    await brainstormSessionModel.update(sessionId, { status: 'stopped' });
  }

  /**
   * 执行讨论循环
   */
  private async runDiscussionLoop(sessionId: string): Promise<void> {
    let roundNumber = 1;
    const MAX_ROUND_TIME = 600000; // 10分钟整轮超时
    const MAX_TOTAL_TIME = 3600000; // 1小时总超时
    const sessionStartTime = Date.now();
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3; // 最多连续3次错误后停止

    while (this.activeSessions.get(sessionId)) {
      const roundStartTime = Date.now();

      // 检查总超时
      const totalElapsed = Date.now() - sessionStartTime;
      if (totalElapsed > MAX_TOTAL_TIME) {
        console.warn(`会话 ${sessionId} 总超时，停止讨论`);
        await brainstormSessionModel.update(sessionId, { status: 'stopped' });
        break;
      }

      // 检查是否应该停止
      const shouldStop = await this.shouldStop(sessionId);
      if (shouldStop.stop) {
        console.log(`会话 ${sessionId} 停止: ${shouldStop.reason}`);
        break;
      }

      // 检查共识检测（如果启用）
      if (roundNumber > 1 && roundNumber % 2 === 0) { // 每2轮检查一次
        const consensusResult = await this.checkConsensus(sessionId, roundNumber);
        if (consensusResult?.hasConsensus) {
          console.log(`会话 ${sessionId} 达成共识，停止讨论`);
          await brainstormMessageModel.create({
            sessionId,
            participantId: null,
            roundNumber,
            content: `[共识检测] 讨论已达成共识（置信度：${(consensusResult.confidence * 100).toFixed(1)}%）\n共识主题：${consensusResult.consensusTopics.join('、')}`,
            messageType: 'agent',
            metadata: {
              consensusResult,
              isSystemMessage: true,
            },
          });
          await brainstormSessionModel.update(sessionId, {
            status: 'completed',
            summary: `讨论达成共识。共识主题：${consensusResult.consensusTopics.join('、')}`,
          });
          break;
        }
      }

      // 执行一轮讨论（带超时保护）
      try {
        await Promise.race([
          this.executeRound(sessionId, roundNumber),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('轮次执行超时')), MAX_ROUND_TIME)
          )
        ]);
        consecutiveErrors = 0; // 重置错误计数

        // 检查是否需要执行反思循环
        const session = await brainstormSessionModel.getById(sessionId);
        if (session.config.reflectionLoop?.enabled && 
            roundNumber > 0 && 
            roundNumber % (session.config.reflectionLoop.reflectionFrequency || 3) === 0) {
          await this.executeReflectionIfNeeded(sessionId, roundNumber);
        }
      } catch (error) {
        consecutiveErrors++;
        console.error(`轮次 ${roundNumber} 执行失败:`, error);
        
        // 如果连续错误过多，停止讨论
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(`连续 ${consecutiveErrors} 次错误，停止讨论`);
          await brainstormSessionModel.update(sessionId, { 
            status: 'stopped',
            summary: `讨论因连续错误而停止：${error instanceof Error ? error.message : '未知错误'}`
          });
          break;
        }
        
        // 继续下一轮，但记录错误
        try {
          await brainstormMessageModel.create({
            sessionId,
            participantId: null,
            roundNumber,
            content: `[系统] 第 ${roundNumber} 轮讨论执行失败，已跳过。错误：${error instanceof Error ? error.message : '未知错误'}`,
            messageType: 'agent',
            metadata: { error: error instanceof Error ? error.message : '未知错误', isSystemMessage: true },
          });
        } catch (saveError) {
          console.error('保存错误消息失败:', saveError);
        }
      }

      // 检查轮次超时
      const roundElapsed = Date.now() - roundStartTime;
      if (roundElapsed > MAX_ROUND_TIME) {
        console.warn(`轮次 ${roundNumber} 超时，停止讨论`);
        break;
      }

      roundNumber++;
      
      // 短暂延迟，避免过于频繁的数据库操作
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 讨论结束，更新状态
    const finalStatus = this.activeSessions.get(sessionId) ? 'stopped' : 'completed';
    await brainstormSessionModel.update(sessionId, { status: finalStatus });
    this.activeSessions.delete(sessionId);

    // 生成总结
    try {
      await this.generateSummary(sessionId);
    } catch (error) {
      console.error('生成总结失败:', error);
      // 总结失败不影响讨论结果
    }
  }

  /**
   * 执行一轮讨论
   */
  async executeRound(sessionId: string, roundNumber: number): Promise<BrainstormMessageDTO[]> {
    const session = await brainstormSessionModel.getById(sessionId);
    const participants = await brainstormParticipantModel.getBySessionId(sessionId);
    const messages: BrainstormMessageDTO[] = [];

    // 如果有主持人，先让主持人发言
    if (session.config.moderatorConfig?.enabled && session.config.moderatorConfig?.moderatorRoleId) {
      const moderatorMessage = await this.executeModeratorTurn(
        session,
        participants,
        roundNumber
      );
      if (moderatorMessage) {
        messages.push(moderatorMessage);
      }
    }

    // 根据讨论模式选择执行方式
    let participantMessages: BrainstormMessageDTO[];
    if (session.config.discussionMode === 'debate' && session.config.debateConfig?.enabled) {
      // 辩论模式
      participantMessages = await this.debateManager.executeDebateRound(
        session,
        roundNumber,
        session.config.debateConfig
      );
    } else if (session.config.discussionMode === 'round-robin') {
      participantMessages = await this.executeRoundRobin(session, participants, roundNumber);
    } else {
      participantMessages = await this.executeParallel(session, participants, roundNumber);
    }

    messages.push(...participantMessages);
    return messages;
  }

  /**
   * 执行主持人发言
   */
  private async executeModeratorTurn(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    roundNumber: number
  ): Promise<BrainstormMessageDTO | null> {
    const moderatorRoleId = session.config.moderatorConfig?.moderatorRoleId;
    if (!moderatorRoleId) {
      return null;
    }

    // 获取历史消息
    const historyMessages = await brainstormMessageModel.getBySessionId(session.id);
    
    // 构建主持人查询
    const moderatorQuery = this.buildModeratorQuery(session, participants, historyMessages, roundNumber);
    const conversationId = `${session.id}_moderator`;

    try {
      const result = await this.agentOrchestrator.executeAgent(
        moderatorRoleId,
        moderatorQuery,
        conversationId,
        {
          topic: session.topic,
          description: session.description,
          roundNumber,
          participantCount: participants.length,
        }
      );

      // 创建主持人参与者记录（如果不存在）
      let moderatorParticipant = participants.find(p => p.aiRoleId === moderatorRoleId);
      if (!moderatorParticipant) {
        // 创建临时主持人参与者记录
        moderatorParticipant = await brainstormParticipantModel.create({
          sessionId: session.id,
          aiRoleId: moderatorRoleId,
          displayName: '主持人',
          roleType: 'moderator',
          sortOrder: -1, // 主持人排在第一位
        });
      }

      // 保存主持人消息
      return await brainstormMessageModel.create({
        sessionId: session.id,
        participantId: moderatorParticipant.id,
        roundNumber,
        content: result.content,
        metadata: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          model: result.metadata?.model,
          finishReason: result.metadata?.finishReason,
          isModerator: true,
        },
      });
    } catch (error) {
      console.error('主持人执行失败:', error);
      return null; // 主持人失败不影响讨论继续
    }
  }

  /**
   * 构建主持人查询
   */
  private buildModeratorQuery(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    historyMessages: BrainstormMessageDTO[],
    roundNumber: number
  ): string {
    const historyText = this.formatHistoryMessages(historyMessages, participants);
    
    let query = `讨论话题：${session.topic}\n`;
    if (session.description) {
      query += `话题描述：${session.description}\n`;
    }

    query += `\n你的角色：主持人\n`;
    query += `参与专家：${participants.map(p => p.displayName || p.aiRole?.name || '专家').join('、')}\n`;

    if (roundNumber === 1) {
      query += `\n这是第 ${roundNumber} 轮讨论。作为主持人，请：\n`;
      query += `1. 简要介绍讨论话题和背景\n`;
      query += `2. 说明讨论的目标和期望\n`;
      query += `3. 引导专家们开始讨论\n`;
      query += `4. 提出一些关键问题供专家思考\n`;
    } else {
      query += `\n这是第 ${roundNumber} 轮讨论。`;
      if (historyText) {
        query += `\n\n历史讨论记录：\n${historyText}\n`;
      }
      query += `\n作为主持人，请：\n`;
      query += `1. 总结前面讨论的核心观点\n`;
      query += `2. 指出讨论中的关键分歧或共识\n`;
      query += `3. 引导专家深入讨论或转向新角度\n`;
      query += `4. 提出需要进一步探讨的问题\n`;
    }

    query += `\n请用简洁、专业的语言表达，控制在200字以内。`;

    return query;
  }

  /**
   * 并行执行模式：所有 Agent 同时发言
   */
  private async executeParallel(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    roundNumber: number
  ): Promise<BrainstormMessageDTO[]> {
    // 获取历史消息（用于构建上下文）
    const historyMessages = await brainstormMessageModel.getBySessionId(session.id);

    // 构建每个参与者的查询（包含话题和历史讨论）
    const queries = await this.buildQueriesForParticipants(session, participants, historyMessages, roundNumber);

    // 并行调用所有 Agent（带超时保护）
    const AGENT_TIMEOUT = 300000; // 单个 Agent 5分钟超时
    const agentPromises = participants.map(async (participant, index) => {
      const query = queries[index];
      const conversationId = `${session.id}_${participant.id}`;

      try {
        const result = await Promise.race([
          this.agentOrchestrator.executeAgent(
            participant.aiRoleId,
            query,
            conversationId,
            {
              topic: session.topic,
              description: session.description,
              roundNumber,
              participantName: participant.displayName || participant.aiRole?.name || '专家',
            }
          ),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Agent 执行超时')), AGENT_TIMEOUT)
          )
        ]);

        // 保存消息（使用事务确保数据一致性）
        return await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: participant.id,
          roundNumber,
          content: result.content,
          metadata: {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
            model: result.metadata?.model,
            finishReason: result.metadata?.finishReason,
          },
        });
      } catch (error) {
        console.error(`参与者 ${participant.id} 执行失败:`, error);
        // 返回错误消息
        return await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: participant.id,
          roundNumber,
          content: `抱歉，我在思考这个问题时遇到了困难。${error instanceof Error ? error.message : '未知错误'}`,
          metadata: {
            error: error instanceof Error ? error.message : '未知错误',
            timeout: error instanceof Error && error.message.includes('超时'),
          },
        });
      }
    });

    // 等待所有 Agent 完成（使用 allSettled 避免单个失败影响整体）
    const results = await Promise.allSettled(agentPromises);
    const messages: BrainstormMessageDTO[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        messages.push(result.value);
      } else {
        console.error('Agent 执行失败:', result.reason);
      }
    }

    return messages;
  }

  /**
   * 轮流发言模式：Agent 按顺序依次发言
   */
  private async executeRoundRobin(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    roundNumber: number
  ): Promise<BrainstormMessageDTO[]> {
    const messages: BrainstormMessageDTO[] = [];
    
    // 按 sortOrder 排序参与者
    const sortedParticipants = [...participants].sort((a, b) => a.sortOrder - b.sortOrder);
    
    // 获取历史消息（用于构建上下文）
    const historyMessages = await brainstormMessageModel.getBySessionId(session.id);

    // 依次执行每个参与者
    for (let i = 0; i < sortedParticipants.length; i++) {
      const participant = sortedParticipants[i];
      
      // 构建查询，包含之前参与者的发言
      const queries = await this.buildQueriesForParticipants(
        session,
        sortedParticipants,
        [...historyMessages, ...messages], // 包含本轮已发言的消息
        roundNumber,
        i // 当前发言者的索引
      );
      const query = queries[i];
      const conversationId = `${session.id}_${participant.id}`;

      try {
        const AGENT_TIMEOUT = 300000; // 单个 Agent 5分钟超时
        const result = await Promise.race([
          this.agentOrchestrator.executeAgent(
            participant.aiRoleId,
            query,
            conversationId,
            {
              topic: session.topic,
              description: session.description,
              roundNumber,
              participantName: participant.displayName || participant.aiRole?.name || '专家',
              turnIndex: i,
              totalTurns: sortedParticipants.length,
            }
          ),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Agent 执行超时')), AGENT_TIMEOUT)
          )
        ]);

        // 保存消息
        const message = await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: participant.id,
          roundNumber,
          content: result.content,
          metadata: {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
            model: result.metadata?.model,
            finishReason: result.metadata?.finishReason,
          },
        });
        
        messages.push(message);
      } catch (error) {
        console.error(`参与者 ${participant.id} 执行失败:`, error);
        // 返回错误消息
        const errorMessage = await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: participant.id,
          roundNumber,
          content: `抱歉，我在思考这个问题时遇到了困难。${error instanceof Error ? error.message : '未知错误'}`,
          metadata: {
            error: error instanceof Error ? error.message : '未知错误',
            timeout: error instanceof Error && error.message.includes('超时'),
          },
        });
        messages.push(errorMessage);
      }
    }

    return messages;
  }

  /**
   * 为参与者构建查询
   */
  private async buildQueriesForParticipants(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    historyMessages: BrainstormMessageDTO[],
    roundNumber: number,
    currentTurnIndex?: number // 轮流模式下的当前发言者索引
  ): Promise<string[]> {
    // 使用结构化上下文（如果启用）
    let contextText = '';
    const contextConfig = session.config.structuredContext;
    
    if (contextConfig?.enabled) {
      try {
        const sessionContext = this.sessionContexts.get(session.id);
        const lastSummaryRound = sessionContext?.lastSummaryRound || 0;
        
        // 检查是否需要更新结构化上下文
        const shouldUpdate = roundNumber - lastSummaryRound >= (contextConfig.summaryFrequency || 3);
        
        if (shouldUpdate || !sessionContext) {
          const structuredContext = await this.contextManager.buildStructuredContext(
            historyMessages,
            participants,
            session.topic,
            session.description,
            contextConfig,
            lastSummaryRound,
            contextConfig.summarizerRoleId
          );
          
          this.sessionContexts.set(session.id, {
            context: structuredContext,
            lastSummaryRound: structuredContext.lastSummaryRound,
          });
          
          contextText = this.contextManager.formatContextForAgent(
            structuredContext,
            contextConfig.maxContextTokens
          );
        } else {
          // 使用缓存的上下文
          contextText = this.contextManager.formatContextForAgent(
            sessionContext.context,
            contextConfig.maxContextTokens
          );
        }
      } catch (error) {
        console.error('构建结构化上下文失败，降级为文本格式:', error);
        // 降级为文本格式
        contextText = this.formatHistoryMessages(historyMessages, participants);
      }
    } else {
      // 未启用结构化上下文，使用传统文本格式
      contextText = this.formatHistoryMessages(historyMessages, participants);
    }

    // 为每个参与者生成查询
    return participants.map((participant, index) => {
      const participantName = participant.displayName || participant.aiRole?.name || '专家';
      const roleType = participant.roleType || participant.aiRole?.description || '';

      let query = `讨论话题：${session.topic}\n`;
      
      if (session.description) {
        query += `话题描述：${session.description}\n`;
      }

      query += `\n你的角色：${participantName}`;
      if (roleType) {
        query += `（${roleType}）`;
      }
      query += `\n`;

      if (contextText) {
        query += `\n${contextText}\n`;
      }

      // 轮流模式下的特殊提示
      if (currentTurnIndex !== undefined) {
        const isFirst = currentTurnIndex === 0;
        const isLast = currentTurnIndex === participants.length - 1;
        
        if (isFirst) {
          query += `\n你是本轮第一个发言的专家，请从你的专业角度发表观点，可以：\n`;
          query += `1. 提出新的见解\n`;
          query += `2. 分析问题的关键点\n`;
          query += `3. 提供具体建议\n`;
          query += `4. 指出潜在问题或风险\n`;
        } else if (isLast) {
          query += `\n你是本轮最后发言的专家，请基于前面专家的观点进行总结或补充：\n`;
          query += `1. 总结前面专家的核心观点\n`;
          query += `2. 补充遗漏的重要角度\n`;
          query += `3. 指出潜在的分歧或共识\n`;
          query += `4. 提出下一步建议\n`;
        } else {
          query += `\n你是本轮第 ${currentTurnIndex + 1} 位发言的专家，请基于前面专家的观点继续讨论：\n`;
          query += `1. 回应或补充前面专家的观点\n`;
          query += `2. 提出不同角度的看法\n`;
          query += `3. 指出潜在问题或风险\n`;
          query += `4. 提供更深入的分析\n`;
        }
      } else {
        // 并行模式
        if (roundNumber === 1) {
          query += `\n请从你的专业角度发表观点，可以：\n`;
          query += `1. 提出新的见解\n`;
          query += `2. 分析问题的关键点\n`;
          query += `3. 提供具体建议\n`;
          query += `4. 指出潜在问题或风险\n`;
        } else {
          query += `\n请继续参与讨论，可以：\n`;
          query += `1. 补充其他专家的观点\n`;
          query += `2. 提出不同角度的看法\n`;
          query += `3. 指出潜在问题或风险\n`;
          query += `4. 提供更深入的分析\n`;
          query += `5. 尝试总结或提出共识点\n`;
        }
      }

      query += `\n请用简洁、专业的语言表达你的观点。`;

      return query;
    });
  }

  /**
   * 格式化历史消息
   */
  private formatHistoryMessages(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[]
  ): string {
    if (messages.length === 0) {
      return '';
    }

    // 按轮次分组
    const messagesByRound = new Map<number, BrainstormMessageDTO[]>();
    for (const msg of messages) {
      if (!messagesByRound.has(msg.roundNumber)) {
        messagesByRound.set(msg.roundNumber, []);
      }
      messagesByRound.get(msg.roundNumber)!.push(msg);
    }

    // 构建文本
    const lines: string[] = [];
    const sortedRounds = Array.from(messagesByRound.keys()).sort((a, b) => a - b);

    for (const round of sortedRounds) {
      lines.push(`[轮次 ${round}]`);
      const roundMessages = messagesByRound.get(round)!;
      
      for (const msg of roundMessages) {
        const participant = participants.find(p => p.id === msg.participantId);
        const name = participant?.displayName || participant?.aiRole?.name || '未知';
        lines.push(`- ${name}: ${msg.content}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 判断是否应该停止
   */
  async shouldStop(sessionId: string): Promise<{ stop: boolean; reason?: string }> {
    const session = await brainstormSessionModel.getById(sessionId);

    // 检查手动停止
    if (!this.activeSessions.get(sessionId)) {
      return { stop: true, reason: '用户手动停止' };
    }

    // 检查最大轮次
    const maxRounds = session.config.stopConditions.maxRounds;
    if (maxRounds !== null) {
      const currentRound = await brainstormMessageModel.getMaxRoundNumber(sessionId);
      if (currentRound >= maxRounds) {
        return { stop: true, reason: `达到最大轮次限制: ${maxRounds}` };
      }
    }

    // 共识检测已移到主循环中执行

    return { stop: false };
  }

  /**
   * 检查共识（如果启用）
   */
  private async checkConsensus(
    sessionId: string,
    roundNumber: number
  ): Promise<import('./ConsensusDetector').ConsensusResult | null> {
    try {
      const session = await brainstormSessionModel.getById(sessionId);
      const config = session.config.stopConditions.consensusConfig;

      if (!config?.enabled && !session.config.stopConditions.consensusDetection) {
        return null;
      }

      // 使用详细配置或默认配置
      const consensusConfig = config || {
        enabled: true,
        method: 'hybrid' as const,
        threshold: 0.7,
        minAgreementRatio: 0.7,
        recentRounds: 3,
      };

      const participants = await brainstormParticipantModel.getBySessionId(sessionId);
      const messages = await brainstormMessageModel.getBySessionId(sessionId);

      const result = await this.consensusDetector.detectConsensus(
        session,
        messages,
        participants,
        consensusConfig
      );

      return result;
    } catch (error) {
      console.error('共识检测失败:', error);
      return null;
    }
  }

  /**
   * 生成讨论总结
   */
  async generateSummary(sessionId: string): Promise<string> {
    const session = await brainstormSessionModel.getById(sessionId);
    
    if (!session.config.summaryConfig.enabled) {
      return '';
    }

    const participants = await brainstormParticipantModel.getBySessionId(sessionId);
    const messages = await brainstormMessageModel.getBySessionId(sessionId);

    if (messages.length === 0) {
      return '讨论尚未开始或没有消息记录。';
    }

    // 构建总结提示词
    const historyText = this.formatHistoryMessages(messages, participants);
    const summaryPrompt = `请对以下头脑风暴讨论进行总结：

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

参与专家：
${participants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}${p.roleType ? `（${p.roleType}）` : ''}`).join('\n')}

讨论记录：
${historyText}

请提供一份结构化的总结，包括：
1. 核心观点汇总（列出各方主要观点）
2. 共识点（各方一致认同的观点）
3. 分歧点（如有不同意见，列出关键分歧）
4. 建议结论（基于讨论提出的建议或结论）

请用简洁、专业的语言撰写总结。`;

    try {
      // 使用第一个参与者的 Agent 来生成总结（或可以配置专门的总结 Agent）
      const summaryRoleId = participants[0]?.aiRoleId;
      if (!summaryRoleId) {
        throw new Error('没有可用的 Agent 生成总结');
      }

      const result = await this.agentOrchestrator.executeAgent(
        summaryRoleId,
        summaryPrompt,
        `${sessionId}_summary`,
        {}
      );

      const summary = result.content;
      
      // 保存总结
      await brainstormSessionModel.updateSummary(sessionId, summary);
      
      return summary;
    } catch (error) {
      console.error('生成总结失败:', error);
      throw new Error(`生成总结失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查会话是否在运行
   */
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.get(sessionId) === true;
  }

  /**
   * 执行反思循环（如果需要）
   */
  private async executeReflectionIfNeeded(sessionId: string, roundNumber: number): Promise<void> {
    try {
      const session = await brainstormSessionModel.getById(sessionId);
      const config = session.config.reflectionLoop;
      
      if (!config?.enabled) {
        return;
      }

      const participants = await brainstormParticipantModel.getBySessionId(sessionId);
      const messages = await brainstormMessageModel.getBySessionId(sessionId);

      // 执行评审-反思循环
      const result = await this.reflectionManager.executeReflectionLoop(
        session,
        messages,
        participants,
        config
      );

      // 保存评审结果
      if (result.evaluation) {
        await brainstormMessageModel.create({
          sessionId,
          participantId: null,
          roundNumber,
          content: `[评审] 评分：${result.evaluation.score.toFixed(2)}/1.0\n反馈：${result.evaluation.feedback}`,
          messageType: 'evaluation',
          metadata: {
            evaluationScore: result.evaluation.score,
            strengths: result.evaluation.strengths,
            weaknesses: result.evaluation.weaknesses,
            suggestions: result.evaluation.suggestions,
          },
        });
      }

      // 保存反思结果
      if (result.reflection) {
        await brainstormMessageModel.create({
          sessionId,
          participantId: null,
          roundNumber,
          content: `[反思] ${result.reflection.analysis}\n下一轮重点：${result.reflection.nextRoundFocus}`,
          messageType: 'reflection',
          metadata: {
            reflectionIteration: result.iteration,
            improvementSuggestions: result.reflection.improvementSuggestions,
          },
        });

        // 如果质量不达标且未超过最大迭代次数，可以考虑调整下一轮的提示
        if (result.evaluation.score < config.qualityThreshold && result.shouldContinue) {
          console.log(`讨论质量未达标（${result.evaluation.score.toFixed(2)}），已生成改进建议`);
        }
      }

      // 如果不应继续，停止讨论
      if (!result.shouldContinue) {
        await brainstormSessionModel.update(sessionId, {
          status: 'stopped',
          summary: `讨论因质量未达标且已达到最大反思迭代次数（${result.iteration}次）而停止`,
        });
        this.activeSessions.set(sessionId, false);
      }
    } catch (error) {
      console.error('执行反思循环失败:', error);
      // 反思失败不影响讨论继续
    }
  }
}

// 导出单例
export const brainstormOrchestrator = new BrainstormOrchestrator();

