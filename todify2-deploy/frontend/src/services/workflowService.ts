import { WorkflowContext, NextStepRecommendation } from '../types/workflow';
import { getNodeById, nodeConfigs } from '../config/workflowNodes';

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextRecommendations?: NextStepRecommendation[];
}

export class WorkflowService {
  // 执行节点
  static async executeNode(
    nodeId: string, 
    inputData: any, 
    context: WorkflowContext
  ): Promise<NodeExecutionResult> {
    const node = getNodeById(nodeId);
    if (!node) {
      return { success: false, error: '节点不存在' };
    }

    const config = nodeConfigs[nodeId];
    if (!config) {
      return { success: false, error: '节点配置不存在' };
    }

    try {
      // 验证输入数据
      const validationResult = this.validateNodeInput(nodeId, inputData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // 根据节点类型执行不同的逻辑
      let result: any;
      switch (node.type) {
        case 'smart_search':
          result = await this.executeSmartSearch(inputData);
          break;
        case 'tech_package':
          result = await this.executeTechPackage(inputData, context);
          break;
        case 'promotion_strategy':
          result = await this.executePromotionStrategy(inputData, context);
          break;
        case 'core_draft':
          result = await this.executeCoreDraft(inputData, context);
          break;
        case 'speech':
          result = await this.executeSpeech(inputData, context);
          break;
        default:
          return { success: false, error: '不支持的节点类型' };
      }

      // 生成下一步推荐
      const nextRecommendations = this.generateNextStepRecommendations(
        nodeId, 
        result, 
        context
      );

      return {
        success: true,
        data: result,
        nextRecommendations
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败'
      };
    }
  }

  // 验证节点输入
  private static validateNodeInput(nodeId: string, inputData: any): { valid: boolean; error?: string } {
    const config = nodeConfigs[nodeId];
    if (!config) {
      return { valid: false, error: '节点配置不存在' };
    }

    // 检查必需字段
    if (config.requiredInputs) {
      for (const field of config.requiredInputs) {
        if (!inputData[field] || inputData[field].toString().trim() === '') {
          return { valid: false, error: `缺少必需字段: ${field}` };
        }
      }
    }

    return { valid: true };
  }

  // 智能搜索执行
  private static async executeSmartSearch(inputData: any): Promise<any> {
    const { searchQuery } = inputData;
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      query: searchQuery,
      results: [
        { title: '搜索结果1', content: '相关内容1', relevance: 0.95 },
        { title: '搜索结果2', content: '相关内容2', relevance: 0.87 },
        { title: '搜索结果3', content: '相关内容3', relevance: 0.82 }
      ],
      summary: `基于关键词"${searchQuery}"的智能搜索已完成，找到3个高相关度结果。`,
      timestamp: new Date()
    };
  }

