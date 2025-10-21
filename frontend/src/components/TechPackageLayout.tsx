import React, { useState } from 'react';
import { Package, RefreshCw, ChevronRight } from 'lucide-react';
import { LoadingButton } from './LoadingAnimation';
import './TechPackageLayout.css';

interface TechPackageLayoutProps {
  inputData?: any;
  generatedContent?: any;
  editedContent?: string;
  selectedTemplate?: string;
  isGenerating?: boolean;
  onGenerate?: (template: string) => void;
  onRegenerate?: () => void;
  onContentChange?: (content: string) => void;
  onNext?: () => void;
}

const TechPackageLayout: React.FC<TechPackageLayoutProps> = ({
  inputData,
  generatedContent,
  editedContent,
  selectedTemplate = 'standard',
  isGenerating = false,
  onGenerate,
  onRegenerate,
  onContentChange,
  onNext
}) => {
  const [activeTemplate, setActiveTemplate] = useState(selectedTemplate);

  const templates = [
    { id: 'standard', name: '标准模板', description: '适用于一般技术包装' },
    { id: 'detailed', name: '详细模板', description: '包含更多技术细节' },
    { id: 'marketing', name: '营销模板', description: '侧重市场推广' }
  ];

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(activeTemplate);
    }
  };

  return (
    <div className="tech-package-layout">
      <div className="tech-package-header">
        <Package className="w-8 h-8 text-blue-600 mb-4" />
        <h2 className="tech-package-title">技术包装</h2>
        <p className="tech-package-description">
          基于搜索结果生成专业的技术包装内容
        </p>
      </div>

      <div className="tech-package-content">
        {/* 输入数据展示 */}
        {inputData && (
          <div className="input-data-section">
            <h3 className="section-title">搜索结果</h3>
            <div className="input-data-preview">
              <p className="text-sm text-gray-600">
                已收集到 {inputData.results?.length || 0} 条相关信息
              </p>
            </div>
          </div>
        )}

        {/* 模板选择 */}
        <div className="template-selection">
          <h3 className="section-title">选择模板</h3>
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${activeTemplate === template.id ? 'active' : ''}`}
                onClick={() => setActiveTemplate(template.id)}
              >
                <h4 className="template-name">{template.name}</h4>
                <p className="template-description">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 生成按钮 */}
        <div className="generate-section">
          <LoadingButton
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText="正在生成技术包装..."
            className="generate-button"
          >
            <Package className="w-5 h-5 mr-2" />
            生成技术包装
          </LoadingButton>
        </div>

        {/* 生成的内容 */}
        {generatedContent && (
          <div className="generated-content">
            <div className="content-header">
              <h3 className="section-title">生成的内容</h3>
              <button
                onClick={onRegenerate}
                className="regenerate-button"
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                重新生成
              </button>
            </div>
            
            <div className="content-editor">
              <textarea
                value={editedContent || generatedContent.content || ''}
                onChange={(e) => onContentChange?.(e.target.value)}
                className="content-textarea"
                placeholder="生成的技术包装内容将显示在这里..."
                rows={12}
              />
            </div>

            {/* 下一步按钮 */}
            <div className="next-section">
              <button
                onClick={onNext}
                className="next-button"
                disabled={!generatedContent}
              >
                下一步
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechPackageLayout;