import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import {
  BrainstormMessageDTO,
  BrainstormParticipantDTO,
  BrainstormSessionDTO,
} from '../../models/Brainstorm';

/**
 * 共识检测结果
 */
export interface ConsensusResult {
  hasConsensus: boolean;              // 是否达成共识
  confidence: number;                 // 置信度 0-1
  consensusTopics: string[];          // 达成共识的主题列表
  remainingDisagreements: string[];  // 剩余分歧点
  participantAgreement: Record<string, number>; // 每个参与者的同意度
  method: 'semantic' | 'voting' | 'hybrid'; // 使用的检测方法
}

/**
 * 共识检测配置
 */
export interface ConsensusDetectionConfig {
  enabled: boolean;
  method: 'semantic' | 'voting' | 'hybrid'; // 检测方法
  threshold: number;                  // 共识阈值 0-1（默认0.7）
  minAgreementRatio: number;          // 最小同意比例（默认0.7，即70%专家同意）
  recentRounds: number;               // 分析最近N轮（默认3轮）
  analyzerRoleId?: string;             // 分析Agent ID（可选）
}

/**
 * 共识检测器
 * 负责检测讨论是否达成共识，实现自动收敛
 */
export class ConsensusDetector {
  private agentOrchestrator: AgentOrchestrator;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
  }

  /**
   * 检测共识
   */
  async detectConsensus(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): Promise<ConsensusResult> {
    if (!config.enabled) {
      return {
        hasConsensus: false,
        confidence: 0,
        consensusTopics: [],
        remainingDisagreements: [],
        participantAgreement: {},
        method: config.method,
      };
    }

    // 获取最近的讨论消息
    const recentMessages = this.getRecentMessages(messages, config.recentRounds || 3);
    
    if (recentMessages.length === 0) {
      return {
        hasConsensus: false,
        confidence: 0,
        consensusTopics: [],
        remainingDisagreements: [],
        participantAgreement: {},
        method: config.method,
      };
    }

    // 根据方法选择检测策略
    switch (config.method) {
      case 'semantic':
        return await this.detectBySemanticAnalysis(session, recentMessages, participants, config);
      case 'voting':
        return await this.detectByVoting(session, recentMessages, participants, config);
      case 'hybrid':
        return await this.detectByHybrid(session, recentMessages, participants, config);
      default:
        return await this.detectByHybrid(session, recentMessages, participants, config);
    }
  }

  /**
   * 语义分析检测（使用Agent分析）
   */
  private async detectBySemanticAnalysis(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): Promise<ConsensusResult> {
    const roleId = config.analyzerRoleId || participants[0]?.aiRoleId;
    if (!roleId) {
      throw new Error('没有可用的Agent进行共识分析');
    }

    const messagesText = this.formatMessagesForAnalysis(messages, participants);
    
    const prompt = `你是一位专业的讨论分析专家。请分析以下讨论是否已达成共识。

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

参与专家：
${participants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}`).join('\n')}

最近讨论记录：
${messagesText}

请从以下维度分析：
1. **观点一致性**：专家们的核心观点是否一致
2. **分歧程度**：是否存在明显分歧，分歧是否已解决
3. **共识强度**：达成的共识是表面一致还是深度一致
4. **讨论成熟度**：讨论是否已经充分，是否还有未解决的问题

请以JSON格式返回分析结果：
{
  "hasConsensus": true,
  "confidence": 0.85,
  "consensusTopics": ["共识主题1", "共识主题2"],
  "remainingDisagreements": ["分歧点1", "分歧点2"],
  "participantAgreement": {
    "participantId1": 0.9,
    "participantId2": 0.8,
    "participantId3": 0.7
  },
  "analysis": "详细分析说明..."
}

