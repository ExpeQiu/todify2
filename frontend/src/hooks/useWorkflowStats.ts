import { useState, useCallback, useEffect } from 'react';
import { 
  workflowStatsService, 
  CreateWorkflowNodeUsageDTO,
  CreateAIQAFeedbackDTO,
  CreateWorkflowSessionStatsDTO,
  CreateNodeContentProcessingDTO
} from '../services/workflowStatsService';

/**
 * 工作流统计收集钩子
 */
export const useWorkflowStats = () => {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // 记录节点使用统计
  const recordNodeUsage = useCallback(async (data: Omit<CreateWorkflowNodeUsageDTO, 'session_id' | 'user_id'>) => {
    try {
      const nodeUsageData: CreateWorkflowNodeUsageDTO = {
        ...data,
        session_id: sessionId,
        user_id: userId
      };
      await workflowStatsService.recordNodeUsage(nodeUsageData);
    } catch (error) {
      console.error('记录节点使用统计失败:', error);
    }
  }, [sessionId, userId]);

  // 记录AI问答评价
  const recordFeedback = useCallback(async (data: Omit<CreateAIQAFeedbackDTO, 'session_id' | 'user_id'>) => {
    try {
      const feedbackData: CreateAIQAFeedbackDTO = {
        ...data,
        session_id: sessionId,
        user_id: userId
      };
      await workflowStatsService.recordAIQAFeedback(feedbackData);
    } catch (error) {
      console.error('记录AI问答评价失败:', error);
    }
  }, [sessionId, userId]);

  // 记录会话统计
  const recordSessionStats = useCallback(async (data: Omit<CreateWorkflowSessionStatsDTO, 'session_id' | 'user_id'>) => {
    try {
      const sessionStatsData: CreateWorkflowSessionStatsDTO = {
        ...data,
        session_id: sessionId,
        user_id: userId
      };
      await workflowStatsService.recordSessionStats(sessionStatsData);
    } catch (error) {
      console.error('记录会话统计失败:', error);
    }
  }, [sessionId, userId]);

  // 记录内容处理统计
  const recordContentProcessing = useCallback(async (data: Omit<CreateNodeContentProcessingDTO, 'session_id'>) => {
    try {
      const contentProcessingData: CreateNodeContentProcessingDTO = {
        ...data,
        session_id: sessionId
      };
      await workflowStatsService.recordContentProcessing(contentProcessingData);
    } catch (error) {
      console.error('记录内容处理统计失败:', error);
    }
  }, [sessionId]);

  return {
    sessionId,
    userId,
    recordNodeUsage,
    recordFeedback,
    recordSessionStats,
    recordContentProcessing
  };
};

/**
 * 节点使用统计钩子
 */
export const useNodeStats = (nodeId: string, nodeName: string, nodeType: string) => {
  const { recordNodeUsage } = useWorkflowStats();
  const [startTime] = useState(Date.now());
  const [usageCount, setUsageCount] = useState(0);

  // 记录节点访问
  const recordNodeAccess = useCallback(async (isWorkflowMode: boolean = false, isStandaloneMode: boolean = false) => {
    const currentTime = Date.now();
    const timeSpent = (currentTime - startTime) / 1000;
    
    try {
      await recordNodeUsage({
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        usage_count: 1,
        total_time_spent: timeSpent,
        is_workflow_mode: isWorkflowMode,
        is_standalone_mode: isStandaloneMode
      });
      setUsageCount(prev => prev + 1);
    } catch (error) {
      console.error('记录节点访问失败:', error);
    }
  }, [nodeId, nodeName, nodeType, startTime, recordNodeUsage]);

  // 记录节点响应时间
  const recordResponseTime = useCallback(async (responseTime: number) => {
    try {
      await recordNodeUsage({
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        avg_response_time: responseTime,
        success_count: 1
      });
    } catch (error) {
      console.error('记录响应时间失败:', error);
    }
  }, [nodeId, nodeName, nodeType, recordNodeUsage]);

  // 记录内容长度
  const recordContentLength = useCallback(async (contentLength: number) => {
    try {
      await recordNodeUsage({
        node_id: nodeId,
        node_name: nodeName,
        node_type: nodeType,
        total_characters: contentLength,
        avg_characters: contentLength
      });
    } catch (error) {
      console.error('记录内容长度失败:', error);
    }
  }, [nodeId, nodeName, nodeType, recordNodeUsage]);

  return {
    usageCount,
    recordNodeAccess,
    recordResponseTime,
    recordContentLength
  };
};

