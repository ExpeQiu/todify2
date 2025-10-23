import { 
  workflowStatsService, 
  CreateWorkflowNodeUsageDTO,
  CreateAIQAFeedbackDTO,
  CreateWorkflowSessionStatsDTO,
  CreateNodeContentProcessingDTO
} from '../services/workflowStatsService';

/**
 * 统计数据收集器
 */
export class StatsCollector {
  private sessionId: string;
  private userId: string;
  private startTime: number;
  private nodeStartTimes: Map<string, number> = new Map();

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
  }

  /**
   * 记录节点开始使用
   */
  recordNodeStart(nodeId: string, nodeName: string, nodeType: string): void {
    this.nodeStartTimes.set(nodeId, Date.now());
    
    // 异步记录节点访问
    this.recordNodeAccess(nodeId, nodeName, nodeType);
  }

  /**
   * 记录节点使用统计
   */
  async recordNodeAccess(
    nodeId: string, 
    nodeName: string, 
    nodeType: string,
    isWorkflowMode: boolean = false,
    isStandaloneMode: boolean = false
  ): Promise<void> {
    try {
      const data: CreateWorkflowNodeUsageDTO = {
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        session_id: this.sessionId,
        user_id: this.userId,
        usage_count: 1,
        is_workflow_mode: isWorkflowMode,
        is_standalone_mode: isStandaloneMode
      };
      
      await workflowStatsService.recordNodeUsage(data);
    } catch (error) {
      console.error('记录节点访问统计失败:', error);
    }
  }

  /**
   * 记录节点响应时间
   */
  async recordNodeResponseTime(
    nodeId: string, 
    nodeName: string, 
    nodeType: string,
    responseTime: number
  ): Promise<void> {
    try {
      const data: CreateWorkflowNodeUsageDTO = {
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        session_id: this.sessionId,
        user_id: this.userId,
        avg_response_time: responseTime,
        success_count: 1
      };
      
      await workflowStatsService.recordNodeUsage(data);
    } catch (error) {
      console.error('记录节点响应时间失败:', error);
    }
  }

  /**
   * 记录内容长度
   */
  async recordContentLength(
    nodeId: string, 
    nodeName: string, 
    nodeType: string,
    contentLength: number
  ): Promise<void> {
    try {
      const data: CreateWorkflowNodeUsageDTO = {
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        session_id: this.sessionId,
        user_id: this.userId,
        total_characters: contentLength,
        avg_characters: contentLength
      };
      
      await workflowStatsService.recordNodeUsage(data);
    } catch (error) {
      console.error('记录内容长度失败:', error);
    }
  }

  /**
   * 记录用户交互反馈
   */
  async recordFeedback(
    nodeId: string,
    messageId: string,
    feedbackType: 'like' | 'dislike' | 'adopt' | 'regenerate' | 'edit',
    feedbackValue: number = 5,
    responseTime?: number,
    contentLength?: number,
    queryText?: string,
    responseText?: string
  ): Promise<void> {
    try {
      const data: CreateAIQAFeedbackDTO = {
        message_id: messageId,
        node_id: nodeId,
        session_id: this.sessionId,
        user_id: this.userId,
        feedback_type: feedbackType,
        feedback_value: feedbackValue,
        response_time: responseTime,
        content_length: contentLength,
        query_text: queryText,
        response_text: responseText
      };
      
      await workflowStatsService.recordAIQAFeedback(data);
    } catch (error) {
      console.error('记录用户反馈失败:', error);
    }
  }

  /**
   * 记录内容处理统计
   */
  async recordContentProcessing(
    nodeId: string,
    messageId: string,
    processingType: 'direct_adopt' | 'edit_adopt' | 'regenerate' | 'abandon',
    originalLength?: number,
    finalLength?: number,
    editCount: number = 0,
    editDuration: number = 0,
    satisfactionScore?: number
  ): Promise<void> {
    try {
      const editRatio = originalLength && finalLength ? 
        (finalLength - originalLength) / originalLength : 0;
      
      const data: CreateNodeContentProcessingDTO = {
        node_id: nodeId,
        session_id: this.sessionId,
        message_id: messageId,
        processing_type: processingType,
        original_content_length: originalLength,
        final_content_length: finalLength,
        edit_ratio: editRatio,
        edit_count: editCount,
        edit_duration: editDuration,
        user_satisfaction_score: satisfactionScore
      };
      
      await workflowStatsService.recordContentProcessing(data);
    } catch (error) {
      console.error('记录内容处理统计失败:', error);
    }
  }

  /**
   * 记录会话统计
   */
  async recordSessionStats(
    visitedNodes: string[],
    completedNodes: string[],
    exitNodeId?: string,
    exitReason?: string,
    satisfactionScore?: number
  ): Promise<void> {
    try {
      const sessionDuration = (Date.now() - this.startTime) / 1000;
      const skippedNodes = visitedNodes.filter(nodeId => !completedNodes.includes(nodeId));
      
      const data: CreateWorkflowSessionStatsDTO = {
        session_id: this.sessionId,
        user_id: this.userId,
        session_duration: sessionDuration,
        total_nodes_visited: visitedNodes.length,
        completed_nodes: completedNodes.length,
        skipped_nodes: skippedNodes.length,
        node_visit_sequence: JSON.stringify(visitedNodes),
        node_completion_status: JSON.stringify(completedNodes),
        exit_node_id: exitNodeId,
        exit_reason: exitReason,
        exit_time: new Date().toISOString(),
        workflow_path: JSON.stringify({
          visited: visitedNodes,
          completed: completedNodes,
          skipped: skippedNodes
        }),
        path_efficiency_score: completedNodes.length / visitedNodes.length || 0,
        overall_satisfaction_score: satisfactionScore
      };
      
      await workflowStatsService.recordSessionStats(data);
    } catch (error) {
      console.error('记录会话统计失败:', error);
    }
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取用户ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * 计算节点使用时间
   */
  getNodeUsageTime(nodeId: string): number {
    const startTime = this.nodeStartTimes.get(nodeId);
    if (!startTime) return 0;
    return (Date.now() - startTime) / 1000;
  }
}

