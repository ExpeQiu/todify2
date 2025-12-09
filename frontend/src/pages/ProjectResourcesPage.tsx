import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Upload, Search, X, FileText, Trash2, Check, ChevronDown, FileCode, Eye, Save, Send, Loader2, User, Bot, Brain, History, MessageSquare, Package, Target, Newspaper, Sparkles, Download, Plus } from 'lucide-react';
import { Project } from '../types/project';
import projectService from '../services/projectService';
import { aiSearchService } from '../services/aiSearchService';
import { techPointService } from '../services/techPointService';
import { knowledgePointService } from '../services/knowledgePointService';
import { publicKnowledgeService } from '../services/publicKnowledgeService';
import { TechPoint } from '../types/techPoint';
import { KnowledgePoint } from '../types/knowledgePoint';
import { FileUploadResponse } from '../types/aiSearch';
import { PublicKnowledgeFile } from '../types/publicKnowledge';
import api from '../services/api';
import { workflowAPI, bochaAPI } from '../services/api';
import { configService } from '../services/configService';
import sourceService, { Source, SourceCategory } from '../services/sourceService';

interface SourceInformation {
  id: number;
  source_id: string;
  title: string;
  type: 'knowledge_base' | 'external';
  url?: string;
  description?: string;
  created_at: string;
  metadata?: any;
  category?: SourceCategory;
}

const ProjectResourcesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const techPointSelectorRef = useRef<HTMLDivElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceInformation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechPoints, setSelectedTechPoints] = useState<number[]>([]);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<number[]>([]);
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [publicKnowledgeFiles, setPublicKnowledgeFiles] = useState<PublicKnowledgeFile[]>([]);
  const [selectedPublicFiles, setSelectedPublicFiles] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTechPointSelector, setShowTechPointSelector] = useState(false);
  const [showKnowledgeBaseSelector, setShowKnowledgeBaseSelector] = useState(false);
  const [techPointSearch, setTechPointSearch] = useState('');
  const [knowledgeBaseSearch, setKnowledgeBaseSearch] = useState('');
  const [publicFileSearch, setPublicFileSearch] = useState('');
  const [configuredResources, setConfiguredResources] = useState<{
    files: SourceInformation[];
    internetInfo: SourceInformation[];
    techPoints: TechPoint[];
    knowledgePoints: KnowledgePoint[];
  }>({
    files: [],
    internetInfo: [],
    techPoints: [],
    knowledgePoints: []
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewContent, setReviewContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showTechPointModal, setShowTechPointModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showKnowledgePointModal, setShowKnowledgePointModal] = useState(false);
  const [showInternetInfoModal, setShowInternetInfoModal] = useState(false);
  const [internetInfoTab, setInternetInfoTab] = useState<'search' | 'web'>('web'); // 'search' 检索信息, 'web' Web Search
  const [internetInfoSearchQuery, setInternetInfoSearchQuery] = useState('');
  const [isAddingInternetInfo, setIsAddingInternetInfo] = useState(false);
  // Web Search 相关状态
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<number>>(new Set());
  const [showPublicKnowledgeModal, setShowPublicKnowledgeModal] = useState(false);
  const [isSummarizingConversation, setIsSummarizingConversation] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<SourceInformation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false); // 控制显示历史记录视图还是AI共创视图
  const [checkingHistory, setCheckingHistory] = useState(true); // 检查历史记录中
  const fileInputRefModal = useRef<HTMLInputElement>(null);
  
  // AI问答相关状态
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; content: string; sender: 'user' | 'ai'; timestamp: Date }>>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState<string | undefined>(undefined);
  const [savedConversationSourceId, setSavedConversationSourceId] = useState<string | null>(null); // 已保存的对话来源ID
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // 提炼为技术点相关状态
  const [extractingTechPoint, setExtractingTechPoint] = useState(false);
  const [showTechPointPreview, setShowTechPointPreview] = useState(false);
  const [extractedTechPointData, setExtractedTechPointData] = useState<any>(null);
  const [extractingSourceId, setExtractingSourceId] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadSources();
      loadTechPoints();
      loadPublicKnowledgeFiles();
      checkHistoryRecords(); // 检查历史记录
    }
  }, [projectId]);

  // 处理从技术点库页面返回的选中技术点
  useEffect(() => {
    const selectedTechPointIds = searchParams.get('selectedTechPointIds');
    if (selectedTechPointIds) {
      try {
        const ids = selectedTechPointIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          setSelectedTechPoints(ids);
          // 重新加载技术点列表，确保能获取到完整的技术点信息
          loadTechPoints();
          // 清除URL参数
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('selectedTechPointIds');
          setSearchParams(newSearchParams, { replace: true });
        }
      } catch (error) {
        console.error('解析选中技术点ID失败:', error);
      }
    }
  }, [searchParams, setSearchParams]);

  // AI消息自动滚动到底部
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // AI问答发送消息
  const handleAISendMessage = async () => {
    if (!aiInputMessage.trim() || aiLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: aiInputMessage.trim(),
      sender: 'user' as const,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    const currentMessage = aiInputMessage.trim();
    setAiInputMessage('');
    setAiLoading(true);

    try {
      // 获取智能工作流AI问答的Dify配置
      const aiQAConfig = await configService.getDifyConfig('smart-workflow-ai-qa');

      // 构建上下文信息（包含项目资源）
      const contextMessages = aiMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // 添加项目资源信息到上下文
      const resourceContext: string[] = [];
      if (configuredResources.techPoints.length > 0) {
        resourceContext.push(`已选择的技术点：${configuredResources.techPoints.map(tp => tp.name).join('、')}`);
      }
      if (configuredResources.files.length > 0) {
        resourceContext.push(`已上传的文件：${configuredResources.files.map(f => f.title).join('、')}`);
      }
      if (configuredResources.knowledgePoints.length > 0) {
        resourceContext.push(`已选择的知识点：${configuredResources.knowledgePoints.map(kp => kp.title).join('、')}`);
      }

      const inputs: any = {
        context: contextMessages,
      };

      if (resourceContext.length > 0) {
        inputs.projectResources = resourceContext.join('\n');
      }

      // 调用AI问答API
      const result = await workflowAPI.aiSearch(
        currentMessage,
        inputs,
        (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined,
        aiConversationId || undefined
      );

      let responseContent = '抱歉，我无法处理您的请求。';

      if (result.success && result.data) {
        responseContent = result.data.answer || result.data.result || responseContent;
        // 更新conversationId以支持多轮对话
        if (result.data.conversation_id) {
          setAiConversationId(result.data.conversation_id);
        }
      } else {
        responseContent = result.error || responseContent;
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'ai' as const,
        timestamp: new Date(),
      };

      setAiMessages((prev) => {
        const updated = [...prev, aiMessage];
        // 在状态更新后，使用最新的消息列表自动保存
        setTimeout(async () => {
          await autoSaveConversationSummaryWithMessages(updated);
        }, 300);
        return updated;
      });
    } catch (error) {
      console.error('AI问答API调用失败:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        sender: 'ai' as const,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // 自动保存对话摘要（使用指定的消息列表）
  const autoSaveConversationSummaryWithMessages = async (messages: Array<{ id: string; content: string; sender: 'user' | 'ai'; timestamp: Date }>) => {
    if (!projectId) return;
    
    // 检查是否有至少一轮完整的问答（至少一条用户消息和一条AI消息）
    const userMessages = messages.filter(msg => msg.sender === 'user');
    const aiResponseMessages = messages.filter(msg => msg.sender === 'ai');
    
    // 如果没有完整的对话，不保存
    if (userMessages.length === 0 || aiResponseMessages.length === 0) {
      return;
    }

    // 如果有已保存的对话来源ID，先尝试删除旧的（如果存在）
    // 然后保存新的对话摘要
    try {
      // 如果已经有保存的对话，更新它；否则创建新的
      if (savedConversationSourceId) {
        // 尝试删除旧的来源记录（使用数据库ID）
        try {
          const idNumber = parseInt(savedConversationSourceId);
          if (!isNaN(idNumber)) {
            await api.delete(`/source-information/${idNumber}`);
          }
        } catch (error) {
          console.warn('删除旧对话记录失败:', error);
          // 如果删除失败，继续创建新的
        }
      }

      // 保存新的对话摘要，使用 project-${projectId} 作为 pageType，传入消息列表
      const savedId = await summarizeAndSaveConversation(undefined, messages);
      
      if (savedId) {
        setSavedConversationSourceId(savedId);
        
        // 刷新历史记录
        await loadSources(); // 重新加载来源列表
        // 更新历史记录列表，但不自动切换视图（避免强制跳回历史记录页面）
        await checkHistoryRecords(false); // 传入 false 表示不自动切换视图
        
        console.log('[ProjectResources] 对话摘要已自动保存:', savedId);
      }
    } catch (error) {
      console.error('[ProjectResources] 自动保存对话摘要失败:', error);
      // 不抛出错误，避免影响用户体验
    }
  };

  const loadPublicKnowledgeFiles = async () => {
    try {
      const response = await publicKnowledgeService.getFiles();
      if (response.success && response.data) {
        setPublicKnowledgeFiles(response.data);
      }
    } catch (error) {
      console.error('加载公共知识库文件失败:', error);
    }
  };

  // 更新已配置的资源清单
  useEffect(() => {
    // 区分文件来源和互联网信息点
    // 文件来源：通过文件上传功能上传的文件（URL是文件路径，不是http链接）
    // 互联网信息点：来自"检索信息"模块的来源（排除上传的文件，只包含http/https链接或没有URL的文本来源）
    const files = sources.filter(s => {
      // 文件上传的通常URL是文件路径，不是http链接
      // 检查：type为external，且有url，且url不是http/https开头
      // 文件URL特征：以/uploads/开头，或者包含文件扩展名（.pdf, .doc等）
      
      // 首先检查type
      if (s.type !== 'external') {
        return false;
      }
      
      // 检查URL是否存在
      const hasUrl = s.url && (typeof s.url === 'string' || typeof s.url === 'object');
      if (!hasUrl) {
        console.log('[资源清单] ✗ 未识别为文件（无URL）:', { 
          id: s.id, 
          title: s.title, 
          type: s.type,
          url: s.url,
          urlType: typeof s.url
        });
        return false;
      }
      
      // 处理URL（可能是字符串或对象）
      let urlStr: string;
      if (typeof s.url === 'string') {
        urlStr = s.url.trim();
      } else if (s.url && typeof s.url === 'object' && 'toString' in s.url) {
        urlStr = String(s.url).trim();
      } else {
        console.log('[资源清单] ✗ 未识别为文件（URL格式异常）:', { 
          id: s.id, 
          title: s.title, 
          type: s.type,
          url: s.url,
          urlType: typeof s.url
        });
        return false;
      }
      
      if (urlStr.length === 0) {
        return false;
      }
      
      const isHttpUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://');
      
      // 判断是否为文件URL：
      // 1. 以/uploads/开头
      // 2. 或者不是http/https开头，且包含文件扩展名
      const startsWithUploads = urlStr.startsWith('/uploads/') || urlStr.startsWith('uploads/');
      const hasFileExtension = /\.(pdf|doc|docx|txt|md|jpg|jpeg|png|gif|webp|ppt|pptx)$/i.test(urlStr);
      const isFileUrl = !isHttpUrl && (startsWithUploads || hasFileExtension);
      
      const isFile = s.type === 'external' && isFileUrl;
      
      if (isFile) {
        console.log('[资源清单] ✓ 识别为文件:', { 
          id: s.id, 
          title: s.title, 
          url: urlStr,
          type: s.type,
          startsWithUploads,
          hasFileExtension
        });
      } else {
        // 记录为什么没有被识别为文件（用于调试）
        console.log('[资源清单] ✗ 未识别为文件:', { 
          id: s.id, 
          title: s.title, 
          url: urlStr,
          urlRaw: JSON.stringify(s.url),
          type: s.type,
          isHttpUrl,
          startsWithUploads,
          hasFileExtension,
          isFileUrl
        });
      }
      return isFile;
    });
    
    // 互联网信息点：排除上传的文件，只包含真正的互联网信息（http/https链接或文本来源）
    // 辅助函数：获取来源的类别
    const getCategory = (source: SourceInformation): SourceCategory | undefined => {
      if (source.category) {
        return source.category;
      }
      if (source.metadata) {
        if (typeof source.metadata === 'string') {
          try {
            const parsed = JSON.parse(source.metadata);
            return parsed.category || parsed.sourceCategory;
          } catch (e) {
            return undefined;
          }
        } else if (typeof source.metadata === 'object') {
          return source.metadata.category || source.metadata.sourceCategory;
        }
      }
      return undefined;
    };
    
    const internetInfo = sources.filter(s => {
      // 排除上传的文件（URL是文件路径的）
      const hasUrl = s.url && typeof s.url === 'string' && s.url.trim().length > 0;
      if (!hasUrl) {
        // 没有URL的文本来源，需要检查是否是对话摘要或技术转译
        const category = getCategory(s);
        if (category === 'ai-qa-summary' || category === 'technical-translation') {
          return false; // 排除对话摘要和技术转译
        }
        return true; // 没有URL且不是对话摘要/技术转译的，归类为互联网信息
      }
      
      const urlStr = s.url.trim();
      const isHttpUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://');
      const isFileUrl = !isHttpUrl && (
        urlStr.startsWith('/uploads/') || 
        urlStr.startsWith('uploads/') ||
        /\.(pdf|doc|docx|txt|md|jpg|jpeg|png|gif|webp|ppt|pptx)$/i.test(urlStr)
      );
      
      if (isFileUrl) {
        return false; // 排除文件
      }
      
      // 排除对话摘要和技术转译（这些应该显示在历史记录中，而不是互联网信息点）
      const category = getCategory(s);
      if (category === 'ai-qa-summary' || category === 'technical-translation') {
        return false; // 排除对话摘要和技术转译
      }
      
      // 包含http/https链接的来源，或者没有URL的文本来源（通过检索信息添加的）
      return true;
    });
    
    // 将公共知识库文件（type: 'knowledge_base'）转换为知识点格式
    const publicKnowledgeSources = sources.filter(s => s.type === 'knowledge_base');
    const publicKnowledgeAsPoints: KnowledgePoint[] = publicKnowledgeSources.map(source => ({
      id: source.id,
      tech_point_id: 0, // 公共知识库文件没有关联的技术点
      title: source.title,
      content: source.description || '',
      knowledge_type: 'fact' as any,
      difficulty_level: 'intermediate' as any,
      tags: [],
      prerequisites: [],
      learning_objectives: [],
      examples: [],
      references: [],
      status: 'active' as any,
      created_at: source.created_at || new Date().toISOString(),
      updated_at: source.created_at || new Date().toISOString()
    }));
    
    // 合并技术点关联的知识点和公共知识库文件
    const allKnowledgePoints = [
      ...knowledgePoints.filter(kp => selectedKnowledgePoints.includes(kp.id)),
      ...publicKnowledgeAsPoints
    ];
    
    console.log('[资源清单] 更新配置资源:', {
      文件数量: files.length,
      互联网信息数量: internetInfo.length,
      技术点数量: techPoints.filter(tp => selectedTechPoints.includes(tp.id)).length,
      知识点数量: allKnowledgePoints.length,
      公共知识库文件数量: publicKnowledgeAsPoints.length,
      总来源数量: sources.length,
      文件列表: files.map(f => ({ id: f.id, title: f.title, url: f.url }))
    });
    
    setConfiguredResources({
      files: files,
      internetInfo: internetInfo,
      techPoints: techPoints.filter(tp => selectedTechPoints.includes(tp.id)),
      knowledgePoints: allKnowledgePoints
    });
  }, [sources, selectedTechPoints, selectedKnowledgePoints, techPoints, knowledgePoints]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const response = await projectService.getProjectById(parseInt(projectId));
      if (response.success && response.data) {
        setProject(response.data);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    if (!projectId) return;
    try {
      const pageType = `project-${projectId}`;
      console.log('[加载来源] 开始加载，pageType:', pageType, 'projectId:', projectId);
      
      // 获取项目的来源信息
      const response = await api.get('/source-information', {
        params: {
          pageType: pageType,
          page: 1,
          pageSize: 100
        }
      });
      console.log('[加载来源] API响应:', response.data);
      console.log('[加载来源] 请求参数:', { pageType, page: 1, pageSize: 100 });
      
      if (response.data.success && response.data.data) {
        const loadedSources = response.data.data;
        console.log('[加载来源] 加载的来源数量:', loadedSources.length);
        console.log('[加载来源] 来源列表详情:', loadedSources.map((s: SourceInformation) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          url: s.url,
          urlType: typeof s.url,
          urlValue: s.url,
          urlStartsWithHttp: s.url ? s.url.startsWith('http') : false,
          urlStartsWithHttps: s.url ? s.url.startsWith('https') : false,
          urlStartsWithUploads: s.url ? (s.url.startsWith('/uploads/') || s.url.startsWith('uploads/')) : false,
          hasFileExtension: s.url ? /\.(pdf|doc|docx|txt|md|jpg|jpeg|png|gif|webp|ppt|pptx)$/i.test(s.url) : false,
          page_type: (s as any).page_type,
          source_id: s.source_id,
          metadata: s.metadata
        })));
        
        // 详细打印每个来源的完整信息
        loadedSources.forEach((s: SourceInformation, index: number) => {
          console.log(`[加载来源] 来源 ${index + 1} 完整信息:`, {
            id: s.id,
            title: s.title,
            type: s.type,
            url: s.url,
            urlRaw: JSON.stringify(s.url),
            description: s.description?.substring(0, 100),
            page_type: (s as any).page_type,
            source_id: s.source_id,
            created_at: (s as any).created_at
          });
        });
        
        // 检查是否有文件类型的来源
        const fileSources = loadedSources.filter((s: SourceInformation) => {
          const hasUrl = s.url && typeof s.url === 'string' && s.url.trim().length > 0;
          const urlStr = hasUrl ? s.url.trim() : '';
          const isHttpUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://');
          const isFileUrl = !isHttpUrl && (
            urlStr.startsWith('/uploads/') || 
            urlStr.startsWith('uploads/') ||
            /\.(pdf|doc|docx|txt|md|jpg|jpeg|png|gif|webp|ppt|pptx)$/i.test(urlStr)
          );
          return s.type === 'external' && isFileUrl;
        });
        console.log('[加载来源] 识别出的文件来源数量:', fileSources.length);
        if (fileSources.length > 0) {
          console.log('[加载来源] 文件来源列表:', fileSources.map(f => ({ id: f.id, title: f.title, url: f.url })));
        }
        
        setSources(loadedSources);
      } else {
        console.warn('[加载来源] API返回失败或没有数据:', response.data);
      }
    } catch (error) {
      console.error('[加载来源] 加载来源信息失败:', error);
    }
  };

  // 检查历史记录（用于决定显示哪个视图）
  const checkHistoryRecords = async (autoSwitchView: boolean = true) => {
    if (!projectId) return;
    setCheckingHistory(true);
    try {
      // 获取项目的所有来源信息
      const response = await api.get('/source-information', {
        params: {
          pageType: `project-${projectId}`,
          page: 1,
          pageSize: 1000
        }
      });
      if (response.data.success && response.data.data) {
        // 过滤出历史记录（AI问答、技术包装、技术策略、技术通稿）
        const historyCategories = ['ai-qa-summary', 'tech-package-qa', 'tech-strategy-qa', 'tech-article-qa', 'technical-translation'];
        const filtered = response.data.data.filter((source: SourceInformation) => {
          // 从 metadata 中解析 category
          let category: string | undefined;
          if (source.metadata) {
            if (typeof source.metadata === 'string') {
              try {
                const parsed = JSON.parse(source.metadata);
                category = parsed.category || parsed.sourceCategory;
              } catch (e) {
                // 忽略解析错误
              }
            } else if (typeof source.metadata === 'object') {
              category = source.metadata.category || source.metadata.sourceCategory;
            }
          }
          // 也检查直接设置的 category
          if (source.category) {
            category = source.category;
          }
          return category && historyCategories.includes(category);
        });
        setHistoryRecords(filtered);
        // 只有在 autoSwitchView 为 true 时才自动切换视图
        // 这样可以避免在AI共创过程中保存对话后强制跳回历史记录页面
        if (autoSwitchView) {
          // 如果有历史记录，显示历史记录视图；否则显示AI共创视图
          setShowHistoryView(filtered.length > 0);
        }
      } else {
        if (autoSwitchView) {
          setShowHistoryView(false);
        }
      }
    } catch (error) {
      console.error('检查历史记录失败:', error);
      if (autoSwitchView) {
        setShowHistoryView(false);
      }
    } finally {
      setCheckingHistory(false);
    }
  };

  // 加载历史记录（用于模态框）
  const loadHistoryRecords = async () => {
    if (!projectId) return;
    setHistoryLoading(true);
    try {
      // 获取项目的所有来源信息
      const response = await api.get('/source-information', {
        params: {
          pageType: `project-${projectId}`,
          page: 1,
          pageSize: 1000
        }
      });
      if (response.data.success && response.data.data) {
        // 过滤出历史记录（AI问答、技术包装、技术策略、技术通稿）
        const historyCategories = ['ai-qa-summary', 'tech-package-qa', 'tech-strategy-qa', 'tech-article-qa', 'technical-translation'];
        const filtered = response.data.data.filter((source: SourceInformation) => {
          // 从 metadata 中解析 category
          let category: string | undefined;
          if (source.metadata) {
            if (typeof source.metadata === 'string') {
              try {
                const parsed = JSON.parse(source.metadata);
                category = parsed.category || parsed.sourceCategory;
              } catch (e) {
                // 忽略解析错误
              }
            } else if (typeof source.metadata === 'object') {
              category = source.metadata.category || source.metadata.sourceCategory;
            }
          }
          // 也检查直接设置的 category
          if (source.category) {
            category = source.category;
          }
          return category && historyCategories.includes(category);
        });
        setHistoryRecords(filtered);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 获取来源的类别
  const getSourceCategory = (source: SourceInformation): SourceCategory | undefined => {
    if (source.category) {
      return source.category;
    }
    if (source.metadata) {
      if (typeof source.metadata === 'string') {
        try {
          const parsed = JSON.parse(source.metadata);
          return parsed.category || parsed.sourceCategory;
        } catch (e) {
          return undefined;
        }
      } else if (typeof source.metadata === 'object') {
        return source.metadata.category || source.metadata.sourceCategory;
      }
    }
    return undefined;
  };

  // 获取类别显示名称
  const getCategoryDisplayName = (category?: SourceCategory): string => {
    switch (category) {
      case 'ai-qa-summary':
        return 'AI问答';
      case 'tech-package-qa':
        return '技术包装';
      case 'tech-strategy-qa':
        return '技术策略';
      case 'tech-article-qa':
        return '技术通稿';
      case 'technical-translation':
        return '技术转译';
      default:
        return '其他';
    }
  };

  // 获取类别图标
  const getCategoryIcon = (category?: SourceCategory) => {
    switch (category) {
      case 'ai-qa-summary':
        return <MessageSquare className="w-4 h-4" />;
      case 'tech-package-qa':
        return <Package className="w-4 h-4" />;
      case 'tech-strategy-qa':
        return <Target className="w-4 h-4" />;
      case 'tech-article-qa':
        return <Newspaper className="w-4 h-4" />;
      case 'technical-translation':
        return <FileCode className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 按类别分组历史记录
  const groupedHistoryRecords = () => {
    const groups: Record<string, SourceInformation[]> = {
      'ai-qa-summary': [],
      'tech-package-qa': [],
      'tech-strategy-qa': [],
      'tech-article-qa': [],
      'technical-translation': [],
      'other': []
    };

    historyRecords.forEach(record => {
      const category = getSourceCategory(record);
      if (category && groups[category]) {
        groups[category].push(record);
      } else {
        groups['other'].push(record);
      }
    });

    return groups;
  };

  // 打开历史记录模态框
  const handleOpenHistoryModal = () => {
    setShowHistoryModal(true);
    loadHistoryRecords();
  };

  // 切换到AI共创视图
  const handleSwitchToAICreation = () => {
    setShowHistoryView(false);
  };

  // 切换到历史记录视图
  const handleSwitchToHistory = () => {
    setShowHistoryView(true);
    loadHistoryRecords();
  };

  // 提炼为技术点
  const handleExtractTechPoint = async (record: SourceInformation) => {
    setExtractingTechPoint(true);
    setExtractingSourceId(record.id);
    
    try {
      // 获取对话内容
      const conversationContent = record.description || record.title || '';
      
      // 构建AI提示词，要求提取技术点信息并转换为JSON格式
      const extractPrompt = `你是一个技术信息提取专家。请分析以下对话内容，提炼关键信息并转换为技术点的标准JSON格式。

对话内容：
${conversationContent}

请提取以下关键信息并生成JSON：

必需字段：
1. name: 技术名称（简短、准确，不超过50字）
2. description: 技术描述（1-2句话概括，不超过200字）
3. tech_type: 技术类型（必须是：feature、improvement、innovation、technology 之一）
4. priority: 优先级（必须是：low、medium、high 之一）
5. technical_details: 技术细节（JSON对象，可以包含：tech_principle技术原理、tech_value技术价值、tech_boundary技术边界等）
6. benefits: 技术优势（字符串数组，列出3-5个关键优势，每个不超过100字）
7. applications: 应用场景（字符串数组，列出应用场景，每个不超过100字）
8. keywords: 关键词（字符串数组，提取3-8个关键词）
9. features: 特性说明（字符串，格式化的markdown，包含：
   - 【一句话说明（slogan）】
   - 【技术品牌定位与愿景】
   - 【用户体验与场景】
   如果信息不足，可以使用"敬请期待"作为占位符）

输出要求：
- 只返回JSON格式，不要包含任何markdown代码块标记或其他文字说明
- JSON必须是有效的，可以直接用JSON.parse()解析
- 如果某些信息无法从对话中提取，使用合理的默认值或空值
- 所有数组字段必须是数组格式，即使为空也要使用[]
- technical_details必须是对象格式，即使为空也要使用{}

示例JSON格式：
{
  "name": "技术名称",
  "description": "技术描述",
  "tech_type": "feature",
  "priority": "medium",
  "technical_details": {
    "tech_principle": "技术原理说明",
    "tech_value": "技术价值说明",
    "tech_boundary": "技术边界说明"
  },
  "benefits": ["优势1", "优势2", "优势3"],
  "applications": ["场景1", "场景2"],
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "features": "【一句话说明（slogan）】\\n说明内容\\n【技术品牌定位与愿景】\\n定位：定位说明\\n愿景：愿景说明\\n【用户体验与场景】\\n场景说明"
}

现在请分析对话内容并返回JSON：`;

      // 调用AI进行提炼
      const aiQAConfig = await configService.getDifyConfig('smart-workflow-ai-qa');
      const result = await workflowAPI.aiSearch(
        extractPrompt,
        { context: [{ role: 'user', content: extractPrompt }] },
        (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined,
        undefined
      );

      if (result.success && result.data) {
        const aiResponse = result.data.answer || result.data.result || '';
        
        // 尝试解析JSON（AI可能返回JSON或包含JSON的文本）
        let techPointData: any = null;
        try {
          // 尝试提取JSON部分（如果AI返回的是markdown代码块）
          const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            techPointData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            techPointData = JSON.parse(aiResponse);
          }
        } catch (parseError) {
          console.error('解析AI返回的JSON失败:', parseError);
          // 如果解析失败，尝试手动构建基本结构
          techPointData = {
            name: record.title || '未命名技术',
            description: conversationContent.substring(0, 200),
            tech_type: 'feature',
            priority: 'medium',
            technical_details: {},
            benefits: [],
            applications: [],
            keywords: [],
            features: conversationContent
          };
          alert('AI提炼完成，但JSON解析失败，已使用默认格式。可以手动编辑。');
        }

        // 添加一些默认字段
        techPointData.status = 'draft';
        techPointData.level = 1;
        
        // 保存提炼的数据
        setExtractedTechPointData(techPointData);
        setShowTechPointPreview(true);
      } else {
        alert('AI提炼失败，请重试');
      }
    } catch (error) {
      console.error('提炼技术点失败:', error);
      alert(`提炼失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setExtractingTechPoint(false);
      setExtractingSourceId(null);
    }
  };

  const loadTechPoints = async () => {
    try {
      const response = await techPointService.getTechPoints({
        page: 1,
        pageSize: 100
      });
      if (response.success && response.data) {
        setTechPoints(response.data.data || []);
      }
    } catch (error) {
      console.error('加载技术点失败:', error);
    }
  };

  const loadKnowledgePoints = async (techPointIds: number[]) => {
    if (techPointIds.length === 0) {
      setKnowledgePoints([]);
      return;
    }
    try {
      // 加载所有选中技术点的知识点
      const allKnowledgePoints: KnowledgePoint[] = [];
      for (const techPointId of techPointIds) {
        const response = await knowledgePointService.getByTechPointId(techPointId, {
          page: 1,
          pageSize: 100
        });
        if (response.success && response.data) {
          // response.data 是知识点数组
          allKnowledgePoints.push(...response.data);
        }
      }
      setKnowledgePoints(allKnowledgePoints);
    } catch (error) {
      console.error('加载知识点失败:', error);
    }
  };

  useEffect(() => {
    if (selectedTechPoints.length > 0) {
      loadKnowledgePoints(selectedTechPoints);
    } else {
      setKnowledgePoints([]);
    }
  }, [selectedTechPoints]);

  // 同步已添加的公共知识库文件到selectedPublicFiles
  useEffect(() => {
    if (sources.length > 0 && publicKnowledgeFiles.length > 0) {
      const addedFileIds: number[] = [];
      sources.forEach(source => {
        if (source.type === 'knowledge_base' && source.source_id.startsWith('public_kb_')) {
          const fileId = parseInt(source.source_id.replace('public_kb_', ''));
          if (!isNaN(fileId) && publicKnowledgeFiles.find(f => f.id === fileId)) {
            addedFileIds.push(fileId);
          }
        }
      });
      setSelectedPublicFiles(addedFileIds);
    }
  }, [sources, publicKnowledgeFiles]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (techPointSelectorRef.current && !techPointSelectorRef.current.contains(event.target as Node)) {
        setShowTechPointSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !projectId) return;
    
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      console.log('[文件上传] 开始上传文件:', fileArray.map(f => f.name));
      
      // 上传文件
      const uploadedFiles = await aiSearchService.uploadFiles(fileArray, undefined);
      console.log('[文件上传] 文件上传成功:', uploadedFiles);
      
      // 创建来源信息记录
      const createdSources = [];
      for (const uploadedFile of uploadedFiles) {
        // 如果markdown内容太长，只保存摘要
        let description = `文件大小: ${formatFileSize(uploadedFile.size)}`;
        if (uploadedFile.markdownContent) {
          // 只保存前500个字符作为描述，完整内容保留在文件记录中
          const contentPreview = uploadedFile.markdownContent.length > 500
            ? uploadedFile.markdownContent.substring(0, 500) + '...'
            : uploadedFile.markdownContent;
          description = contentPreview;
        }
        
        const pageType = `project-${projectId}`;
        const sourceData = {
          source_id: uploadedFile.id || uploadedFile.fileId || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: uploadedFile.name,
          type: 'external' as const,
          url: uploadedFile.url,
          description: description,
          page_type: pageType,
          conversation_id: null
        };
        
        console.log('[文件上传] 创建来源信息:', sourceData);
        console.log('[文件上传] pageType:', pageType, 'projectId:', projectId);
        
        try {
          const response = await api.post('/source-information', sourceData);
          console.log('[文件上传] 来源信息创建成功:', response.data);
          const createdData = response.data.data;
          console.log('[文件上传] 创建后的数据:', {
            id: createdData?.id,
            source_id: createdData?.source_id,
            title: createdData?.title,
            url: createdData?.url,
            page_type: createdData?.page_type,
            type: createdData?.type,
            status: createdData?.status
          });
          
          // 立即验证：使用source_id查询刚创建的记录
          if (createdData?.source_id) {
            try {
              const verifyResponse = await api.get(`/source-information/source-id/${createdData.source_id}`);
              console.log('[文件上传] 验证查询结果:', verifyResponse.data);
            } catch (verifyError) {
              console.warn('[文件上传] 验证查询失败（可能API不存在）:', verifyError);
            }
          }
          
          createdSources.push(createdData);
        } catch (sourceError) {
          console.error('[文件上传] 创建来源信息失败:', sourceError);
          if (sourceError instanceof Error) {
            console.error('[文件上传] 错误详情:', sourceError.message, sourceError.stack);
          }
          // 继续处理其他文件，不中断整个流程
        }
      }
      
      console.log('[文件上传] 成功创建来源信息数量:', createdSources.length);
      if (createdSources.length > 0) {
        console.log('[文件上传] 创建的来源信息详情:', createdSources.map(s => ({
          id: s.id,
          source_id: s.source_id,
          title: s.title,
          url: s.url,
          page_type: s.page_type
        })));
        
        // 测试查询：立即查询刚创建的记录
        const pageType = `project-${projectId}`;
        for (const createdSource of createdSources) {
          if (createdSource.source_id) {
            try {
              console.log('[文件上传] 测试查询刚创建的记录，source_id:', createdSource.source_id);
              const testResponse = await api.get(`/source-information/source-id/${createdSource.source_id}`);
              console.log('[文件上传] 测试查询结果:', testResponse.data);
              
              // 也测试用pageType查询
              const pageTypeResponse = await api.get('/source-information', {
                params: {
                  pageType: pageType,
                  page: 1,
                  pageSize: 100
                }
              });
              console.log('[文件上传] 测试pageType查询结果:', {
                pageType,
                count: pageTypeResponse.data.data?.length || 0,
                sources: pageTypeResponse.data.data?.map((s: any) => ({
                  id: s.id,
                  source_id: s.source_id,
                  title: s.title,
                  url: s.url,
                  page_type: s.page_type
                }))
              });
            } catch (testError) {
              console.error('[文件上传] 测试查询失败:', testError);
            }
          }
        }
      }
      
      // 等待一小段时间确保数据库已更新，然后重新加载来源列表
      console.log('[文件上传] 等待300ms后重新加载...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadSources();
      console.log('[文件上传] 来源列表已重新加载');
      
      // 再次等待并重新加载一次，确保数据同步
      console.log('[文件上传] 等待500ms后二次重新加载...');
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadSources();
      console.log('[文件上传] 来源列表二次重新加载完成');
      
      // 清空文件输入
      if (fileInputRefModal.current) {
        fileInputRefModal.current.value = '';
      }
      
      // 显示成功提示
      if (createdSources.length > 0) {
        alert(`成功上传 ${createdSources.length} 个文件`);
      }
    } catch (error) {
      console.error('[文件上传] 文件上传失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`文件上传失败: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    try {
      await api.delete(`/source-information/${sourceId}`);
      await loadSources();
      return true;
    } catch (error) {
      console.error('删除来源失败:', error);
      alert('删除来源失败');
      return false;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 过滤检索信息：排除上传的文件，只显示真正的检索信息（http/https链接或文本来源）
  const filteredSources = sources.filter(source => {
    // 排除上传的文件（URL是文件路径的，不是http链接）
    if (source.url && !source.url.startsWith('http') && !source.url.startsWith('https')) {
      return false;
    }
    // 只包含http/https链接或没有URL的文本来源
    return true;
  }).filter(source =>
    source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTechPoints = techPoints.filter(tp =>
    tp.name.toLowerCase().includes(techPointSearch.toLowerCase()) ||
    tp.description?.toLowerCase().includes(techPointSearch.toLowerCase())
  );

  const filteredKnowledgePoints = knowledgePoints.filter(kp =>
    kp.title.toLowerCase().includes(knowledgeBaseSearch.toLowerCase()) ||
    kp.content?.toLowerCase().includes(knowledgeBaseSearch.toLowerCase())
  );

  const filteredPublicFiles = publicKnowledgeFiles.filter(file =>
    file.name.toLowerCase().includes(publicFileSearch.toLowerCase()) ||
    file.description?.toLowerCase().includes(publicFileSearch.toLowerCase())
  );

  const toggleTechPoint = (techPointId: number) => {
    setSelectedTechPoints(prev =>
      prev.includes(techPointId)
        ? prev.filter(id => id !== techPointId)
        : [...prev, techPointId]
    );
  };

  const toggleKnowledgePoint = (knowledgePointId: number) => {
    setSelectedKnowledgePoints(prev =>
      prev.includes(knowledgePointId)
        ? prev.filter(id => id !== knowledgePointId)
        : [...prev, knowledgePointId]
    );
  };

  const togglePublicFile = async (fileId: number) => {
    if (selectedPublicFiles.includes(fileId)) {
      // 取消选择：从selectedPublicFiles中移除，并从项目中删除对应的来源
      setSelectedPublicFiles(prev => prev.filter(id => id !== fileId));
      if (projectId) {
        // 查找对应的来源信息并删除
        const sourceToDelete = sources.find(s => 
          s.type === 'knowledge_base' && 
          s.source_id === `public_kb_${fileId}`
        );
        if (sourceToDelete) {
          try {
            await handleDeleteSource(sourceToDelete.id);
          } catch (error) {
            console.error('删除公共知识库文件来源失败:', error);
          }
        }
      }
    } else {
      // 选择：添加到selectedPublicFiles，并添加到项目来源中
      setSelectedPublicFiles(prev => [...prev, fileId]);
      if (projectId) {
        const file = publicKnowledgeFiles.find(f => f.id === fileId);
        if (file) {
          try {
            await api.post('/source-information', {
              source_id: `public_kb_${file.id}`,
              title: file.name,
              type: 'knowledge_base',
              url: file.file_url || file.file_path,
              description: file.description || `公共知识库文件: ${file.name}`,
              page_type: `project-${projectId}`,
              conversation_id: null
            });
            // 重新加载来源列表
            await loadSources();
          } catch (error) {
            console.error('添加公共知识库文件到项目失败:', error);
          }
        }
      }
    }
  };

  const handleTechnicalTranslation = async () => {
    setIsTranslating(true);
    setTranslatedContent('');
    
    try {
      const contentParts: string[] = [];
      
      // 1. 拼接已选择的技术点
      if (configuredResources.techPoints.length > 0) {
        contentParts.push('## 已选择技术点\n\n');
        configuredResources.techPoints.forEach((techPoint, index) => {
          contentParts.push(`### ${index + 1}. ${techPoint.name}\n\n`);
          if (techPoint.description) {
            contentParts.push(`${techPoint.description}\n\n`);
          }
        });
        contentParts.push('\n---\n\n');
      }
      
      // 2. 拼接已上传的文件（转换为markdown）
      if (configuredResources.files.length > 0) {
        contentParts.push('## 已上传文件\n\n');
        
        // 获取所有文件记录以获取markdown内容
        let fileRecords: FileUploadResponse[] = [];
        try {
          fileRecords = await aiSearchService.getFiles({
            pageType: `project-${projectId}` as any
          });
        } catch (error) {
          console.error('获取文件列表失败:', error);
        }
        
        for (const file of configuredResources.files) {
          contentParts.push(`### ${file.title}\n\n`);
          
          // 尝试从文件记录中获取markdown内容
          const fileRecord = fileRecords.find(f => 
            f.url === file.url || 
            f.name === file.title ||
            f.id === file.source_id
          );
          
          if (fileRecord?.markdownContent) {
            // 使用文件的markdown内容
            contentParts.push(`${fileRecord.markdownContent}\n\n`);
          } else if (file.description) {
            // 如果没有markdown内容，使用description（可能已经包含markdown内容）
            contentParts.push(`${file.description}\n\n`);
          } else {
            contentParts.push(`文件：${file.title}\n\n`);
          }
        }
        contentParts.push('\n---\n\n');
      }
      
      // 3. 拼接已选择的知识点
      if (configuredResources.knowledgePoints.length > 0) {
        contentParts.push('## 已选择知识点\n\n');
        configuredResources.knowledgePoints.forEach((knowledgePoint, index) => {
          contentParts.push(`### ${index + 1}. ${knowledgePoint.title}\n\n`);
          if (knowledgePoint.content) {
            contentParts.push(`${knowledgePoint.content}\n\n`);
          }
        });
        contentParts.push('\n---\n\n');
      }
      
      // 4. 拼接互联网信息点
      if (configuredResources.internetInfo.length > 0) {
        contentParts.push('## 互联网信息点\n\n');
        configuredResources.internetInfo.forEach((info, index) => {
          contentParts.push(`### ${index + 1}. ${info.title}\n\n`);
          if (info.url) {
            contentParts.push(`链接：${info.url}\n\n`);
          }
          if (info.description) {
            contentParts.push(`${info.description}\n\n`);
          }
        });
      }
      
      const finalContent = contentParts.join('');
      setTranslatedContent(finalContent);
    } catch (error) {
      console.error('技术转译失败:', error);
      alert('技术转译失败，请重试');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveReview = async () => {
    setIsSaving(true);
    try {
      // 更新转译内容
      setTranslatedContent(reviewContent);
      // 这里可以添加保存到后端的逻辑
      // 例如：await api.post(`/projects/${projectId}/translated-content`, { content: reviewContent });
      
      setShowReviewModal(false);
      alert('内容已保存');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 总结对话内容并保存为来源信息
  const summarizeAndSaveConversation = async (targetPageType?: string, messages?: Array<{ id: string; content: string; sender: 'user' | 'ai'; timestamp: Date }>): Promise<string | null> => {
    // 使用传入的消息列表，如果没有则使用状态中的消息
    const messagesToUse = messages || aiMessages;
    
    // 如果没有对话内容，直接返回 null
    if (messagesToUse.length === 0) {
      return null;
    }

    // 如果没有指定pageType，使用project-{projectId}格式
    const pageType = targetPageType || (projectId ? `project-${projectId}` : undefined);

    setIsSummarizingConversation(true);
    try {
      // 构建对话文本
      const conversationText = messagesToUse.map((msg) => {
        const role = msg.sender === 'user' ? '用户' : 'AI助手';
        return `${role}: ${msg.content}`;
      }).join('\n\n');

      // 如果对话文本太长，先截断（保留前2000字符）
      const maxLength = 2000;
      const truncatedText = conversationText.length > maxLength 
        ? conversationText.substring(0, maxLength) + '\n\n...（内容已截断）'
        : conversationText;

      // 生成总结（简化版本：使用对话内容作为描述，标题为总结）
      // 如果对话很长，取前100字符作为标题
      let summaryTitle = '项目资源对话摘要';
      let summaryDescription = truncatedText;

      // 尝试使用 AI 生成更智能的总结
      try {
        const aiQAConfig = await configService.getDifyConfig('smart-workflow-ai-qa');
        const summaryPrompt = `请对以下对话进行总结，生成一个简洁的标题（不超过30字）和一段摘要（不超过300字）。用中文回答，格式为：
标题：[标题]
摘要：[摘要内容]

对话内容：
${truncatedText}`;

        const result = await workflowAPI.aiSearch(
          summaryPrompt,
          { context: [{ role: 'user', content: summaryPrompt }] },
          (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined,
          undefined
        );

        if (result.success && result.data) {
          const aiResponse = result.data.answer || result.data.result || '';
          // 解析 AI 响应，提取标题和摘要
          const titleMatch = aiResponse.match(/标题[：:]\s*(.+)/);
          const summaryMatch = aiResponse.match(/摘要[：:]\s*(.+?)(?:\n|$)/s);
          
          if (titleMatch && titleMatch[1]) {
            summaryTitle = titleMatch[1].trim();
          }
          if (summaryMatch && summaryMatch[1]) {
            summaryDescription = summaryMatch[1].trim();
            // 如果 AI 生成的摘要太短，补充完整对话内容
            if (summaryDescription.length < 200) {
              summaryDescription = `${summaryDescription}\n\n完整对话内容：\n${truncatedText}`;
            }
          }
        }
      } catch (error) {
        console.warn('使用 AI 生成总结失败，使用简化版本:', error);
        // 如果 AI 调用失败，使用简化版本
        summaryTitle = messagesToUse.length > 0 
          ? `项目对话摘要（${messagesToUse.length}条消息）`
          : '项目对话摘要';
      }

      // 创建来源信息
      const sourceId = `project_conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const source: Source = {
        id: sourceId,
        title: summaryTitle,
        type: 'external',
        description: summaryDescription,
        category: 'ai-qa-summary', // AI问答总结信息
      };

      // 保存到数据库
      const saveResult = await sourceService.saveSourceInformation(
        source,
        pageType,
        aiConversationId || undefined
      );

      if (saveResult.success && saveResult.data) {
        console.log('[ProjectResources] 对话摘要已保存:', {
          id: saveResult.data.id,
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
          pageType: pageType
        });
        // 返回数据库的 id（数字），用于后续删除操作
        return saveResult.data.id?.toString() || null;
      } else {
        console.error('[ProjectResources] 保存对话摘要失败:', saveResult.error);
        return null;
      }
    } catch (error) {
      console.error('[ProjectResources] 总结对话失败:', error);
      return null;
    } finally {
      setIsSummarizingConversation(false);
    }
  };

  // 添加互联网信息来源
  const handleAddInternetInfo = async () => {
    if (!internetInfoSearchQuery.trim()) {
      alert('请输入需要检索的信息');
      return;
    }

    if (!projectId) {
      alert('项目ID不存在');
      return;
    }

    setIsAddingInternetInfo(true);
    try {
      const searchText = internetInfoSearchQuery.trim();
      const sourceId = `internet_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 创建检索信息来源
      const source: Source = {
        id: sourceId,
        title: `检索信息: ${searchText.slice(0, 30)}${searchText.length > 30 ? '...' : ''}`,
        type: 'external',
        description: `[检索信息] ${searchText}\n\n说明：此来源需要AI检索补充相关信息。`,
        category: 'internet-search', // 互联网搜索信息
      };

      // 保存到数据库
      const pageType = `project-${projectId}`;
      const saveResult = await sourceService.saveSourceInformation(
        source,
        pageType,
        aiConversationId || undefined
      );

      if (saveResult.success && saveResult.data) {
        console.log('[ProjectResources] 互联网信息已添加:', {
          id: saveResult.data.id,
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
        });
        
        // 刷新来源列表
        await loadSources();
        
        // 清空输入并关闭弹窗
        setInternetInfoSearchQuery('');
        setShowInternetInfoModal(false);
      } else {
        alert(saveResult.error || '添加互联网信息失败');
      }
    } catch (error) {
      console.error('[ProjectResources] 添加互联网信息失败:', error);
      alert('添加互联网信息失败，请重试');
    } finally {
      setIsAddingInternetInfo(false);
    }
  };

  // Web Search 搜索处理
  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    setWebSearchResults([]);
    setSelectedSearchResults(new Set());

    try {
      const result = await bochaAPI.webSearch({
        query: webSearchQuery.trim(),
        summary: true,
        count: 10,
      });

      if (result.success && result.data?.webPages?.value) {
        setWebSearchResults(result.data.webPages.value);
      } else {
        alert(result.error?.message || '搜索失败，请重试');
      }
    } catch (error) {
      console.error('[ProjectResources] Web Search 失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 切换搜索结果选择状态
  const toggleSearchResult = (index: number) => {
    const newSelected = new Set(selectedSearchResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSearchResults(newSelected);
  };

  // 保存选中的 Web Search 结果为来源信息
  const handleSaveWebSearchResults = async () => {
    if (selectedSearchResults.size === 0) {
      alert('请至少选择一个搜索结果');
      return;
    }

    if (!projectId) {
      alert('项目ID不存在');
      return;
    }

    setIsAddingInternetInfo(true);
    try {
      const pageType = `project-${projectId}`;
      const selectedResults = Array.from(selectedSearchResults).map(index => webSearchResults[index]);
      
      // 批量保存选中的搜索结果
      for (const result of selectedResults) {
        const sourceId = `web_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const description = `${result.snippet || ''}\n\n${result.summary ? `摘要：${result.summary}` : ''}\n\n来源：${result.siteName || ''}`.trim();
        
        const source: Source = {
          id: sourceId,
          title: result.name || '未命名网页',
          type: 'external',
          url: result.url,
          description: description,
          category: 'web-search',
        };

        await sourceService.saveSourceInformation(
          source,
          pageType,
          aiConversationId || undefined
        );
      }

      // 刷新来源列表
      await loadSources();
      
      // 清空状态并关闭弹窗
      setWebSearchQuery('');
      setWebSearchResults([]);
      setSelectedSearchResults(new Set());
      setShowInternetInfoModal(false);
      
      alert(`成功添加 ${selectedResults.length} 个搜索结果`);
    } catch (error) {
      console.error('[ProjectResources] 保存 Web Search 结果失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsAddingInternetInfo(false);
    }
  };

  // 保存技术转译内容为来源信息
  const saveTechnicalTranslationAsSource = async (targetPageType: 'tech-strategy' | 'tech-package'): Promise<string | null> => {
    // 如果没有转译内容，直接返回 null
    if (!translatedContent || translatedContent.trim().length === 0) {
      return null;
    }

    try {
      // 生成标题（如果内容太长，截取前50字符）
      const maxTitleLength = 50;
      let title = '技术转译内容';
      
      // 尝试从转译内容中提取标题（第一行非空内容）
      const lines = translatedContent.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // 移除 markdown 标题符号（##、###等）
        const cleanLine = firstLine.replace(/^#+\s*/, '');
        if (cleanLine.length > 0) {
          title = cleanLine.length > maxTitleLength 
            ? cleanLine.substring(0, maxTitleLength) + '...'
            : cleanLine;
        }
      }

      // 创建来源信息
      const sourceId = `project_translation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const source: Source = {
        id: sourceId,
        title: title,
        type: 'external',
        description: translatedContent,
        category: 'technical-translation', // 技术转译信息
      };

      // 保存到数据库
      const saveResult = await sourceService.saveSourceInformation(
        source,
        targetPageType,
        aiConversationId || undefined
      );

      if (saveResult.success && saveResult.data) {
        console.log('[ProjectResources] 技术转译内容已保存:', {
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
          pageType: targetPageType
        });
        return saveResult.data.source_id;
      } else {
        console.error('[ProjectResources] 保存技术转译内容失败:', saveResult.error);
        return null;
      }
    } catch (error) {
      console.error('[ProjectResources] 保存技术转译内容失败:', error);
      return null;
    }
  };

  // 处理跳转到技术策略或技术包装页面
  const handleNavigateToAIPage = async (pageType: 'tech-strategy' | 'tech-package') => {
    // 收集所有需要保存的来源 ID
    const sourceIds: string[] = [];
    
    // 1. 总结并保存对话内容
    const conversationSourceId = await summarizeAndSaveConversation(pageType);
    if (conversationSourceId) {
      sourceIds.push(conversationSourceId);
    }
    
    // 2. 保存技术转译内容
    const translationSourceId = await saveTechnicalTranslationAsSource(pageType);
    if (translationSourceId) {
      sourceIds.push(translationSourceId);
    }
    
    // 构建跳转 URL
    let url = `/${pageType}`;
    const params = new URLSearchParams();
    
    if (projectId) {
      params.append('projectId', projectId);
      // 添加 newConversation 参数，确保创建新对话
      params.append('newConversation', 'true');
    }
    
    // 添加所有 sourceId（支持多个）
    sourceIds.forEach(sourceId => {
      params.append('sourceId', sourceId);
    });
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // 跳转
    navigate(url);
  };

  if (loading || checkingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">项目不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← 返回
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{formatDate(project.created_at)}</span>
                    <span>{sources.length}个来源</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 入口 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4 h-12" aria-label="Tabs">
            {/* AI共创 Tab */}
            <button
              onClick={handleSwitchToAICreation}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors h-full ${
                !showHistoryView
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className={`w-5 h-5 ${!showHistoryView ? 'text-green-600' : 'text-gray-400'}`} />
              <span>AI共创</span>
            </button>

            {/* 历史记录 Tab */}
            <button
              onClick={handleSwitchToHistory}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors h-full ${
                showHistoryView
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className={`w-5 h-5 ${showHistoryView ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>历史记录</span>
            </button>
          </nav>
        </div>

        {showHistoryView ? (
          /* 历史记录视图 */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : (() => {
              const grouped = groupedHistoryRecords();
              const categoryOrder = ['ai-qa-summary', 'tech-package-qa', 'tech-strategy-qa', 'tech-article-qa', 'technical-translation'];
              const hasRecords = categoryOrder.some(cat => grouped[cat] && grouped[cat].length > 0);

              if (!hasRecords) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>暂无历史记录</p>
                    <p className="text-sm mt-2">开始使用AI问答、技术包装、技术策略或技术通稿功能，历史记录将显示在这里</p>
                    <button
                      onClick={handleSwitchToAICreation}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      开始AI共创
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {categoryOrder.map(category => {
                    const records = grouped[category] || [];
                    if (records.length === 0) return null;

                    const categoryName = getCategoryDisplayName(category as SourceCategory);
                    const Icon = getCategoryIcon(category as SourceCategory);

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg">
                        {/* 分类标题 */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
                          <div className="text-blue-600">{Icon}</div>
                          <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
                          <span className="ml-2 text-sm text-gray-500">({records.length})</span>
                        </div>

                        {/* 记录列表 */}
                        <div className="divide-y divide-gray-200">
                          {records.map((record) => (
                            <div
                              key={record.id}
                              className="p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                                    {record.title}
                                  </h4>
                                  {record.description && (
                                    <div className="text-xs text-gray-600 mb-2 line-clamp-3">
                                      {record.description.length > 200
                                        ? record.description.substring(0, 200) + '...'
                                        : record.description}
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{formatDate(record.created_at)}</span>
                                    {record.url && (
                                      <a
                                        href={record.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                                      >
                                        {record.url}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* 提炼为技术点按钮 */}
                                  {getSourceCategory(record) === 'ai-qa-summary' && (
                                    <button
                                      onClick={() => handleExtractTechPoint(record)}
                                      disabled={extractingTechPoint}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                      title="提炼为技术点"
                                    >
                                      {extractingTechPoint && extractingSourceId === record.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  {/* 删除按钮 */}
                                  <button
                                    onClick={async () => {
                                      if (confirm('确定要删除这条历史记录吗？')) {
                                        await handleDeleteSource(record.id);
                                        // 删除后重新加载历史记录并检查
                                        await loadHistoryRecords();
                                        await checkHistoryRecords();
                                        // 如果删除后没有历史记录了，自动切换到AI共创视图
                                        if (historyRecords.length <= 1) {
                                          // 等待一下让状态更新
                                          setTimeout(() => {
                                            checkHistoryRecords();
                                          }, 300);
                                        }
                                      }
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          /* AI共创视图 */
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
          {/* 左侧：AI问答 */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
              {/* AI问答头部 */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">AI问答助手</h2>
                    <p className="text-sm text-gray-500">基于项目资源进行智能问答</p>
                  </div>
                </div>
              </div>

              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {aiMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-gray-400">
                      <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">开始与AI助手对话吧</p>
                      <p className="text-xs mt-2 text-gray-400">AI将基于您已选择的技术点、文件和知识库进行回答</p>
                    </div>
                  </div>
                ) : (
                  aiMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {/* 头像 */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {message.sender === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>

                        {/* 消息内容 */}
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : 'bg-gray-50 border border-gray-200 rounded-tl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* 加载状态 */}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">AI正在思考中...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={aiMessagesEndRef} />
              </div>

              {/* 输入区域 */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInputMessage}
                    onChange={(e) => setAiInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !aiLoading && aiInputMessage.trim()) {
                        handleAISendMessage();
                      }
                    }}
                    placeholder="请输入您的问题..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={handleAISendMessage}
                    disabled={!aiInputMessage.trim() || aiLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：已关联技术信息 */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">已关联技术信息</h2>
              
              {/* 已选择的技术点 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    已选择技术点 ({configuredResources.techPoints.length})
                  </h3>
                  <button
                    onClick={() => {
                      // 跳转到技术点库页面进行选择
                      const returnUrl = `/project/${projectId}/resources`;
                      const selectedIds = selectedTechPoints.join(',');
                      navigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${selectedIds}`);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="追加技术点"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.techPoints.length === 0 ? (
                    <div 
                      onClick={() => {
                        // 跳转到技术点库页面进行选择
                        const returnUrl = `/project/${projectId}/resources`;
                        const selectedIds = selectedTechPoints.join(',');
                        navigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${selectedIds}`);
                      }}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无已选择的技术点（点击选择）
                    </div>
                  ) : (
                    configuredResources.techPoints.map((techPoint) => (
                      <div
                        key={techPoint.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {techPoint.name}
                          </h4>
                          {techPoint.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {techPoint.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <button
                            onClick={() => {
                              if (confirm(`确定要移除技术点"${techPoint.name}"吗？`)) {
                                toggleTechPoint(techPoint.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 已上传的文件 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    已上传文件 ({configuredResources.files.length})
                  </h3>
                  <button
                    onClick={() => setShowFileUploadModal(true)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="追加文件"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.files.length === 0 ? (
                    <div 
                      onClick={() => setShowFileUploadModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无已上传的文件（点击上传）
                    </div>
                  ) : (
                    configuredResources.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {file.title}
                            </h4>
                          </div>
                          {file.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {file.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(file.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <button
                            onClick={async () => {
                              if (confirm(`确定要删除文件"${file.title}"吗？`)) {
                                await handleDeleteSource(file.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 已选择的知识点 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    已选择知识点 ({configuredResources.knowledgePoints.length})
                  </h3>
                  <button
                    onClick={() => setShowKnowledgePointModal(true)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="追加知识点"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.knowledgePoints.length === 0 ? (
                    <div
                      onClick={() => setShowPublicKnowledgeModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无关联公共知识库（点击选择）
                    </div>
                  ) : (
                    configuredResources.knowledgePoints.map((knowledgePoint) => (
                      <div
                        key={knowledgePoint.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {knowledgePoint.title}
                          </h4>
                          {knowledgePoint.content && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {knowledgePoint.content}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <button
                            onClick={() => {
                              if (confirm(`确定要移除知识点"${knowledgePoint.title}"吗？`)) {
                                toggleKnowledgePoint(knowledgePoint.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 互联网信息点 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    互联网信息点 ({configuredResources.internetInfo.length})
                  </h3>
                  <button
                    onClick={() => setShowInternetInfoModal(true)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="追加互联网信息"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.internetInfo.length === 0 ? (
                    <div 
                      onClick={() => setShowInternetInfoModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无互联网信息点（点击添加）
                    </div>
                  ) : (
                    configuredResources.internetInfo.map((info) => (
                      <div
                        key={info.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {info.title}
                            </h4>
                          </div>
                          {info.url && (
                            <a
                              href={info.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 truncate block mt-1"
                            >
                              {info.url}
                            </a>
                          )}
                          {info.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {info.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(info.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <button
                            onClick={async () => {
                              if (confirm(`确定要删除互联网信息"${info.title}"吗？`)) {
                                await handleDeleteSource(info.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 分割线和技术转译按钮 */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    onClick={handleTechnicalTranslation}
                    disabled={isTranslating}
                    className="flex-1 px-4 py-3 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-400 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileCode className="w-5 h-5" />
                    <span>{isTranslating ? '转译中...' : '技术转译'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setReviewContent(translatedContent);
                      setShowReviewModal(true);
                    }}
                    disabled={!translatedContent || isTranslating}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>审查</span>
                  </button>
                </div>
                {translatedContent && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">转译结果：</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {translatedContent}
                      </pre>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(translatedContent);
                        alert('内容已复制到剪贴板');
                      }}
                      className="mt-3 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      复制内容
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 进入AI辅助共创功能框 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">进入AI辅助共创：</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigateToAIPage('tech-strategy')}
                  disabled={isSummarizingConversation}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-lg font-medium transition-colors text-left flex items-center justify-between"
                >
                  <span>技术策略</span>
                  {isSummarizingConversation && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
                <button
                  onClick={() => handleNavigateToAIPage('tech-package')}
                  disabled={isSummarizingConversation}
                  className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-lg font-medium transition-colors text-left flex items-center justify-between"
                >
                  <span>技术包装</span>
                  {isSummarizingConversation && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>


      {/* 上传文件弹窗 */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">上传文件</h2>
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRefModal.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500');
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500');
                  await handleFileUpload(e.dataTransfer.files);
                  // 上传完成后再关闭弹窗
                  setShowFileUploadModal(false);
                }}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  点击或拖拽文件到此处上传
                </p>
                <p className="text-sm text-gray-500">
                  支持 PDF, DOC, DOCX, TXT, MD, 图片等格式
                </p>
                <input
                  ref={fileInputRefModal}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    await handleFileUpload(e.target.files);
                    // 上传完成后再关闭弹窗
                    setShowFileUploadModal(false);
                  }}
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
                />
              </div>
              {isUploading && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  上传中...
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFileUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 知识点选择弹窗 */}
      {showKnowledgePointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">知识点选择</h2>
              <button
                onClick={() => setShowKnowledgePointModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTechPoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">请先选择技术点</p>
                  <button
                    onClick={() => {
                      setShowKnowledgePointModal(false);
                      // 跳转到技术点库页面进行选择
                      const returnUrl = `/project/${projectId}/resources`;
                      const selectedIds = selectedTechPoints.join(',');
                      navigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${selectedIds}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    选择技术点
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索知识点..."
                      value={knowledgeBaseSearch}
                      onChange={(e) => setKnowledgeBaseSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredKnowledgePoints.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 text-sm">
                        {knowledgeBaseSearch ? '未找到匹配的知识点' : '暂无知识点'}
                      </div>
                    ) : (
                      filteredKnowledgePoints.map((knowledgePoint) => (
                        <div
                          key={knowledgePoint.id}
                          onClick={() => toggleKnowledgePoint(knowledgePoint.id)}
                          className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedKnowledgePoints.includes(knowledgePoint.id)
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {knowledgePoint.title}
                              </h3>
                              {selectedKnowledgePoints.includes(knowledgePoint.id) && (
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            {knowledgePoint.content && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {knowledgePoint.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedKnowledgePoints.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">
                        已选择 {selectedKnowledgePoints.length} 个知识点
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowKnowledgePointModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 互联网信息点弹窗 */}
      {showInternetInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">检索信息</h2>
              <button
                onClick={() => {
                  setShowInternetInfoModal(false);
                  setInternetInfoSearchQuery('');
                  setWebSearchQuery('');
                  setWebSearchResults([]);
                  setSelectedSearchResults(new Set());
                  setInternetInfoTab('web');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setInternetInfoTab('web')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  internetInfoTab === 'web'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Web Search
              </button>
              <button
                onClick={() => setInternetInfoTab('search')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  internetInfoTab === 'search'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                检索信息
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {internetInfoTab === 'search' ? (
                // 检索信息 Tab
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    输入需要检索的信息，AI将自动检索并补充相关信息作为来源
                  </p>
                  <textarea
                    value={internetInfoSearchQuery}
                    onChange={(e) => setInternetInfoSearchQuery(e.target.value)}
                    placeholder="请输入需要检索的信息，例如：iPhone 15 Pro Max 技术规格、最新市场趋势等"
                    className="w-full min-h-[300px] px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                    required
                  />
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>说明：</strong>此功能将创建一个检索信息来源，AI会在对话时自动检索并补充相关信息。
                    </p>
                  </div>
                </>
              ) : (
                // Web Search Tab
                <>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webSearchQuery}
                        onChange={(e) => setWebSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleWebSearch();
                          }
                        }}
                        placeholder="请输入搜索关键词，例如：阿里巴巴2024年的ESG报告"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleWebSearch}
                        disabled={isSearching || !webSearchQuery.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            搜索中...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            搜索
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      使用博查AI搜索全网网页信息和链接，结果准确、摘要完整
                    </p>
                  </div>

                  {/* 搜索结果列表 */}
                  {webSearchResults.length > 0 && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          找到 {webSearchResults.length} 个结果
                        </p>
                        {selectedSearchResults.size > 0 && (
                          <p className="text-sm text-blue-600">
                            已选择 {selectedSearchResults.size} 个
                          </p>
                        )}
                      </div>
                      {webSearchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => toggleSearchResult(index)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedSearchResults.has(index)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedSearchResults.has(index)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedSearchResults.has(index) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                                {result.name}
                              </h3>
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-blue-600 hover:text-blue-800 truncate block mb-2"
                              >
                                {result.displayUrl || result.url}
                              </a>
                              {result.snippet && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {result.snippet}
                                </p>
                              )}
                              {result.summary && (
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {result.summary}
                                </p>
                              )}
                              {result.siteName && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {result.siteName}
                                  {result.datePublished && ` · ${new Date(result.datePublished).toLocaleDateString()}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isSearching && webSearchResults.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">正在搜索...</span>
                    </div>
                  )}

                  {!isSearching && webSearchResults.length === 0 && webSearchQuery && (
                    <div className="text-center py-12 text-gray-500">
                      未找到相关结果
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowInternetInfoModal(false);
                  setInternetInfoSearchQuery('');
                  setWebSearchQuery('');
                  setWebSearchResults([]);
                  setSelectedSearchResults(new Set());
                  setInternetInfoTab('web');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              {internetInfoTab === 'search' ? (
                <button
                  onClick={handleAddInternetInfo}
                  disabled={isAddingInternetInfo || !internetInfoSearchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingInternetInfo ? '添加中...' : '插入'}
                </button>
              ) : (
                <button
                  onClick={handleSaveWebSearchResults}
                  disabled={isAddingInternetInfo || selectedSearchResults.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingInternetInfo ? '添加中...' : `添加选中结果 (${selectedSearchResults.size})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 公共知识库文件选择弹窗 */}
      {showPublicKnowledgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">从公共知识库选择文件</h2>
              <button
                onClick={() => setShowPublicKnowledgeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文件..."
                  value={publicFileSearch}
                  onChange={(e) => setPublicFileSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPublicFiles.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    {publicFileSearch ? '未找到匹配的文件' : '暂无文件'}
                  </div>
                ) : (
                  filteredPublicFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => togglePublicFile(file.id)}
                      className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedPublicFiles.includes(file.id)
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </h3>
                          {selectedPublicFiles.includes(file.id) && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        {file.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {file.description}
                          </p>
                        )}
                        {file.file_url && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {file.file_url}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedPublicFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    已选择 {selectedPublicFiles.length} 个文件
                  </p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPublicKnowledgeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 审查弹窗 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">审查转译内容</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-hidden p-6">
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                placeholder="在此编辑转译内容..."
              />
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveReview}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录模态框 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">历史记录</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">加载中...</span>
                </div>
              ) : (
                (() => {
                  const grouped = groupedHistoryRecords();
                  const categoryOrder = ['ai-qa-summary', 'tech-package-qa', 'tech-strategy-qa', 'tech-article-qa', 'technical-translation'];
                  const hasRecords = categoryOrder.some(cat => grouped[cat] && grouped[cat].length > 0);

                  if (!hasRecords) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>暂无历史记录</p>
                        <p className="text-sm mt-2">开始使用AI问答、技术包装、技术策略或技术通稿功能，历史记录将显示在这里</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {categoryOrder.map(category => {
                        const records = grouped[category] || [];
                        if (records.length === 0) return null;

                        const categoryName = getCategoryDisplayName(category as SourceCategory);
                        const Icon = getCategoryIcon(category as SourceCategory);

                        return (
                          <div key={category} className="border border-gray-200 rounded-lg">
                            {/* 分类标题 */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
                              <div className="text-blue-600">{Icon}</div>
                              <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
                              <span className="ml-2 text-sm text-gray-500">({records.length})</span>
                            </div>

                            {/* 记录列表 */}
                            <div className="divide-y divide-gray-200">
                              {records.map((record) => (
                                <div
                                  key={record.id}
                                  className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                                        {record.title}
                                      </h4>
                                      {record.description && (
                                        <div className="text-xs text-gray-600 mb-2 line-clamp-3">
                                          {record.description.length > 200
                                            ? record.description.substring(0, 200) + '...'
                                            : record.description}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>{formatDate(record.created_at)}</span>
                                        {record.url && (
                                          <a
                                            href={record.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                                          >
                                            {record.url}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {/* 提炼为技术点按钮 */}
                                      {getSourceCategory(record) === 'ai-qa-summary' && (
                                        <button
                                          onClick={() => handleExtractTechPoint(record)}
                                          disabled={extractingTechPoint}
                                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                          title="提炼为技术点"
                                        >
                                          {extractingTechPoint && extractingSourceId === record.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Sparkles className="w-4 h-4" />
                                          )}
                                        </button>
                                      )}
                                      {/* 删除按钮 */}
                                      <button
                                        onClick={async () => {
                                          if (confirm('确定要删除这条历史记录吗？')) {
                                            await handleDeleteSource(record.id);
                                            // 删除后重新加载历史记录
                                            await loadHistoryRecords();
                                          }
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 技术点预览和保存弹窗 */}
      {showTechPointPreview && extractedTechPointData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">技术点预览 - AI提炼结果</h2>
              <button
                onClick={() => {
                  setShowTechPointPreview(false);
                  setExtractedTechPointData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full flex flex-col space-y-4">
                {/* 基本信息预览 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">技术名称</label>
                    <input
                      type="text"
                      value={extractedTechPointData.name || ''}
                      onChange={(e) => setExtractedTechPointData({...extractedTechPointData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">技术类型</label>
                    <select
                      value={extractedTechPointData.tech_type || 'feature'}
                      onChange={(e) => setExtractedTechPointData({...extractedTechPointData, tech_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="feature">特性</option>
                      <option value="improvement">改进</option>
                      <option value="innovation">创新</option>
                      <option value="technology">技术</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={extractedTechPointData.description || ''}
                    onChange={(e) => setExtractedTechPointData({...extractedTechPointData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* JSON预览 */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">完整JSON数据</label>
                    <button
                      onClick={() => {
                        const jsonStr = JSON.stringify(extractedTechPointData, null, 2);
                        navigator.clipboard.writeText(jsonStr);
                        alert('JSON已复制到剪贴板');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>复制JSON</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(extractedTechPointData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTechPointPreview(false);
                  setExtractedTechPointData(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    try {
                      // 转换数据格式以匹配API要求
                      // 注意：API字段名是tech_type，不是type
                      const techPointFormData: any = {
                        name: extractedTechPointData.name || '未命名技术',
                        description: extractedTechPointData.description || '',
                        category_id: extractedTechPointData.category_id || null,
                        tech_type: extractedTechPointData.tech_type || 'feature',
                        priority: extractedTechPointData.priority || 'medium',
                        status: extractedTechPointData.status || 'draft',
                        level: extractedTechPointData.level || 1,
                        // 扩展字段
                        tags: Array.isArray(extractedTechPointData.keywords) 
                          ? extractedTechPointData.keywords 
                          : (extractedTechPointData.keywords ? [extractedTechPointData.keywords] : []),
                        technical_details: extractedTechPointData.technical_details || {},
                        benefits: Array.isArray(extractedTechPointData.benefits) 
                          ? extractedTechPointData.benefits 
                          : [],
                        applications: Array.isArray(extractedTechPointData.applications) 
                          ? extractedTechPointData.applications 
                          : [],
                        keywords: Array.isArray(extractedTechPointData.keywords) 
                          ? extractedTechPointData.keywords 
                          : [],
                      };

                      // 验证必填字段
                      if (!techPointFormData.name || techPointFormData.name.trim() === '') {
                        alert('技术名称不能为空');
                        return;
                      }

                      console.log('[提炼技术点] 准备保存的数据:', techPointFormData);

                      // 调用创建技术点API（使用后端API直接调用，因为techPointService可能字段不完整）
                      const response = await api.post('/tech-points', techPointFormData);
                      
                      if (response.data.success) {
                        alert('技术点创建成功！');
                        setShowTechPointPreview(false);
                        setExtractedTechPointData(null);
                        // 可选：跳转到技术点管理页面或刷新技术点列表
                      } else {
                        alert(`创建失败: ${response.data.message || response.data.error || '未知错误'}`);
                      }
                    } catch (error: any) {
                      console.error('保存技术点失败:', error);
                      const errorMessage = error.response?.data?.message 
                        || error.response?.data?.error 
                        || error.message 
                        || '未知错误';
                      alert(`保存失败: ${errorMessage}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>保存为技术点</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectResourcesPage;
