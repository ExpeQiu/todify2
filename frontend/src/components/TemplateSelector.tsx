import React, { useState } from 'react';
import { FileText, Lightbulb, Zap, Target, Settings } from 'lucide-react';
import './TemplateSelector.css';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  category: 'standard' | 'advanced' | 'specialized';
}

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  onGenerate: (templateId: string) => void;
  isGenerating: boolean;
}

const templates: Template[] = [
  {
    id: 'standard',
    name: '标准技术包装',
    description: '适用于常规技术内容的标准化包装，结构清晰，重点突出',
    icon: <FileText className="template-icon" />,
    features: ['技术概述', '核心特点', '应用场景', '技术优势'],
    category: 'standard'
  },
  {
    id: 'deep-analysis',
    name: '深度技术分析',
    description: '深入分析技术细节，适合复杂技术方案的详细阐述',
    icon: <Lightbulb className="template-icon" />,
    features: ['技术原理', '实现细节', '性能分析', '对比评估'],
    category: 'advanced'
  },
  {
    id: 'simplified',
    name: '简化技术说明',
    description: '简洁明了的技术说明，适合快速理解和传播',
    icon: <Zap className="template-icon" />,
    features: ['核心要点', '简化描述', '关键优势', '快速上手'],
    category: 'standard'
  },
  {
    id: 'innovation-showcase',
    name: '创新技术展示',
    description: '突出技术创新点，适合新技术和前沿方案的展示',
    icon: <Target className="template-icon" />,
    features: ['创新亮点', '技术突破', '市场价值', '发展前景'],
    category: 'specialized'
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onGenerate,
  isGenerating
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'standard' | 'advanced' | 'specialized'>('all');

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === activeCategory);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  const handleGenerate = () => {
    if (selectedTemplate) {
      onGenerate(selectedTemplate);
    }
  };

  return (
    <div className="template-selector">
      <div className="template-header">
        <h3>选择技术包装模板</h3>
        <p>根据您的需求选择合适的技术包装模板</p>
      </div>

      {/* 分类筛选 */}
      <div className="template-categories">
        <button 
          className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部
        </button>
        <button 
          className={`category-btn ${activeCategory === 'standard' ? 'active' : ''}`}
          onClick={() => setActiveCategory('standard')}
        >
          标准模板
        </button>
        <button 
          className={`category-btn ${activeCategory === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveCategory('advanced')}
        >
          高级模板
        </button>
        <button 
          className={`category-btn ${activeCategory === 'specialized' ? 'active' : ''}`}
          onClick={() => setActiveCategory('specialized')}
        >
          专业模板
        </button>
      </div>

      {/* 模板列表 */}
      <div className="template-grid">
        {filteredTemplates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <div className="template-card-header">
              {template.icon}
              <h4>{template.name}</h4>
            </div>
            <p className="template-description">{template.description}</p>
            <div className="template-features">
              {template.features.map((feature, index) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
            </div>
            <div className="template-category-badge">
              {template.category === 'standard' && '标准'}
              {template.category === 'advanced' && '高级'}
              {template.category === 'specialized' && '专业'}
            </div>
          </div>
        ))}
      </div>

      {/* 生成按钮 */}
      <div className="template-actions">
        <button 
          className="btn btn-primary generate-btn"
          onClick={handleGenerate}
          disabled={!selectedTemplate || isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner"></div>
              生成中...
            </>
          ) : (
            <>
              <Settings className="btn-icon" />
              生成技术包装
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;