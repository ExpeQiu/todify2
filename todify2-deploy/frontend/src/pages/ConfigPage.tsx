import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  TestTube, 
  Save, 
  Download, 
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import './ConfigPage.css';
import configService, { 
  DifyAPIConfig, 
  WorkflowStepConfig, 
  ConfigResponse, 
  DifyAPITestResult 
} from '../services/configService';

const ConfigPage: React.FC = () => {
  // 状态管理
  const [difyConfigs, setDifyConfigs] = useState<DifyAPIConfig[]>([]);
  const [workflowConfigs, setWorkflowConfigs] = useState<WorkflowStepConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"dify" | "workflow">("dify");
  const [testResults, setTestResults] = useState<{ [key: string]: DifyAPITestResult }>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  // 加载配置数据
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [difyConfigs, workflowConfigs] = await Promise.all([
        configService.getDifyConfigs(),
        configService.getWorkflowConfigs()
      ]);
      
      setDifyConfigs(difyConfigs);
      setWorkflowConfigs(workflowConfigs);
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: '加载配置失败' });
    } finally {
      setLoading(false);
    }
  };

  // 保存所有配置
  const saveAllConfigs = async () => {
    setSaving(true);
    try {
      const [difyResult, workflowResult] = await Promise.all([
        configService.saveDifyConfigs(difyConfigs),
        configService.saveWorkflowConfigs(workflowConfigs)
      ]);
      
      if (difyResult.success && workflowResult.success) {
        setMessage({ type: 'success', text: '所有配置保存成功' });
      } else {
        const errors = [];
        if (!difyResult.success) errors.push(difyResult.message);
        if (!workflowResult.success) errors.push(workflowResult.message);
        setMessage({ type: 'error', text: `保存失败: ${errors.join(', ')}` });
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage({ type: 'error', text: '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  // 测试Dify API连接
  const testConnection = async (config: DifyAPIConfig) => {
    setTestResults(prev => ({
      ...prev,
      [config.id]: { success: false, message: '测试中...' }
    }));

    try {
      const result = await configService.testDifyConnection(config);
      setTestResults(prev => ({
        ...prev,
        [config.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [config.id]: { success: false, message: '测试失败' }
      }));
    }
  };

  // 添加新的Dify配置
  const addDifyConfig = async () => {
    const newConfig: Omit<DifyAPIConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '新配置',
      description: '请填写配置描述',
      apiUrl: 'https://api.dify.ai/v1',
      apiKey: '',
      enabled: true,
    };

    try {
      const result = await configService.addDifyConfig(newConfig);
      if (result.success && result.data) {
        setDifyConfigs(prev => [...prev, result.data]);
        setMessage({ type: 'success', text: '配置添加成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '添加失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '添加配置失败' });
    }
  };

  // 添加预设配置模板
  const addPresetConfig = async (preset: { name: string; description: string; type: string }) => {
    const newConfig: Omit<DifyAPIConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: preset.name,
      description: preset.description,
      apiUrl: 'https://api.dify.ai/v1',
      apiKey: '',
      enabled: true,
    };

    try {
      const result = await configService.addDifyConfig(newConfig);
      if (result.success && result.data) {
        setDifyConfigs(prev => [...prev, result.data]);
        setMessage({ type: 'success', text: `${preset.name}配置模板添加成功` });
      } else {
        setMessage({ type: 'error', text: result.message || '添加失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '添加配置失败' });
    }
  };

  // 更新Dify配置
  const updateDifyConfig = (id: string, updates: Partial<DifyAPIConfig>) => {
    setDifyConfigs(prev =>
      prev.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
    );
  };

  // 删除Dify配置
  const deleteDifyConfig = async (id: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      const result = await configService.deleteDifyConfig(id);
      if (result.success) {
        setDifyConfigs(prev => prev.filter(config => config.id !== id));
        setMessage({ type: 'success', text: '配置删除成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除配置失败' });
    }
  };

  // 切换API密钥显示
  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: '已复制到剪贴板' });
    } catch (error) {
      console.error('复制失败:', error);
      setMessage({ type: 'error', text: '复制失败' });
    }
  };

  // 更新工作流配置
  const updateWorkflowConfig = (stepId: number, difyConfigId: string) => {
    setWorkflowConfigs(prev =>
      prev.map(config =>
        config.stepId === stepId ? { ...config, difyConfigId } : config
      )
    );
  };

  // 清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="config-page">
        <TopNavigation />
        <div className="config-container">
          <div className="loading-state">
            <Loader size={32} className="spinning" />
            <p>加载配置中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <TopNavigation />
      <div className="config-layout">
        {/* 消息提示 */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* 左侧导航 */}
        <div className="config-sidebar">
          <div className="sidebar-header">
            <Settings size={20} />
            <h2>系统配置</h2>
          </div>
          <div className="sidebar-description">
            管理和配置系统的各项参数，请选择相应的配置项
          </div>
          
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "dify" ? "active" : ""}`}
              onClick={() => setActiveTab("dify")}
            >
              Dify API配置
            </button>
            <button
              className={`nav-item ${activeTab === "workflow" ? "active" : ""}`}
              onClick={() => setActiveTab("workflow")}
            >
              工作流配置
            </button>
          </nav>
        </div>

        {/* 右侧内容区域 */}
        <div className="config-content">
          <div className="content-header">
            <button
              className={`save-btn ${saving ? 'saving' : ''}`}
              onClick={saveAllConfigs}
              disabled={saving}
            >
              {saving && <RefreshCw size={16} className="spinning" />}
              {!saving && <Save size={16} />}
              {saving ? "保存中..." : "保存配置"}
            </button>
          </div>

          {/* 内容区域 */}
          <div className="content-body">
          {activeTab === "dify" && (
            <div className="dify-config-section">
              <div className="section-header">
                <div>
                  <h2>Dify接口配置管理</h2>
                  <p>管理所有Dify API端点的配置信息，支持独立配置每个接口的API密钥和设置</p>
                </div>
                <div className="header-actions">
                  <div className="preset-configs">
                    <button 
                      className="preset-btn"
                      onClick={() => addPresetConfig({
                        name: 'AI智能搜索',
                        description: 'AI智能搜索接口，用于处理用户查询和信息检索',
                        type: 'ai_search'
                      })}
                    >
                      <Plus size={14} />
                      AI搜索
                    </button>
                    <button 
                      className="preset-btn"
                      onClick={() => addPresetConfig({
                        name: '技术包装',
                        description: '技术包装接口，用于技术内容的包装和优化',
                        type: 'tech_package'
                      })}
                    >
                      <Plus size={14} />
                      技术包装
                    </button>
                    <button 
                      className="preset-btn"
                      onClick={() => addPresetConfig({
                        name: '推广策略',
                        description: '推广策略接口，用于生成营销和推广方案',
                        type: 'promotion_strategy'
                      })}
                    >
                      <Plus size={14} />
                      推广策略
                    </button>
                    <button 
                      className="preset-btn"
                      onClick={() => addPresetConfig({
                        name: '核心文章',
                        description: '核心文章接口，用于生成高质量的技术文章',
                        type: 'core_article'
                      })}
                    >
                      <Plus size={14} />
                      核心文章
                    </button>
                    <button 
                      className="preset-btn"
                      onClick={() => addPresetConfig({
                        name: '演讲稿生成',
                        description: '演讲稿生成接口，用于创建演讲和发布内容',
                        type: 'speech_generation'
                      })}
                    >
                      <Plus size={14} />
                      演讲稿
                    </button>
                  </div>
                  <button className="add-btn" onClick={addDifyConfig}>
                    <Plus size={16} />
                    自定义配置
                  </button>
                </div>
              </div>

              {/* API端点概览 */}
              <div className="api-endpoints-overview">
                <h3>已配置的Dify API端点</h3>
                {difyConfigs.length === 0 ? (
                  <div className="empty-state">
                    <p>暂无配置，请使用上方的预设模板或自定义配置来添加Dify API端点</p>
                  </div>
                ) : (
                  <div className="endpoints-grid">
                    {difyConfigs.map((config) => (
                      <div key={config.id} className="endpoint-card">
                        <div className="endpoint-header">
                          <h4>{config.name}</h4>
                          <span className="endpoint-type">Chat</span>
                        </div>
                        <p>{config.description}</p>
                        <div className="endpoint-details">
                          <span className="api-path">POST /chat-messages</span>
                          <span className={`status-indicator ${config.enabled ? 'enabled' : 'disabled'}`}>
                            {config.enabled ? '已启用' : '已禁用'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="config-list">
                {difyConfigs.map((config) => (
                  <div key={config.id} className="config-card">
                    <div className="config-header">
                      <div className="config-info">
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => updateDifyConfig(config.id, { name: e.target.value })}
                          className="config-name-input"
                          placeholder="配置名称"
                        />
                        <input
                          type="text"
                          value={config.description}
                          onChange={(e) => updateDifyConfig(config.id, { description: e.target.value })}
                          className="config-desc-input"
                          placeholder="配置描述"
                        />
                      </div>
                      <div className="config-actions">
                        <button
                          className="test-btn"
                          onClick={() => testConnection(config)}
                          disabled={!config.apiUrl || !config.apiKey}
                        >
                          <TestTube size={16} />
                          测试连接
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteDifyConfig(config.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="config-fields">
                      <div className="field-group">
                        <label>配置名称</label>
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => updateDifyConfig(config.id, { name: e.target.value })}
                          placeholder="输入配置名称"
                        />
                      </div>

                      <div className="field-group">
                        <label>描述信息</label>
                        <textarea
                          value={config.description}
                          onChange={(e) => updateDifyConfig(config.id, { description: e.target.value })}
                          placeholder="描述此配置的用途和功能"
                          rows={2}
                        />
                      </div>

                      <div className="field-group">
                        <label>API基础URL</label>
                        <input
                          type="url"
                          value={config.apiUrl}
                          onChange={(e) => updateDifyConfig(config.id, { apiUrl: e.target.value })}
                          placeholder="https://api.dify.ai/v1"
                        />
                      </div>

                      <div className="field-group">
                        <label>API密钥</label>
                        <div className="api-key-input">
                          <input
                            type={showApiKeys[config.id] ? "text" : "password"}
                            value={config.apiKey}
                            onChange={(e) => updateDifyConfig(config.id, { apiKey: e.target.value })}
                            placeholder="输入Dify API密钥"
                          />
                          <button
                            type="button"
                            className="toggle-visibility"
                            onClick={() => toggleApiKeyVisibility(config.id)}
                            title={showApiKeys[config.id] ? "隐藏密钥" : "显示密钥"}
                          >
                            {showApiKeys[config.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => copyToClipboard(config.apiKey)}
                            title="复制密钥"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="field-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => updateDifyConfig(config.id, { enabled: e.target.checked })}
                          />
                          启用此配置
                        </label>
                      </div>
                    </div>

                    {/* 测试结果 */}
                    {testResults[config.id] && (
                      <div className={`test-result ${testResults[config.id].success ? 'success' : 'error'}`}>
                        {testResults[config.id].success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{testResults[config.id].message}</span>
                        {testResults[config.id].responseTime && (
                          <span className="response-time">({testResults[config.id].responseTime}ms)</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "workflow" && (
            <div className="workflow-config-section">
              <div className="section-header">
                <h2>工作流节点配置</h2>
                <p>为每个工作流节点配置独立的Dify API，每个节点可以使用不同的模型和配置</p>
              </div>

              <div className="workflow-list">
                {workflowConfigs.map((stepConfig) => {
                  const assignedConfig = difyConfigs.find(config => config.id === stepConfig.difyConfigId);
                  return (
                    <div key={stepConfig.stepId} className="workflow-item">
                      <div className="step-info">
                        <div className="step-number">{stepConfig.stepId}</div>
                        <div className="step-details">
                          <h3>{stepConfig.stepName}</h3>
                          <p className="step-key">节点键: {stepConfig.stepKey}</p>
                          <p className="step-description">
                            {stepConfig.stepKey === 'aiSearch' && '智能搜索节点 - 处理用户问答和信息检索'}
                            {stepConfig.stepKey === 'techPackage' && '技术包装节点 - 对技术内容进行包装和优化'}
                            {stepConfig.stepKey === 'techStrategy' && '技术策略节点 - 生成技术策略分析'}
                            {stepConfig.stepKey === 'coreDraft' && '核心稿件节点 - 生成技术通稿'}
                            {stepConfig.stepKey === 'speechGeneration' && '演讲稿节点 - 生成发布会演讲稿'}
                          </p>
                        </div>
                      </div>

                      <div className="step-config">
                        <div className="config-assignment">
                          <label>选择Dify配置</label>
                          <select
                            value={stepConfig.difyConfigId}
                            onChange={(e) => updateWorkflowConfig(stepConfig.stepId, e.target.value)}
                            className="config-select"
                          >
                            <option value="">请选择配置</option>
                            {difyConfigs
                              .filter(config => config.enabled)
                              .map((config) => (
                                <option key={config.id} value={config.id}>
                                  {config.name} - {config.description}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* 显示当前分配的配置信息 */}
                        {assignedConfig && (
                          <div className="assigned-config-info">
                            <div className="config-status">
                              <span className={`status-indicator ${assignedConfig.enabled ? 'enabled' : 'disabled'}`}>
                                {assignedConfig.enabled ? '已启用' : '已禁用'}
                              </span>
                              <span className="config-name">{assignedConfig.name}</span>
                            </div>
                            <div className="config-details">
                              <p>API地址: {assignedConfig.apiUrl}</p>
                              <p>API密钥: {assignedConfig.apiKey ? '已配置' : '未配置'}</p>
                            </div>
                            {/* 测试按钮 */}
                            <button
                              className="test-btn"
                              onClick={() => testConnection(assignedConfig)}
                              disabled={!assignedConfig.apiKey}
                            >
                              <TestTube size={14} />
                              测试连接
                            </button>
                          </div>
                        )}

                        {/* 测试结果 */}
                        {assignedConfig && testResults[assignedConfig.id] && (
                          <div className={`test-result ${testResults[assignedConfig.id].success ? 'success' : 'error'}`}>
                            {testResults[assignedConfig.id].success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            <span>{testResults[assignedConfig.id].message}</span>
                            {testResults[assignedConfig.id].responseTime && (
                              <span className="response-time">({testResults[assignedConfig.id].responseTime}ms)</span>
                            )}
                          </div>
                        )}

                        {/* 未配置提示 */}
                        {!stepConfig.difyConfigId && (
                          <div className="no-config-warning">
                            <AlertCircle size={16} />
                            <span>此节点尚未配置Dify API，请选择一个配置</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 配置建议 */}
              <div className="config-suggestions">
                <h3>配置建议</h3>
                <ul>
                  <li>每个节点建议使用专门优化的模型配置以获得最佳效果</li>
                  <li>智能搜索节点适合使用问答优化的模型</li>
                  <li>技术包装和推广策略节点适合使用创意写作模型</li>
                  <li>核心稿件和演讲稿节点适合使用长文本生成模型</li>
                  <li>定期测试API连接以确保配置正常工作</li>
                </ul>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;