// 全局统计收集器实例
export const statsCollector = new StatsCollector();

/**
 * 节点统计装饰器
 */
export function withStatsTracking<T extends React.ComponentType<any>>(
  Component: T,
  nodeId: string,
  nodeName: string,
  nodeType: string
): T {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    useEffect(() => {
      // 记录节点开始使用
      statsCollector.recordNodeStart(nodeId, nodeName, nodeType);
    }, []);

    return React.createElement(Component, { ...props, ref });
  });

  WrappedComponent.displayName = `withStatsTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}

/**
 * 响应时间统计装饰器
 */
export function withResponseTimeTracking<T extends React.ComponentType<any>>(
  Component: T,
  nodeId: string,
  nodeName: string,
  nodeType: string
): T {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const handleExecute = async (originalExecute: any) => {
      const startTime = Date.now();
      
      try {
        const result = await originalExecute();
        const responseTime = (Date.now() - startTime) / 1000;
        
        // 记录响应时间
        statsCollector.recordNodeResponseTime(nodeId, nodeName, nodeType, responseTime);
        
        return result;
      } catch (error) {
        const responseTime = (Date.now() - startTime) / 1000;
        
        // 记录失败的响应时间
        statsCollector.recordNodeResponseTime(nodeId, nodeName, nodeType, responseTime);
        
        throw error;
      }
    };

    return React.createElement(Component, { 
      ...props, 
      ref,
      onExecute: props.onExecute ? (data: any) => handleExecute(() => props.onExecute(data)) : undefined
    });
  });

  WrappedComponent.displayName = `withResponseTimeTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}

/**
 * 内容长度统计装饰器
 */
export function withContentLengthTracking<T extends React.ComponentType<any>>(
  Component: T,
  nodeId: string,
  nodeName: string,
  nodeType: string
): T {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const handleContentGenerated = (content: string) => {
      if (content && content.length > 0) {
        statsCollector.recordContentLength(nodeId, nodeName, nodeType, content.length);
      }
    };

    return React.createElement(Component, { 
      ...props, 
      ref,
      onContentGenerated: handleContentGenerated
    });
  });

  WrappedComponent.displayName = `withContentLengthTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}

/**
 * 用户交互统计装饰器
 */
export function withInteractionTracking<T extends React.ComponentType<any>>(
  Component: T,
  nodeId: string
): T {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const handleLike = async (messageId: string, responseTime?: number, contentLength?: number) => {
      await statsCollector.recordFeedback(nodeId, messageId, 'like', 5, responseTime, contentLength);
    };

    const handleDislike = async (messageId: string, responseTime?: number, contentLength?: number) => {
      await statsCollector.recordFeedback(nodeId, messageId, 'dislike', 1, responseTime, contentLength);
    };

    const handleAdopt = async (messageId: string, responseTime?: number, contentLength?: number) => {
      await statsCollector.recordFeedback(nodeId, messageId, 'adopt', 5, responseTime, contentLength);
    };

    const handleRegenerate = async (messageId: string, responseTime?: number, contentLength?: number) => {
      await statsCollector.recordFeedback(nodeId, messageId, 'regenerate', 3, responseTime, contentLength);
    };

    const handleEdit = async (messageId: string, responseTime?: number, contentLength?: number) => {
      await statsCollector.recordFeedback(nodeId, messageId, 'edit', 4, responseTime, contentLength);
    };

    return React.createElement(Component, { 
      ...props, 
      ref,
      onLike: handleLike,
      onDislike: handleDislike,
      onAdopt: handleAdopt,
      onRegenerate: handleRegenerate,
      onEdit: handleEdit
    });
  });

  WrappedComponent.displayName = `withInteractionTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}

/**
 * 内容处理统计装饰器
 */
export function withContentProcessingTracking<T extends React.ComponentType<any>>(
  Component: T,
  nodeId: string
): T {
  const WrappedComponent = React.forwardRef<any, any>((props, ref) => {
    const handleDirectAdopt = async (messageId: string, contentLength: number) => {
      await statsCollector.recordContentProcessing(nodeId, messageId, 'direct_adopt', contentLength, contentLength, 0, 0, 5);
    };

    const handleEditAdopt = async (
      messageId: string, 
      originalLength: number, 
      finalLength: number, 
      editCount: number, 
      editDuration: number
    ) => {
      await statsCollector.recordContentProcessing(nodeId, messageId, 'edit_adopt', originalLength, finalLength, editCount, editDuration, 4);
    };

    const handleRegenerate = async (messageId: string, originalLength: number) => {
      await statsCollector.recordContentProcessing(nodeId, messageId, 'regenerate', originalLength, originalLength, 1, 0, 3);
    };

    const handleAbandon = async (messageId: string, contentLength: number) => {
      await statsCollector.recordContentProcessing(nodeId, messageId, 'abandon', contentLength, contentLength, 0, 0, 1);
    };

    return React.createElement(Component, { 
      ...props, 
      ref,
      onDirectAdopt: handleDirectAdopt,
      onEditAdopt: handleEditAdopt,
      onRegenerate: handleRegenerate,
      onAbandon: handleAbandon
    });
  });

  WrappedComponent.displayName = `withContentProcessingTracking(${Component.displayName || Component.name})`;
  
  return WrappedComponent as T;
}