  // 技术包装执行
  private static async executeTechPackage(inputData: any, context: WorkflowContext): Promise<any> {
    const { template = 'default' } = inputData;
    
    // 获取智能搜索的结果作为输入
    const searchData = context.nodes.smart_search?.data;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      template,
      sourceData: searchData,
      packagedContent: {
        technicalPoints: ['技术要点1', '技术要点2', '技术要点3'],
        advantages: ['优势1', '优势2', '优势3'],
        applications: ['应用场景1', '应用场景2'],
        marketValue: '市场价值分析内容'
      },
      timestamp: new Date()
    };
  }

  // 推广策略执行
  private static async executePromotionStrategy(inputData: any, context: WorkflowContext): Promise<any> {
    const { targetAudience = 'general' } = inputData;
    
    // 获取技术包装的结果
    const techPackageData = context.nodes.tech_package?.data;
    
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    return {
      targetAudience,
      sourceData: techPackageData,
      strategy: {
        channels: ['社交媒体', '行业论坛', '技术博客'],
        messaging: ['核心信息1', '核心信息2', '核心信息3'],
        timeline: '3个月推广计划',
        budget: '预算建议'
      },
      timestamp: new Date()
    };
  }

  // 核心稿件执行
  private static async executeCoreDraft(inputData: any, context: WorkflowContext): Promise<any> {
    const { contentType = 'article' } = inputData;
    
    // 获取推广策略的结果
    const strategyData = context.nodes.promotion_strategy?.data;
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      contentType,
      sourceData: strategyData,
      draft: {
        title: '核心稿件标题',
        abstract: '摘要内容',
        mainContent: '主要内容段落...',
        keyPoints: ['要点1', '要点2', '要点3'],
        conclusion: '结论部分'
      },
      timestamp: new Date()
    };
  }

  // 演讲稿执行
  private static async executeSpeech(inputData: any, context: WorkflowContext): Promise<any> {
    const { speechType = 'presentation', duration = 10 } = inputData;
    
    // 获取核心稿件的结果
    const draftData = context.nodes.core_draft?.data;
    
    await new Promise(resolve => setTimeout(resolve, 2200));
    
    return {
      speechType,
      duration,
      sourceData: draftData,
      speech: {
        opening: '开场白内容',
        mainPoints: ['演讲要点1', '演讲要点2', '演讲要点3'],
        transitions: ['过渡语1', '过渡语2'],
        closing: '结束语内容',
        notes: '演讲备注'
      },
      timestamp: new Date()
    };
  }

  // 生成下一步推荐
  private static generateNextStepRecommendations(
    currentNodeId: string,
    executionResult: any,
    context: WorkflowContext
  ): NextStepRecommendation[] {
    const currentNode = getNodeById(currentNodeId);
    if (!currentNode || !currentNode.nextSteps) {
      return [];
    }

    return currentNode.nextSteps.map(nextNodeId => {
      const nextNode = getNodeById(nextNodeId);
      if (!nextNode) {
        return null;
      }

      // 计算推荐置信度
      let confidence = 0.7; // 基础置信度
      
      // 根据执行结果调整置信度
      if (executionResult && Object.keys(executionResult).length > 0) {
        confidence += 0.2;
      }

      // 根据依赖关系调整置信度
      if (nextNode.dependencies) {
        const completedDeps = nextNode.dependencies.filter(depId => 
          context.completedNodes.includes(depId)
        );
        confidence = confidence * (completedDeps.length / nextNode.dependencies.length);
      }

      // 生成推荐理由
      let reason = `基于${currentNode.name}的执行结果，建议进行${nextNode.name}`;
      
      if (confidence < 0.5) {
        reason = `需要完成更多前置步骤才能执行${nextNode.name}`;
      } else if (confidence > 0.8) {
        reason = `${currentNode.name}执行成功，强烈建议继续${nextNode.name}`;
      }

      return {
        nodeId: nextNodeId,
        confidence: Math.min(confidence, 1.0),
        reason,
        requiredData: nextNode.dependencies
      };
    }).filter(Boolean) as NextStepRecommendation[];
  }

  // 检查节点是否可以独立执行
  static canExecuteIndependently(nodeId: string): boolean {
    const config = nodeConfigs[nodeId];
    return config?.canStartIndependently || false;
  }

  // 获取节点的默认输入数据
  static getDefaultInputData(nodeId: string): any {
    const config = nodeConfigs[nodeId];
    return config?.defaultValues || {};
  }

  // 分析工作流完整性
  static analyzeWorkflowCompleteness(context: WorkflowContext): {
    completionRate: number;
    missingSteps: string[];
    recommendations: string[];
  } {
    const allNodes = ['smart_search', 'tech_package', 'promotion_strategy', 'core_draft', 'speech'];
    const completedNodes = context.completedNodes;
    
    const completionRate = completedNodes.length / allNodes.length;
    const missingSteps = allNodes.filter(nodeId => !completedNodes.includes(nodeId));
    
    const recommendations = missingSteps.map(nodeId => {
      const node = getNodeById(nodeId);
      return node ? `建议完成${node.name}以获得完整的工作流结果` : '';
    }).filter(Boolean);

    return {
      completionRate,
      missingSteps,
      recommendations
    };
  }
}