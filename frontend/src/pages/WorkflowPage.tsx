import React, { useState } from 'react';
import { Search, Package, Target, FileText, Mic } from 'lucide-react';
import { workflowAPI } from '../services/api';
import DocumentEditor from '../components/DocumentEditor';
import LoadingAnimation, { LoadingOverlay, LoadingButton } from '../components/LoadingAnimation';
import PageTransition, { StepTransition, AnimatedPage } from '../components/PageTransition';
import TechPackageLayout from '../components/TechPackageLayout';
import { documentService } from '../services/documentService';
import TopNavigation from '../components/TopNavigation';
import './WorkflowPage.css';

interface StepData {
  smartSearch?: any;
  techPackage?: any;
  promotionStrategy?: any;
  coreDraft?: any;
  speechGeneration?: any;
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TechPackageState {
  generatedContent?: any;
  editedContent?: string;
  selectedTemplate?: string;
  isGenerating: boolean;
}

const WorkflowPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
  // const [searchQuery, setSearchQuery] = useState('');
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [techPackageState, setTechPackageState] = useState<TechPackageState>({
    isGenerating: false
  });

  const steps = [
    { id: 1, title: '智能搜索', description: '收集相关信息', icon: Search, key: 'smartSearch' },
    { id: 2, title: '技术包装', description: '对搜索结果进行技术包装', icon: Package, key: 'techPackage' },
    { id: 3, title: '推广策略', description: '生成推广策略方案', icon: Target, key: 'promotionStrategy' },
    { id: 4, title: '核心稿件', description: '生成核心文档稿件', icon: FileText, key: 'coreDraft' },
    { id: 5, title: '演讲稿', description: '生成演讲稿内容', icon: Mic, key: 'speechGeneration' }
  ];

  // 添加步骤过渡动画状态
  const [stepTransition, setStepTransition] = useState<'entering' | 'exiting' | null>(null);

  // 增强的步骤切换处理
  const handleStepChange = (newStep: number) => {
    if (newStep < 1 || newStep > 5 || newStep === currentStep) return;
    
    setStepTransition('exiting');
    setTimeout(() => {
      setCurrentStep(newStep);
      setStepTransition('entering');
      setTimeout(() => setStepTransition(null), 600);
    }, 400);
  };

