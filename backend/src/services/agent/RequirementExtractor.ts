import { AgentOrchestrator, AgentExecutionResult } from './AgentOrchestrator';
import { ChatMessage } from '../llm/types';
import { aiRoleModel } from '../../models';

/**
 * 已选择的资源
 */
export interface SelectedResources {
  techPointIds: number[];
  knowledgePointIds: number[];
  sourceIds: number[];
}

/**
 * 提取的需求信息
 */
export interface ExtractedRequirement {
  scene: 'tech-package' | 'tech-strategy' | 'tech-article' | 'unknown';
  confidence: number;              // 识别置信度 0-1
  techScope: string[];             // 涉及的技术点
  targetAudience: string;          // 目标受众
  outputFormat: string;            // 输出格式要求
  keyRequirements: string[];       // 关键需求点
  selectedResources: SelectedResources;  // 已选择的资源
  conversationSummary: string;     // 对话摘要
}

/**
 * 需求提取器
 * 从AI问答历史中提取结构化需求
 */
export class RequirementExtractor {
  constructor(private agentOrchestrator: AgentOrchestrator) {}

  /**
   * 从对话历史中提取需求
   * @param projectId 项目ID
   * @param conversationHistory 对话历史
   * @param selectedResources 已选择的资源
   * @returns 提取的需求信息
   */
  async extractFromConversation(
    projectId: number,
    conversationHistory: ChatMessage[],
    selectedResources: SelectedResources
  ): Promise<ExtractedRequirement> {
    // 构建提取Prompt
    const conversationText = conversationHistory
      .map(msg => {
        const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : '系统';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    const prompt = `
你是一个需求分析专家。请分析以下AI问答对话，提取用户的真实需求。

对话历史：
${conversationText}

用户已选择的资源：
- 技术点：${selectedResources.techPointIds.length}个
- 知识点：${selectedResources.knowledgePointIds.length}个  
- 来源信息：${selectedResources.sourceIds.length}个

请识别：
1. 业务场景（tech-package/tech-strategy/tech-article/unknown）
   - tech-package: 技术包装，生成技术亮点、卖点包装内容
   - tech-strategy: 技术策略，生成技术传播策略文档
   - tech-article: 技术通稿，生成新闻稿、技术文章
   - unknown: 无法确定场景
2. 涉及的技术范围（列出关键词或技术点名称）
3. 目标受众（如：企业客户、个人用户、媒体记者、投资者等）
4. 输出格式要求（如：长文、短文、PPT要点、新闻稿等）
5. 关键需求点（用户特别强调的要求）

输出JSON格式（必须严格遵循，不要添加任何额外说明）：
{
  "scene": "tech-strategy",
  "confidence": 0.85,
  "techScope": ["技术点A", "技术点B"],
  "targetAudience": "企业客户",
  "outputFormat": "长文",
  "keyRequirements": ["突出创新", "强调商业价值"],
  "conversationSummary": "用户希望生成一份针对企业客户的技术策略文档，重点突出技术创新和商业价值..."
}
`;

    try {
      // 尝试找到一个可用的Agent用于需求提取
      let agentId = 'requirement-extractor'; // 默认ID
      
      // 尝试获取所有可用的Agent
      try {
        const allRoles = await aiRoleModel.getAll();
        const availableAgent = allRoles.find(
          role => role.enabled && 
          role.provider === 'direct-agent' && 
          role.agentConfig
        );
        
        if (availableAgent) {
          agentId = availableAgent.id;
        }
      } catch (e) {
        console.warn('无法获取Agent列表，使用默认ID:', e);
      }

      // 执行Agent
      const result = await this.agentOrchestrator.executeAgent(
        agentId,
        prompt,
        '',
        { parseJSON: true }
      );

      // 尝试解析JSON
      let extracted: any;
      try {
        // 尝试直接解析
        extracted = JSON.parse(result.content);
      } catch (e) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法从响应中提取JSON');
        }
      }

      // 验证必需字段
      if (!extracted.scene) {
        extracted.scene = 'unknown';
      }
      if (typeof extracted.confidence !== 'number') {
        extracted.confidence = 0.5;
      }
      if (!Array.isArray(extracted.techScope)) {
        extracted.techScope = [];
      }
      if (!extracted.targetAudience) {
        extracted.targetAudience = '企业客户';
      }
      if (!extracted.outputFormat) {
        extracted.outputFormat = '长文';
      }
      if (!Array.isArray(extracted.keyRequirements)) {
        extracted.keyRequirements = [];
      }
      if (!extracted.conversationSummary) {
        extracted.conversationSummary = '用户希望通过AI问答生成专业内容';
      }

      // 添加已选资源
      extracted.selectedResources = {
        techPointIds: selectedResources.techPointIds,
        knowledgePointIds: selectedResources.knowledgePointIds,
        sourceIds: selectedResources.sourceIds
      };

      return extracted as ExtractedRequirement;
    } catch (error) {
      console.error('需求提取失败:', error);
      
      // 返回默认值
      return {
        scene: 'unknown',
        confidence: 0,
        techScope: [],
        targetAudience: '企业客户',
        outputFormat: '长文',
        keyRequirements: [],
        selectedResources,
        conversationSummary: '需求提取失败，请手动选择场景'
      };
    }
  }
}

