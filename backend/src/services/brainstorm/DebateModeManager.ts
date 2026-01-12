import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import {
  BrainstormMessageDTO,
  BrainstormParticipantDTO,
  BrainstormSessionDTO,
  DebateConfig,
} from '../../models/Brainstorm';
import { brainstormMessageModel, brainstormParticipantModel } from '../../models';

/**
 * 辩论评判结果
 */
export interface DebateJudgment {
  roundNumber: number;
  proScore: number;                  // 正方得分 0-10
  conScore: number;                  // 反方得分 0-10
  winner: 'pro' | 'con' | 'tie';     // 获胜方
  proStrengths: string[];            // 正方优势
  conStrengths: string[];            // 反方优势
  proWeaknesses: string[];           // 正方不足
  conWeaknesses: string[];           // 反方不足
  overallAnalysis: string;           // 总体分析
  nextRoundFocus: string;            // 下一轮重点
}

/**
 * 辩论模式管理器
 * 负责管理正反方辩论流程和评判
 */
export class DebateModeManager {
  private agentOrchestrator: AgentOrchestrator;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
  }

  /**
   * 执行辩论轮次
   */
  async executeDebateRound(
    session: BrainstormSessionDTO,
    roundNumber: number,
    config: DebateConfig
  ): Promise<BrainstormMessageDTO[]> {
    const participants = await brainstormParticipantModel.getBySessionId(session.id);
    const historyMessages = await brainstormMessageModel.getBySessionId(session.id);

    // 分离正反方参与者
    const proParticipants = participants.filter(p => config.proRoleIds.includes(p.aiRoleId));
    const conParticipants = participants.filter(p => config.conRoleIds.includes(p.aiRoleId));

    if (proParticipants.length === 0 || conParticipants.length === 0) {
      throw new Error('辩论模式需要至少一个正方和一个反方参与者');
    }

    const messages: BrainstormMessageDTO[] = [];

    // 第一轮：正方先发言
    if (roundNumber === 1) {
      // 正方发言
      const proMessages = await this.executeSideTurn(
        session,
        proParticipants,
        'pro',
        roundNumber,
        historyMessages,
        '请从正方角度阐述你的观点，支持讨论话题。'
      );
      messages.push(...proMessages);

      // 反方发言
      const conMessages = await this.executeSideTurn(
        session,
        conParticipants,
        'con',
        roundNumber,
        [...historyMessages, ...proMessages],
        '请从反方角度反驳正方观点，提出不同意见。'
      );
      messages.push(...conMessages);
    } else {
      // 后续轮次：交替发言
      // 先让反方回应上一轮的正方观点
      const conMessages = await this.executeSideTurn(
        session,
        conParticipants,
        'con',
        roundNumber,
        historyMessages,
        `请回应上一轮正方的观点，继续从反方角度进行反驳。`
      );
      messages.push(...conMessages);

      // 然后正方回应
      const proMessages = await this.executeSideTurn(
        session,
        proParticipants,
        'pro',
        roundNumber,
        [...historyMessages, ...conMessages],
        `请回应上一轮反方的观点，继续从正方角度进行论证。`
      );
      messages.push(...proMessages);
    }

    // 如果配置了裁判，进行评判
    if (config.judgeRoleId && 
        (config.judgeAfterRounds === undefined || roundNumber % (config.judgeAfterRounds || 1) === 0)) {
      const judgment = await this.judgeDebate(
        session,
        roundNumber,
        [...historyMessages, ...messages],
        proParticipants,
        conParticipants,
        config.judgeRoleId
      );

      // 保存评判结果
      if (judgment) {
        await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: null,
          roundNumber,
          content: this.formatJudgment(judgment),
          messageType: 'agent',
          metadata: {
            judgment,
            isSystemMessage: true,
            isJudgment: true,
          },
        });
      }
    }

    return messages;
  }

  /**
   * 执行一方（正方或反方）的发言
   */
  private async executeSideTurn(
    session: BrainstormSessionDTO,
    participants: BrainstormParticipantDTO[],
    side: 'pro' | 'con',
    roundNumber: number,
    historyMessages: BrainstormMessageDTO[],
    instruction: string
  ): Promise<BrainstormMessageDTO[]> {
    const messages: BrainstormMessageDTO[] = [];

    // 并行执行该方的所有参与者
    const promises = participants.map(async (participant) => {
      const query = this.buildDebateQuery(
        session,
        participant,
        side,
        roundNumber,
        historyMessages,
        instruction
      );

      const conversationId = `${session.id}_${participant.id}_${side}`;

      try {
        const result = await this.agentOrchestrator.executeAgent(
          participant.aiRoleId,
          query,
          conversationId,
          {
            topic: session.topic,
            description: session.description,
            roundNumber,
            side,
            participantName: participant.displayName || participant.aiRole?.name || '专家',
          }
        );

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
            debateSide: side,
          },
        });
      } catch (error) {
        console.error(`辩论参与者 ${participant.id} 执行失败:`, error);
        return await brainstormMessageModel.create({
          sessionId: session.id,
          participantId: participant.id,
          roundNumber,
          content: `抱歉，我在思考这个问题时遇到了困难。${error instanceof Error ? error.message : '未知错误'}`,
          metadata: {
            error: error instanceof Error ? error.message : '未知错误',
            debateSide: side,
          },
        });
      }
    });

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        messages.push(result.value);
      }
    }

    return messages;
  }

  /**
   * 构建辩论查询
   */
  private buildDebateQuery(
    session: BrainstormSessionDTO,
    participant: BrainstormParticipantDTO,
    side: 'pro' | 'con',
    roundNumber: number,
    historyMessages: BrainstormMessageDTO[],
    instruction: string
  ): string {
    const participantName = participant.displayName || participant.aiRole?.name || '专家';
    const sideName = side === 'pro' ? '正方' : '反方';

    let query = `讨论话题：${session.topic}\n`;
    if (session.description) {
      query += `话题描述：${session.description}\n`;
    }

    query += `\n你的角色：${participantName}（${sideName}）\n`;

    // 添加历史讨论
    if (historyMessages.length > 0) {
      query += `\n历史讨论记录：\n`;
      const messagesByRound = new Map<number, BrainstormMessageDTO[]>();
      for (const msg of historyMessages) {
        if (!messagesByRound.has(msg.roundNumber)) {
          messagesByRound.set(msg.roundNumber, []);
        }
        messagesByRound.get(msg.roundNumber)!.push(msg);
      }

      const sortedRounds = Array.from(messagesByRound.keys()).sort((a, b) => a - b);
      for (const round of sortedRounds) {
        query += `[轮次 ${round}]\n`;
        const roundMessages = messagesByRound.get(round)!;
        for (const msg of roundMessages) {
          const side = msg.metadata?.debateSide === 'pro' ? '[正方]' : msg.metadata?.debateSide === 'con' ? '[反方]' : '';
          query += `${side} ${msg.content}\n`;
        }
        query += '\n';
      }
    }

    query += `\n${instruction}\n`;
    query += `\n要求：\n`;
    if (side === 'pro') {
      query += `1. 支持讨论话题，提供有力的论证\n`;
      query += `2. 回应反方的质疑和反驳\n`;
      query += `3. 提供具体案例或数据支撑\n`;
      query += `4. 逻辑清晰，论证严密\n`;
    } else {
      query += `1. 质疑或反驳讨论话题，提出不同观点\n`;
      query += `2. 指出正方的逻辑漏洞或不足\n`;
      query += `3. 提供替代方案或风险分析\n`;
      query += `4. 论证有力，反驳精准\n`;
    }
    query += `\n请用简洁、专业的语言表达你的观点，控制在300字以内。`;

    return query;
  }

  /**
   * 评判辩论
   */
  private async judgeDebate(
    session: BrainstormSessionDTO,
    roundNumber: number,
    messages: BrainstormMessageDTO[],
    proParticipants: BrainstormParticipantDTO[],
    conParticipants: BrainstormParticipantDTO[],
    judgeRoleId: string
  ): Promise<DebateJudgment | null> {
    const messagesText = this.formatMessagesForJudgment(messages, proParticipants, conParticipants);

    const prompt = `你是一位专业的辩论裁判。请对以下辩论进行评判。

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

正方参与者：
${proParticipants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}`).join('\n')}

