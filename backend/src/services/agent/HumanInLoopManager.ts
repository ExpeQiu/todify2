import { AgentOrchestrator, AgentExecutionResult } from './AgentOrchestrator';
import { DatabaseManager, db } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * 内容版本
 */
export interface ContentVersion {
  versionId: string;
  executionId: string;
  content: string;
  timestamp: Date;
  changeDescription?: string;
  changedBy: 'system' | 'user';
}

/**
 * 局部优化请求
 */
export interface LocalOptimizationRequest {
  executionId: string;
  versionId: string;
  selectedText: string;
  startPosition: number;
  endPosition: number;
  toolAgentId: string;
  instruction?: string;
  contextBefore?: string;
  contextAfter?: string;
}

/**
 * 局部优化结果
 */
export interface LocalOptimizationResult {
  originalText: string;
  optimizedText: string;
  changeDescription: string;
  newVersionId: string;
  fullContent: string;
}

/**
 * 人机协作管理器
 * 管理内容版本和局部优化
 */
export class HumanInLoopManager {
  private agentOrchestrator: AgentOrchestrator;
  private versionStore: Map<string, ContentVersion[]> = new Map();

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
  }

  /**
   * 保存内容版本
   */
  async saveVersion(
    executionId: string,
    content: string,
    changeDescription?: string,
    changedBy: 'system' | 'user' = 'system'
  ): Promise<string> {
    const versionId = `v-${Date.now()}`;
    const version: ContentVersion = {
      versionId,
      executionId,
      content,
      timestamp: new Date(),
      changeDescription,
      changedBy
    };

    if (!this.versionStore.has(executionId)) {
      this.versionStore.set(executionId, []);
    }
    this.versionStore.get(executionId)!.push(version);

    // TODO: 保存到数据库
    // await this.saveVersionToDB(version);

    return versionId;
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(executionId: string): Promise<ContentVersion[]> {
    // 先从内存获取
    const versions = this.versionStore.get(executionId) || [];
    
    // TODO: 从数据库加载
    // const dbVersions = await this.loadVersionsFromDB(executionId);
    // return [...versions, ...dbVersions].sort((a, b) => 
    //   b.timestamp.getTime() - a.timestamp.getTime()
    // );

    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 获取指定版本
   */
  async getVersion(executionId: string, versionId: string): Promise<ContentVersion | null> {
    const versions = await this.getVersionHistory(executionId);
    return versions.find(v => v.versionId === versionId) || null;
  }

  /**
   * 局部优化
   */
  async optimizeLocalContent(
    request: LocalOptimizationRequest
  ): Promise<LocalOptimizationResult> {
    // 1. 获取当前版本
    const versions = await this.getVersionHistory(request.executionId);
    const currentVersion = versions.find(v => v.versionId === request.versionId);
    
    if (!currentVersion) {
      throw new Error('版本不存在');
    }

    // 2. 构建工具Agent的Prompt
    const toolPrompt = this.buildToolPrompt(request);

    // 3. 调用工具Agent
    console.log(`[HumanInLoopManager] 调用工具Agent: ${request.toolAgentId}`);
    
    // 尝试找到一个可用的Agent
    let agentId = request.toolAgentId;
    try {
      const result = await this.agentOrchestrator.executeAgent(
        agentId,
        toolPrompt,
        '',
        { localOptimization: true }
      );

      const optimizedText = result.content.trim();

      // 4. 替换原文中的选中部分
      const fullContent = 
        currentVersion.content.substring(0, request.startPosition) +
        optimizedText +
        currentVersion.content.substring(request.endPosition);

      // 5. 保存新版本
      const toolName = this.getToolName(request.toolAgentId);
      const newVersionId = await this.saveVersion(
        request.executionId,
        fullContent,
        `使用 ${toolName} 优化局部内容`,
        'user'
      );

      return {
        originalText: request.selectedText,
        optimizedText,
        changeDescription: `使用 ${toolName} 优化局部内容`,
        newVersionId,
        fullContent
      };
    } catch (error: any) {
      console.error(`[HumanInLoopManager] 工具Agent ${agentId} 执行失败:`, error);
      
      // 如果Agent不存在，抛出错误
      if (error.message?.includes('不存在') || error.message?.includes('not found')) {
        throw new Error(`工具Agent ${agentId} 不存在，请先配置该Agent`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 构建工具Prompt
   */
  private buildToolPrompt(request: LocalOptimizationRequest): string {
    let prompt = '';

    // 添加上下文
    if (request.contextBefore) {
      prompt += `## 前文上下文\n${request.contextBefore}\n\n`;
    }

    prompt += `## 需要优化的内容\n${request.selectedText}\n\n`;

    if (request.contextAfter) {
      prompt += `## 后文上下文\n${request.contextAfter}\n\n`;
    }

    // 添加用户指令
    if (request.instruction) {
      prompt += `## 用户要求\n${request.instruction}\n\n`;
    }

    // 根据工具类型添加不同的指令
    const toolInstruction = this.getToolInstruction(request.toolAgentId);
    prompt += toolInstruction;

    return prompt;
  }

  /**
   * 获取工具指令
   */
  private getToolInstruction(toolAgentId: string): string {
    const instructions: Record<string, string> = {
      'polish-writer': `请优化以下内容的文字表达：
- 使语言更加流畅自然
- 提升专业性和准确性
- 保持原意不变
- 确保与上下文连贯

请直接输出优化后的内容，不要添加额外说明。`,
      'simplify-writer': `请将以下内容简化：
- 去除冗余表达
- 使用通俗易懂的语言
- 保留核心信息
- 适合目标受众理解

请直接输出简化后的内容，不要添加额外说明。`,
      'enhance-technical': `请增强以下内容的技术深度：
- 补充技术原理
- 添加技术细节
- 提供更专业的描述
- 确保准确性

请直接输出增强后的内容，不要添加额外说明。`,
      'web-search-supplement': `请为以下内容补充相关信息：
1. 识别内容中需要补充的信息点
2. 模拟搜索相关信息
3. 补充到原文中
4. 标注信息来源

请直接输出补充后的内容，不要添加额外说明。`,
      'competitor-research': `请为以下内容补充竞品信息：
- 识别相关竞品
- 对比技术特点
- 分析优劣势
- 提供客观评价

请直接输出补充后的内容，不要添加额外说明。`,
      'case-study-finder': `请为以下内容补充应用案例：
- 寻找相关应用场景
- 提供具体案例
- 说明实际效果
- 增强说服力

请直接输出补充后的内容，不要添加额外说明。`,
      'format-structure': `请优化以下内容的结构：
- 调整层次关系
- 改进逻辑顺序
- 使用恰当的标题
- 增强可读性

请直接输出优化后的内容，不要添加额外说明。`,
      'bullet-points': `请将以下内容转换为要点列表：
- 提取核心要点
- 使用简洁表达
- 保持逻辑清晰
- 易于快速阅读

请直接输出要点列表，不要添加额外说明。`
    };

    return instructions[toolAgentId] || `请优化以下内容，保持与上下文的连贯性，直接输出优化后的内容，不要添加额外说明。`;
  }

  /**
   * 获取工具名称
   */
  private getToolName(toolAgentId: string): string {
    const names: Record<string, string> = {
      'polish-writer': '文字润色',
      'simplify-writer': '简化表达',
      'enhance-technical': '技术增强',
      'web-search-supplement': '互联网搜索补充',
      'competitor-research': '竞品调研',
      'case-study-finder': '案例补充',
      'format-structure': '结构优化',
      'bullet-points': '转换为要点'
    };

    return names[toolAgentId] || toolAgentId;
  }

  /**
   * 回退到指定版本
   */
  async revertToVersion(
    executionId: string,
    versionId: string
  ): Promise<ContentVersion> {
    const versions = await this.getVersionHistory(executionId);
    const targetVersion = versions.find(v => v.versionId === versionId);

    if (!targetVersion) {
      throw new Error('版本不存在');
    }

    // 创建一个新的版本（回退版本）
    const newVersionId = await this.saveVersion(
      executionId,
      targetVersion.content,
      `回退到版本 ${versionId}`,
      'user'
    );

    const revertedVersion: ContentVersion = {
      ...targetVersion,
      versionId: newVersionId,
      timestamp: new Date(),
      changeDescription: `回退到版本 ${versionId}`
    };

    return revertedVersion;
  }
}

