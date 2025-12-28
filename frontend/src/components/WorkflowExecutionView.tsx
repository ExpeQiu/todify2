import React, { useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Circle, ChevronRight, Clock } from 'lucide-react';

export interface AgentWorkflow {
  agentId: string;
  name: string;
  instruction: string;
  useContext?: boolean;
  usePreviousOutput?: boolean;
}

export interface AgentStepResult {
  agentId: string;
  agentName: string;
  output: string;
  executionTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface WorkflowExecutionViewProps {
  executionId: string;
  workflow: AgentWorkflow[];
  stepResults: AgentStepResult[];
  currentStepIndex?: number;
  onStepClick?: (stepIndex: number) => void;
}

type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

const WorkflowExecutionView: React.FC<WorkflowExecutionViewProps> = ({
  executionId,
  workflow,
  stepResults,
  currentStepIndex,
  onStepClick
}) => {
  const getStepStatus = (index: number): StepStatus => {
    const stepResult = stepResults[index];
    if (stepResult) {
      return stepResult.status;
    }
    if (currentStepIndex !== undefined) {
      if (index < currentStepIndex) {
        return 'completed';
      } else if (index === currentStepIndex) {
        return 'running';
      }
    }
    return 'pending';
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'failed':
        return 'border-red-500 bg-red-50';
      case 'pending':
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusText = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '执行中';
      case 'failed':
        return '失败';
      case 'pending':
      default:
        return '待执行';
    }
  };

  // 计算进度
  const completedSteps = stepResults.filter(s => s.status === 'completed').length;
  const totalSteps = workflow.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="workflow-execution-view bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">工作流执行</h3>
          <span className="text-xs text-gray-500">
            {completedSteps}/{totalSteps} 步骤完成
          </span>
        </div>
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-3">
        {workflow.map((step, index) => {
          const status = getStepStatus(index);
          const stepResult = stepResults[index];
          const isClickable = onStepClick !== undefined;

          return (
            <div key={index} className="relative">
              {/* 连接线 */}
              {index < workflow.length - 1 && (
                <div className="absolute left-[11px] top-8 w-0.5 h-6 bg-gray-200 z-0" />
              )}

              {/* 步骤节点 */}
              <div
                className={`relative flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                  getStatusColor(status)
                } ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => isClickable && onStepClick?.(index)}
              >
                {/* 状态图标 */}
                <div className="flex-shrink-0 relative z-10">
                  {getStatusIcon(status)}
                </div>

                {/* 步骤信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {step.name || step.agentId}
                    </span>
                    <div className="flex items-center space-x-2">
                      {stepResult && (
                        <span className="text-xs text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{stepResult.executionTime}ms</span>
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        status === 'completed' ? 'bg-green-100 text-green-700' :
                        status === 'running' ? 'bg-blue-100 text-blue-700' :
                        status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>

                  {/* 步骤描述 */}
                  {step.instruction && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {step.instruction}
                    </p>
                  )}

                  {/* 输出预览 */}
                  {stepResult && stepResult.output && status === 'completed' && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">输出预览:</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {stepResult.output.substring(0, 150)}
                        {stepResult.output.length > 150 ? '...' : ''}
                      </p>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {status === 'failed' && stepResult?.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-xs text-red-700">{stepResult.error}</p>
                    </div>
                  )}
                </div>

                {/* 点击指示 */}
                {isClickable && (
                  <div className="flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowExecutionView;
