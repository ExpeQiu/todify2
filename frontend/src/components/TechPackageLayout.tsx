import React, { useState, useEffect } from 'react';
import { Package, Edit3, Eye, RefreshCw, Download, Settings, Lightbulb } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import './TechPackageLayout.css';

interface TechPackageLayoutProps {
  inputData?: any;
  generatedContent?: any;
  editedContent?: string;
  selectedTemplate?: string;
  onGenerate: (template?: string) => void;
  onRegenerate: () => void;
  onContentChange: (content: string) => void;
  onNext?: () => void;
  isGenerating: boolean;
  templates?: string[];
}

const TechPackageLayout: React.FC<TechPackageLayoutProps> = ({
  inputData,
  generatedContent,
  editedContent: propEditedContent,
  selectedTemplate: propSelectedTemplate,
  onGenerate,
  onRegenerate,
  onContentChange,
  onNext,
  isGenerating,
  templates = ['标准技术包装', '深度技术分析', '简化技术说明', '创新技术展示']
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(propSelectedTemplate || 'standard');
  const [editedContent, setEditedContent] = useState(propEditedContent || '');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showTemplateSelector, setShowTemplateSelector] = useState(!generatedContent);

  // 同步外部状态
  useEffect(() => {
    if (propSelectedTemplate) {
      setSelectedTemplate(propSelectedTemplate);
    }
  }, [propSelectedTemplate]);

  useEffect(() => {
    if (propEditedContent) {
      setEditedContent(propEditedContent);
    }
  }, [propEditedContent]);

  const handleContentEdit = (content: string) => {
    setEditedContent(content);
    onContentChange(content);
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
  };

  const handleGenerate = () => {
    onGenerate(selectedTemplate);
    setShowTemplateSelector(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="tech-package-layout">
      {/* 顶部操作栏 */}
      <div className="tech-package-header">
        <div className="header-left">
          <Package className="header-icon" />
          <h2>技术包装</h2>
        </div>
        <div className="header-right">
          <select 
            value={selectedTemplate} 
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="template-selector"
          >
            {templates.map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? <RefreshCw className="animate-spin" /> : <Lightbulb />}
            {isGenerating ? '生成中...' : '生成包装'}
          </button>
        </div>
      </div>

      {/* 三栏布局主体 */}
      <div className="tech-package-content">
        {/* 左侧：输入数据区域 */}
        <div className="input-panel">
          <div className="panel-header">
            <h3>上一步信息</h3>
          </div>
          <div className="panel-content">
            {inputData ? (
              <div className="input-data-display">
                <div className="data-summary">
                  <h4>搜索结果摘要</h4>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">关键词:</span>
                      <span className="stat-value">{inputData.keywords?.join(', ') || '未知'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">结果数:</span>
                      <span className="stat-value">{inputData.results?.length || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">数据量:</span>
                      <span className="stat-value">
                        {typeof inputData === 'string' ? 
                          `${Math.round(inputData.length / 1024 * 10) / 10}KB` : 
                          `${Math.round(JSON.stringify(inputData).length / 1024 * 10) / 10}KB`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="data-preview">
                  <h4>主要内容</h4>
                  <div className="content-preview">
                    {typeof inputData === 'string' ? (
                      <div className="text-preview">
                        <p>{inputData.substring(0, 300)}</p>
                        {inputData.length > 300 && <span className="more-indicator">...</span>}
                      </div>
                    ) : (
                      <div className="json-preview-container">
                        <pre className="json-preview">
                          {JSON.stringify(inputData, null, 2).substring(0, 500)}
                          {JSON.stringify(inputData, null, 2).length > 500 && '...'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                <div className="data-actions">
                  <button className="btn btn-sm btn-secondary">
                    <Eye />
                    查看详情
                  </button>
                  <button className="btn btn-sm btn-secondary">
                    <Download />
                    导出数据
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-data">
                <Package className="empty-icon" />
                <p>暂无输入数据</p>
                <small>请先完成上一步操作</small>
              </div>
            )}
          </div>
        </div>

        {/* 中间：AI生成区域 */}
        <div className="generation-panel">
          <div className="panel-header">
            <h3>Dify-AI内容生成区</h3>
            {generatedContent && (
              <button 
                onClick={onRegenerate}
                className="btn btn-secondary btn-sm"
                disabled={isGenerating}
              >
                <RefreshCw className={isGenerating ? 'animate-spin' : ''} />
                重新生成
              </button>
            )}
          </div>
          <div className="panel-content">
            {isGenerating ? (
              <div className="generating-state">
                <div className="loading-animation">
                  <RefreshCw className="animate-spin loading-icon" />
                  <p>AI正在生成技术包装内容...</p>
                  <div className="progress-steps">
                    <div className="step active">分析输入数据</div>
                    <div className="step active">应用包装模板</div>
                    <div className="step active">生成技术内容</div>
                    <div className="step">优化表达方式</div>
                  </div>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="generated-content">
                <div className="content-header">
                  <h4>生成的技术包装</h4>
                  <span className="template-tag">{selectedTemplate}</span>
                </div>
                <div className="content-body">
                  {typeof generatedContent === 'string' ? (
                    <div className="formatted-content">
                      {generatedContent.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <pre className="json-content">
                      {JSON.stringify(generatedContent, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-content">
                {showTemplateSelector ? (
                  <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={handleTemplateSelect}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <div className="empty-state">
                    <Package className="empty-icon" />
                    <p>选择模板开始生成技术包装</p>
                    <button 
                      onClick={() => setShowTemplateSelector(true)}
                      className="btn btn-primary"
                    >
                      选择模板
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：用户编辑区域 */}
        <div className="editing-panel">
          <div className="panel-header">
            <h3>用户编辑区</h3>
            <div className="view-mode-toggle">
              <button 
                className={`btn btn-sm ${viewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('edit')}
              >
                <Edit3 />
                编辑
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('preview')}
              >
                <Eye />
                预览
              </button>
            </div>
          </div>
          <div className="panel-content">
            {viewMode === 'edit' ? (
              <div className="edit-mode">
                <textarea
                  value={editedContent || (typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2))}
                  onChange={(e) => handleContentEdit(e.target.value)}
                  placeholder="在此编辑和优化生成的内容..."
                  className="content-editor"
                />
                <div className="editor-toolbar">
                  <div className="toolbar-left">
                    <span className="word-count">
                      字数: {(editedContent || '').length}
                    </span>
                  </div>
                  <div className="toolbar-right">
                    <button className="btn btn-sm btn-secondary">
                      <Settings />
                      格式化
                    </button>
                    <button className="btn btn-sm btn-secondary">
                      <Download />
                      导出
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-mode">
                <div className="preview-content">
                  {editedContent ? (
                    <div className="formatted-preview">
                      {editedContent.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  ) : generatedContent ? (
                    <div className="formatted-preview">
                      {typeof generatedContent === 'string' ? (
                        generatedContent.split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))
                      ) : (
                        <pre className="json-preview">
                          {JSON.stringify(generatedContent, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="empty-preview">
                      <Eye className="empty-icon" />
                      <p>暂无内容预览</p>
                      <p className="empty-hint">生成或编辑内容后可在此预览</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作区 */}
      <div className="tech-package-footer">
        <div className="footer-left">
          <button className="btn btn-secondary">
            上一步: AI搜索
          </button>
        </div>
        <div className="footer-right">
          <button className="btn btn-secondary">
            附加信息
          </button>
          <button className="btn btn-secondary">
            内容导出
          </button>
          <button 
            className="btn btn-primary"
            onClick={onNext}
            disabled={!generatedContent && !editedContent}
          >
            下一步: 技术策略
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechPackageLayout;