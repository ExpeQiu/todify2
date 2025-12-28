import { AgentOrchestrator, AgentExecutionResult } from './AgentOrchestrator';
import { ResourceMatcher, MatchedResources } from './ResourceMatcher';
import { ContextBuilder } from './ContextBuilder';
import { HumanInLoopManager } from './HumanInLoopManager';
import { ExtractedRequirement } from './RequirementExtractor';
import { AgentWorkflow, techPackageWorkflow, techStrategyWorkflow, techArticleWorkflow } from '../../config/workflows';
import { ProjectModel } from '../../models/Project';
import { DatabaseManager, db } from '../../config/database';
import { Project } from '../../types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent步骤执行结果
 */
export interface AgentStepResult {
  agentId: string;
  agentName: string;
  output: string;
  executionTime: number;
}

/**
 * 多Agent执行结果
 */
export interface MultiAgentExecutionResult {
  executionId: string;
  scene: 'tech-package' | 'tech-strategy' | 'tech-article';
  finalOutput: string;
  versionId: string;
  matchedResources: MatchedResources;
  intermediateResults: AgentStepResult[];
  totalTime: number;
}

/**
 * 多Agent执行器
 * 负责执行完整的多Agent工作流
 */
export class MultiAgentExecutor {
  private agentOrchestrator: AgentOrchestrator;
  private resourceMatcher: ResourceMatcher;
  private contextBuilder: ContextBuilder;
  private humanInLoopManager: HumanInLoopManager;
  private projectModel: ProjectModel;

  constructor() {
    this.agentOrchestrator = new AgentOrchestrator();
    this.resourceMatcher = new ResourceMatcher(db);
    this.contextBuilder = new ContextBuilder();
    this.humanInLoopManager = new HumanInLoopManager();
    this.projectModel = new ProjectModel(db);
  }

  /**
   * 执行多Agent工作流
   */
  async execute(
    projectId: number,
    scene: 'tech-package' | 'tech-strategy' | 'tech-article',
    requirement: ExtractedRequirement
  ): Promise<MultiAgentExecutionResult> {
    const executionId = `exec-${Date.now()}`;
    const startTime = Date.now();

    try {
      // 1. 加载项目
      const project = await this.projectModel.findById(projectId);
      if (!project) {
        throw new Error(`项目不存在: ${projectId}`);
      }

      // 2. 匹配相关资源
      const matchedResources = await this.resourceMatcher.matchResources(
        requirement,
        projectId
      );

      // 3. 构建上下文
      const context = this.contextBuilder.buildContext(
        project,
        matchedResources,
        requirement
      );

      // 4. 选择工作流
      const workflow = this.selectWorkflow(scene);

      // 5. 执行Agent工作流
      const intermediateResults: AgentStepResult[] = [];
      let previousOutput = '';

      for (const step of workflow) {
        const stepStartTime = Date.now();
        
        // 构建输入
        let input = `# 任务要求\n${step.instruction}\n\n`;
        
        if (step.useContext) {
          input += `# 项目上下文\n${context}\n\n`;
        }
        
        if (step.usePreviousOutput && previousOutput) {
          input += `# 前置步骤输出\n${previousOutput}\n\n`;
        }

        // 执行Agent
        console.log(`[MultiAgentExecutor] 执行Agent: ${step.name} (${step.agentId})`);
        
        // 尝试找到一个可用的Agent，如果指定的agentId不存在，使用第一个可用的
        let agentId = step.agentId;
        try {
          const result = await this.agentOrchestrator.executeAgent(
            agentId,
            input,
            '',
            { scene, requirement }
          );

          previousOutput = result.content;
          const stepTime = Date.now() - stepStartTime;

          intermediateResults.push({
            agentId: step.agentId,
            agentName: step.name,
            output: result.content,
            executionTime: stepTime
          });

          console.log(`[MultiAgentExecutor] Agent ${step.name} 执行完成，耗时: ${stepTime}ms`);
        } catch (error: any) {
          console.error(`[MultiAgentExecutor] Agent ${step.name} 执行失败:`, error);
          
          // 如果Agent不存在，尝试使用默认Agent
          if (error.message?.includes('不存在') || error.message?.includes('not found')) {
            console.warn(`[MultiAgentExecutor] Agent ${agentId} 不存在，尝试使用默认Agent`);
            // 这里可以添加降级逻辑，使用一个通用的Agent
            // 暂时抛出错误
            throw new Error(`Agent ${agentId} 不存在，请先配置该Agent`);
          } else {
            throw error;
          }
        }
      }

      const totalTime = Date.now() - startTime;

      // 6. 保存初稿（版本1）
      const versionId = await this.humanInLoopManager.saveVersion(
        executionId,
        previousOutput,
        '初稿生成',
        'system'
      );

      // 7. 保存执行记录（这里暂时不保存到数据库，后续可以添加）
      // await this.saveExecution({...});

      console.log(`[MultiAgentExecutor] 执行完成，总耗时: ${totalTime}ms，版本ID: ${versionId}`);

      return {
        executionId,
        scene,
        finalOutput: previousOutput,
        versionId,
        matchedResources,
        intermediateResults,
        totalTime
      };
    } catch (error) {
      console.error('[MultiAgentExecutor] 执行失败:', error);
      throw error;
    }
  }

  /**
   * 选择工作流
   */
  private selectWorkflow(scene: string): AgentWorkflow[] {
    switch (scene) {
      case 'tech-package':
        return techPackageWorkflow;
      case 'tech-strategy':
        return techStrategyWorkflow;
      case 'tech-article':
        return techArticleWorkflow;
      default:
        throw new Error(`未知场景: ${scene}`);
    }
  }
}