/**
 * 用户交互统计钩子
 */
export const useInteractionStats = (nodeId: string) => {
  const { recordFeedback } = useWorkflowStats();
  const [interactions, setInteractions] = useState({
    likes: 0,
    dislikes: 0,
    regenerations: 0,
    adoptions: 0,
    edits: 0
  });

  // 记录点赞
  const recordLike = useCallback(async (messageId: string, responseTime?: number, contentLength?: number) => {
    try {
      await recordFeedback({
        message_id: messageId,
        node_id: nodeId,
        feedback_type: 'like',
        feedback_value: 5,
        response_time: responseTime,
        content_length: contentLength
      });
      setInteractions(prev => ({ ...prev, likes: prev.likes + 1 }));
    } catch (error) {
      console.error('记录点赞失败:', error);
    }
  }, [nodeId, recordFeedback]);

  // 记录点踩
  const recordDislike = useCallback(async (messageId: string, responseTime?: number, contentLength?: number) => {
    try {
      await recordFeedback({
        message_id: messageId,
        node_id: nodeId,
        feedback_type: 'dislike',
        feedback_value: 1,
        response_time: responseTime,
        content_length: contentLength
      });
      setInteractions(prev => ({ ...prev, dislikes: prev.dislikes + 1 }));
    } catch (error) {
      console.error('记录点踩失败:', error);
    }
  }, [nodeId, recordFeedback]);

  // 记录重新生成
  const recordRegenerate = useCallback(async (messageId: string, responseTime?: number, contentLength?: number) => {
    try {
      await recordFeedback({
        message_id: messageId,
        node_id: nodeId,
        feedback_type: 'regenerate',
        feedback_value: 3,
        response_time: responseTime,
        content_length: contentLength
      });
      setInteractions(prev => ({ ...prev, regenerations: prev.regenerations + 1 }));
    } catch (error) {
      console.error('记录重新生成失败:', error);
    }
  }, [nodeId, recordFeedback]);

  // 记录采纳
  const recordAdopt = useCallback(async (messageId: string, responseTime?: number, contentLength?: number) => {
    try {
      await recordFeedback({
        message_id: messageId,
        node_id: nodeId,
        feedback_type: 'adopt',
        feedback_value: 5,
        response_time: responseTime,
        content_length: contentLength
      });
      setInteractions(prev => ({ ...prev, adoptions: prev.adoptions + 1 }));
    } catch (error) {
      console.error('记录采纳失败:', error);
    }
  }, [nodeId, recordFeedback]);

  // 记录编辑
  const recordEdit = useCallback(async (messageId: string, responseTime?: number, contentLength?: number) => {
    try {
      await recordFeedback({
        message_id: messageId,
        node_id: nodeId,
        feedback_type: 'edit',
        feedback_value: 4,
        response_time: responseTime,
        content_length: contentLength
      });
      setInteractions(prev => ({ ...prev, edits: prev.edits + 1 }));
    } catch (error) {
      console.error('记录编辑失败:', error);
    }
  }, [nodeId, recordFeedback]);

  return {
    interactions,
    recordLike,
    recordDislike,
    recordRegenerate,
    recordAdopt,
    recordEdit
  };
};

/**
 * 内容处理统计钩子
 */
