import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import {
  BrainstormMessageDTO,
  BrainstormParticipantDTO,
  BrainstormSessionDTO,
  EvaluationResult,
  ReflectionResult,
  ReflectionLoopConfig,
} from '../../models/Brainstorm';
import { StructuredContextManager } from './StructuredContextManager';

/**
 * 评审-反思循环管理器
 * 负责评估讨论质量并生成改进建议
 */
export class ReflectionLoopManager {
  private agentOrchestrator: AgentOrchestrator;
  private contextManager: StructuredContextManager;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
    this.contextManager = new StructuredContextManager();
  }

  /**
   * 执行评审
   */
  async evaluate(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    evaluatorRoleId?: string
  ): Promise<EvaluationResult> {
    const roleId = evaluatorRoleId || participants[0]?.aiRoleId;
    if (!roleId) {
      throw new Error('没有可用的Agent进行评审');
    }

    // 构建评审提示词
    const evaluationPrompt = this.buildEvaluationPrompt(
      session,
      messages,
      participants
    );

    try {
      const result = await this.agentOrchestrator.executeAgent(
        roleId,
        evaluationPrompt,
        `evaluation_${session.id}_${Date.now()}`,
        {
          sessionTopic: session.topic,
          messageCount: messages.length,
          participantCount: participants.length,
        }
      );

      return this.parseEvaluationResponse(result.content);
    } catch (error) {
      console.error('评审执行失败:', error);
      // 返回默认评审结果
      return {
        score: 0.5,
        feedback: '评审过程出现错误，无法提供详细反馈',
        strengths: [],
        weaknesses: ['评审过程失败'],
        suggestions: ['请检查Agent配置'],
      };
    }
  }

  /**
   * 执行反思
   */
  async reflect(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    evaluation: EvaluationResult,
    reflectorRoleId?: string
  ): Promise<ReflectionResult> {
    const roleId = reflectorRoleId || participants[0]?.aiRoleId;
    if (!roleId) {
      throw new Error('没有可用的Agent进行反思');
    }

    // 构建反思提示词
    const reflectionPrompt = this.buildReflectionPrompt(
      session,
      messages,
      participants,
      evaluation
    );

    try {
      const result = await this.agentOrchestrator.executeAgent(
        roleId,
        reflectionPrompt,
        `reflection_${session.id}_${Date.now()}`,
        {
          sessionTopic: session.topic,
          evaluationScore: evaluation.score,
        }
      );

      return this.parseReflectionResponse(result.content, participants);
    } catch (error) {
      console.error('反思执行失败:', error);
      // 返回默认反思结果
      return {
        analysis: '反思过程出现错误',
        improvementSuggestions: [
          {
            suggestion: '请检查Agent配置',
            priority: 'high',
          },
        ],
        nextRoundFocus: '继续讨论',
      };
    }
  }

  /**
   * 执行完整的评审-反思循环
   */
  async executeReflectionLoop(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    config: ReflectionLoopConfig
  ): Promise<{
    evaluation: EvaluationResult;
    reflection: ReflectionResult | null;
    shouldContinue: boolean;
    iteration: number;
  }> {
    if (!config.enabled) {
      return {
        evaluation: {
          score: 0.5,
          feedback: '反思循环未启用',
          strengths: [],
          weaknesses: [],
          suggestions: [],
        },
        reflection: null,
        shouldContinue: true,
        iteration: 0,
      };
    }

    let iteration = 0;
    let currentQuality = 0;
    let shouldContinue = true;

    // 执行评审
    const evaluation = await this.evaluate(
      session,
      messages,
      participants,
      config.evaluatorRoleId
    );

    currentQuality = evaluation.score;
    iteration++;

    // 如果质量达标，不需要反思
    if (currentQuality >= config.qualityThreshold) {
      return {
        evaluation,
        reflection: null,
        shouldContinue: true,
        iteration,
      };
    }

    // 如果未达标且未超过最大迭代次数，执行反思
    if (iteration < config.maxIterations) {
      const reflection = await this.reflect(
        session,
        messages,
        participants,
        evaluation,
        config.reflectorRoleId
      );

      return {
        evaluation,
        reflection,
        shouldContinue: true, // 继续下一轮讨论
        iteration,
      };
    }

    // 超过最大迭代次数，停止
    return {
      evaluation,
      reflection: null,
      shouldContinue: false,
      iteration,
    };
  }

  /**
   * 构建评审提示词
   */
  private buildEvaluationPrompt(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[]
  ): string {
    const messagesText = this.formatMessagesForEvaluation(messages, participants);

    return `你是一位专业的讨论质量评审专家。请对以下头脑风暴讨论进行评审。

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

参与专家：
${participants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}${p.roleType ? `（${p.roleType}）` : ''}`).join('\n')}

