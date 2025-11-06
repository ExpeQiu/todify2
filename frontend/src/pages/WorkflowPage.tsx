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
  Plus,
} from "lucide-react";
import { workflowAPI } from "../services/api";
import { useWorkflowStats, useWorkflowSessionStats } from '../hooks/useWorkflowStats';
import StandaloneDocumentEditor from "../components/StandaloneDocumentEditor";
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
import { useNavigate } from "react-router-dom";
import { agentWorkflowService } from "../services/agentWorkflowService";
import { aiRoleService } from "../services/aiRoleService";
import { AgentWorkflow, InputSourceConfig } from "../types/agentWorkflow";
import { AIRoleConfig } from "../types/aiRole";
import { WorkflowEngine } from "../services/workflowEngine";

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
  const navigate = useNavigate();
  
  // 统计收集钩子
  const { recordNodeUsage, recordFeedback } = useWorkflowStats();
  const { recordNodeVisit, recordNodeCompletion, recordSessionEnd } = useWorkflowSessionStats();
  
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
  
  // 会话ID状态 - 用于跨步骤保持对话连续性
  const [conversationId, setConversationId] = useState<string>('');

  // Agent工作流相关状态
  const [smartWorkflow, setSmartWorkflow] = useState<AgentWorkflow | null>(null);
  const [workflowAgents, setWorkflowAgents] = useState<AIRoleConfig[]>([]);
  const [useAgentWorkflow, setUseAgentWorkflow] = useState(false);

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

  // 加载Agent工作流配置
  useEffect(() => {
    const loadAgentWorkflow = async () => {
      try {
        // 尝试加载"智能工作流"
        const workflows = await agentWorkflowService.getAllWorkflows();
        const smartWorkflow = workflows.find(w => w.name === '智能工作流');
        
        if (smartWorkflow) {
          setSmartWorkflow(smartWorkflow);
          setUseAgentWorkflow(true);
          
          // 加载所有Agent以便查找配置
          const allAgents = await aiRoleService.getAIRoles();
          setWorkflowAgents(allAgents);
          
          // 根据工作流节点生成steps
          const workflowSteps = smartWorkflow.nodes
            .sort((a, b) => {
              // 按照边的连接顺序排序
              const edges = smartWorkflow.edges;
              const getOrder = (nodeId: string): number => {
                const incoming = edges.filter(e => e.target === nodeId);
                if (incoming.length === 0) return 0;
                const maxOrder = Math.max(...incoming.map(e => getOrder(e.source)));
                return maxOrder + 1;
              };
              return getOrder(a.id) - getOrder(b.id);
            })
            .map((node, index) => {
              const agent = allAgents.find(a => a.id === node.agentId);
              const stepKey = node.data.label || node.data.agentName || `step_${index}`;
              
              // 映射到原有的stepKey格式
              let mappedKey = stepKey;
              if (stepKey.includes('AI问答') || stepKey.includes('ai-qa')) {
                mappedKey = 'smartSearch';
              } else if (stepKey.includes('技术包装') || stepKey.includes('tech-package')) {
                mappedKey = 'techPackage';
              } else if (stepKey.includes('技术策略') || stepKey.includes('tech-strategy')) {
                mappedKey = 'techStrategy';
              } else if (stepKey.includes('技术通稿') || stepKey.includes('tech-article') || stepKey.includes('core-draft')) {
                mappedKey = 'coreDraft';
              } else if (stepKey.includes('演讲稿') || stepKey.includes('speech')) {
                mappedKey = 'speechGeneration';
              }
              
              return {
                id: index,
                title: node.data.label || node.data.agentName || `步骤${index + 1}`,
                description: index === 0 ? '进行中' : '未开始',
                icon: [MessageCircle, Package, Target, FileText, Mic][index] || FileText,
                key: mappedKey,
                status: index === 0 ? 'active' : 'pending',
                agentId: node.agentId,
                agent: agent,
              };
            });
          
          setSteps(workflowSteps as any);
          console.log('从Agent工作流加载步骤配置:', workflowSteps);
        } else {
          // 如果没有找到智能工作流，使用原有配置
          setUseAgentWorkflow(false);
          console.log('未找到智能工作流，使用原有配置');
        }
      } catch (error) {
        console.error('加载Agent工作流失败:', error);
        setUseAgentWorkflow(false);
      }
    };
    
    loadAgentWorkflow();
  }, []);

  // 加载配置
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        console.log('开始加载配置...');
        const difyConfigsData = await configService.getDifyConfigs();
        const workflowConfigsData = await configService.getWorkflowConfigs();
        
        console.log('Dify配置加载完成:', difyConfigsData.length, '个配置');
        console.log('详细Dify配置:', difyConfigsData.map(config => ({
          id: config.id,
          name: config.name,
          enabled: config.enabled,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'null'
        })));
        
        console.log('工作流配置加载完成:', workflowConfigsData.length, '个配置');
        console.log('详细工作流配置:', workflowConfigsData.map(config => ({
          stepKey: config.stepKey,
          difyConfigId: config.difyConfigId,
          enabled: config.enabled
        })));
        
        setDifyConfigs(difyConfigsData);
        setWorkflowConfigs(workflowConfigsData);
        setConfigsLoaded(true);
        
        // 验证智能搜索配置是否存在
        const smartSearchConfig = workflowConfigsData.find(config => config.stepKey === 'smartSearch');
        if (smartSearchConfig) {
          const difyConfig = difyConfigsData.find(config => config.id === smartSearchConfig.difyConfigId);
          console.log('智能搜索配置验证:', {
            workflowConfig: smartSearchConfig,
            difyConfig: difyConfig ? {
              id: difyConfig.id,
              name: difyConfig.name,
              enabled: difyConfig.enabled,
              apiUrl: difyConfig.apiUrl,
              apiKey: difyConfig.apiKey ? `${difyConfig.apiKey.substring(0, 10)}...` : 'null'
            } : null
          });
        } else {
          console.warn('未找到智能搜索工作流配置');
        }
      } catch (error) {
        console.error('加载配置失败:', error);
        // 即使失败也设置为已加载，但会在使用时触发重新初始化
        setConfigsLoaded(true);
      }
    };

    loadConfigs();
  }, []);

  // 获取当前步骤的Dify API配置
  const getCurrentStepDifyConfig = (stepKey: string): DifyAPIConfig | null => {
    // 优先使用Agent工作流配置
    if (useAgentWorkflow && smartWorkflow) {
      const step = steps.find(s => s.key === stepKey);
      if (step && (step as any).agent) {
        const agent = (step as any).agent as AIRoleConfig;
        if (agent.enabled && agent.difyConfig) {
          // 将AIRoleConfig转换为DifyAPIConfig格式
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            apiUrl: agent.difyConfig.apiUrl,
            apiKey: agent.difyConfig.apiKey,
            connectionType: agent.difyConfig.connectionType,
            enabled: agent.enabled,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
          } as DifyAPIConfig;
        }
      }
      return null;
    }
    
    // 回退到原有配置系统
    if (!configsLoaded || !workflowConfigs.length || !difyConfigs.length) {
      console.warn(`配置未完全加载: configsLoaded=${configsLoaded}, workflowConfigs.length=${workflowConfigs.length}, difyConfigs.length=${difyConfigs.length}`);
      return null;
    }
    
    const workflowConfig = workflowConfigs.find(config => config.stepKey === stepKey);
    if (!workflowConfig || !workflowConfig.difyConfigId) {
      console.warn(`未找到步骤配置: stepKey=${stepKey}, workflowConfig=`, workflowConfig);
      return null;
    }
    
    const difyConfig = difyConfigs.find(config => config.id === workflowConfig.difyConfigId);
    if (!difyConfig) {
      console.warn(`未找到Dify配置: difyConfigId=${workflowConfig.difyConfigId}`);
      return null;
    }
    
    // 检查配置是否启用，如果禁用则返回null
    if (!difyConfig.enabled) {
      console.log(`Dify配置已禁用，使用本地API: stepKey=${stepKey}, configName=${difyConfig.name}`);
      return null;
    }
    
    return difyConfig;
  };

  const calculateProgress = () => {
    // 修复进度计算逻辑：基于当前步骤索引计算进度
    const completedSteps = steps.filter(
      (step) => step.status === "completed",
    ).length;
    
    // 如果当前步骤是active状态，说明已经开始这一步，应该计算部分进度
    const currentActiveStep = steps.find(step => step.status === "active");
    let activeStepProgress = 0;
    
    if (currentActiveStep) {
      // 基于currentStep索引而不是step.id来判断
      activeStepProgress = currentStep > 0 ? 0.5 : 0;
    }
    
    const totalProgress = (completedSteps + activeStepProgress) / steps.length;
    return Math.round(totalProgress * 100);
  };

  /**
   * 根据节点的inputSources配置，从stepData中解析输入数据
   * 这是一个辅助函数，用于在WorkflowPage中模拟WorkflowEngine的输入解析逻辑
   */
  const resolveStepInput = (step: any, currentStepData: StepData): any => {
    if (!smartWorkflow || !step.agentId) {
      console.log('❌ 无法解析输入：缺少智能工作流配置或步骤agentId');
      return null;
    }

    // 查找当前步骤对应的节点
    const currentNode = smartWorkflow.nodes.find(n => n.agentId === step.agentId);
    if (!currentNode) {
      console.log(`❌ 无法找到节点: agentId=${step.agentId}`);
      return null;
    }
    
    if (!currentNode.data.inputSources || Object.keys(currentNode.data.inputSources).length === 0) {
      console.log(`ℹ️ 节点 ${currentNode.data.label} 没有配置inputSources，将使用传统方式解析输入`);
      return null;
    }

    console.log(`🔍 开始解析节点 ${currentNode.data.label} 的输入源配置...`);

    // 解析所有输入源
    const resolvedInput: Record<string, any> = {};
    
    Object.entries(currentNode.data.inputSources).forEach(([paramName, sourceConfig]) => {
      const config = sourceConfig as InputSourceConfig;
      
      if (config.type === 'static') {
        // 静态值直接使用
        resolvedInput[paramName] = config.value;
        console.log(`  ✅ ${paramName}: 静态值 = ${JSON.stringify(config.value).substring(0, 100)}`);
      } else if (config.type === 'node_output' && config.nodeId) {
        // 引用上游节点输出
        // 需要找到上游节点对应的步骤，然后从stepData中获取数据
        const upstreamNode = smartWorkflow.nodes.find(n => n.id === config.nodeId);
        if (upstreamNode) {
          const upstreamAgentId = upstreamNode.agentId;
          // 找到上游节点对应的stepKey
          const upstreamStep = steps.find(s => s.agentId === upstreamAgentId);
          if (upstreamStep) {
            const upstreamData = currentStepData[upstreamStep.key];
            
            if (upstreamData) {
              // 如果指定了输出字段，提取该字段
              if (config.outputField) {
                resolvedInput[paramName] = upstreamData[config.outputField];
                console.log(`  ✅ ${paramName}: 来自节点 ${upstreamNode.data.label}.${config.outputField}`);
              } else {
                resolvedInput[paramName] = upstreamData;
                console.log(`  ✅ ${paramName}: 来自节点 ${upstreamNode.data.label} (完整输出)`);
              }
            } else {
              console.log(`  ⚠️ ${paramName}: 上游节点 ${upstreamNode.data.label} 的数据未找到`);
            }
          } else {
            console.log(`  ⚠️ ${paramName}: 无法找到上游步骤 (agentId=${upstreamAgentId})`);
          }
        } else {
          console.log(`  ⚠️ ${paramName}: 无法找到上游节点 (nodeId=${config.nodeId})`);
        }
      }
    });

    if (Object.keys(resolvedInput).length > 0) {
      console.log(`✅ 成功解析 ${Object.keys(resolvedInput).length} 个输入参数`);
      return resolvedInput;
    } else {
      console.log('ℹ️ 未成功解析任何输入参数，将使用传统方式');
      return null;
    }
  };

  /**
   * 为当前步骤准备输入数据（结合智能解析和传统方式）
   * 这个函数尝试使用resolveStepInput智能解析，如果失败则回退到传统方式
   */
  const prepareStepInput = (currentIndex: number, nextStepIndex: number, currentStepData: StepData): any => {
    const nextStep = steps[nextStepIndex];
    if (!nextStep) return null;

    // 尝试智能解析
    const resolvedInput = resolveStepInput(nextStep, currentStepData);
    if (resolvedInput) {
      console.log('✅ 使用智能解析的输入数据');
      return resolvedInput;
    }

    // 回退到传统解析方式
    console.log('⚠️ 智能解析失败，使用传统方式解析输入');
    const currentStepKey = steps[currentIndex]?.key;
    const nextStepKey = nextStep.key;
    
    // 特殊情况：从AI问答到技术包装，需要从chatMessages获取数据
    if (currentStepKey === 'smartSearch' && nextStepKey === 'techPackage') {
      const adoptedMessage = chatMessages.find(msg => msg.type === 'assistant' && msg.adopted);
      const latestValidAiMessage = chatMessages
        .filter(msg => msg.type === 'assistant')
        .reverse()
        .find(msg => {
          const content = msg.content || '';
          return !content.includes('我是智能助手') && 
                 !content.includes('请输入您的问题') && 
                 !content.includes('你好!我是智能助手') &&
                 content.trim().length > 20;
        });
      
      if (adoptedMessage?.content?.trim()) {
        return adoptedMessage.content;
      } else if (latestValidAiMessage?.content?.trim()) {
        return latestValidAiMessage.content;
      }
    }
    
    // 其他情况：使用editorContent或stepData中的内容
    if (editorContent.trim()) {
      return editorContent;
    }
    
    // 尝试从stepData获取
    const stepContentKey = `${currentStepKey}Content`;
    if (currentStepData[stepContentKey]) {
      return currentStepData[stepContentKey];
    }
    
    return null;
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
            techPackageDifyConfig || undefined,
            conversationId
          );
          
          console.log('技术包装API结果:', apiResult);
          
          if (apiResult.success) {
            // 更新conversationId（如果API返回了新的）
            if (apiResult.data?.conversation_id) {
              setConversationId(apiResult.data.conversation_id);
            }
            
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
            
            // 同时保存生成的内容到下一步的编辑区，确保后续步骤可以访问
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
              
              apiResult = await workflowAPI.techStrategy(techStrategyInput, techStrategyDifyConfig || undefined, conversationId);
              
              console.log('技术策略API结果:', apiResult);
              
              if (apiResult.success) {
                // 更新conversationId（如果API返回了新的）
                if (apiResult.data?.conversation_id) {
                  setConversationId(apiResult.data.conversation_id);
                }
                
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
              
              apiResult = await workflowAPI.coreDraft(editorContent, coreDraftDifyConfig || undefined, conversationId);
              
              if (apiResult.success) {
                // 更新conversationId（如果API返回了新的）
                if (apiResult.data?.conversation_id) {
                  setConversationId(apiResult.data.conversation_id);
                }
                
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
              
              apiResult = await workflowAPI.speechGeneration(editorContent, speechGenerationDifyConfig || undefined, conversationId);
              
              if (apiResult.success) {
                // 更新conversationId（如果API返回了新的）
                if (apiResult.data?.conversation_id) {
                  setConversationId(apiResult.data.conversation_id);
                }
                
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
    
    // 记录节点访问统计
    const step = steps[stepId];
    if (step) {
      recordNodeVisit(step.key);
      
      // 记录节点使用统计
      recordNodeUsage({
        node_id: step.key,
        node_name: step.title,
        node_type: step.key,
        usage_count: 1,
        is_workflow_mode: true,
        is_standalone_mode: false
      });
    }
    
    // 修复步骤状态更新逻辑：
    // - 当前步骤之前的步骤应该标记为completed
    // - 当前步骤标记为active  
    // - 当前步骤之后的步骤标记为pending
    const updatedSteps = steps.map((step, index) => {
      let status: string;
      let description: string;
      
      if (index < stepId) {
        status = 'completed';
        description = '已完成';
      } else if (index === stepId) {
        status = 'active';
        description = '进行中';
      } else {
        status = 'pending';
        description = '未开始';
      }
      
      return {
        ...step,
        status,
        description
      };
    });
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
        console.log("智能搜索配置未找到，尝试初始化默认配置");
        try {
          // 尝试初始化默认配置
          const refreshedDifyConfigs = await configService.getDifyConfigs(); // 这会自动创建默认配置
          const refreshedWorkflowConfigs = await configService.getWorkflowConfigs(); // 这会自动创建工作流配置
          
          console.log('重新加载配置完成:', {
            difyConfigs: refreshedDifyConfigs.length,
            workflowConfigs: refreshedWorkflowConfigs.length
          });
          
          // 更新本地状态
          setDifyConfigs(refreshedDifyConfigs);
          setWorkflowConfigs(refreshedWorkflowConfigs);
          
          // 重新获取配置
          const workflowConfig = refreshedWorkflowConfigs.find(config => config.stepKey === 'smartSearch');
          if (workflowConfig) {
            smartSearchDifyConfig = refreshedDifyConfigs.find(config => config.id === workflowConfig.difyConfigId) || null;
            console.log("重新获取智能搜索配置成功:", smartSearchDifyConfig?.name);
          }
          
          // 如果仍然没有配置，使用默认的AI搜索配置
          if (!smartSearchDifyConfig) {
            const defaultConfig = await configService.getDifyConfig("default-ai-search");
            // 只有当配置存在且启用时才使用
            if (defaultConfig && defaultConfig.enabled) {
              smartSearchDifyConfig = defaultConfig;
              console.log("使用默认AI搜索配置:", smartSearchDifyConfig?.name);
            } else {
              console.log("默认AI搜索配置被禁用或不存在，将使用本地API");
              smartSearchDifyConfig = null;
            }
          }
        } catch (initError) {
          console.error("初始化配置失败:", initError);
          setIsTyping(false);
          
          // 添加错误消息到聊天记录
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "assistant",
            content: "抱歉，系统配置初始化失败。请刷新页面重试，或联系管理员检查配置服务。",
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, errorMessage]);
          return;
        }
      }
      
      // 调用智能搜索API - 确保传递conversation_id以支持多轮对话
      const result = await workflowAPI.aiSearch(
        inputMessage,
        { 
          context: chatMessages.map(msg => ({ 
            role: msg.type === 'user' ? 'user' : 'assistant', 
            content: msg.content 
          })),
        },
        (smartSearchDifyConfig && smartSearchDifyConfig.enabled) ? smartSearchDifyConfig : undefined,
        conversationId || undefined
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
        
        // 更新conversationId（如果返回了新的）- 支持多轮对话
        if (result.data.conversationId && result.data.conversationId !== conversationId) {
          setConversationId(result.data.conversationId);
          console.log('🔄 更新conversationId以支持多轮对话:', result.data.conversationId);
        } else if (result.data.conversation_id && result.data.conversation_id !== conversationId) {
          setConversationId(result.data.conversation_id);
          console.log('🔄 更新conversation_id以支持多轮对话:', result.data.conversation_id);
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
      
      // 记录AI问答统计
      if (result.success && result.data) {
        const responseTime = Date.now() - Date.now(); // 这里应该计算实际的响应时间
        recordNodeUsage({
          node_id: 'ai_qa',
          node_name: 'AI问答',
          node_type: 'ai_qa',
          usage_count: 1,
          avg_response_time: responseTime,
          success_count: 1,
          is_workflow_mode: true,
          is_standalone_mode: false
        });
        
        // 记录节点完成
        recordNodeCompletion('ai_qa');
      }
      
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
    
    // 记录反馈统计
    const message = chatMessages.find(msg => msg.id === messageId);
    if (message) {
      recordFeedback({
        node_id: 'ai_qa',
        node_name: 'AI问答',
        node_type: 'ai_qa',
        message_id: messageId,
        feedback_type: 'like',
        satisfaction_score: 5,
        feedback_content: message.content.substring(0, 100)
      });
    }
  };

  const handleDislikeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, disliked: !msg.disliked, liked: false }
        : msg
    ));
    
    // 记录反馈统计
    const message = chatMessages.find(msg => msg.id === messageId);
    if (message) {
      recordFeedback({
        node_id: 'ai_qa',
        node_name: 'AI问答',
        node_type: 'ai_qa',
        message_id: messageId,
        feedback_type: 'dislike',
        satisfaction_score: 1,
        feedback_content: message.content.substring(0, 100)
      });
    }
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
          const defaultConfig = await configService.getDifyConfig("default-ai-search");
          // 只有当配置存在且启用时才使用
          if (defaultConfig && defaultConfig.enabled) {
            smartSearchDifyConfig = defaultConfig;
          } else {
            console.log("默认AI搜索配置被禁用或不存在，将使用本地API");
            smartSearchDifyConfig = null;
          }
        }
      }

      // 重新调用智能搜索API
      const result = await workflowAPI.aiSearch(
        messageToRegenerate.content,
        { context: chatMessages.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content })) },
        (smartSearchDifyConfig && smartSearchDifyConfig.enabled) ? smartSearchDifyConfig : undefined
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
                  {/* AI聊天和搜索历史按钮 */}
                  <button 
                    onClick={() => {
                      // 重置聊天记录到初始状态
                      setChatMessages([
                        {
                          id: "1",
                          type: "assistant",
                          content: "你好！我是智能助手，请输入您的问题或需求，我将为您提供专业的技术分析和内容生成服务。",
                          timestamp: new Date(),
                        },
                      ]);
                      // 清空输入框
                      setInputMessage("");
                      // 重置对话ID，开始新的对话
                      setConversationId("");
                      console.log('重置对话ID，开始新对话');
                    }}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 shadow-sm text-sm"
                    data-oid="new-question-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>提一个新问题</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate("/history")}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 shadow-sm text-sm"
                    data-oid="search-history-btn"
                  >
                    <Search className="w-4 h-4" />
                    <span>搜索历史记录</span>
                  </button>
                  
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
              <StandaloneDocumentEditor
                initialContent={editorContent}
                title={steps.find(step => step.id === currentStep)?.title}
                isEditing={getCurrentStepEditingState()}
                onToggleEdit={() => toggleEditingMode(currentStep)}
                onContentChange={handleEditorChange}
                onSave={(content, _title) => {
                  setEditorContent(content);
                  handleSave();
                }}
                onExportPDF={(content, _title) => {
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