评分标准：
- hasConsensus: 如果70%以上专家在核心问题上达成一致，则为true
- confidence: 0-1，基于共识的强度和一致性
- consensusTopics: 列出明确达成共识的具体主题
- remainingDisagreements: 列出仍然存在的分歧点（如果有）
- participantAgreement: 每个参与者的同意度（0-1）`;

    try {
      const result = await this.agentOrchestrator.executeAgent(
        roleId,
        prompt,
        `consensus_analysis_${session.id}_${Date.now()}`,
        {
          sessionTopic: session.topic,
          threshold: config.threshold,
        }
      );

      return this.parseConsensusResponse(result.content, config.method);
    } catch (error) {
      console.error('语义分析检测失败:', error);
      // 降级为简单检测
      return this.detectBySimpleAnalysis(messages, participants, config);
    }
  }

  /**
   * 投票检测（让每个Agent投票）
   */
  private async detectByVoting(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): Promise<ConsensusResult> {
    const messagesText = this.formatMessagesForAnalysis(messages, participants);
    const votes: Record<string, { hasConsensus: boolean; confidence: number; topics: string[] }> = {};

    // 让每个参与者投票
    const votePromises = participants.map(async (participant) => {
      const prompt = `作为讨论参与者，请评估当前讨论是否已达成共识。

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

讨论记录：
${messagesText}

请评估：
1. 是否已达成共识？（true/false）
2. 共识的置信度（0-1）
3. 达成共识的具体主题（数组）

