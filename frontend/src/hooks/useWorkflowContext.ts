import { useState, useCallback, useEffect } from 'react';
import { WorkflowContext, NodeState, NextStepRecommendation } from '../types/workflow';
import { getNextStepRecommendations as getNextSteps, getNodeById } from '../config/workflowNodes';

// 从localStorage获取工作流上下文
const getStoredContext = (): WorkflowContext => {
  try {
    const stored = localStorage.getItem('workflowContext');
    if (stored) {
      const parsed = JSON.parse(stored);
      // 恢复Date对象
      Object.keys(parsed.nodes).forEach(nodeId => {
        if (parsed.nodes[nodeId].timestamp) {
          parsed.nodes[nodeId].timestamp = new Date(parsed.nodes[nodeId].timestamp);
        }
      });
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load workflow context from localStorage:', error);
  }
  
  return {
    nodes: {},
    completedNodes: [],
    availableNextSteps: []
  };
};

// 保存工作流上下文到localStorage
const saveContext = (context: WorkflowContext) => {
  try {
    localStorage.setItem('workflowContext', JSON.stringify(context));
  } catch (error) {
    console.warn('Failed to save workflow context to localStorage:', error);
  }
};

export const useWorkflowContext = () => {
  const [context, setContext] = useState<WorkflowContext>(getStoredContext);

  // 保存上下文到localStorage
  useEffect(() => {
    saveContext(context);
  }, [context]);

  // 更新节点状态
  const updateNodeState = useCallback((nodeId: string, updates: Partial<NodeState>) => {
    setContext(prev => {
      const newContext = {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...prev.nodes[nodeId],
            nodeId,
            ...updates,
            timestamp: new Date()
          }
        }
      };

      // 如果节点完成，更新完成列表
      if (updates.status === 'completed' && !prev.completedNodes.includes(nodeId)) {
        newContext.completedNodes = [...prev.completedNodes, nodeId];
      }

      // 更新当前节点
      if (updates.status === 'loading') {
        newContext.currentNode = nodeId;
      }

      // 重新计算可用的下一步
      if (newContext.currentNode) {
        newContext.availableNextSteps = getNextSteps(
          newContext.currentNode,
          newContext.completedNodes
        );
      }

      return newContext;
    });
  }, []);

  // 设置当前节点
  const setCurrentNode = useCallback((nodeId: string) => {
    setContext(prev => ({
      ...prev,
      currentNode: nodeId,
      availableNextSteps: getNextSteps(
        nodeId,
        prev.completedNodes
      )
    }));
  }, []);

  // 获取节点状态
  const getNodeState = useCallback((nodeId: string): NodeState => {
    return context.nodes[nodeId] || {
      nodeId,
      status: 'idle'
    };
  }, [context.nodes]);

  // 检查节点是否可以执行
  const canExecuteNode = useCallback((nodeId: string): boolean => {
    const node = getNodeById(nodeId);
    if (!node) return false;

    // 检查依赖是否满足
    if (node.dependencies) {
      return node.dependencies.every(depId => 
        context.completedNodes.includes(depId)
      );
    }

    return true;
  }, [context.completedNodes]);

  // 获取下一步推荐
  const getNextStepRecommendations = useCallback((): NextStepRecommendation[] => {
    if (!context.currentNode) return [];

    const nextSteps = context.availableNextSteps;
    
    return nextSteps.map(nodeId => {
      const node = getNodeById(nodeId);
      const canExecute = canExecuteNode(nodeId);
      
      return {
        nodeId,
        confidence: canExecute ? 0.9 : 0.5,
        reason: canExecute 
          ? `基于${node?.name}的结果，建议执行此步骤`
          : `需要完成前置步骤才能执行`,
        requiredData: node?.dependencies
      };
    });
  }, [context.currentNode, context.availableNextSteps, canExecuteNode]);

  // 重置工作流上下文
  const resetContext = useCallback(() => {
    setContext({
      nodes: {},
      completedNodes: [],
      availableNextSteps: []
    });
    localStorage.removeItem('workflowContext');
  }, []);

  // 检查是否有进行中的节点
  const hasActiveNode = useCallback((): boolean => {
    return Object.values(context.nodes).some(node => node.status === 'loading');
  }, [context.nodes]);

  return {
    context,
    updateNodeState,
    setCurrentNode,
    getNodeState,
    canExecuteNode,
    getNextStepRecommendations,
    resetContext,
    hasActiveNode
  };
};