讨论记录：
${messagesText}

请从以下维度进行评审：
1. **讨论深度**：观点是否深入、有洞察力
2. **观点多样性**：是否从多个角度分析问题
3. **逻辑性**：论证是否清晰、有逻辑
4. **实用性**：建议是否具有可操作性
5. **创新性**：是否有新颖的观点或思路

请以JSON格式返回评审结果：
{
  "score": 0.85,
  "feedback": "整体讨论质量较高，但某些方面需要改进...",
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestions": ["改进建议1", "改进建议2"]
}

评分范围：0-1，0.7以上为良好，0.8以上为优秀。`;
  }

  /**
   * 构建反思提示词
   */
  private buildReflectionPrompt(
    session: BrainstormSessionDTO,
    messages: BrainstormMessageDTO[],
    participants: BrainstormParticipantDTO[],
    evaluation: EvaluationResult
  ): string {
    const messagesText = this.formatMessagesForEvaluation(messages, participants);

    return `你是一位专业的讨论反思专家。基于以下评审结果，请提供改进建议。

讨论话题：${session.topic}
${session.description ? `话题描述：${session.description}\n` : ''}

参与专家：
${participants.map((p, i) => `${i + 1}. ${p.displayName || p.aiRole?.name || '专家'}（ID: ${p.id}）`).join('\n')}

讨论记录：
${messagesText}

评审结果：
- 评分：${evaluation.score}/1.0
- 反馈：${evaluation.feedback}
- 优点：${evaluation.strengths.join('、')}
- 不足：${evaluation.weaknesses.join('、')}
- 建议：${evaluation.suggestions.join('、')}

请提供结构化的反思和改进建议，以JSON格式返回：
{
  "analysis": "对当前讨论的深入分析...",
  "improvementSuggestions": [
    {
      "targetParticipantId": "参与者ID（可选，如果针对特定专家）",
      "suggestion": "具体的改进建议",
      "priority": "high|medium|low"
    }
  ],
  "nextRoundFocus": "下一轮讨论应该重点关注的方向"
}

要求：
1. improvementSuggestions要具体、可操作
2. 如果建议针对特定专家，请使用targetParticipantId
3. priority要合理分配（high不超过3个）`;
  }

  /**
   * 格式化消息用于评审
   */
  private formatMessagesForEvaluation(
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
   * 解析评审响应
   */
  private parseEvaluationResponse(content: string): EvaluationResult {
    try {
      let jsonStr = content.trim();
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        score: Math.max(0, Math.min(1, parsed.score || 0.5)),
        feedback: parsed.feedback || '无反馈',
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.error('解析评审响应失败:', error);
      return {
        score: 0.5,
        feedback: content.substring(0, 200),
        strengths: [],
        weaknesses: [],
        suggestions: [],
      };
    }
  }

  /**
   * 解析反思响应
   */
  private parseReflectionResponse(
    content: string,
    participants: BrainstormParticipantDTO[]
  ): ReflectionResult {
    try {
      let jsonStr = content.trim();
      
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      // 验证targetParticipantId是否存在
      const validParticipantIds = new Set(participants.map(p => String(p.id)));

      const improvementSuggestions = (parsed.improvementSuggestions || []).map((s: any) => {
        // 如果指定了targetParticipantId，验证其有效性
        if (s.targetParticipantId && !validParticipantIds.has(String(s.targetParticipantId))) {
          console.warn(`无效的targetParticipantId: ${s.targetParticipantId}`);
          delete s.targetParticipantId;
        }

        return {
          targetParticipantId: s.targetParticipantId ? String(s.targetParticipantId) : undefined,
          suggestion: s.suggestion || '',
          priority: ['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium',
        };
      });

      return {
        analysis: parsed.analysis || '无分析',
        improvementSuggestions,
        nextRoundFocus: parsed.nextRoundFocus || '继续讨论',
      };
    } catch (error) {
      console.error('解析反思响应失败:', error);
      return {
        analysis: content.substring(0, 300),
        improvementSuggestions: [
          {
            suggestion: '请继续深入讨论',
            priority: 'medium',
          },
        ],
        nextRoundFocus: '继续讨论',
      };
    }
  }
}