请以JSON格式返回：
{
  "hasConsensus": true,
  "confidence": 0.8,
  "topics": ["主题1", "主题2"]
}`;

      try {
        const result = await this.agentOrchestrator.executeAgent(
          participant.aiRoleId,
          prompt,
          `consensus_vote_${session.id}_${participant.id}_${Date.now()}`,
          {}
        );

        const vote = this.parseVoteResponse(result.content);
        votes[String(participant.id)] = vote;
      } catch (error) {
        console.error(`参与者 ${participant.id} 投票失败:`, error);
        // 默认投票
        votes[String(participant.id)] = {
          hasConsensus: false,
          confidence: 0.5,
          topics: [],
        };
      }
    });

    await Promise.all(votePromises);

    // 统计投票结果
    return this.aggregateVotes(votes, participants, config);
  }

  /**
   * 混合检测（语义分析 + 投票）
   */
  private async detectByHybrid(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): Promise<ConsensusResult> {
    // 并行执行两种方法
    const [semanticResult, votingResult] = await Promise.all([
      this.detectBySemanticAnalysis(session, messages, participants, config).catch(() => null),
      this.detectByVoting(session, messages, participants, config).catch(() => null),
    ]);

    // 合并结果
    if (!semanticResult && !votingResult) {
      return this.detectBySimpleAnalysis(messages, participants, config);
    }

    if (!semanticResult) return votingResult!;
    if (!votingResult) return semanticResult;

    // 加权合并
    const hasConsensus = semanticResult.hasConsensus && votingResult.hasConsensus;
    const confidence = (semanticResult.confidence * 0.6 + votingResult.confidence * 0.4);
    const consensusTopics = [...new Set([...semanticResult.consensusTopics, ...votingResult.consensusTopics])];
    const remainingDisagreements = [...new Set([...semanticResult.remainingDisagreements, ...votingResult.remainingDisagreements])];

    // 合并参与者同意度
    const participantAgreement: Record<string, number> = {};
    participants.forEach(p => {
      const id = String(p.id);
      const semantic = semanticResult.participantAgreement[id] || 0.5;
      const voting = votingResult.participantAgreement[id] || 0.5;
      participantAgreement[id] = (semantic * 0.6 + voting * 0.4);
    });

    return {
      hasConsensus: hasConsensus && confidence >= config.threshold,
      confidence,
      consensusTopics,
      remainingDisagreements,
      participantAgreement,
      method: 'hybrid',
    };
  }

  /**
   * 简单分析（降级方案）
   */
  private detectBySimpleAnalysis(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): ConsensusResult {
    // 简单的关键词匹配和统计
    const recentMessages = this.getRecentMessages(messages, config.recentRounds || 3);
    
    // 统计每个参与者的发言次数
    const participantCounts: Record<string, number> = {};
    recentMessages.forEach(msg => {
      if (msg.participantId) {
        const id = String(msg.participantId);
        participantCounts[id] = (participantCounts[id] || 0) + 1;
      }
    });

    // 简单的共识判断：如果所有参与者都发言了，且轮次足够，认为可能达成共识
    const allParticipated = participants.every(p => participantCounts[String(p.id)] > 0);
    const hasEnoughRounds = recentMessages.length >= participants.length * 2;

    return {
      hasConsensus: allParticipated && hasEnoughRounds,
      confidence: allParticipated && hasEnoughRounds ? 0.6 : 0.3,
      consensusTopics: [],
      remainingDisagreements: [],
      participantAgreement: Object.fromEntries(
        participants.map(p => [String(p.id), participantCounts[String(p.id)] > 0 ? 0.7 : 0.3])
      ),
      method: config.method,
    };
  }

  /**
   * 获取最近的讨论消息
   */
  private getRecentMessages(messages: BrainstormMessageDTO[], rounds: number): BrainstormMessageDTO[] {
    if (messages.length === 0) return [];
    
    const maxRound = Math.max(...messages.map(m => m.roundNumber));
    const minRound = Math.max(1, maxRound - rounds + 1);
    
    return messages.filter(m => m.roundNumber >= minRound);
  }

  /**
   * 格式化消息用于分析
   */
  private formatMessagesForAnalysis(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[]
  ): string {
    const lines: string[] = [];
    const messagesByRound = new Map<number, BrainstormMessageDTO[]>();
    
    for (const msg of messages) {
      if (!messagesByRound.has(msg.roundNumber)) {
        messagesByRound.set(msg.roundNumber, []);
      }
      messagesByRound.get(msg.roundNumber)!.push(msg);
    }

    const sortedRounds = Array.from(messagesByRound.keys()).sort((a, b) => a - b);

    for (const round of sortedRounds) {
      lines.push(`\n[轮次 ${round}]`);
      const roundMessages = messagesByRound.get(round)!;
      
      for (const msg of roundMessages) {
        const participant = participants.find(p => p.id === msg.participantId);
        const name = participant?.displayName || participant?.aiRole?.name || '未知';
        lines.push(`${name}: ${msg.content}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 解析共识响应
   */
  private parseConsensusResponse(content: string, method: string): ConsensusResult {
    try {
      let jsonStr = content.trim();
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        hasConsensus: Boolean(parsed.hasConsensus),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        consensusTopics: Array.isArray(parsed.consensusTopics) ? parsed.consensusTopics : [],
        remainingDisagreements: Array.isArray(parsed.remainingDisagreements) ? parsed.remainingDisagreements : [],
        participantAgreement: parsed.participantAgreement || {},
        method: method as any,
      };
    } catch (error) {
      console.error('解析共识响应失败:', error);
      return {
        hasConsensus: false,
        confidence: 0.3,
        consensusTopics: [],
        remainingDisagreements: [],
        participantAgreement: {},
        method: method as any,
      };
    }
  }

  /**
   * 解析投票响应
   */
  private parseVoteResponse(content: string): { hasConsensus: boolean; confidence: number; topics: string[] } {
    try {
      let jsonStr = content.trim();
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        hasConsensus: Boolean(parsed.hasConsensus),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      };
    } catch (error) {
      console.error('解析投票响应失败:', error);
      return {
        hasConsensus: false,
        confidence: 0.5,
        topics: [],
      };
    }
  }

  /**
   * 聚合投票结果
   */
  private aggregateVotes(
    votes: Record<string, { hasConsensus: boolean; confidence: number; topics: string[] }>,
    participants: BrainstormParticipantDTO[],
    config: ConsensusDetectionConfig
  ): ConsensusResult {
    const participantAgreement: Record<string, number> = {};
    let consensusCount = 0;
    let totalConfidence = 0;
    const allTopics = new Set<string>();

    participants.forEach(p => {
      const id = String(p.id);
      const vote = votes[id];
      if (vote) {
        participantAgreement[id] = vote.confidence;
        if (vote.hasConsensus) {
          consensusCount++;
        }
        totalConfidence += vote.confidence;
        vote.topics.forEach(topic => allTopics.add(topic));
      } else {
        participantAgreement[id] = 0.5;
      }
    });

    const agreementRatio = consensusCount / participants.length;
    const avgConfidence = totalConfidence / participants.length;
    const hasConsensus = agreementRatio >= (config.minAgreementRatio || 0.7) && avgConfidence >= config.threshold;

    return {
      hasConsensus,
      confidence: avgConfidence,
      consensusTopics: Array.from(allTopics),
      remainingDisagreements: hasConsensus ? [] : ['部分专家未达成共识'],
      participantAgreement,
      method: 'voting',
    };
  }
}
