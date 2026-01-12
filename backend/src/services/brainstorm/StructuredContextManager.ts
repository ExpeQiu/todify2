import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import {
  BrainstormMessageDTO,
  BrainstormParticipantDTO,
  StructuredContext,
  StructuredContextConfig,
} from '../../models/Brainstorm';

/**
 * 结构化上下文管理器
 * 负责将历史消息压缩为结构化上下文，减少Token消耗
 */
export class StructuredContextManager {
  private agentOrchestrator: AgentOrchestrator;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
  }

  /**
   * 构建结构化上下文
   */
  async buildStructuredContext(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    sessionTopic: string,
    sessionDescription: string | undefined,
    config: StructuredContextConfig,
    lastSummaryRound: number = 0,
    summarizerRoleId?: string
  ): Promise<StructuredContext> {
    // 如果未启用，返回空上下文
    if (!config.enabled) {
      return {
        summary: '',
        keyPoints: [],
        lastSummaryRound: 0,
        tokenEstimate: 0,
      };
    }

    // 获取需要摘要的消息（上次摘要后的新消息）
    const newMessages = messages.filter(m => m.roundNumber > lastSummaryRound);
    
    if (newMessages.length === 0) {
      return {
        summary: '',
        keyPoints: [],
        lastSummaryRound,
        tokenEstimate: 0,
      };
    }

    // 选择摘要Agent
    const roleId = summarizerRoleId || participants[0]?.aiRoleId;
    if (!roleId) {
      throw new Error('没有可用的Agent进行摘要');
    }

    // 构建摘要提示词
    const summaryPrompt = this.buildSummaryPrompt(
      sessionTopic,
      sessionDescription,
      newMessages,
      participants,
      config
    );

    try {
      // 调用Agent生成结构化摘要
      const result = await this.agentOrchestrator.executeAgent(
        roleId,
        summaryPrompt,
        `summary_${Date.now()}`,
        {
          sessionTopic,
          extractKeyPoints: config.extractKeyPoints,
          detectDisagreements: config.detectDisagreements,
        }
      );

      // 解析Agent返回的结构化数据
      const structured = this.parseStructuredResponse(result.content, newMessages, participants);

      // 估算Token消耗
      const tokenEstimate = this.estimateTokens(structured);

      return {
        ...structured,
        lastSummaryRound: Math.max(...newMessages.map(m => m.roundNumber)),
        tokenEstimate,
      };
    } catch (error) {
      console.error('生成结构化上下文失败:', error);
      // 降级为简单摘要
      return this.buildFallbackContext(newMessages, participants, lastSummaryRound);
    }
  }

  /**
   * 构建摘要提示词
   */
  private buildSummaryPrompt(
    topic: string,
    description: string | undefined,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: StructuredContextConfig
  ): string {
    const messagesText = this.formatMessagesForSummary(messages, participants);

    let prompt = `请对以下头脑风暴讨论进行结构化摘要：

讨论话题：${topic}
${description ? `话题描述：${description}\n` : ''}

参与专家：
${participants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}${p.roleType ? `（${p.roleType}）` : ''}`).join('\n')}

讨论记录：
${messagesText}

请提供一份结构化的JSON格式摘要，包含以下内容：
`;

    prompt += `{
  "summary": "讨论的核心摘要（200字以内）",
  "keyPoints": [
    {
      "participantId": "参与者ID",
      "participantName": "参与者名称",
      "point": "关键观点",
      "confidence": 0.8,
      "supportingEvidence": ["支撑证据1", "支撑证据2"],
      "roundNumber": 1
    }
  ]`;

    if (config.detectDisagreements) {
      prompt += `,
  "disagreements": [
    {
      "topic": "分歧主题",
      "positions": {
        "participantId1": "观点1",
        "participantId2": "观点2"
      }
    }
  ],
  "consensus": ["共识点1", "共识点2"]`;
    }

    prompt += `
}

