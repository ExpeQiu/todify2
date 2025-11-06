import React, { useEffect, useState } from 'react';
import { 
  Play, Pause, Square, CheckCircle2, Circle, AlertCircle, 
  Clock, Loader, Eye, EyeOff 
} from 'lucide-react';
import { 
  WorkflowExecution, 
  NodeExecutionResult, 
  NodeExecutionStatus,
  NodeExecutionResult as NodeResult 
} from '../types/agentWorkflow';

interface WorkflowExecutionViewProps {
  execution: WorkflowExecution | null;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onResume?: () => void;
  isLoading?: boolean;
}

/**
 * Workflow执行可视化组件
 * 实时显示工作流执行状态、节点进度和结果
 */
const WorkflowExecutionView: React.FC<WorkflowExecutionViewProps> = ({
  execution,
  onPlay,
  onPause,
  onStop,
  onResume,
  isLoading = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 切换节点展开状态
  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  if (!execution) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">等待开始执行...</p>
      </div>
    );
  }

  const { status, nodeResults, startTime, endTime, duration, error } = execution;
  
  // 计算总体进度
  const totalNodes = nodeResults.length;
  const completedNodes = nodeResults.filter(r => r.status === 'completed').length;
  const failedNodes = nodeResults.filter(r => r.status === 'failed').length;
  const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  // 获取状态图标和颜色
  const getStatusIcon = (nodeStatus: NodeExecutionStatus) => {
    switch (nodeStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-400" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusColor = (nodeStatus: NodeExecutionStatus) => {
    switch (nodeStatus) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'skipped':
        return 'bg-gray-50 border-gray-200';
      case 'pending':
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 头部 - 执行状态和控制 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status === 'running' && <Loader className="w-5 h-5 text-white animate-spin" />}
            {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-300" />}
            {status === 'failed' && <AlertCircle className="w-5 h-5 text-red-300" />}
            {status === 'cancelled' && <Square className="w-5 h-5 text-gray-300" />}
            {status === 'paused' && <Pause className="w-5 h-5 text-yellow-300" />}
            <h3 className="text-white font-semibold text-lg">
              {execution.workflowName || 'Workflow执行'}
            </h3>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center gap-2">
            {status === 'pending' && onPlay && (
              <button
                onClick={onPlay}
                disabled={isLoading}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                开始
              </button>
            )}
            {status === 'running' && onPause && (
              <>
                <button
                  onClick={onPause}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    停止
                  </button>
                )}
              </>
            )}
            {status === 'paused' && onResume && (
              <>
                <button
                  onClick={onResume}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  继续
                </button>
                {onStop && (
                  <button
                    onClick={onStop}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    停止
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
            <span>总体进度: {completedNodes}/{totalNodes}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-blue-900 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 ease-out flex items-center"
              style={{ width: `${progress}%` }}
            >
              {status === 'running' && (
                <div className="w-8 h-8 ml-auto bg-white rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 执行信息 */}
        <div className="mt-3 flex items-center gap-4 text-sm text-blue-100">
          {startTime && (
            <span>开始: {new Date(startTime).toLocaleTimeString()}</span>
          )}
          {duration !== undefined && (
            <span>耗时: {(duration / 1000).toFixed(1)}s</span>
          )}
          {failedNodes > 0 && (
            <span className="text-red-300">失败: {failedNodes}</span>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mt-3 p-3 bg-red-500 bg-opacity-20 rounded-lg border border-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-100 font-medium">执行失败</p>
                <p className="text-red-200 text-sm mt-1">{error.message}</p>
                {error.nodeId && (
                  <p className="text-red-200 text-xs mt-1">失败节点: {error.nodeId}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 节点列表 */}
      <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
        {nodeResults.map((nodeResult, index) => {
          const isExpanded = expandedNodes.has(nodeResult.nodeId);
          
          return (
            <div
              key={nodeResult.nodeId}
              className={`border-2 rounded-lg overflow-hidden transition-all ${
                selectedNode === nodeResult.nodeId ? 'ring-2 ring-blue-500' : ''
              } ${getStatusColor(nodeResult.status)}`}
            >
              {/* 节点头部 */}
              <div
                className="p-4 cursor-pointer hover:bg-opacity-80 transition-colors"
                onClick={() => {
                  toggleNodeExpansion(nodeResult.nodeId);
                  setSelectedNode(nodeResult.nodeId);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(nodeResult.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {nodeResult.nodeId}
                      </div>
                      <div className="text-sm text-gray-600">
                        节点 {index + 1}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {nodeResult.duration !== undefined && (
                      <span>{(nodeResult.duration / 1000).toFixed(1)}s</span>
                    )}
                    {nodeResult.startTime && (
                      <span>{new Date(nodeResult.startTime).toLocaleTimeString()}</span>
                    )}
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* 节点详情（展开时显示） */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                  {/* 输入数据 */}
                  {nodeResult.input && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">输入数据</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                        {JSON.stringify(nodeResult.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 输出数据 */}
                  {nodeResult.output && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">输出数据</div>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                        {JSON.stringify(nodeResult.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {nodeResult.error && (
                    <div className="border border-red-200 bg-red-50 rounded p-3">
                      <div className="text-xs font-medium text-red-700 mb-1">错误信息</div>
                      <div className="text-xs text-red-600">{nodeResult.error.message}</div>
                      {nodeResult.error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
                            查看堆栈
                          </summary>
                          <pre className="text-xs text-red-600 mt-2 bg-white p-2 rounded overflow-auto max-h-24">
                            {nodeResult.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {/* 日志 */}
                  {nodeResult.logs && nodeResult.logs.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">日志</div>
                      <div className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-24 space-y-1">
                        {nodeResult.logs.map((log, logIndex) => (
                          <div key={logIndex} className="text-gray-700">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {nodeResults.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Circle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>暂无节点数据</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowExecutionView;

