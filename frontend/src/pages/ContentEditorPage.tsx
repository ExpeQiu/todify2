import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Save, History, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import TopNavigation from '../components/TopNavigation';
import LocalContentEditor, { LocalOptimizationRequest } from '../components/LocalContentEditor';
import WorkflowExecutionView, { AgentWorkflow, AgentStepResult } from '../components/WorkflowExecutionView';
import WorkflowStepDetailPanel from '../components/WorkflowStepDetailPanel';

interface MultiAgentExecutionResult {
  executionId: string;
  scene: 'tech-package' | 'tech-strategy' | 'tech-article';
  finalOutput: string;
  versionId: string;
  matchedResources: {
    techPoints: Array<{ data: any; score: number; matchReason: string }>;
    knowledgePoints: Array<{ data: any; score: number; matchReason: string }>;
    sources: Array<{ data: any; score: number; matchReason: string }>;
  };
  intermediateResults: Array<{
    agentId: string;
    agentName: string;
    output: string;
    executionTime: number;
  }>;
  workflow?: AgentWorkflow[];
  totalTime: number;
}

const ContentEditorPage: React.FC = () => {
  const { projectId, executionId } = useParams<{ projectId: string; executionId: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<MultiAgentExecutionResult | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [currentVersionId, setCurrentVersionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (executionId) {
      loadExecution();
    }
    
    // 清理轮询
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [executionId]);

  const loadExecution = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      setError(null);
      
      // 首先尝试从sessionStorage加载
      const stored = sessionStorage.getItem(`execution-${executionId}`);
      if (stored && !isPolling) {
        try {
          const data = JSON.parse(stored);
          setExecution(data);
          setCurrentContent(data.finalOutput);
          setCurrentVersionId(data.versionId);
          setLoading(false);
          
          // 如果执行已完成，不需要轮询
          if (data.finalOutput) {
            return;
          }
        } catch (e) {
          console.warn('解析存储的执行结果失败:', e);
        }
      }
      
      // 从API获取执行状态
      try {
        const response = await api.get(`/agent/executions/${executionId}/status`);
        
        if (response.data.success && response.data.data) {
          const statusData = response.data.data;
          
          // 如果执行已完成，更新数据并停止轮询
          if (statusData.status === 'completed') {
            const fullResponse = await api.get(`/agent/executions/${executionId}`);
            if (fullResponse.data.success && fullResponse.data.data) {
              const data = fullResponse.data.data;
              setExecution(data);
              setCurrentContent(data.finalOutput);
              setCurrentVersionId(data.versionId);
              sessionStorage.setItem(`execution-${executionId}`, JSON.stringify(data));
              
              // 停止轮询
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsPolling(false);
            }
          } else if (statusData.status === 'running') {
            // 执行中，更新中间结果
            if (statusData.stepResults) {
              setExecution(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  intermediateResults: statusData.stepResults
                };
              });
            }
            
            // 如果还没开始轮询，开始轮询
            if (!isPolling && !pollingIntervalRef.current) {
              startPolling();
            }
          } else if (statusData.status === 'failed') {
            setError('执行失败：' + (statusData.error || '未知错误'));
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsPolling(false);
          }
        } else {
          // API可能还未实现，尝试直接获取完整数据
          const fullResponse = await api.get(`/agent/executions/${executionId}`);
          if (fullResponse.data.success && fullResponse.data.data) {
            const data = fullResponse.data.data;
            setExecution(data);
            setCurrentContent(data.finalOutput);
            setCurrentVersionId(data.versionId);
          } else {
            if (!isPolling) {
              setError('执行记录不存在，请返回项目资源页重新生成');
            }
          }
        }
      } catch (apiError: any) {
        // API可能还未实现，使用错误提示
        if (!isPolling) {
          console.warn('从API加载执行结果失败:', apiError);
          setError('执行记录不存在，请返回项目资源页重新生成');
        }
      }
    } catch (error: any) {
      console.error('加载执行结果失败:', error);
      if (!isPolling) {
        setError(error.message || '加载失败');
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // 开始轮询
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    
    setIsPolling(true);
    pollingIntervalRef.current = setInterval(() => {
      loadExecution(true);
    }, 2000); // 每2秒轮询一次
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  };

  const handleExport = async () => {
    if (!execution) {
      alert('执行记录不存在');
      return;
    }

    try {
      // 选择导出格式
      const format = window.prompt('选择导出格式:\n1. markdown\n2. txt\n3. docx\n4. pdf', 'markdown') || 'markdown';
      
      if (!['markdown', 'txt', 'docx', 'pdf'].includes(format)) {
        alert('不支持的导出格式');
        return;
      }

      // 调用导出API
      const response = await api.post(
        `/agent/executions/${executionId}/export`,
        {
          format,
          versionId: currentVersionId,
          execution
        },
        {
          responseType: 'blob'
        }
      );

      // 创建下载链接
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = `content-${Date.now()}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('导出失败:', error);
      alert('导出失败：' + (error.response?.data?.error || error.message || '未知错误'));
    }
  };

  const handleSave = () => {
    // TODO: 实现保存功能
    alert('保存功能待实现');
  };

  // 处理局部优化
  const handleLocalOptimize = async (request: LocalOptimizationRequest) => {
    try {
      const response = await api.post('/agent/optimize-local', request);
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        
        // 更新内容和版本
        setCurrentContent(result.fullContent);
        setCurrentVersionId(result.newVersionId);
        
        // 更新执行结果
        if (execution) {
          setExecution({
            ...execution,
            finalOutput: result.fullContent,
            versionId: result.newVersionId
          });
        }
        
        // 更新sessionStorage
        if (execution) {
          const updatedExecution = {
            ...execution,
            finalOutput: result.fullContent,
            versionId: result.newVersionId
          };
          sessionStorage.setItem(`execution-${executionId}`, JSON.stringify(updatedExecution));
        }
      } else {
        throw new Error(response.data.error || '优化失败');
      }
    } catch (error: any) {
      console.error('局部优化失败:', error);
      alert('优化失败：' + (error.response?.data?.error || error.message || '未知错误'));
      throw error;
    }
  };

  // 回退版本
  const handleRevert = async (versionId: string) => {
    try {
      const response = await api.post(`/agent/executions/${executionId}/revert`, {
        targetVersionId: versionId
      });
      
      if (response.data.success && response.data.data) {
        const version = response.data.data;
        setCurrentContent(version.content);
        setCurrentVersionId(version.versionId);
        
        // 更新执行结果
        if (execution) {
          setExecution({
            ...execution,
            finalOutput: version.content,
            versionId: version.versionId
          });
        }
      } else {
        throw new Error(response.data.error || '回退失败');
      }
    } catch (error: any) {
      console.error('回退失败:', error);
      alert('回退失败：' + (error.response?.data?.error || error.message || '未知错误'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate(`/project/${projectId}/resources`)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回项目资源页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <p>执行结果不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(`/project/${projectId}/resources`)}
          className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回项目资源页</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：中间结果和资源信息 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">生成信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">场景:</span>
                  <span className="text-gray-800 font-medium">
                    {execution.scene === 'tech-package' ? '技术包装' : 
                     execution.scene === 'tech-strategy' ? '技术策略' : '技术通稿'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">生成时间:</span>
                  <span className="text-gray-800 font-medium">{execution.totalTime}ms</span>
                </div>
              </div>
            </div>

            {/* 工作流执行视图 */}
            {execution.workflow && execution.workflow.length > 0 ? (
              <>
                <WorkflowExecutionView
                  executionId={executionId || ''}
                  workflow={execution.workflow}
                  stepResults={execution.intermediateResults.map(step => ({
                    agentId: step.agentId,
                    agentName: step.agentName,
                    output: step.output,
                    executionTime: step.executionTime,
                    status: 'completed' as const
                  }))}
                  currentStepIndex={execution.intermediateResults.length}
                  onStepClick={setSelectedStepIndex}
                />
                {/* 步骤详情面板 */}
                {selectedStepIndex !== null && execution.workflow[selectedStepIndex] && (
                  <WorkflowStepDetailPanel
                    stepIndex={selectedStepIndex}
                    workflow={execution.workflow[selectedStepIndex]}
                    stepResult={execution.intermediateResults[selectedStepIndex] ? {
                      agentId: execution.intermediateResults[selectedStepIndex].agentId,
                      agentName: execution.intermediateResults[selectedStepIndex].agentName,
                      output: execution.intermediateResults[selectedStepIndex].output,
                      executionTime: execution.intermediateResults[selectedStepIndex].executionTime,
                      status: 'completed'
                    } : undefined}
                    onClose={() => setSelectedStepIndex(null)}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">生成步骤</h3>
                <div className="space-y-3">
                  {execution.intermediateResults.map((step, idx) => (
                    <div key={idx} className="border-l-2 border-blue-200 pl-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-800">{step.agentName}</span>
                        <span className="text-xs text-gray-500">{step.executionTime}ms</span>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {step.output.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 匹配的资源 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">使用的资源</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">技术点:</span>
                  <span className="text-gray-800 font-medium">
                    {execution.matchedResources.techPoints.length}个
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">知识点:</span>
                  <span className="text-gray-800 font-medium">
                    {execution.matchedResources.knowledgePoints.length}个
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">来源:</span>
                  <span className="text-gray-800 font-medium">
                    {execution.matchedResources.sources.length}个
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 中间：内容编辑器 */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">生成内容</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExport}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <LocalContentEditor
                  executionId={executionId || ''}
                  content={currentContent}
                  versionId={currentVersionId}
                  onOptimize={handleLocalOptimize}
                  onRevert={handleRevert}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditorPage;

