import { useCallback } from 'react';

import { useWorkflowStats, useWorkflowSessionStats } from '@/hooks/useWorkflowStats';

/**
 * 工作流分析统计 Hook
 * 封装 WorkflowPage 中使用的所有统计埋点逻辑
 */
export const useWorkflowAnalytics = () => {
  const { recordNodeUsage, recordFeedback } = useWorkflowStats();
  const { recordNodeVisit, recordNodeCompletion, recordSessionEnd } = useWorkflowSessionStats();

  /**
   * 记录步骤激活（节点访问）
   */
  const trackStepActivated = useCallback(
    (stepKey: string, stepTitle: string) => {
      recordNodeVisit(stepKey);
      recordNodeUsage({
        node_id: stepKey,
        node_name: stepTitle,
        node_type: stepKey,
        usage_count: 1,
        is_workflow_mode: true,
        is_standalone_mode: false,
      });
    },
    [recordNodeVisit, recordNodeUsage],
  );

  /**
   * 记录 AI 问答成功
   */
  const trackAISearchSuccess = useCallback(() => {
    recordNodeUsage({
      node_id: 'ai_qa',
      node_name: 'AI问答',
      node_type: 'ai_qa',
      success_count: 1,
      is_workflow_mode: true,
      is_standalone_mode: false,
    });
    recordNodeCompletion('ai_qa');
  }, [recordNodeUsage, recordNodeCompletion]);

  /**
   * 记录消息点赞
   */
  const trackMessageLike = useCallback(
    (messageId: string, messageContent: string) => {
      recordFeedback({
        node_id: 'ai_qa',
        node_name: 'AI问答',
        node_type: 'ai_qa',
        message_id: messageId,
        feedback_type: 'like',
        satisfaction_score: 5,
        feedback_content: messageContent.substring(0, 100),
      });
    },
    [recordFeedback],
  );

  /**
   * 记录消息点踩
   */
  const trackMessageDislike = useCallback(
    (messageId: string, messageContent: string) => {
      recordFeedback({
        node_id: 'ai_qa',
        node_name: 'AI问答',
        node_type: 'ai_qa',
        message_id: messageId,
        feedback_type: 'dislike',
        satisfaction_score: 1,
        feedback_content: messageContent.substring(0, 100),
      });
    },
    [recordFeedback],
  );

  /**
   * 记录会话结束
   */
  const trackSessionEnd = useCallback(() => {
    recordSessionEnd();
  }, [recordSessionEnd]);

  return {
    trackStepActivated,
    trackAISearchSuccess,
    trackMessageLike,
    trackMessageDislike,
    trackSessionEnd,
  };
};