要求：
1. summary要简洁明了，突出核心讨论内容
2. keyPoints要提取每个专家的核心观点，按重要性排序
3. ${config.detectDisagreements ? 'disagreements要识别出明显的分歧点' : ''}
4. 所有字段必须完整，使用有效的JSON格式`;

    return prompt;
  }

  /**
   * 格式化消息用于摘要
   */
  private formatMessagesForSummary(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[]
  ): string {
    const lines: string[] = [];
    
    // 按轮次分组
    const messagesByRound = new Map<number, BrainstormMessageDTO[]>();
    for (const msg of messages) {
      if (!messagesByRound.has(msg.roundNumber)) {
        messagesByRound.set(msg.roundNumber, []);
      }
      messagesByRound.get(msg.roundNumber)!.push(msg);
    }

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
   * 解析Agent返回的结构化响应
   */
  private parseStructuredResponse(
    content: string,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[]
  ): Omit<StructuredContext, 'lastSummaryRound' | 'tokenEstimate'> {
    try {
      // 尝试提取JSON（可能包含markdown代码块）
      let jsonStr = content.trim();
      
      // 移除markdown代码块标记
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      // 验证和转换数据
      const keyPoints = (parsed.keyPoints || []).map((kp: any) => ({
        participantId: String(kp.participantId || ''),
        participantName: kp.participantName || '未知',
        point: kp.point || '',
        confidence: kp.confidence || 0.5,
        supportingEvidence: kp.supportingEvidence || [],
        roundNumber: kp.roundNumber || 1,
      }));

      return {
        summary: parsed.summary || '',
        keyPoints,
        disagreements: parsed.disagreements || [],
        consensus: parsed.consensus || [],
      };
    } catch (error) {
      console.error('解析结构化响应失败:', error);
      // 降级处理：从内容中提取摘要
      return {
        summary: content.substring(0, 500),
        keyPoints: [],
        disagreements: [],
        consensus: [],
      };
    }
  }

  /**
   * 构建降级上下文（当Agent调用失败时）
   */
  private buildFallbackContext(
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    lastSummaryRound: number
  ): StructuredContext {
    // 简单提取最后几轮的关键信息
    const recentMessages = messages.slice(-10);
    const summary = recentMessages
      .map(msg => {
        const participant = participants.find(p => p.id === msg.participantId);
        const name = participant?.displayName || participant?.aiRole?.name || '专家';
        return `${name}: ${msg.content.substring(0, 100)}`;
      })
      .join('\n');

    return {
      summary,
      keyPoints: [],
      lastSummaryRound: Math.max(...messages.map(m => m.roundNumber)),
      tokenEstimate: summary.length / 4, // 粗略估算
    };
  }

  /**
   * 估算Token数量
   */
  private estimateTokens(context: Omit<StructuredContext, 'lastSummaryRound' | 'tokenEstimate'>): number {
    const text = JSON.stringify(context);
    // 粗略估算：中文约1.5字符/token，英文约4字符/token
    return Math.ceil(text.length / 2.5);
  }

  /**
   * 格式化结构化上下文为文本（用于传递给Agent）
   */
  formatContextForAgent(context: StructuredContext, maxTokens?: number): string {
    if (!context.summary && context.keyPoints.length === 0) {
      return '';
    }

    const parts: string[] = [];

    if (context.summary) {
      parts.push(`## 讨论摘要\n${context.summary}\n`);
    }

    if (context.keyPoints.length > 0) {
      parts.push('## 关键观点\n');
      context.keyPoints.forEach((kp, idx) => {
        parts.push(`${idx + 1}. **${kp.participantName}**：${kp.point}`);
        if (kp.supportingEvidence && kp.supportingEvidence.length > 0) {
          parts.push(`   支撑：${kp.supportingEvidence.join('；')}`);
        }
      });
      parts.push('');
    }

    if (context.disagreements && context.disagreements.length > 0) {
      parts.push('## 当前分歧\n');
      context.disagreements.forEach((dis, idx) => {
        parts.push(`${idx + 1}. **${dis.topic}**`);
        Object.entries(dis.positions).forEach(([pid, pos]) => {
          parts.push(`   - ${pid}: ${pos}`);
        });
      });
      parts.push('');
    }

    if (context.consensus && context.consensus.length > 0) {
      parts.push(`## 已达成共识\n${context.consensus.map(c => `- ${c}`).join('\n')}\n`);
    }

    const result = parts.join('\n');

    // 如果指定了最大Token，进行截断
    if (maxTokens) {
      const estimated = this.estimateTokens({ summary: result, keyPoints: [] });
      if (estimated > maxTokens) {
        // 简单截断（实际应该更智能）
        const ratio = maxTokens / estimated;
        return result.substring(0, Math.floor(result.length * ratio)) + '...';
      }
    }

    return result;
  }
}
