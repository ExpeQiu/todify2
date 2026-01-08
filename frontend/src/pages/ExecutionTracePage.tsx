import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import executionTraceService, { ExecutionTrace } from '../services/executionTraceService';
import TopNavigation from '../components/TopNavigation';
import '../styles/ExecutionTracePage.css';

const ExecutionTracePage: React.FC = () => {
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  const [traces, setTraces] = useState<ExecutionTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<ExecutionTrace | null>(null);

  useEffect(() => {
    if (executionId) {
      loadTraces();
    }
  }, [executionId]);

  const loadTraces = async () => {
    if (!executionId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await executionTraceService.getByExecutionId(executionId);
      setTraces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载执行追踪失败');
      console.error('加载执行追踪失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      success: { label: '成功', className: 'status-success' },
      failed: { label: '失败', className: 'status-failed' },
      skipped: { label: '跳过', className: 'status-skipped' }
    };
    const statusInfo = statusMap[status] || { label: status, className: 'status-unknown' };
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const parseJSON = (jsonString?: string): any => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  if (loading) {
    return (
      <div className="execution-trace-page">
        <TopNavigation />
        <div className="trace-container">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="execution-trace-page">
        <TopNavigation />
        <div className="trace-container">
          <div className="error">{error}</div>
          <button onClick={loadTraces} className="btn-retry">重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-trace-page">
      <TopNavigation />
      <div className="trace-container">
        <div className="trace-header">
          <h1>执行追踪</h1>
          <div className="trace-info">
            <span>执行ID: {executionId}</span>
            <span>步骤数: {traces.length}</span>
          </div>
        </div>

        <div className="trace-content">
          <div className="trace-list">
            <h2>执行步骤</h2>
            {traces.length === 0 ? (
              <div className="empty-state">暂无执行追踪记录</div>
            ) : (
              <div className="trace-steps">
                {traces.map((trace, index) => (
                  <div
                    key={trace.id}
                    className={`trace-step ${selectedTrace?.id === trace.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTrace(trace)}
                  >
                    <div className="step-header">
                      <div className="step-number">{index + 1}</div>
                      <div className="step-info">
                        <div className="step-name">{trace.step_name}</div>
                        <div className="step-meta">
                          <span className="step-type">{trace.step_type}</span>
                          {getStatusBadge(trace.status)}
                          {trace.duration && (
                            <span className="step-duration">{formatDuration(trace.duration)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {trace.error && (
                      <div className="step-error">错误: {trace.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTrace && (
            <div className="trace-detail">
              <h2>步骤详情</h2>
              <div className="detail-section">
                <h3>基本信息</h3>
                <div className="detail-item">
                  <label>步骤名称:</label>
                  <span>{selectedTrace.step_name}</span>
                </div>
                <div className="detail-item">
                  <label>步骤类型:</label>
                  <span>{selectedTrace.step_type}</span>
                </div>
                <div className="detail-item">
                  <label>状态:</label>
                  {getStatusBadge(selectedTrace.status)}
                </div>
                <div className="detail-item">
                  <label>执行时间:</label>
                  <span>{formatDuration(selectedTrace.duration)}</span>
                </div>
                <div className="detail-item">
                  <label>创建时间:</label>
                  <span>{formatTimestamp(selectedTrace.created_at)}</span>
                </div>
              </div>

              {selectedTrace.input && (
                <div className="detail-section">
                  <h3>输入</h3>
                  <pre className="detail-json">
                    {JSON.stringify(parseJSON(selectedTrace.input), null, 2)}
                  </pre>
                </div>
              )}

              {selectedTrace.output && (
                <div className="detail-section">
                  <h3>输出</h3>
                  <pre className="detail-json">
                    {JSON.stringify(parseJSON(selectedTrace.output), null, 2)}
                  </pre>
                </div>
              )}

              {selectedTrace.error && (
                <div className="detail-section">
                  <h3>错误信息</h3>
                  <div className="error-message">{selectedTrace.error}</div>
                </div>
              )}

              {selectedTrace.metadata && (
                <div className="detail-section">
                  <h3>元数据</h3>
                  <pre className="detail-json">
                    {JSON.stringify(parseJSON(selectedTrace.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionTracePage;

