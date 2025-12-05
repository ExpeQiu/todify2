import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Search, X, FileText, Trash2, Check, ChevronDown, FileCode, Eye, Save, Send, Loader2, User, Bot, Brain, History, MessageSquare, Package, Target, Newspaper } from 'lucide-react';
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
import { workflowAPI } from '../services/api';
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
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadSources();
      loadTechPoints();
      loadPublicKnowledgeFiles();
      checkHistoryRecords(); // 检查历史记录
    }
  }, [projectId]);

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

      setAiMessages((prev) => [...prev, aiMessage]);
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
      return s.type === 'external' && s.url && !s.url.startsWith('http') && !s.url.startsWith('https');
    });
    // 互联网信息点：排除上传的文件，只包含真正的互联网信息（http/https链接或文本来源）
    const internetInfo = sources.filter(s => {
      // 排除上传的文件（URL是文件路径的）
      if (s.url && !s.url.startsWith('http') && !s.url.startsWith('https')) {
        return false;
      }
      // 包含http/https链接的来源，或者没有URL的文本来源（通过检索信息添加的）
      return true;
    });
    
    setConfiguredResources({
      files: files,
      internetInfo: internetInfo,
      techPoints: techPoints.filter(tp => selectedTechPoints.includes(tp.id)),
      knowledgePoints: knowledgePoints.filter(kp => selectedKnowledgePoints.includes(kp.id))
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
      // 获取项目的来源信息
      const response = await api.get('/source-information', {
        params: {
          pageType: `project-${projectId}`,
          page: 1,
          pageSize: 100
        }
      });
      if (response.data.success && response.data.data) {
        setSources(response.data.data);
      }
    } catch (error) {
      console.error('加载来源信息失败:', error);
    }
  };

  // 检查历史记录（用于决定显示哪个视图）
  const checkHistoryRecords = async () => {
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
        // 如果有历史记录，显示历史记录视图；否则显示AI共创视图
        setShowHistoryView(filtered.length > 0);
      } else {
        setShowHistoryView(false);
      }
    } catch (error) {
      console.error('检查历史记录失败:', error);
      setShowHistoryView(false);
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
      // 上传文件
      const uploadedFiles = await aiSearchService.uploadFiles(fileArray, undefined);
      
      // 创建来源信息记录
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
        
        await api.post('/source-information', {
          source_id: uploadedFile.id || uploadedFile.fileId || `file_${Date.now()}`,
          title: uploadedFile.name,
          type: 'external',
          url: uploadedFile.url,
          description: description,
          page_type: `project-${projectId}`,
          conversation_id: null
        });
      }
      
      // 重新加载来源列表
      await loadSources();
      
      // 清空文件输入
      if (fileInputRefModal.current) {
        fileInputRefModal.current.value = '';
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
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
      setSelectedPublicFiles(prev => prev.filter(id => id !== fileId));
    } else {
      setSelectedPublicFiles(prev => [...prev, fileId]);
      // 将选中的公共知识库文件添加到项目来源中
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
  const summarizeAndSaveConversation = async (targetPageType: 'tech-strategy' | 'tech-package'): Promise<string | null> => {
    // 如果没有对话内容，直接返回 null
    if (aiMessages.length === 0) {
      return null;
    }

    setIsSummarizingConversation(true);
    try {
      // 构建对话文本
      const conversationText = aiMessages.map((msg) => {
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
        summaryTitle = aiMessages.length > 0 
          ? `项目对话摘要（${aiMessages.length}条消息）`
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
        targetPageType,
        aiConversationId || undefined
      );

      if (saveResult.success && saveResult.data) {
        console.log('[ProjectResources] 对话摘要已保存:', {
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
          pageType: targetPageType
        });
        return saveResult.data.source_id;
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
              <div className="flex items-center space-x-3">
                {showHistoryView ? (
                  <button
                    onClick={handleSwitchToAICreation}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Brain className="w-4 h-4" />
                    <span>AI共创</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSwitchToHistory}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <History className="w-4 h-4" />
                    <span>历史记录</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                  className="ml-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  已选择技术点 ({configuredResources.techPoints.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.techPoints.length === 0 ? (
                    <div 
                      onClick={() => setShowTechPointModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无已选择的技术点
                    </div>
                  ) : (
                    configuredResources.techPoints.map((techPoint) => (
                      <div
                        key={techPoint.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
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
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 已上传的文件 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  已上传文件 ({configuredResources.files.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.files.length === 0 ? (
                    <div 
                      onClick={() => setShowFileUploadModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无已上传的文件
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
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 已选择的知识点 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  已选择知识点 ({configuredResources.knowledgePoints.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.knowledgePoints.length === 0 ? (
                    <div 
                      onClick={() => setShowKnowledgePointModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无已选择的知识点
                    </div>
                  ) : (
                    configuredResources.knowledgePoints.map((knowledgePoint) => (
                      <div
                        key={knowledgePoint.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
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
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 互联网信息点 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  互联网信息点 ({configuredResources.internetInfo.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {configuredResources.internetInfo.length === 0 ? (
                    <div 
                      onClick={() => setShowInternetInfoModal(true)}
                      className="text-center text-gray-400 py-4 text-sm cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      暂无互联网信息点
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
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
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

      {/* 技术点选择弹窗 */}
      {showTechPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">关联技术点信息选择</h2>
              <button
                onClick={() => setShowTechPointModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative" ref={techPointSelectorRef}>
                <button
                  onClick={() => setShowTechPointSelector(!showTechPointSelector)}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">
                    {selectedTechPoints.length > 0
                      ? `已选择 ${selectedTechPoints.length} 个技术点`
                      : '选择技术点'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTechPointSelector ? 'transform rotate-180' : ''}`} />
                </button>
                {showTechPointSelector && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="搜索技术点..."
                        value={techPointSearch}
                        onChange={(e) => setTechPointSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredTechPoints.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          未找到技术点
                        </div>
                      ) : (
                        filteredTechPoints.map((techPoint) => (
                          <div
                            key={techPoint.id}
                            onClick={() => toggleTechPoint(techPoint.id)}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {techPoint.name}
                              </h3>
                              {techPoint.description && (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                  {techPoint.description}
                                </p>
                              )}
                            </div>
                            {selectedTechPoints.includes(techPoint.id) && (
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedTechPoints.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTechPoints.map((techPointId) => {
                    const techPoint = techPoints.find(tp => tp.id === techPointId);
                    return techPoint ? (
                      <span
                        key={techPointId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {techPoint.name}
                        <button
                          onClick={() => toggleTechPoint(techPointId)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTechPointModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

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
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500');
                  handleFileUpload(e.dataTransfer.files);
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
                  onChange={(e) => {
                    handleFileUpload(e.target.files);
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
                      setShowTechPointModal(true);
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">检索信息</h2>
              <button
                onClick={() => setShowInternetInfoModal(false)}
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
                  placeholder="搜索来源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSources.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {searchQuery ? '未找到匹配的来源' : '暂无来源'}
                  </div>
                ) : (
                  filteredSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <h3 className="text-sm font-medium text-gray-900 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {source.title}
                          </h3>
                        </div>
                        {source.description && (
                          <div className="text-xs text-gray-500 line-clamp-2 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {(() => {
                              let displayText = source.description;
                              if (displayText.includes('\n')) {
                                displayText = displayText.split('\n').slice(0, 2)
                                  .map(line => line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim())
                                  .filter(line => line.length > 0)
                                  .join(' ');
                              }
                              if (displayText.length > 150) {
                                displayText = displayText.substring(0, 150) + '...';
                              }
                              return displayText;
                            })()}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(source.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowInternetInfoModal(false)}
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
                                    <button
                                      onClick={async () => {
                                        if (confirm('确定要删除这条历史记录吗？')) {
                                          await handleDeleteSource(record.id);
                                          // 删除后重新加载历史记录
                                          await loadHistoryRecords();
                                        }
                                      }}
                                      className="ml-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
    </div>
  );
};

export default ProjectResourcesPage;
