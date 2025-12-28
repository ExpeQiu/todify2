import React from 'react';
import { X, Clock, CheckCircle2, XCircle, Loader2, FileText, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgentWorkflow, AgentStepResult } from './WorkflowExecutionView';

interface WorkflowStepDetailPanelProps {
  stepIndex: number;
  workflow: AgentWorkflow;
  stepResult?: AgentStepResult;
  onClose: () => void;
}

const WorkflowStepDetailPanel: React.FC<WorkflowStepDetailPanelProps> = ({
  stepIndex,
  workflow,
  stepResult,
  onClose
}) => {
  const getStatusIcon = () => {
    if (!stepResult) {
      return <Circle className="w-5 h-5 text-gray-300" />;
    }
    switch (stepResult.status) {
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

  const getStatusText = () => {
    if (!stepResult) return '待执行';
    switch (stepResult.status) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bot className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                步骤 {stepIndex + 1}: {workflow.name || workflow.agentId}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon()}
                <span className="text-sm text-gray-600">{getStatusText()}</span>
                {stepResult && (
                  <span className="text-xs text-gray-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{stepResult.executionTime}ms</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Agent信息 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Agent信息</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Agent ID:</span>
                <span className="text-gray-800 font-mono">{workflow.agentId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">使用上下文:</span>
                <span className="text-gray-800">{workflow.useContext ? '是' : '否'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">使用前一步输出:</span>
                <span className="text-gray-800">{workflow.usePreviousOutput ? '是' : '否'}</span>
              </div>
            </div>
          </div>

          {/* 指令 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>执行指令</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{workflow.instruction}</p>
            </div>
          </div>

          {/* 输出结果 */}
          {stepResult && stepResult.output && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">输出结果</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {stepResult.output}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {stepResult && stepResult.status === 'failed' && stepResult.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-red-700 mb-2">错误信息</h3>
              <p className="text-sm text-red-600">{stepResult.error}</p>
            </div>
          )}

          {/* 未执行提示 */}
          {!stepResult && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">此步骤尚未执行</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 添加Circle图标（如果lucide-react没有）
const Circle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
  </svg>
);

export default WorkflowStepDetailPanel;