反方参与者：
${conParticipants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}`).join('\n')}

辩论记录：
${messagesText}

请从以下维度进行评判：
1. **论证质量**：逻辑是否清晰，论证是否有力
2. **论据支撑**：是否有充分的案例、数据或理论支撑
3. **反驳效果**：是否有效回应对方观点
4. **语言表达**：是否清晰、准确、有说服力
5. **整体表现**：综合表现如何

请以JSON格式返回评判结果：
{
  "roundNumber": ${roundNumber},
  "proScore": 7.5,
  "conScore": 8.0,
  "winner": "con",
  "proStrengths": ["优势1", "优势2"],
  "conStrengths": ["优势1", "优势2"],
  "proWeaknesses": ["不足1", "不足2"],
  "conWeaknesses": ["不足1", "不足2"],
  "overallAnalysis": "总体分析...",
  "nextRoundFocus": "下一轮应该重点关注..."
}

评分标准：
- 每方得分：0-10分
- winner: "pro" | "con" | "tie"
- 如果得分差距小于0.5，则为"tie"`;

    try {
      const result = await this.agentOrchestrator.executeAgent(
        judgeRoleId,
        prompt,
        `debate_judgment_${session.id}_${roundNumber}`,
        {}
      );

      return this.parseJudgmentResponse(result.content, roundNumber);
    } catch (error) {
      console.error('辩论评判失败:', error);
      return null;
    }
  }

  /**
   * 格式化消息用于评判
   */
  private formatMessagesForJudgment(
    messages: BrainstormMessageDTO[],
    proParticipants: BrainstormParticipantDTO[],
    conParticipants: BrainstormParticipantDTO[]
  ): string {
    const lines: string[] = [];
    const proIds = new Set(proParticipants.map(p => p.id));
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

      // 按正反方分组
      const proMessages = roundMessages.filter(m => m.participantId && proIds.has(m.participantId));
      const conMessages = roundMessages.filter(m => m.participantId && !proIds.has(m.participantId));

      if (proMessages.length > 0) {
        lines.push('【正方】');
        proMessages.forEach(msg => {
          const participant = proParticipants.find(p => p.id === msg.participantId);
          const name = participant?.displayName || participant?.aiRole?.name || '未知';
          lines.push(`${name}: ${msg.content}`);
        });
      }

      if (conMessages.length > 0) {
        lines.push('【反方】');
        conMessages.forEach(msg => {
          const participant = conParticipants.find(p => p.id === msg.participantId);
          const name = participant?.displayName || participant?.aiRole?.name || '未知';
          lines.push(`${name}: ${msg.content}`);
        });
      }
    }

    return lines.join('\n');
  }

  /**
   * 解析评判响应
   */
  private parseJudgmentResponse(content: string, roundNumber: number): DebateJudgment | null {
    try {
      let jsonStr = content.trim();

      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      const proScore = Math.max(0, Math.min(10, parsed.proScore || 5));
      const conScore = Math.max(0, Math.min(10, parsed.conScore || 5));
      const diff = Math.abs(proScore - conScore);
      const winner = diff < 0.5 ? 'tie' : (proScore > conScore ? 'pro' : 'con');

      return {
        roundNumber: parsed.roundNumber || roundNumber,
        proScore,
        conScore,
        winner,
        proStrengths: Array.isArray(parsed.proStrengths) ? parsed.proStrengths : [],
        conStrengths: Array.isArray(parsed.conStrengths) ? parsed.conStrengths : [],
        proWeaknesses: Array.isArray(parsed.proWeaknesses) ? parsed.proWeaknesses : [],
        conWeaknesses: Array.isArray(parsed.conWeaknesses) ? parsed.conWeaknesses : [],
        overallAnalysis: parsed.overallAnalysis || '无分析',
        nextRoundFocus: parsed.nextRoundFocus || '继续辩论',
      };
    } catch (error) {
      console.error('解析评判响应失败:', error);
      return null;
    }
  }

  /**
   * 格式化评判结果
   */
  private formatJudgment(judgment: DebateJudgment): string {
    const lines: string[] = [];
    lines.push(`[辩论评判 - 第${judgment.roundNumber}轮]`);
    lines.push(`\n得分：`);
    lines.push(`  正方：${judgment.proScore.toFixed(1)}分`);
    lines.push(`  反方：${judgment.conScore.toFixed(1)}分`);
    lines.push(`  获胜方：${judgment.winner === 'pro' ? '正方' : judgment.winner === 'con' ? '反方' : '平局'}`);

    if (judgment.proStrengths.length > 0) {
      lines.push(`\n正方优势：`);
      judgment.proStrengths.forEach(s => lines.push(`  - ${s}`));
    }

    if (judgment.conStrengths.length > 0) {
      lines.push(`\n反方优势：`);
      judgment.conStrengths.forEach(s => lines.push(`  - ${s}`));
    }

    if (judgment.proWeaknesses.length > 0) {
      lines.push(`\n正方不足：`);
      judgment.proWeaknesses.forEach(w => lines.push(`  - ${w}`));
    }

    if (judgment.conWeaknesses.length > 0) {
      lines.push(`\n反方不足：`);
      judgment.conWeaknesses.forEach(w => lines.push(`  - ${w}`));
    }

    lines.push(`\n总体分析：\n${judgment.overallAnalysis}`);
    lines.push(`\n下一轮重点：${judgment.nextRoundFocus}`);

    return lines.join('\n');
  }
}
