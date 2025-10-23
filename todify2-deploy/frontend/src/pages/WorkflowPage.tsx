import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Search,
  Package,
  Target,
  FileText,
  Mic,
  MessageCircle,
  Send,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Check,
  CheckCircle,
} from "lucide-react";
import { workflowAPI } from "../services/api";
import DocumentEditor from "../components/DocumentEditor";
import LoadingAnimation, {
  LoadingOverlay,
  LoadingButton,
} from "../components/LoadingAnimation";
import PageTransition, {
  StepTransition,
  AnimatedPage,
} from "../components/PageTransition";
import { documentService } from "../services/documentService";
import TopNavigation from "../components/TopNavigation";
import configService, { DifyAPIConfig, WorkflowStepConfig } from "../services/configService";
import "./WorkflowPage.css";

interface StepData {
  smartSearch?: any;
  techPackage?: any;
  coreDraft?: any;
  speechGeneration?: any;
  aiSearch?: any;
  [key: string]: any; // 添加索引签名以支持动态键访问
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  isRegenerating?: boolean;
  adopted?: boolean; // 新增：标记消息是否被采纳
}

const WorkflowPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0); // 默认设置为步骤0（AI问答），按照工作流程从第一步开始
  const [stepData, setStepData] = useState<StepData>({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(
    undefined,
  );
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  // 配置管理状态
  const [difyConfigs, setDifyConfigs] = useState<DifyAPIConfig[]>([]);
  const [workflowConfigs, setWorkflowConfigs] = useState<WorkflowStepConfig[]>([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  // AI对话相关状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "你好！我是智能助手，请输入您的问题或需求，我将为您提供专业的技术分析和内容生成服务。",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState("");
  
  // 编辑模式状态 - 为每个步骤维护独立的编辑状态
  const [editingStates, setEditingStates] = useState<{[key: number]: boolean}>({});
  
  // 自动保存定时器
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 工作流处理状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(true); // 默认开启全屏编辑器模式

  const [steps, setSteps] = useState([
    {
      id: 0,
      title: "AI问答",
      description: "进行中",
      icon: MessageCircle,
      key: "smartSearch",
      status: "active",
    },
    {
      id: 1,
      title: "技术包装",
      description: "未开始",
      icon: Package,
      key: "techPackage",
      status: "pending",
    },
    {
      id: 2,
      title: "技术策略",
      description: "未开始",
      icon: Target,
      key: "techStrategy",
      status: "pending",
    },
    {
      id: 3,
      title: "技术通稿",
      description: "未开始",
      icon: FileText,
      key: "coreDraft",
      status: "pending",
    },
    {
      id: 4,
      title: "发布会演讲稿",
      description: "未开始",
      icon: Mic,
      key: "speechGeneration",
      status: "pending",
    },
  ]);

  // 加载配置
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const difyConfigsData = await configService.getDifyConfigs();
        const workflowConfigsData = await configService.getWorkflowConfigs();
        
        setDifyConfigs(difyConfigsData);
        setWorkflowConfigs(workflowConfigsData);
        setConfigsLoaded(true);
      } catch (error) {
        console.error('加载配置失败:', error);
        setConfigsLoaded(true); // 即使失败也设置为已加载，使用默认配置
      }
    };

    loadConfigs();
  }, []);

  // 获取当前步骤的Dify API配置
  const getCurrentStepDifyConfig = (stepKey: string): DifyAPIConfig | null => {
    if (!configsLoaded) return null;
    
    const workflowConfig = workflowConfigs.find(config => config.stepKey === stepKey);
    if (!workflowConfig || !workflowConfig.difyConfigId) return null;
    
    return difyConfigs.find(config => config.id === workflowConfig.difyConfigId) || null;
  };

  const calculateProgress = () => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed",
    ).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  // 处理下一步点击事件
  const handleNextStep = async () => {
    console.log('handleNextStep 被调用');
    console.log('当前步骤:', currentStep);
    console.log('总步骤数:', steps.length);
    
    if (currentStep >= steps.length - 1) {
      console.log('已经是最后一步，无法继续');
      return;
    }
    
    console.log('开始处理下一步...');
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      // 保存当前编辑区内容到步骤数据
      const currentStepKey = steps[currentStep].key;
      console.log('当前步骤键:', currentStepKey);
      console.log('当前步骤索引:', currentStep);
      const updatedStepData = { ...stepData };
      
      // 确保当前编辑区内容被保存到步骤数据中
      if (currentStepKey === 'techPackage') {
        updatedStepData.techPackageContent = editorContent;
        console.log('保存技术包装内容到步骤数据:', editorContent.substring(0, 100) + '...');
      } else if (currentStepKey === 'techStrategy') {
        updatedStepData.techStrategyContent = editorContent;
        console.log('保存技术策略内容到步骤数据:', editorContent.substring(0, 100) + '...');
      } else if (currentStepKey === 'coreDraft') {
        updatedStepData.coreDraftContent = editorContent;
        console.log('保存技术通稿内容到步骤数据:', editorContent.substring(0, 100) + '...');
      } else if (currentStepKey === 'speechGeneration') {
        updatedStepData.speechGenerationContent = editorContent;
        console.log('保存演讲稿内容到步骤数据:', editorContent.substring(0, 100) + '...');
      }
      
      // 根据当前步骤调用对应的API，每个步骤使用自己的Dify配置
      let apiResult = null;
      
      // 特殊处理：如果当前步骤是AI问答(0)，下一步是技术包装(1)
      if (currentStep === 0 && steps[currentStep + 1]?.key === 'techPackage') {
        console.log('检测到从AI问答步骤切换到技术包装步骤');
        
        // 获取最新的AI回答内容
        const latestAiMessage = chatMessages
          .filter(msg => msg.type === 'assistant')
          .slice(-1)[0];
        
        // 获取最新的用户输入
        const latestUserMessage = chatMessages
          .filter(msg => msg.type === 'user')
          .slice(-1)[0];
        
        console.log('最新的AI回答:', latestAiMessage?.content);
        console.log('最新的用户输入:', latestUserMessage?.content);
        
        // 首先检查是否有被采纳的消息
        const adoptedMessage = chatMessages.find(msg => msg.type === 'assistant' && msg.adopted);
        
        // 获取最新的有效AI回复消息（排除默认欢迎消息）
        const latestValidAiMessage = chatMessages
          .filter(msg => msg.type === 'assistant')
          .reverse() // 从最新的开始查找
          .find(msg => {
            const content = msg.content || '';
            // 排除默认欢迎消息
            return !content.includes('我是智能助手') && 
                   !content.includes('请输入您的问题') && 
                   !content.includes('你好!我是智能助手') &&
                   content.trim().length > 20; // 确保内容有实际意义
          });
        
        console.log('=== 消息选择逻辑调试 ===');
        console.log('是否有被采纳的消息:', !!adoptedMessage);
        console.log('被采纳的消息内容:', adoptedMessage?.content?.substring(0, 100) + '...' || '无');
        console.log('最新的有效AI回复:', latestValidAiMessage?.content?.substring(0, 100) + '...' || '无');
        console.log('最新的用户输入:', latestUserMessage?.content?.substring(0, 100) + '...' || '无');
        
        // 消息选择优先级：
        // 1. 如果有被采纳的消息，优先使用它
        // 2. 如果没有被采纳的消息，使用最新的有效AI回复
        // 3. 如果都没有，使用最新的用户输入
        let inputForTechPackage = '';
        
        if (adoptedMessage?.content?.trim()) {
          inputForTechPackage = adoptedMessage.content;
          console.log('✅ 使用被采纳的消息作为技术包装输入');
        } else if (latestValidAiMessage?.content?.trim()) {
          inputForTechPackage = latestValidAiMessage.content;
          console.log('✅ 使用最新的AI回复作为技术包装输入（用户忘记点击采纳）');
          
          // 给用户一个友好的提示
          console.log('💡 提示：系统检测到您没有点击"采纳"按钮，已自动使用最新的AI回复进行技术包装处理');
        } else if (latestUserMessage?.content?.trim()) {
          inputForTechPackage = latestUserMessage.content;
          console.log('✅ 使用最新的用户输入作为技术包装输入');
        }
        
        console.log('最终传递给技术包装的内容长度:', inputForTechPackage.length);
        console.log('内容预览:', inputForTechPackage.substring(0, 200) + '...');
        console.log('聊天消息总数:', chatMessages.length);
        console.log('AI消息数量:', chatMessages.filter(msg => msg.type === 'assistant').length);
        console.log('用户消息数量:', chatMessages.filter(msg => msg.type === 'user').length);
        
        if (inputForTechPackage && inputForTechPackage.trim()) {
          const techPackageDifyConfig = getCurrentStepDifyConfig('techPackage');
          console.log('技术包装Dify配置:', techPackageDifyConfig);
          
          // 使用Dify Workflow API处理AI回答内容
          apiResult = await workflowAPI.techPackage(
            inputForTechPackage, 
            undefined, 
            techPackageDifyConfig || undefined
          );
          
          console.log('技术包装API结果:', apiResult);
          
          if (apiResult.success) {
            updatedStepData.techPackage = apiResult.data;
            // 将API返回的结果显示在下一步的编辑区
            let resultContent = '';
            
            // 处理不同的数据结构，优先查找text1字段
            if (typeof apiResult.data === 'string') {
              resultContent = apiResult.data;
            } else if (apiResult.data?.data?.outputs?.text1) {
              resultContent = apiResult.data.data.outputs.text1;
            } else if (apiResult.data?.outputs?.text1) {
              resultContent = apiResult.data.outputs.text1;
            } else if (apiResult.data?.result) {
              resultContent = apiResult.data.result;
            } else if (apiResult.data?.answer) {
              resultContent = apiResult.data.answer;
            } else if (apiResult.data?.content) {
              resultContent = apiResult.data.content;
            } else if (apiResult.data?.data?.outputs?.answer) {
              resultContent = apiResult.data.data.outputs.answer;
            } else if (apiResult.data?.data?.outputs?.text) {
              resultContent = apiResult.data.data.outputs.text;
            } else if (apiResult.data?.outputs?.answer) {
              resultContent = apiResult.data.outputs.answer;
            } else if (apiResult.data?.outputs?.text) {
              resultContent = apiResult.data.outputs.text;
            } else if (apiResult.data?.outputs?.text3) {
              resultContent = apiResult.data.outputs.text3;
            } else if (apiResult.data?.data?.outputs?.text3) {
              resultContent = apiResult.data.data.outputs.text3;
            } else if (apiResult.data?.data?.outputs?.text) {
              resultContent = apiResult.data.data.outputs.text;
            } else if (apiResult.data?.data?.outputs?.answer) {
              resultContent = apiResult.data.data.outputs.answer;
            } else {
              // 如果无法提取内容，使用JSON字符串
              resultContent = JSON.stringify(apiResult.data, null, 2);
            }
            
            console.log('技术包装生成的内容:', resultContent);
            console.log('API返回的完整数据:', apiResult.data);
            setEditorContent(resultContent);
            
            // 同时保存生成的内容到步骤数据中，确保后续步骤可以访问
            updatedStepData.techPackageContent = resultContent;
          } else {
            throw new Error(apiResult.error || '技术包装处理失败');
          }
        } else {
          throw new Error('没有找到可用的输入内容，请先在AI问答步骤中获取回答');
        }
      } else {
        // 其他步骤的正常处理逻辑
        switch (steps[currentStep + 1]?.key) {
          case 'techStrategy':
            // 技术策略步骤，将编辑区内容传递给技术策略
            // 优先使用当前编辑区内容，如果没有则尝试从步骤数据中获取
            let techStrategyInput = editorContent.trim();
            
            console.log('技术策略步骤 - 当前编辑区内容长度:', editorContent.length);
            console.log('技术策略步骤 - 编辑区内容预览:', editorContent.substring(0, 200) + '...');
            
            if (!techStrategyInput) {
              // 如果编辑区为空，尝试从步骤数据中获取技术包装内容
              if (updatedStepData.techPackageContent) {
                // 优先使用保存的技术包装内容
                techStrategyInput = updatedStepData.techPackageContent;
                console.log('从步骤数据中获取技术包装内容作为技术策略输入:', techStrategyInput.substring(0, 200) + '...');
              } else if (updatedStepData.techPackage) {
                // 如果没有techPackageContent，尝试从techPackage中提取
                techStrategyInput = typeof updatedStepData.techPackage === 'string' 
                  ? updatedStepData.techPackage 
                  : JSON.stringify(updatedStepData.techPackage);
                console.log('从步骤数据中获取技术包装原始数据作为技术策略输入:', techStrategyInput.substring(0, 200) + '...');
              }
            }
            
            if (techStrategyInput) {
              let techStrategyDifyConfig = getCurrentStepDifyConfig('techStrategy');
              
              // 如果配置未加载，尝试直接获取默认配置
              if (!techStrategyDifyConfig) {
                console.log('技术策略配置未找到，尝试获取默认配置');
                techStrategyDifyConfig = await configService.getDifyConfig('default-tech-strategy');
              }
              
              console.log('技术策略Dify配置:', techStrategyDifyConfig);
              console.log('传递给技术策略的内容:', techStrategyInput.substring(0, 200) + '...');
              
              apiResult = await workflowAPI.techStrategy(techStrategyInput, techStrategyDifyConfig || undefined);
              
              console.log('技术策略API结果:', apiResult);
              
              if (apiResult.success) {
                updatedStepData.techStrategy = apiResult.data;
                
                // 提取技术策略生成的内容，优先查找text2字段
                let resultContent = '';
                if (typeof apiResult.data === 'string') {
                  resultContent = apiResult.data;
                } else if (apiResult.data?.data?.outputs?.text2) {
                  resultContent = apiResult.data.data.outputs.text2;
                } else if (apiResult.data?.outputs?.text2) {
                  resultContent = apiResult.data.outputs.text2;
                } else if (apiResult.data?.result) {
                  resultContent = apiResult.data.result;
                } else if (apiResult.data?.answer) {
                  resultContent = apiResult.data.answer;
                } else if (apiResult.data?.content) {
                  resultContent = apiResult.data.content;
                } else if (apiResult.data?.data?.outputs?.answer) {
                  resultContent = apiResult.data.data.outputs.answer;
                } else if (apiResult.data?.data?.outputs?.text) {
                  resultContent = apiResult.data.data.outputs.text;
                } else if (apiResult.data?.outputs?.answer) {
                  resultContent = apiResult.data.outputs.answer;
                } else if (apiResult.data?.outputs?.text) {
                  resultContent = apiResult.data.outputs.text;
                } else {
                  resultContent = JSON.stringify(apiResult.data, null, 2);
                }
                
                console.log('技术策略生成的内容:', resultContent);
                setEditorContent(resultContent);
                
                // 同时保存生成的内容到专用的内容字段，确保后续步骤切换时可以正确显示
                updatedStepData.techStrategyContent = resultContent;
              } else {
                throw new Error(apiResult.error || '技术策略处理失败');
              }
            } else {
              // 如果没有可用的输入内容，给出明确的错误提示
              throw new Error('没有找到技术包装内容，请先在技术包装步骤中生成内容，或确保编辑区中有可用的内容');
            }
            break;
            
          case 'coreDraft':
            // 技术通稿步骤，将编辑区内容传递给核心稿件
            console.log('技术通稿步骤 - 当前编辑区内容长度:', editorContent.length);
            console.log('技术通稿步骤 - 编辑区内容预览:', editorContent.substring(0, 200) + '...');
            
            if (editorContent.trim()) {
              let coreDraftDifyConfig = getCurrentStepDifyConfig('coreDraft');
              
              // 如果配置未加载，尝试直接获取默认配置
              if (!coreDraftDifyConfig) {
                console.log('技术通稿配置未找到，尝试获取默认配置');
                coreDraftDifyConfig = await configService.getDifyConfig('default-core-draft');
              }
              
              apiResult = await workflowAPI.coreDraft(editorContent, coreDraftDifyConfig || undefined);
              
              if (apiResult.success) {
                updatedStepData.coreDraft = apiResult.data;
                
                // 提取技术通稿的输出内容，优先查找text3字段
                let resultContent = '';
                if (apiResult.data?.data?.outputs?.text3) {
                  resultContent = apiResult.data.data.outputs.text3;
                } else if (apiResult.data?.outputs?.text3) {
                  resultContent = apiResult.data.outputs.text3;
                } else if (apiResult.data?.result) {
                  resultContent = apiResult.data.result;
                } else {
                  resultContent = JSON.stringify(apiResult.data, null, 2);
                }
                
                setEditorContent(resultContent);
                
                // 同时保存生成的内容到专用的内容字段
                updatedStepData.coreDraftContent = resultContent;
              } else {
                throw new Error(apiResult.error || '核心稿件处理失败');
              }
            }
            break;
            
          case 'speechGeneration':
            // 演讲稿步骤，将编辑区内容传递给演讲稿
            console.log('演讲稿步骤 - 当前编辑区内容长度:', editorContent.length);
            console.log('演讲稿步骤 - 编辑区内容预览:', editorContent.substring(0, 200) + '...');
            
            if (editorContent.trim()) {
              let speechGenerationDifyConfig = getCurrentStepDifyConfig('speechGeneration');
              
              // 如果配置未加载，尝试直接获取默认配置
              if (!speechGenerationDifyConfig) {
                console.log('发布会稿配置未找到，尝试获取默认配置');
                speechGenerationDifyConfig = await configService.getDifyConfig('default-speech-generation');
              }
              
              apiResult = await workflowAPI.speechGeneration(editorContent, speechGenerationDifyConfig || undefined);
              
              if (apiResult.success) {
                updatedStepData.speechGeneration = apiResult.data;
                
                // 提取发布会稿的输出内容，优先查找text4字段
                let resultContent = '';
                if (apiResult.data?.data?.outputs?.text4) {
                  resultContent = apiResult.data.data.outputs.text4;
                } else if (apiResult.data?.outputs?.text4) {
                  resultContent = apiResult.data.outputs.text4;
                } else if (apiResult.data?.result) {
                  resultContent = apiResult.data.result;
                } else {
                  resultContent = JSON.stringify(apiResult.data, null, 2);
                }
                
                setEditorContent(resultContent);
                
                // 同时保存生成的内容到专用的内容字段
                updatedStepData.speechGenerationContent = resultContent;
              } else {
                throw new Error(apiResult.error || '演讲稿处理失败');
              }
            }
            break;
            
          default:
            // 其他步骤直接保存内容
            const nextStepKey = steps[currentStep + 1]?.key;
            if (nextStepKey) {
              updatedStepData[nextStepKey] = editorContent;
            }
            break;
        }
      }
      
      // 更新步骤数据
      setStepData(updatedStepData);
      
      // 切换到下一步
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // 更新步骤状态
      const updatedSteps = steps.map((step, index) => ({
        ...step,
        status: index < nextStep ? 'completed' : index === nextStep ? 'active' : 'pending'
      }));
      setSteps(updatedSteps);
      
    } catch (error) {
      console.error('处理下一步时出错:', error);
      setProcessError(error instanceof Error ? error.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理上一步点击事件
  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // 更新步骤状态
      const updatedSteps = steps.map((step, index) => ({
        ...step,
        status: index < prevStep ? 'completed' : index === prevStep ? 'active' : 'pending'
      }));
      setSteps(updatedSteps);
      
      // 恢复对应步骤的编辑区内容（使用与handleStepClick相同的逻辑）
      const stepKey = steps[prevStep]?.key;
      let contentToShow = '';
      
      if (stepKey) {
        // 优先使用步骤专用的内容字段
        if (stepKey === 'techPackage' && stepData.techPackageContent) {
          contentToShow = stepData.techPackageContent;
        } else if (stepKey === 'techStrategy' && stepData.techStrategyContent) {
          contentToShow = stepData.techStrategyContent;
        } else if (stepKey === 'coreDraft' && stepData.coreDraftContent) {
          contentToShow = stepData.coreDraftContent;
        } else if (stepKey === 'speechGeneration' && stepData.speechGenerationContent) {
          contentToShow = stepData.speechGenerationContent;
        } else if (stepData[stepKey]) {
          // 如果没有专用内容字段，尝试从原始数据中提取
          const stepDataValue = stepData[stepKey];
          if (typeof stepDataValue === 'string') {
            contentToShow = stepDataValue;
          } else if (stepDataValue && typeof stepDataValue === 'object') {
            // 尝试从API响应中提取内容
            if (stepDataValue.data?.outputs?.text1) {
              contentToShow = stepDataValue.data.outputs.text1;
            } else if (stepDataValue.data?.outputs?.text2) {
              contentToShow = stepDataValue.data.outputs.text2;
            } else if (stepDataValue.data?.outputs?.text3) {
              contentToShow = stepDataValue.data.outputs.text3;
            } else if (stepDataValue.data?.outputs?.text4) {
              contentToShow = stepDataValue.data.outputs.text4;
            } else if (stepDataValue.data?.outputs?.answer) {
              contentToShow = stepDataValue.data.outputs.answer;
            } else if (stepDataValue.data?.outputs?.text) {
              contentToShow = stepDataValue.data.outputs.text;
            } else if (stepDataValue.result) {
              contentToShow = stepDataValue.result;
            } else if (stepDataValue.answer) {
              contentToShow = stepDataValue.answer;
            } else if (stepDataValue.content) {
              contentToShow = stepDataValue.content;
            } else {
              contentToShow = JSON.stringify(stepDataValue, null, 2);
            }
          }
        }
      }
      
      console.log(`切换到上一步 ${prevStep} (${stepKey}):`, {
        stepKey,
        hasStepData: !!stepData[stepKey],
        contentToShow: contentToShow.substring(0, 100) + '...',
        contentLength: contentToShow.length,
        stepTitle: steps[prevStep]?.title
      });
      
      setEditorContent(contentToShow);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
    
    // 更新步骤状态
    const updatedSteps = steps.map((step, index) => ({
      ...step,
      status: index < stepId ? 'completed' : index === stepId ? 'active' : 'pending'
    }));
    setSteps(updatedSteps);
    
    // 恢复对应步骤的编辑区内容
    const stepKey = steps[stepId]?.key;
    let contentToShow = '';
    
    if (stepKey) {
      // 优先使用步骤专用的内容字段
      if (stepKey === 'techPackage' && stepData.techPackageContent) {
        contentToShow = stepData.techPackageContent;
      } else if (stepKey === 'techStrategy' && stepData.techStrategyContent) {
        contentToShow = stepData.techStrategyContent;
      } else if (stepKey === 'coreDraft' && stepData.coreDraftContent) {
        contentToShow = stepData.coreDraftContent;
      } else if (stepKey === 'speechGeneration' && stepData.speechGenerationContent) {
        contentToShow = stepData.speechGenerationContent;
      } else if (stepData[stepKey]) {
        // 如果没有专用内容字段，尝试从原始数据中提取
        const stepDataValue = stepData[stepKey];
        if (typeof stepDataValue === 'string') {
          contentToShow = stepDataValue;
        } else if (stepDataValue && typeof stepDataValue === 'object') {
          // 尝试从API响应中提取内容
          if (stepDataValue.data?.outputs?.text1) {
            contentToShow = stepDataValue.data.outputs.text1;
          } else if (stepDataValue.data?.outputs?.text2) {
            contentToShow = stepDataValue.data.outputs.text2;
          } else if (stepDataValue.data?.outputs?.text3) {
            contentToShow = stepDataValue.data.outputs.text3;
          } else if (stepDataValue.data?.outputs?.text4) {
            contentToShow = stepDataValue.data.outputs.text4;
          } else if (stepDataValue.data?.outputs?.answer) {
            contentToShow = stepDataValue.data.outputs.answer;
          } else if (stepDataValue.data?.outputs?.text) {
            contentToShow = stepDataValue.data.outputs.text;
          } else if (stepDataValue.result) {
            contentToShow = stepDataValue.result;
          } else if (stepDataValue.answer) {
            contentToShow = stepDataValue.answer;
          } else if (stepDataValue.content) {
            contentToShow = stepDataValue.content;
          } else {
            contentToShow = JSON.stringify(stepDataValue, null, 2);
          }
        }
      }
    }
    
    console.log(`切换到步骤 ${stepId} (${stepKey}):`, {
      stepKey,
      hasStepData: !!stepData[stepKey],
      contentToShow: contentToShow.substring(0, 100) + '...',
      contentLength: contentToShow.length,
      stepTitle: steps[stepId]?.title
    });
    
    console.log(`设置editorContent: ${contentToShow.substring(0, 100)}...`);
    console.log(`设置步骤标题: ${steps[stepId]?.title}`);
    
    setEditorContent(contentToShow);
  };

  // 处理编辑器内容变化
  const handleEditorChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(event.target.value);
    
    // 清除之前的定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // 设置3秒自动保存
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);
    
    setAutoSaveTimer(timer);
  };
  
  // 自动保存功能
  const handleAutoSave = () => {
    const currentStepKey = steps[currentStep].key;
    const updatedStepData = { ...stepData };
    
    // 保存当前编辑区内容到步骤数据
    if (currentStepKey === 'techPackage') {
      updatedStepData.techPackageContent = editorContent;
    } else if (currentStepKey === 'techStrategy') {
      updatedStepData.techStrategyContent = editorContent;
    } else if (currentStepKey === 'coreDraft') {
      updatedStepData.coreDraftContent = editorContent;
    } else if (currentStepKey === 'speechGeneration') {
      updatedStepData.speechGenerationContent = editorContent;
    }
    
    setStepData(updatedStepData);
    console.log(`自动保存步骤 ${currentStep} (${currentStepKey}) 的内容`);
  };
  
  // 切换编辑模式
  const toggleEditingMode = (stepId: number) => {
    setEditingStates(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };
  
  // 获取当前步骤的编辑状态
  const getCurrentStepEditingState = () => {
    // 对于技术包装、技术策略、技术通稿、发布会演讲稿步骤，默认显示预览模式
    const previewSteps = [1, 2, 3, 4]; // techPackage, techStrategy, coreDraft, speechGeneration
    
    if (previewSteps.includes(currentStep)) {
      return editingStates[currentStep] || false; // 默认false，即预览模式
    }
    
    // AI问答步骤始终显示聊天界面
    return false;
  };

  // 处理粘贴事件
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 允许默认粘贴行为
    setTimeout(() => {
      const target = event.target as HTMLTextAreaElement;
      setEditorContent(target.value);
    }, 0);
  };

  // 处理键盘快捷键
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+V 或 Cmd+V 粘贴（浏览器默认处理）
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      // 让浏览器处理粘贴，然后更新状态
      setTimeout(() => {
        const target = event.target as HTMLTextAreaElement;
        setEditorContent(target.value);
      }, 0);
    }
    
    // Ctrl+S 或 Cmd+S 保存
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handleSave();
    }
  };

  // 保存功能
  const handleSave = () => {
    // 这里可以添加保存到后端的逻辑
    console.log('保存内容:', editorContent);
    // 可以显示保存成功的提示
  };

  // 导出功能
  const handleExport = () => {
    // 创建下载链接
    const element = document.createElement('a');
    const file = new Blob([editorContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = '编辑内容.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // 获取智能搜索节点的Dify配置
      let smartSearchDifyConfig = getCurrentStepDifyConfig('smartSearch');
      
      // 如果配置不存在，尝试初始化默认配置
      if (!smartSearchDifyConfig) {
        console.error("智能搜索配置未找到，尝试初始化默认配置");
        try {
          // 尝试初始化默认配置
          const refreshedDifyConfigs = await configService.getDifyConfigs(); // 这会自动创建默认配置
          const refreshedWorkflowConfigs = await configService.getWorkflowConfigs(); // 这会自动创建工作流配置
          
          // 更新本地状态
          setDifyConfigs(refreshedDifyConfigs);
          setWorkflowConfigs(refreshedWorkflowConfigs);
          
          // 重新获取配置
          smartSearchDifyConfig = getCurrentStepDifyConfig('smartSearch');
          
          // 如果仍然没有配置，使用默认的AI搜索配置
          if (!smartSearchDifyConfig) {
            smartSearchDifyConfig = await configService.getDifyConfig("default-ai-search");
            console.log("使用默认AI搜索配置:", smartSearchDifyConfig?.name);
          }
          
          if (!smartSearchDifyConfig) {
            throw new Error("无法获取任何可用的智能搜索配置");
          }
        } catch (initError) {
          console.error("配置初始化失败:", initError);
          throw new Error("智能搜索配置初始化失败，请检查配置设置");
        }
      }
      
      // 调用智能搜索API
      const result = await workflowAPI.aiSearch(
        inputMessage,
        { context: chatMessages.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })) },
        smartSearchDifyConfig || undefined
      );

      let responseContent = "抱歉，我无法处理您的请求。";
      
      if (result.success && result.data) {
        // 处理不同的返回格式
        if (result.data.result) {
          responseContent = result.data.result;
        } else if (result.data.answer) {
          responseContent = result.data.answer;
        } else {
          responseContent = "抱歉，未能获取到有效回答。";
        }
      } else if (result.error) {
        responseContent = `抱歉，处理您的请求时出现了问题：${result.error}`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      
      setChatMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('智能搜索API调用失败:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `抱歉，处理您的请求时出现了错误。请检查智能搜索节点的Dify配置是否正确。`,
        timestamp: new Date(),
      };
      
      setChatMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 快捷操作处理函数
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('消息已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleLikeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, liked: !msg.liked, disliked: false }
        : msg
    ));
  };

  const handleDislikeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, disliked: !msg.disliked, liked: false }
        : msg
    ));
  };

  // 处理采纳消息
  const handleAdoptMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, adopted: !msg.adopted }
        : { ...msg, adopted: false } // 取消其他消息的采纳状态，确保只有一条消息被采纳
    ));
  };

  const handleRegenerateMessage = async (messageId: string) => {
    // 找到要重新生成的消息
    const messageToRegenerate = chatMessages.find(msg => msg.id === messageId);
    if (!messageToRegenerate) return;

    // 标记消息为重新生成中
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isRegenerating: true }
        : msg
    ));

    try {
      // 获取智能搜索节点的Dify配置
      let smartSearchDifyConfig = getCurrentStepDifyConfig('smartSearch');
      
      if (!smartSearchDifyConfig) {
        await configService.getDifyConfigs();
        await configService.getWorkflowConfigs();
        smartSearchDifyConfig = getCurrentStepDifyConfig('smartSearch');
        
        if (!smartSearchDifyConfig) {
          smartSearchDifyConfig = await configService.getDifyConfig("default-ai-search");
        }
      }

      // 重新调用智能搜索API
      const result = await workflowAPI.aiSearch(
        messageToRegenerate.content,
        { context: chatMessages.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })) },
        smartSearchDifyConfig || undefined
      );

      let responseContent = "抱歉，我无法处理您的请求。";
      
      if (result.success && result.data) {
        if (result.data.result) {
          responseContent = result.data.result;
        } else if (result.data.answer) {
          responseContent = result.data.answer;
        } else {
          responseContent = "抱歉，未能获取到有效回答。";
        }
      } else if (result.error) {
        responseContent = `处理请求时出现问题：${result.error}`;
      }

      // 更新消息内容
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: responseContent, 
              isRegenerating: false,
              timestamp: new Date()
            }
          : msg
      ));
    } catch (error) {
      console.error('重新生成消息失败:', error);
      
      // 恢复消息状态
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRegenerating: false }
          : msg
      ));
    }
  };

  return (
    <div className="workflow-page">
      <TopNavigation />

      <div className={`workflow-container ${isFullscreenEditor ? 'fullscreen-editor' : ''}`}>
        {/* 左侧工作流程导航 */}
        <div className="workflow-sidebar">
          <div className="workflow-header">
            <h2>智能工作流</h2>
            <p>通过五个步骤完成从搜索到演讲稿的完整流程</p>
          </div>

          <div className="workflow-steps">
            <div className="progress-header">
              <span>工作流步骤</span>
              <span className="progress-text">{calculateProgress()}%</span>
            </div>

            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`workflow-step ${currentStep === step.id ? "active" : ""} ${step.status}`}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="step-icon">
                  <step.icon size={20} />
                </div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
                {step.status === "completed" && (
                  <div className="step-status completed">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="content-section">
          {/* 根据当前步骤显示不同的界面 */}
          {currentStep === 0 ? (
            /* AI问答步骤 - 聊天界面 */
            <div className="ai-chat-section">
              {/* 顶部状态栏 */}
              <div className="chat-header">
                <div className="chat-status">
                  <div className="status-indicator online"></div>
                  <span>AI助手在线</span>
                </div>
                <div className="chat-actions">
                  <button className="chat-action-btn" onClick={handleSave}>
                    <Edit3 size={16} />
                    保存
                  </button>
                  <button className="chat-action-btn" onClick={handleExport}>
                    <FileText size={16} />
                    导出
                  </button>
                </div>
              </div>

              {/* 聊天消息区域 */}
              <div className="chat-messages">
                {chatMessages.length === 0 ? (
                  <div className="chat-welcome">
                    <div className="welcome-content">
                      <h3>您在忙什么？</h3>
                      <p>我是您的AI助手，可以帮助您完成智能工作流的各个步骤</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div key={message.id} className={`message ${message.type} group`}>
                      <div className="message-content">
                        <div className="markdown-content">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <div className="message-footer">
                          <span className="message-time">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          
                          {/* AI消息的快捷操作按钮 */}
                          {message.type === "assistant" && (
                            <div className="message-actions">
                              {/* 采纳按钮 */}
                              <button
                                onClick={() => handleAdoptMessage(message.id)}
                                className={`action-btn adopt-btn ${message.adopted ? 'adopted' : ''}`}
                                title={message.adopted ? "已采纳" : "采纳此消息"}
                              >
                                {message.adopted ? <CheckCircle size={18} /> : <Check size={18} />}
                              </button>
                              
                              {/* 复制按钮 */}
                              <button
                                onClick={() => handleCopyMessage(message.content)}
                                className="action-btn copy-btn"
                                title="复制消息"
                              >
                                <Copy size={18} />
                              </button>
                              
                              {/* 重新生成按钮 */}
                              <button
                                onClick={() => handleRegenerateMessage(message.id)}
                                disabled={message.isRegenerating}
                                className="action-btn regenerate-btn disabled:opacity-50"
                                title="重新生成"
                              >
                                <RotateCcw size={18} className={message.isRegenerating ? 'animate-spin' : ''} />
                              </button>
                              
                              {/* 点赞按钮 */}
                              <button
                                onClick={() => handleLikeMessage(message.id)}
                                className={`action-btn like-btn ${message.liked ? 'liked' : ''}`}
                                title="点赞"
                              >
                                <ThumbsUp size={18} />
                              </button>
                              
                              {/* 点踩按钮 */}
                              <button
                                onClick={() => handleDislikeMessage(message.id)}
                                className={`action-btn dislike-btn ${message.disliked ? 'disliked' : ''}`}
                                title="点踩"
                              >
                                <ThumbsDown size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="message assistant">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 错误提示 */}
                {processError && (
                   <div className="error-message">
                     <span>⚠️ {processError}</span>
                     <button 
                       className="error-close"
                       onClick={() => setProcessError(null)}
                     >
                       ×
                     </button>
                   </div>
                 )}
               </div>

               {/* 输入区域 */}
               <div className="chat-input-area">
                 <div className="input-container">
                   <input
                     type="text"
                     value={inputMessage}
                     onChange={(e) => setInputMessage(e.target.value)}
                     onKeyPress={handleKeyPress}
                     placeholder="输入您的问题或需求..."
                     className="chat-input"
                     disabled={isProcessing}
                   />
                   <div className="input-actions">
                     <button className="voice-btn" disabled={isProcessing}>
                       <Mic size={20} />
                     </button>
                     <button 
                       className="send-btn" 
                       onClick={handleSendMessage}
                       disabled={!inputMessage.trim() || isProcessing}
                     >
                       <Send size={20} />
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           ) : (
             /* 其他步骤 - 文本编辑器界面 */
             <div className="content-editor-section">
               <DocumentEditor
                 initialContent={editorContent}
                 title={steps.find(step => step.id === currentStep)?.title}
                 isEditing={getCurrentStepEditingState()}
                 onToggleEdit={() => toggleEditingMode(currentStep)}
                 onContentChange={handleEditorChange}
                 onSave={(content, title) => {
                   setEditorContent(content);
                   handleSave();
                 }}
                 onExportPDF={(content, title) => {
                   setEditorContent(content);
                   handleExport();
                 }}
               />
               
               {processError && (
                 <div className="error-message">
                   <span>⚠️ {processError}</span>
                   <button 
                     className="error-close"
                     onClick={() => setProcessError(null)}
                   >
                     ×
                   </button>
                 </div>
               )}
             </div>
           )}
         </div>
      </div>

      {/* 底部导航栏 */}
      <div className="bottom-navigation">
        <button
          className="nav-button nav-button-left"
          onClick={handlePrevStep}
          disabled={currentStep === 0 || isProcessing}
        >
          <ChevronLeft size={20} />
          <span>
            {currentStep > 0 
              ? `上一步：${steps[currentStep - 1].title}` 
              : '上一步'
            }
          </span>
        </button>

        <button
          className="nav-button nav-button-right"
          onClick={handleNextStep}
          disabled={currentStep === steps.length - 1 || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="loading-spinner"></div>
              <span>处理中...</span>
            </>
          ) : (
            <>
              <span>
                {currentStep < steps.length - 1 
                  ? `下一步：${steps[currentStep + 1].title}` 
                  : '下一步'
                }
              </span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* 加载覆盖层 */}
      {loading && (
        <LoadingOverlay isVisible={loading}>
          <LoadingAnimation text={loadingText} progress={loadingProgress} />
        </LoadingOverlay>
      )}
    </div>
  );
};

export default WorkflowPage;
