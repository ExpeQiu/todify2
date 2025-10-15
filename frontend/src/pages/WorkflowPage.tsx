import React, { useState } from 'react';
import { Search, Package, Target, FileText, Mic, Download, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { workflowAPI } from '../services/api';
import DocumentEditor from '../components/DocumentEditor';
import { documentService } from '../services/documentService';
import './WorkflowPage.css';

interface StepData {
  smartSearch?: any;
  techPackage?: any;
  promotionStrategy?: any;
  coreDraft?: any;
  speech?: any;
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  const steps = [
    { id: 1, title: '智能搜索', icon: Search, description: '输入关键词进行智能搜索' },
    { id: 2, title: '技术包装', icon: Package, description: '对搜索结果进行技术包装' },
    { id: 3, title: '推广策略', icon: Target, description: '生成推广策略方案' },
    { id: 4, title: '核心稿件', icon: FileText, description: '生成核心文档稿件' },
    { id: 5, title: '演讲稿', icon: Mic, description: '生成演讲稿内容' },
  ];

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setLoading(true);
    try {
      const result = await workflowAPI.smartSearch(searchQuery);
      if (result.success) {
        setStepData(prev => ({ ...prev, smartSearch: result.data }));
        setCurrentStep(2);
      } else {
        alert(result.error || '搜索失败');
      }
    } catch (error) {
      alert('搜索请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTechPackage = async () => {
    setLoading(true);
    try {
      const result = await workflowAPI.techPackage(stepData.smartSearch);
      if (result.success) {
        setStepData(prev => ({ ...prev, techPackage: result.data }));
        setCurrentStep(3);
      } else {
        alert(result.error || '技术包装失败');
      }
    } catch (error) {
      alert('技术包装请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionStrategy = async () => {
    setLoading(true);
    try {
      const result = await workflowAPI.promotionStrategy(stepData.techPackage);
      if (result.success) {
        setStepData(prev => ({ ...prev, promotionStrategy: result.data }));
        setCurrentStep(4);
      } else {
        alert(result.error || '推广策略生成失败');
      }
    } catch (error) {
      alert('推广策略请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCoreDraft = async () => {
    setLoading(true);
    try {
      const result = await workflowAPI.coreDraft(stepData.promotionStrategy, stepData.techPackage);
      if (result.success) {
        setStepData(prev => ({ ...prev, coreDraft: result.data }));
        
        // Create document from core draft
        const document: Document = {
          id: Date.now().toString(),
          title: '智能生成文档',
          content: result.data.content || JSON.stringify(result.data, null, 2),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setCurrentDocument(document);
        
        setCurrentStep(5);
      } else {
        alert(result.error || '核心稿件生成失败');
      }
    } catch (error) {
      alert('核心稿件请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async (content: string, title: string) => {
    if (!currentDocument) return;
    
    const updatedDocument = {
      ...currentDocument,
      title,
      content,
      updatedAt: new Date()
    };
    
    documentService.saveDocument(updatedDocument);
    setCurrentDocument(updatedDocument);
  };

  const handleExportDocument = async (content: string, title: string) => {
    if (!currentDocument) return;
    
    try {
      await documentService.exportToPDF(content, title);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请稍后重试');
    }
  };

  const handleSpeechGeneration = async () => {
    setLoading(true);
    try {
      const result = await workflowAPI.speech(stepData.coreDraft);
      if (result.success) {
        setStepData(prev => ({ ...prev, speech: result.data }));
        alert('语音生成完成！');
      } else {
        alert(result.error || '语音生成失败');
      }
    } catch (error) {
      alert('语音请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>智能搜索</h2>
            <p>请输入您想要搜索的关键词，系统将为您进行智能搜索并收集相关信息。</p>
            <textarea
              placeholder="输入搜索关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={handleSmartSearch} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="spinner" /> : <Search />}
              开始搜索
            </button>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>技术包装</h2>
            <p>基于搜索结果进行技术包装，提取核心技术要点。</p>
            {stepData.smartSearch && (
              <div className="result-area">
                <h3>搜索结果预览</h3>
                <pre>{JSON.stringify(stepData.smartSearch, null, 2)}</pre>
              </div>
            )}
            <button 
              onClick={handleTechPackage} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="spinner" /> : <Package />}
              生成技术包装
            </button>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>推广策略</h2>
            <p>制定推广策略，分析市场定位和推广方案。</p>
            {stepData.techPackage && (
              <div className="result-area">
                <h3>技术包装结果</h3>
                <pre>{JSON.stringify(stepData.techPackage, null, 2)}</pre>
              </div>
            )}
            <button 
              onClick={handlePromotionStrategy} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="spinner" /> : <Target />}
              生成推广策略
            </button>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>核心草稿</h2>
            <p>生成文档的核心草稿内容。</p>
            {stepData.promotionStrategy && (
              <div className="result-area">
                <h3>推广策略结果</h3>
                <pre>{JSON.stringify(stepData.promotionStrategy, null, 2)}</pre>
              </div>
            )}
            <button 
              onClick={handleCoreDraft} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? <Loader2 className="spinner" /> : <FileText />}
              生成核心草稿
            </button>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>文档编辑与导出</h2>
            <p>编辑生成的文档并导出为PDF或其他格式。</p>
            
            {currentDocument && (
              <div className="document-editor-container">
                <DocumentEditor
                  initialContent={currentDocument.content}
                  title={currentDocument.title}
                  onSave={handleSaveDocument}
                  onExportPDF={handleExportDocument}
                />
              </div>
            )}
            
            <div className="speech-section">
              <h3>语音生成</h3>
              <p>为文档生成语音版本。</p>
              <button 
                onClick={handleSpeechGeneration} 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? <Loader2 className="spinner" /> : <Mic />}
                生成语音
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workflow-page">
      <div className="sidebar">
        <h1>Todify2</h1>
        <p className="subtitle">智能文档生成平台</p>
        
        <div className="steps">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div 
                key={step.id} 
                className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="step-icon">
                  <Icon size={20} />
                </div>
                <div className="step-info">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="main-content">
        {renderStepContent()}
        
        <div className="actions">
          {currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn-secondary"
            >
              <ChevronLeft />
              上一步
            </button>
          )}
          
          {currentStep < 5 && currentStep > 1 && (
            <button 
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-primary"
            >
              下一步
              <ChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;