export const useContentProcessingStats = (nodeId: string) => {
  const { recordContentProcessing } = useWorkflowStats();

  // 记录直接采纳
  const recordDirectAdopt = useCallback(async (messageId: string, contentLength: number) => {
    try {
      await recordContentProcessing({
        node_id: nodeId,
        message_id: messageId,
        processing_type: 'direct_adopt',
        original_content_length: contentLength,
        final_content_length: contentLength,
        edit_ratio: 0,
        edit_count: 0,
        edit_duration: 0,
        user_satisfaction_score: 5
      });
    } catch (error) {
      console.error('记录直接采纳失败:', error);
    }
  }, [nodeId, recordContentProcessing]);

  // 记录编辑后采纳
  const recordEditAdopt = useCallback(async (
    messageId: string, 
    originalLength: number, 
    finalLength: number, 
    editCount: number, 
    editDuration: number
  ) => {
    const editRatio = (finalLength - originalLength) / originalLength;
    try {
      await recordContentProcessing({
        node_id: nodeId,
        message_id: messageId,
        processing_type: 'edit_adopt',
        original_content_length: originalLength,
        final_content_length: finalLength,
        edit_ratio: editRatio,
        edit_count: editCount,
        edit_duration: editDuration,
        user_satisfaction_score: 4
      });
    } catch (error) {
      console.error('记录编辑后采纳失败:', error);
    }
  }, [nodeId, recordContentProcessing]);

  // 记录重新生成
  const recordRegenerate = useCallback(async (messageId: string, originalLength: number) => {
    try {
      await recordContentProcessing({
        node_id: nodeId,
        message_id: messageId,
        processing_type: 'regenerate',
        original_content_length: originalLength,
        edit_ratio: 1,
        edit_count: 1,
        edit_duration: 0,
        user_satisfaction_score: 3
      });
    } catch (error) {
      console.error('记录重新生成失败:', error);
    }
  }, [nodeId, recordContentProcessing]);

  // 记录放弃
  const recordAbandon = useCallback(async (messageId: string, contentLength: number) => {
    try {
      await recordContentProcessing({
        node_id: nodeId,
        message_id: messageId,
        processing_type: 'abandon',
        original_content_length: contentLength,
        edit_ratio: 0,
        edit_count: 0,
        edit_duration: 0,
        user_satisfaction_score: 1
      });
    } catch (error) {
      console.error('记录放弃失败:', error);
    }
  }, [nodeId, recordContentProcessing]);

  return {
    recordDirectAdopt,
    recordEditAdopt,
    recordRegenerate,
    recordAbandon
  };
};

/**
 * 工作流会话统计钩子
 */
export const useWorkflowSessionStats = () => {
  const { recordSessionStats, sessionId } = useWorkflowStats();
  const [sessionStartTime] = useState(Date.now());
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);

  // 记录节点访问
  const recordNodeVisit = useCallback((nodeId: string) => {
    setVisitedNodes(prev => [...new Set([...prev, nodeId])]);
  }, []);

  // 记录节点完成
  const recordNodeCompletion = useCallback((nodeId: string) => {
    setCompletedNodes(prev => [...new Set([...prev, nodeId])]);
  }, []);

  // 记录会话结束
  const recordSessionEnd = useCallback(async (exitNodeId?: string, exitReason?: string) => {
    const sessionDuration = (Date.now() - sessionStartTime) / 1000;
    const skippedNodes = visitedNodes.filter(nodeId => !completedNodes.includes(nodeId));
    
    try {
      await recordSessionStats({
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
        path_efficiency_score: completedNodes.length / visitedNodes.length || 0
      });
    } catch (error) {
      console.error('记录会话结束失败:', error);
    }
  }, [sessionStartTime, visitedNodes, completedNodes, recordSessionStats]);

  return {
    sessionId,
    recordNodeVisit,
    recordNodeCompletion,
    recordSessionEnd
  };
};