  const handleSmartSearch = async (query: string) => {
    setLoading(true);
    setLoadingText('正在进行智能搜索...');
    setLoadingProgress(0);
    
    try {
      // 模拟进度更新
      const progressSteps = [20, 40, 60, 80, 100];
      const textSteps = [
        '分析搜索关键词...',
        '检索相关信息...',
        '整理搜索结果...',
        '生成智能摘要...',
        '搜索完成！'
      ];
      
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingProgress(progressSteps[i]);
        setLoadingText(textSteps[i]);
      }
      
      const result = await workflowAPI.smartSearch(query);
      
      if (result.success) {
        setStepData(prev => ({ ...prev, smartSearch: result.data }));
        setTimeout(() => {
          setCurrentStep(1);
        }, 500);
      } else {
        alert(result.error || '智能搜索失败');
      }
    } catch (error) {
      alert('搜索请求失败，请稍后重试');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingText('');
        setLoadingProgress(undefined);
      }, 1000);
    }
  };

  const handleTechPackage = async (template?: string) => {
    setTechPackageState(prev => ({ ...prev, isGenerating: true, selectedTemplate: template }));
    
    try {
      const result = await workflowAPI.techPackage(stepData.smartSearch, template);
      
      if (result.success) {
        setTechPackageState(prev => ({
          ...prev,
          generatedContent: result.data,
          isGenerating: false
        }));
        setStepData(prev => ({ ...prev, techPackage: result.data }));
      } else {
        alert(result.error || '技术包装失败');
        setTechPackageState(prev => ({ ...prev, isGenerating: false }));
      }
    } catch (error) {
      alert('技术包装请求失败，请稍后重试');
      setTechPackageState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleTechPackageRegenerate = async () => {
    await handleTechPackage(techPackageState.selectedTemplate);
  };

  const handleTechPackageContentChange = (content: string) => {
    setTechPackageState(prev => ({ ...prev, editedContent: content }));
  };

  const handlePromotionStrategy = async () => {
    setLoading(true);
    setLoadingText('正在生成推广策略...');
    setLoadingProgress(undefined);
    
    try {
      setLoadingProgress(25);
      setLoadingText('分析技术包装数据...');
      
      const result = await workflowAPI.promotionStrategy(stepData.techPackage);
      
      setLoadingProgress(85);
      setLoadingText('制定推广方案...');
      
      if (result.success) {
        setLoadingProgress(100);
        setLoadingText('推广策略完成！');
        
        setTimeout(() => {
          setStepData(prev => ({ ...prev, promotionStrategy: result.data }));
          setCurrentStep(4);
        }, 500);
      } else {
        alert(result.error || '推广策略生成失败');
      }
    } catch (error) {
      alert('推广策略请求失败，请稍后重试');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingText('');
        setLoadingProgress(undefined);
      }, 1000);
    }
  };

  const handleCoreDraft = async () => {
    setLoading(true);
    setLoadingText('正在生成核心草稿...');
    setLoadingProgress(undefined);
    
    try {
      setLoadingProgress(20);
      setLoadingText('整合推广策略和技术方案...');
      
      const result = await workflowAPI.coreDraft(stepData.promotionStrategy, stepData.techPackage);
      
      setLoadingProgress(70);
      setLoadingText('生成文档内容...');
      
      if (result.success) {
        setLoadingProgress(90);
        setLoadingText('创建文档对象...');
        
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
        
        setLoadingProgress(100);
        setLoadingText('核心草稿完成！');
        
        setTimeout(() => {
          setCurrentStep(5);
        }, 500);
      } else {
        alert(result.error || '核心稿件生成失败');
      }
    } catch (error) {
      alert('核心稿件请求失败，请稍后重试');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingText('');
        setLoadingProgress(undefined);
      }, 1000);
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
          <AnimatedPage className="space-y-6">
            <StepTransition currentStep={currentStep} direction="forward">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">智能搜索</h3>
                  <p className="text-gray-600 mb-4">
                    输入您的搜索关键词，我们将为您收集相关信息
                  </p>
                  <LoadingButton
                    onClick={() => handleSmartSearch('默认搜索')}
                    isLoading={loading && currentStep === 1}
                    loadingText={loadingText}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    开始智能搜索
                  </LoadingButton>
                </div>
              </div>
            </StepTransition>
          </AnimatedPage>
        );

      case 2:
        return (
          <AnimatedPage className="space-y-6">
            <StepTransition currentStep={currentStep} direction="forward">
              <TechPackageLayout
                inputData={stepData.smartSearch}
                generatedContent={techPackageState.generatedContent}
                editedContent={techPackageState.editedContent}
                selectedTemplate={techPackageState.selectedTemplate}
                isGenerating={techPackageState.isGenerating}
                onGenerate={handleTechPackage}
                onRegenerate={handleTechPackageRegenerate}
                onContentChange={handleTechPackageContentChange}
                onNext={() => handleStepChange(3)}
              />
            </StepTransition>
          </AnimatedPage>
        );

      case 3:
        return (
          <AnimatedPage className="space-y-6">
            <StepTransition currentStep={currentStep} direction="forward">
              <div className="bg-orange-50 p-6 rounded-lg">
                <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">推广策略</h3>
                <p className="text-gray-600 mb-4">
                  基于技术包装内容生成推广策略
                </p>
                <LoadingButton
                  onClick={handlePromotionStrategy}
                  isLoading={loading && currentStep === 3}
                  loadingText={loadingText}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Target className="w-5 h-5 mr-2" />
                  生成推广策略
                </LoadingButton>
              </div>
            </StepTransition>
          </AnimatedPage>
        );

      case 4:
        return (
          <AnimatedPage className="space-y-6">
            <StepTransition currentStep={currentStep} direction="forward">
              <div className="bg-green-50 p-6 rounded-lg">
                <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">核心稿件</h3>
                <p className="text-gray-600 mb-4">
                  生成最终的核心文档稿件
                </p>
                {stepData.coreDraft && (
                   <DocumentEditor
                     initialContent={stepData.coreDraft.content}
                     title={stepData.coreDraft.title}
                     onSave={handleSaveDocument}
                     onExportPDF={handleExportDocument}
                   />
                 )}
                <LoadingButton
                  onClick={handleCoreDraft}
                  isLoading={loading && currentStep === 4}
                  loadingText={loadingText}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  生成核心稿件
                </LoadingButton>
              </div>
            </StepTransition>
          </AnimatedPage>
        );

      case 5:
        return (
          <AnimatedPage className="space-y-6">
            <StepTransition currentStep={currentStep} direction="forward">
              <div className="bg-purple-50 p-6 rounded-lg">
                <Mic className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">演讲稿生成</h3>
                <p className="text-gray-600 mb-4">
                  基于核心稿件生成演讲稿
                </p>
                {stepData.speechGeneration && (
                  <div className="mt-4 p-4 bg-white rounded border">
                    <h4 className="font-medium mb-2">生成的演讲稿：</h4>
                    <div className="prose max-w-none">
                      {stepData.speechGeneration.content}
                    </div>
                  </div>
                )}
                <LoadingButton
                  onClick={handleSpeechGeneration}
                  isLoading={loading && currentStep === 5}
                  loadingText={loadingText}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  生成演讲稿
                </LoadingButton>
              </div>
            </StepTransition>
          </AnimatedPage>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workflow-page">
      <TopNavigation currentPageTitle="智能工作流" />
      <PageTransition isVisible={true} direction="fade" duration={300}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">智能工作流</h1>
            <p className="text-gray-600">
              通过五个步骤完成从搜索到演讲稿的完整流程
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 侧边栏 - 步骤指示器 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                <h2 className="font-semibold text-gray-800 mb-6 text-center">工作流步骤</h2>
                
                {/* 进度条 */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>进度</span>
                    <span>{Math.round((Object.keys(stepData).length / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(Object.keys(stepData).length / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 relative">
                  {/* 连接线 */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                  <div 
                    className="absolute left-6 top-8 w-0.5 bg-gradient-to-b from-blue-500 to-green-500 transition-all duration-500 ease-out"
                    style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>

                  {steps.map((step, index) => {
                    const isCompleted = stepData[step.key as keyof typeof stepData];
                    const isCurrent = currentStep === step.id;
                    const isAccessible = index === 0 || stepData[steps[index - 1].key as keyof typeof stepData];
                    
                    return (
                      <div
                        key={step.id}
                        className={`relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 ${stepTransition || ''} ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-200 border shadow-sm transform scale-105'
                            : isCompleted
                            ? 'bg-green-50 border-green-200 border hover:shadow-sm'
                            : isAccessible
                            ? 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm'
                            : 'bg-gray-25 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => isAccessible && handleStepChange(step.id)}
                      >
                        {/* 步骤圆圈 */}
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                          isCurrent
                            ? 'bg-blue-500 text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : isAccessible
                            ? 'bg-white border-2 border-gray-300 text-gray-600'
                            : 'bg-gray-100 border-2 border-gray-200 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <step.icon className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className={`font-medium text-sm mb-1 ${
                            isCurrent
                              ? 'text-blue-800'
                              : isCompleted
                              ? 'text-green-800'
                              : isAccessible
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}>
                            {step.title}
                          </div>
                          <div className={`text-xs ${
                            isCurrent
                              ? 'text-blue-600'
                              : isCompleted
                              ? 'text-green-600'
                              : isAccessible
                              ? 'text-gray-500'
                              : 'text-gray-400'
                          }`}>
                            {isCurrent ? '进行中' : isCompleted ? '已完成' : isAccessible ? '待执行' : '未解锁'}
                          </div>
                        </div>

                        {/* 当前步骤指示器 */}
                        {isCurrent && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 主内容区域 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <StepTransition currentStep={currentStep} direction="forward">
                  <div className={`step-content ${stepTransition || ''}`}>
                    {renderStepContent()}
                  </div>
                </StepTransition>

                {/* Progress Bar */}
                 <div className="progress-container">
                   <div 
                     className="progress-bar" 
                     style={{ width: `${((currentStep) / steps.length) * 100}%` }}
                   />
                 </div>

                {/* Enhanced Navigation */}
                <div className="navigation-container">
                  <button
                    className={`nav-button ${currentStep === 1 ? 'secondary' : 'primary'}`}
                    onClick={() => handleStepChange(currentStep - 1)}
                    disabled={currentStep === 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                    上一步
                  </button>

                  <div className="step-indicators">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`step-indicator ${
                          step.id < currentStep ? 'completed' : 
                          step.id === currentStep ? 'current' : 
                          step.id <= currentStep + 1 ? 'accessible' : 'locked'
                        }`}
                        onClick={() => {
                          if (step.id <= currentStep + 1) {
                            handleStepChange(step.id);
                          }
                        }}
                        title={`步骤 ${step.id}: ${step.title}`}
                      />
                    ))}
                  </div>

                  <button
                    className={`nav-button ${currentStep === 5 ? 'secondary' : 'primary'}`}
                    onClick={() => handleStepChange(currentStep + 1)}
                    disabled={currentStep === 5}
                  >
                    下一步
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* 加载覆盖层 */}
      <LoadingOverlay isVisible={loading}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
          <LoadingAnimation 
            type="ai"
            size="lg"
            text={loadingText}
            progress={loadingProgress}
          />
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default WorkflowPage;