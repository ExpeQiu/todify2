/**
 * 基础AI搜索页面组件
 * 包含所有通用逻辑，通过配置来区分不同页面的行为
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import TopNavigation from "../TopNavigation";
import SourceSidebar, { Source } from "./SourceSidebar";
import DialogueContent from "./DialogueContent";
import StudioSidebar from "./StudioSidebar";
import FieldMappingConfig from "./FieldMappingConfig";
import { Conversation, OutputContent, WorkflowConfig, FieldMappingConfig as FieldMappingConfigType } from "../../types/aiSearch";
import { aiSearchService } from "../../services/aiSearchService";
import { agentWorkflowService } from "../../services/agentWorkflowService";
import { AgentWorkflow } from "../../types/agentWorkflow";
import { PageConfig } from "../../configs/pageConfigs";
import { pageToolConfigService } from "../../services/pageToolConfigService";
import sourceService, { SourceCategory } from "../../services/sourceService";
import { projectService } from "../../services/projectService";
import { Project } from "../../types/project";

const MESSAGE_PAGE_SIZE = 30;
const WORKFLOW_DEFAULT_KEY = "__default__";

const areArraysEqual = (a: string[] | undefined, b: string[] | undefined) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every(item => setA.has(item));
};

const areObjectsEqual = (a: Record<string, string>, b: Record<string, string>) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

interface BaseAISearchPageProps {
  config: PageConfig;
  embeddedMode?: boolean;      // 是否嵌入模式
  projectId?: string;           // 项目ID（嵌入模式必需）
  hideTopNavigation?: boolean;  // 是否隐藏顶部导航
}

const BaseAISearchPage: React.FC<BaseAISearchPageProps> = ({ 
  config, 
  embeddedMode = false,
  projectId: propProjectId,
  hideTopNavigation = false 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  // 追踪当前对话中已发送给 Dify 的来源 ID，避免重复发送
  const [sentSourceIds, setSentSourceIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [outputs, setOutputs] = useState<OutputContent[]>([]);
  const [showSourceSidebar, setShowSourceSidebar] = useState(true); // 默认显示左侧边栏
  const [showStudioSidebar, setShowStudioSidebar] = useState(config.pageType === 'tech-package'); // tech-package 页面默认显示右侧边栏（工具箱和聊天历史）
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [showFieldMappingConfig, setShowFieldMappingConfig] = useState(false);
  const [triggeringFeatureId, setTriggeringFeatureId] = useState<string | null>(null);
  const [triggeringStatus, setTriggeringStatus] = useState<string | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<AgentWorkflow[]>([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [contextWindowSize, setContextWindowSize] = useState<number>(10);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalErrorDetail, setGlobalErrorDetail] = useState<string | null>(null);
  const [enabledToolIds, setEnabledToolIds] = useState<string[] | undefined>(config.enabledToolIds);
  const [dynamicLabelMap, setDynamicLabelMap] = useState<Record<string, string>>({});
  const [project, setProject] = useState<Project | null>(null);
  const triggerStatusTimerRef = useRef<number | null>(null);
  const workflowSelectionRef = useRef<Record<string, string>>({});
  
  // 使用 ref 来追踪 currentConversation，避免 loadConversations 循环依赖导致无限请求
  const currentConversationRef = useRef(currentConversation);
  
  // 使用 ref 来追踪是否正在加载来源信息，防止重复请求
  const isLoadingSourcesRef = useRef(false);
  const sourcesRef = useRef<Source[]>([]);
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);
  
  // 同步 sources 到 ref
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  const loadWorkflowSelectionFromStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(config.workflowSelectionKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("解析工作流选择缓存失败:", error);
      return {};
    }
  }, [config.workflowSelectionKey]);

  const persistWorkflowSelection = useCallback(
    (workflowId: string, conversationId?: string | null) => {
      if (!workflowId) return;
      const map = {
        ...workflowSelectionRef.current,
        [conversationId || WORKFLOW_DEFAULT_KEY]: workflowId,
        [WORKFLOW_DEFAULT_KEY]: workflowId,
      };
      workflowSelectionRef.current = map;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(config.workflowSelectionKey, JSON.stringify(map));
        } catch (error) {
          console.warn("保存工作流选择缓存失败:", error);
        }
      }
    },
    [config.workflowSelectionKey]
  );

  useEffect(() => {
    workflowSelectionRef.current = loadWorkflowSelectionFromStorage();
  }, [loadWorkflowSelectionFromStorage]);

  const clearGlobalError = useCallback(() => {
    setGlobalError(null);
    setGlobalErrorDetail(null);
  }, []);

  const reportError = useCallback((message: string, detail?: unknown) => {
    setGlobalError(message);
    if (!detail) {
      setGlobalErrorDetail(null);
      return;
    }

    if (typeof detail === "string") {
      setGlobalErrorDetail(detail);
      return;
    }

    if (detail instanceof Error) {
      setGlobalErrorDetail(detail.message);
      return;
    }

    try {
      setGlobalErrorDetail(JSON.stringify(detail));
    } catch {
      setGlobalErrorDetail(String(detail));
    }
  }, []);

  const updateTriggerStatus = (message: string | null, duration = 0) => {
    if (triggerStatusTimerRef.current) {
      window.clearTimeout(triggerStatusTimerRef.current);
      triggerStatusTimerRef.current = null;
    }

    setTriggeringStatus(message);

    if (message && duration > 0) {
      triggerStatusTimerRef.current = window.setTimeout(() => {
        setTriggeringStatus(null);
        triggerStatusTimerRef.current = null;
      }, duration);
    }
  };

  // 获取项目ID和是否创建新对话的标志
  // 嵌入模式：从props读取；独立模式：从URL参数读取
  const projectId = embeddedMode ? propProjectId : searchParams.get('projectId');
  const shouldCreateNewConversation = searchParams.get('newConversation') === 'true';
  
  // 加载项目信息
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          try {
            const result = await projectService.getProjectById(projectIdNum);
            if (result.success && result.data) {
              setProject(result.data);
            }
          } catch (error) {
            console.error('加载项目信息失败:', error);
          }
        }
      } else {
        setProject(null);
      }
    };
    loadProject();
  }, [projectId]);
  
  // 计算有效的 pageType（包含项目ID，用于项目隔离）
  // 规则：如果有 projectId，则是 {pageType}-project-{projectId}，否则使用 config.pageType
  const effectivePageType = useMemo(() => {
    return projectId ? `${config.pageType}-project-${projectId}` : config.pageType;
  }, [projectId, config.pageType]);
  
  // 根据项目ID调整 pageType，确保不同项目的对话相互独立
  // 项目隔离规则：
  // 加载来源信息（根据是否有 projectId 选择不同的查询方式）
  const loadPageTypeSources = useCallback(async () => {
    // 防止重复请求
    if (isLoadingSourcesRef.current) {
      console.log('[SourceInfo] 正在加载中，跳过重复请求');
      return;
    }
    
    isLoadingSourcesRef.current = true;
    try {
      let sourceResult;
      
      if (projectId) {
        // 如果有项目ID，使用项目级查询
        console.log('[SourceInfo] 开始加载项目来源信息:', projectId);
        sourceResult = await sourceService.loadSourceInformationByProjectId(projectId);
      } else {
        // 如果没有项目ID，使用页面类型查询
        console.log('[SourceInfo] 开始加载页面类型来源信息:', config.pageType);
        sourceResult = await sourceService.loadSourceInformationByPageType(config.pageType);
      }
      
      console.log('[SourceInfo] 加载结果:', {
        success: sourceResult.success,
        count: sourceResult.data?.length || 0,
        error: sourceResult.error
      });
      
      if (sourceResult.success && sourceResult.data && sourceResult.data.length > 0) {
        console.log('[SourceInfo] 加载到的来源:', sourceResult.data.map(s => ({ id: s.id, title: s.title })));
        setSources(prev => {
          // 只保留文件来源（file_开头的），然后添加当前页面的来源
          // 这样可以确保切换页面时只显示当前页面的来源
          const fileSources = prev.filter(s => s.id.startsWith('file_'));
          const pageTypeSources = sourceResult.data!;
          
          // 合并文件来源和页面类型来源
          const sourceMap = new Map<string, Source>();
          fileSources.forEach(s => sourceMap.set(s.id, s));
          pageTypeSources.forEach(s => sourceMap.set(s.id, s));
          
          const merged = Array.from(sourceMap.values());
          console.log('[SourceInfo] 合并后的来源数量:', merged.length, {
            fileSources: fileSources.length,
            pageTypeSources: pageTypeSources.length
          });
          sourcesRef.current = merged;
          return merged;
        });
      } else if (sourceResult.error) {
        console.warn('[SourceInfo] 加载失败:', sourceResult.error);
        // 即使加载失败，也要清除其他页面的来源，只保留文件来源
        setSources(prev => {
          const filtered = prev.filter(s => s.id.startsWith('file_'));
          sourcesRef.current = filtered;
          return filtered;
        });
      } else {
        console.log('[SourceInfo] 没有找到来源信息');
        // 没有找到来源时，只保留文件来源
        setSources(prev => {
          const filtered = prev.filter(s => s.id.startsWith('file_'));
          sourcesRef.current = filtered;
          return filtered;
        });
      }
    } catch (error) {
      console.error("[SourceInfo] 加载来源信息失败:", error);
      // 不阻止页面加载，只记录错误
    } finally {
      isLoadingSourcesRef.current = false;
    }
  }, [projectId, config.pageType]);

  // 检查 URL 参数中的 sourceId 并自动选中（支持多个 sourceId）
  useEffect(() => {
    const urlSourceIds = searchParams.getAll('sourceId'); // 获取所有的 sourceId 参数
    if (urlSourceIds.length === 0) {
      return;
    }
    
    // 使用 ref 获取最新的 sources，避免依赖 sources 导致循环
    const currentSources = sourcesRef.current;
    console.log('[SourceInfo] 检测到 URL 参数中的 sourceIds:', urlSourceIds, '当前来源数量:', currentSources.length);
    
    // 如果来源列表为空，可能需要等待加载，先不处理
    if (currentSources.length === 0) {
      console.log('[SourceInfo] 来源列表为空，等待加载...');
      // 如果正在加载，等待加载完成；否则触发一次加载
      if (!isLoadingSourcesRef.current) {
        setTimeout(() => {
          loadPageTypeSources();
        }, 500);
      }
      return;
    }
    
    const newSelectedIds: string[] = [];
    let hasNewSelection = false;
    const missingSourceIds: string[] = [];
    
    // 检查每个 sourceId 是否存在于来源中，并添加到选中列表
    urlSourceIds.forEach(sourceId => {
      const foundSource = currentSources.find(s => s.id === sourceId);
      if (foundSource) {
        console.log('[SourceInfo] 找到匹配的来源，自动选中:', foundSource.title);
        newSelectedIds.push(sourceId);
        hasNewSelection = true;
      } else {
        console.warn('[SourceInfo] URL 参数中的 sourceId 不存在于加载的来源中:', sourceId);
        missingSourceIds.push(sourceId);
      }
    });
    
    // 如果有新的选中项，更新选中列表
    if (hasNewSelection) {
      setSelectedSourceIds(prev => {
        const combined = [...prev];
        newSelectedIds.forEach(id => {
          if (!combined.includes(id)) {
            combined.push(id);
          }
        });
        return combined;
      });
      
      // 清除 URL 参数，避免刷新时重复选中
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('sourceId');
      setSearchParams(newSearchParams, { replace: true });
    } else if (missingSourceIds.length > 0) {
      // 如果所有 sourceId 都不存在，可能是新保存的来源还未加载
      // 等待一段时间后重新加载页面类型的来源（但只加载一次）
      console.log('[SourceInfo] 等待新保存的来源加载...');
      if (!isLoadingSourcesRef.current) {
        setTimeout(async () => {
          await loadPageTypeSources();
        }, 500);
      }
    }
  }, [searchParams, setSearchParams, loadPageTypeSources]);

  const loadFiles = useCallback(async () => {
    try {
      try {
        const cleanupApi = await import("../../services/api");
        await cleanupApi.default.delete('/ai-search/files/garbled/cleanup');
      } catch (error) {
        console.warn('清理乱码文件失败:', error);
      }

      // 使用有效的 pageType（可能包含项目ID）
      const files = await aiSearchService.getFiles({ pageType: effectivePageType as any });
      const fileSources: Source[] = files.map((file) => ({
        id: `file_${file.id || file.fileId}`,
        title: file.name,
        type: 'external' as const,
        url: file.url,
        description: `文件大小: ${formatFileSize(file.size)}`,
      }));
      
      setSources((prev) => {
        // 保留非文件来源（页面类型的来源），然后添加当前页面的文件来源
        const nonFileSources = prev.filter((s) => !s.id.startsWith('file_'));
        return [...nonFileSources, ...fileSources];
      });
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  }, [effectivePageType]);

  // 使用 ref 追踪是否已初始化，避免重复初始化
  const isInitializedRef = useRef(false);
  
  // 加载对话历史和输出内容（仅在组件挂载时执行一次）
  useEffect(() => {
    // 如果已经初始化过，跳过（除非页面类型或项目ID变化，那会由另一个useEffect处理）
    if (isInitializedRef.current) {
      return;
    }
    
    isInitializedRef.current = true;
    
    // 如果 URL 中有 newConversation 参数，清除当前对话，确保创建新对话
    if (shouldCreateNewConversation && currentConversation) {
      console.log('[ConversationDebug] 检测到 newConversation 参数，清除当前对话');
      setCurrentConversation(null);
      // 清除 URL 参数，避免刷新时重复清除
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('newConversation');
      setSearchParams(newSearchParams, { replace: true });
    }
    
    loadConversations();
    loadOutputs();
    loadWorkflowConfig();
    loadFiles();
    
    // 加载页面类型的来源信息（始终加载，作为基础来源）
    loadPageTypeSources();
    
    const handleFilesUploaded = () => {
      loadFiles();
    };
    window.addEventListener('filesUploaded', handleFilesUploaded);
    
    return () => {
      window.removeEventListener('filesUploaded', handleFilesUploaded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const loadAvailableWorkflows = useCallback(async () => {
    try {
      setIsWorkflowLoading(true);
      const list = await agentWorkflowService.getAllWorkflows();
      setAvailableWorkflows(list);
    } catch (error) {
      console.error("加载工作流列表失败:", error);
      reportError("加载工作流列表失败", error instanceof Error ? error.message : undefined);
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [reportError]);

  useEffect(() => {
    loadAvailableWorkflows();
  }, [loadAvailableWorkflows]);

  // 使用ref缓存已加载的工具ID列表，避免重复请求
  const cachedToolIdsRef = useRef<Record<string, string[]>>({});
  const cachedMappingsRef = useRef<any[]>([]);
  const isLoadingToolsRef = useRef<boolean>(false);

  // 提取加载工具配置的函数，以便在多个地方调用
  const loadEnabledToolsForPage = useCallback(async (useCache = true) => {
    // 如果正在加载，避免重复请求
    if (isLoadingToolsRef.current && useCache) {
      return;
    }

    // 如果有缓存，先立即使用缓存显示，提升用户体验
    const hasCache = cachedToolIdsRef.current[config.pageType];
    if (useCache && hasCache) {
      const cachedToolIds = cachedToolIdsRef.current[config.pageType];
      console.log('[BaseAISearchPage] 使用缓存工具配置，pageType:', config.pageType, '工具数量:', cachedToolIds.length);
      setEnabledToolIds(prev => areArraysEqual(prev, cachedToolIds) ? prev : cachedToolIds);
      // 如果有缓存的映射配置，也可以使用缓存的标签
      if (cachedMappingsRef.current.length > 0) {
        const pageKeys = config.pageType === 'press-release' 
          ? ['press-release', 'speech'] 
          : [config.pageType];
        const labels: Record<string, string> = {};
        for (const item of cachedMappingsRef.current) {
          const fos = Array.isArray(item.config?.featureObjects) ? item.config.featureObjects : [];
          for (const f of fos) {
            if (f.featureType && f.featureType !== 'ai-dialog') {
              const featurePageType = (f as any).pageType;
              if (featurePageType && pageKeys.includes(featurePageType)) {
                if ((f as any).label && !labels[f.featureType]) {
                  labels[f.featureType] = (f as any).label as string;
                }
              }
            }
          }
        }
        if (Object.keys(labels).length > 0) {
          setDynamicLabelMap(prev => areObjectsEqual(prev, labels) ? prev : labels);
        }
      }
      // 继续在后台更新，但不阻塞UI
    }

    isLoadingToolsRef.current = true;
    try {
      console.log('[BaseAISearchPage] 加载工具配置，pageType:', config.pageType);
      
      // 1. 优先从字段映射配置中加载（字段映射配置是用户实际配置的，应该优先使用）
      const mappings = await aiSearchService.getAllFieldMappingConfigs();
      cachedMappingsRef.current = mappings; // 缓存映射配置
      
      // 向后兼容：支持读取旧数据中的 'speech'，但新数据统一使用 'press-release'
      const pageKeys = config.pageType === 'press-release' 
        ? ['press-release', 'speech'] 
        : [config.pageType];
      console.log('[BaseAISearchPage] 从字段映射配置加载工具，pageKeys:', pageKeys, 'mappings数量:', mappings.length);
      
      const setIds = new Set<string>();
      const labels: Record<string, string> = {};
      
      // 从所有字段映射配置中筛选匹配当前 pageType 的工具项
      // 这样可以聚合所有工作流中配置的该页面的工具
      for (const item of mappings) {
        const fos = Array.isArray(item.config?.featureObjects) ? item.config.featureObjects : [];
        for (const f of fos) {
          // 排除 ai-dialog，检查是否匹配当前页面的 pageType
          if (f.featureType && f.featureType !== 'ai-dialog') {
            const featurePageType = (f as any).pageType;
            // 如果 featureObject 有 pageType，必须匹配当前页面；如果没有 pageType，则不显示（避免显示不相关的工具）
            if (featurePageType && pageKeys.includes(featurePageType)) {
              setIds.add(f.featureType);
              // 如果多个工作流配置了同一个工具，优先使用有 label 的配置
              if ((f as any).label && !labels[f.featureType]) {
                labels[f.featureType] = (f as any).label as string;
              }
            }
          }
        }
      }
      
      // 如果当前工作流有配置，优先使用当前工作流的标签
      if (selectedWorkflowId) {
        const currentMapping = mappings.find(m => m.workflowId === selectedWorkflowId);
        if (currentMapping) {
          const fos = Array.isArray(currentMapping.config?.featureObjects) ? currentMapping.config.featureObjects : [];
          for (const f of fos) {
            if (f.featureType && f.featureType !== 'ai-dialog') {
              const featurePageType = (f as any).pageType;
              if (featurePageType && pageKeys.includes(featurePageType)) {
                if ((f as any).label) {
                  labels[f.featureType] = (f as any).label as string;
                }
              }
            }
          }
        }
      }
      
      console.log('[BaseAISearchPage] 从字段映射配置找到的工具数量:', setIds.size, '工具列表:', Array.from(setIds));
      
      // 如果字段映射配置中有工具，优先使用字段映射配置
      if (setIds.size > 0) {
        const toolIds = Array.from(setIds);
        setEnabledToolIds(prev => areArraysEqual(prev, toolIds) ? prev : toolIds);
        setDynamicLabelMap(prev => areObjectsEqual(prev, labels) ? prev : labels);
        // 缓存工具ID
        cachedToolIdsRef.current[config.pageType] = toolIds;
        return;
      }

      // 2. 如果字段映射配置中没有工具，尝试从数据库加载页面工具配置
      const dbConfig = await pageToolConfigService.getByPageType(config.pageType);
      if (dbConfig && dbConfig.enabledToolIds && dbConfig.enabledToolIds.length > 0) {
        console.log('[BaseAISearchPage] 字段映射配置为空，从数据库配置加载工具:', dbConfig.enabledToolIds);
        setEnabledToolIds(prev => areArraysEqual(prev, dbConfig.enabledToolIds) ? prev : dbConfig.enabledToolIds);
        setDynamicLabelMap(prev => areObjectsEqual(prev, dbConfig.featureLabelMap || {}) ? prev : (dbConfig.featureLabelMap || {}));
        // 缓存工具ID
        cachedToolIdsRef.current[config.pageType] = dbConfig.enabledToolIds;
        return;
      }

      // 3. 如果都没有，回退到使用配置中的默认工具列表
      console.log('[BaseAISearchPage] 未找到字段映射配置和数据库配置，使用默认配置:', config.enabledToolIds);
      const defaultToolIds = config.enabledToolIds || [];
      setEnabledToolIds(prev => areArraysEqual(prev, defaultToolIds) ? prev : defaultToolIds);
      setDynamicLabelMap(prev => areObjectsEqual(prev, {}) ? prev : {});
      // 缓存默认工具ID
      cachedToolIdsRef.current[config.pageType] = defaultToolIds;
    } catch (error) {
      console.error('[BaseAISearchPage] 加载工具配置失败:', error);
      // 出错时也回退到使用配置中的默认工具列表（只有在没有缓存时才设置）
      if (!cachedToolIdsRef.current[config.pageType]) {
        const defaultToolIds = config.enabledToolIds || [];
        setEnabledToolIds(prev => areArraysEqual(prev, defaultToolIds) ? prev : defaultToolIds);
        setDynamicLabelMap(prev => areObjectsEqual(prev, {}) ? prev : {});
        cachedToolIdsRef.current[config.pageType] = defaultToolIds;
      }
    } finally {
      isLoadingToolsRef.current = false;
    }
  }, [config.pageType, config.enabledToolIds, selectedWorkflowId]);

  // 只在pageType改变时加载工具配置（包括API请求）
  useEffect(() => {
    loadEnabledToolsForPage();
  }, [loadEnabledToolsForPage]);

  // 监听页面可见性和焦点变化，当页面重新获得焦点时重新加载工具配置
  // 这样当用户从字段映射管理页面返回时，新添加的工具会自动显示
  useEffect(() => {
    let reloadTimer: number | null = null;
    
    const reloadTools = () => {
      // 清除之前的定时器
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
      // 延迟一小段时间再加载，避免频繁请求
      reloadTimer = window.setTimeout(() => {
        console.log('[BaseAISearchPage] 页面重新获得焦点，重新加载工具配置');
        // 页面重新获得焦点时强制刷新，不使用缓存
        loadEnabledToolsForPage(false);
        reloadTimer = null;
      }, 500);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reloadTools();
      }
    };

    const handleFocus = () => {
      reloadTools();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
    };
  }, [loadEnabledToolsForPage]);

  // 只在selectedWorkflowId改变时更新标签（不重新请求API）
  useEffect(() => {
    if (!selectedWorkflowId || !cachedMappingsRef.current.length) {
      return;
    }

    const updateLabelsForWorkflow = () => {
      const mappings = cachedMappingsRef.current;
      const pageKeys = config.pageType === 'press-release' 
        ? ['press-release', 'speech'] 
        : [config.pageType];
      
      const currentMapping = mappings.find(m => m.workflowId === selectedWorkflowId);
      if (currentMapping) {
        const labels: Record<string, string> = {};
        const fos = Array.isArray(currentMapping.config?.featureObjects) ? currentMapping.config.featureObjects : [];
        
        for (const f of fos) {
          if (f.featureType && f.featureType !== 'ai-dialog') {
            const featurePageType = (f as any).pageType;
            if (featurePageType && pageKeys.includes(featurePageType)) {
              if ((f as any).label) {
                labels[f.featureType] = (f as any).label as string;
              }
            }
          }
        }
        
        // 只有在找到标签时才更新
        if (Object.keys(labels).length > 0) {
          setDynamicLabelMap(prev => ({ ...prev, ...labels }));
        }
      }
    };

    updateLabelsForWorkflow();
  }, [selectedWorkflowId, config.pageType]);

  const handleWorkflowSelectionChange = useCallback(
    (workflowId: string) => {
      if (!workflowId) return;
      setSelectedWorkflowId(workflowId);
      persistWorkflowSelection(workflowId, currentConversation?.id);
    },
    [currentConversation?.id, persistWorkflowSelection]
  );

  // 从字段映射配置中获取该 pageType 的默认工作流
  const [defaultWorkflowFromMapping, setDefaultWorkflowFromMapping] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultWorkflowFromMapping = async () => {
      try {
        const mappings = await aiSearchService.getAllFieldMappingConfigs();
        // 查找该 pageType 对应的第一个工作流（作为默认工作流）
        // 支持向后兼容：press-release 也匹配 speech
        const pageKeys = config.pageType === 'press-release' 
          ? ['press-release', 'speech'] 
          : [config.pageType];
        
        for (const mapping of mappings) {
          const featureObjects = Array.isArray(mapping.config?.featureObjects) 
            ? mapping.config.featureObjects 
            : [];
          
          // 查找第一个匹配当前 pageType 的 featureObject，使用其 workflowId 作为默认工作流
          const matchedFeature = featureObjects.find((f: any) => 
            f.pageType && pageKeys.includes(f.pageType)
          );
          
          if (matchedFeature) {
            const workflowId = matchedFeature.workflowId || mapping.workflowId;
            // 验证工作流是否在可用列表中
            if (availableWorkflows.some(w => w.id === workflowId)) {
              setDefaultWorkflowFromMapping(workflowId);
              console.log(`[BaseAISearchPage] 从字段映射配置找到 ${config.pageType} 的默认工作流:`, workflowId);
              return;
            }
          }
        }
        
        // 如果没有找到匹配的，尝试使用该工作流配置中的第一个工作流
        // 查找所有为该 pageType 配置的工作流，使用第一个
        const allWorkflowsForPage = new Set<string>();
        for (const mapping of mappings) {
          const featureObjects = Array.isArray(mapping.config?.featureObjects) 
            ? mapping.config.featureObjects 
            : [];
          
          const hasMatchingPageType = featureObjects.some((f: any) => 
            f.pageType && pageKeys.includes(f.pageType)
          );
          
          if (hasMatchingPageType) {
            allWorkflowsForPage.add(mapping.workflowId);
          }
        }
        
        // 使用第一个匹配的工作流
        if (allWorkflowsForPage.size > 0) {
          const firstWorkflowId = Array.from(allWorkflowsForPage)[0];
          if (availableWorkflows.some(w => w.id === firstWorkflowId)) {
            setDefaultWorkflowFromMapping(firstWorkflowId);
            console.log(`[BaseAISearchPage] 从字段映射配置找到 ${config.pageType} 的默认工作流（使用工作流配置）:`, firstWorkflowId);
            return;
          }
        }
        
        setDefaultWorkflowFromMapping(null);
      } catch (error) {
        console.error('[BaseAISearchPage] 加载字段映射配置失败:', error);
        setDefaultWorkflowFromMapping(null);
      }
    };

    if (availableWorkflows.length > 0) {
      loadDefaultWorkflowFromMapping();
    }
  }, [config.pageType, availableWorkflows]);

  useEffect(() => {
    const selectionMap = workflowSelectionRef.current;
    const conversationId = currentConversation?.id;

    const workflowIds = new Set(availableWorkflows.map((workflow) => workflow.id));

    const storedForConversation =
      conversationId && workflowIds.has(selectionMap[conversationId] || '')
        ? selectionMap[conversationId]
        : undefined;

    const storedDefault =
      selectionMap[WORKFLOW_DEFAULT_KEY] && workflowIds.has(selectionMap[WORKFLOW_DEFAULT_KEY])
        ? selectionMap[WORKFLOW_DEFAULT_KEY]
        : undefined;

    const configId =
      selectedWorkflowId && workflowIds.has(selectedWorkflowId) ? selectedWorkflowId : undefined;

    // 优先级：对话特定 > 字段映射默认 > 配置ID > 存储的默认 > 第一个可用
    const fallback =
      storedForConversation ||
      (defaultWorkflowFromMapping && workflowIds.has(defaultWorkflowFromMapping) ? defaultWorkflowFromMapping : undefined) ||
      configId ||
      storedDefault ||
      availableWorkflows[0]?.id ||
      null;

    if (fallback && fallback !== selectedWorkflowId) {
      setSelectedWorkflowId(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.id, availableWorkflows, defaultWorkflowFromMapping]);

  useEffect(() => {
    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, currentConversation?.id);
    }
  }, [selectedWorkflowId, currentConversation?.id, persistWorkflowSelection]);

  const loadWorkflowConfig = async () => {
    try {
      const workflowConfig = await aiSearchService.getWorkflowConfig(config.pageType as any);
      setWorkflowConfig(workflowConfig);
    } catch (error) {
      console.error("加载工作流配置失败:", error);
      reportError("加载工作流配置失败", error instanceof Error ? error.message : undefined);
    }
  };

  // 用于防止重复加载的ref
  const loadingConversationRef = useRef<Set<string>>(new Set());
  
  const loadConversationDetail = useCallback(
    async (
      conversationId: string,
      options?: {
        append?: boolean;
        before?: string;
      }
    ) => {
      if (!conversationId) return;
      
      // 如果正在加载同一个对话，且不是追加模式，则跳过
      if (!options?.append && loadingConversationRef.current.has(conversationId)) {
        console.log('[SourceInfo] 跳过重复加载对话:', conversationId);
        return;
      }
      
      // 标记为正在加载
      loadingConversationRef.current.add(conversationId);
      
      try {
        const detail = await aiSearchService.getConversation(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
          before: options?.before,
        });
        if (!detail) {
          return;
        }
        
        // 从数据库加载该对话的来源信息（仅在非追加模式下加载，避免重复）
        if (!options?.append) {
          try {
            console.log('[SourceInfo] 开始加载对话来源信息:', conversationId);
            const sourceResult = await sourceService.loadSourceInformationByConversationId(conversationId);
            console.log('[SourceInfo] 对话来源加载结果:', {
              success: sourceResult.success,
              count: sourceResult.data?.length || 0,
              error: sourceResult.error
            });
            
            const dbSources = sourceResult.success && sourceResult.data ? sourceResult.data : [];
            const conversationSources = detail.sources || [];
            
            // 创建数据库来源的ID集合，用于过滤已删除的来源
            const dbSourceIds = new Set(dbSources.map(s => s.id));
            
            // 合并所有来源：现有来源 + 数据库来源（优先）+ 对话来源（仅当不在数据库中时）
            setSources(prev => {
              const sourceMap = new Map<string, Source>();
              
              // 1. 先添加现有的来源（包括页面类型的来源）
              prev.forEach(s => sourceMap.set(s.id, s));
              
              // 2. 添加数据库中的来源（优先，因为已经过滤了已删除的记录）
              dbSources.forEach(s => sourceMap.set(s.id, s));
              
              // 3. 添加对话中的来源（仅当不在数据库中时，避免重新添加已删除的来源）
              conversationSources.forEach(s => {
                // 如果来源不在数据库中，说明可能已被删除，不添加
                // 如果来源在数据库中，说明是活跃的，已经在步骤2中添加了
                if (!dbSourceIds.has(s.id)) {
                  // 不在数据库中，可能是已删除的来源，不添加
                  console.log('[SourceInfo] 跳过对话中的已删除来源:', s.id, s.title);
                }
              });
              
              const merged = Array.from(sourceMap.values());
              console.log('[SourceInfo] 合并后的来源数量:', merged.length, {
                prev: prev.length,
                conversation: conversationSources.length,
                db: dbSources.length,
                filtered: conversationSources.filter(s => !dbSourceIds.has(s.id)).length
              });
              return merged;
            });
          } catch (error) {
            console.error("[SourceInfo] 加载对话来源信息失败:", error);
            // 如果加载失败，不添加对话中的来源，因为可能包含已删除的来源
            // 只保留现有的来源（包括页面类型的来源）
            console.warn("[SourceInfo] 加载对话来源失败，保留现有来源，不添加对话中的来源（可能包含已删除的记录）");
          }
        }
        
        setCurrentConversation((prev) => {
          console.log('[ConversationDebug] 加载对话详情:', {
            本地对话ID: conversationId,
            之前的本地对话ID: prev?.id || '无',
            是否追加模式: options?.append || false,
            之前消息数: prev?.messages?.length || 0,
            新消息数: detail.messages?.length || 0,
            'Dify conversation_id (当前)': detail.difyConversationId || '未设置（首次对话时正常）',
            'Dify conversation_id (之前)': prev?.difyConversationId || '未设置',
          });
          
          if (options?.append && prev && prev.id === conversationId) {
            const previousMessages = prev.messages || [];
            const newMessages = detail.messages || [];
            // 合并消息并去重（按消息ID）
            const messageMap = new Map<string, any>();
            // 先添加旧消息
            previousMessages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            // 再添加新消息（会覆盖重复的）
            newMessages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            // 按时间排序
            const mergedMessages = Array.from(messageMap.values()).sort((a, b) => {
              const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
              const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
              return timeA - timeB;
            });
            return {
              ...prev,
              messages: mergedMessages,
              sources: detail.sources,
              hasMoreMessages: detail.hasMoreMessages,
              nextCursor: detail.nextCursor,
              difyConversationId: detail.difyConversationId || prev.difyConversationId,
            };
          }
          if (prev && prev.id === conversationId && prev.messages?.length) {
            const incomingMessages = detail.messages || [];
            // 使用Map去重，保留最新的消息
            const messageMap = new Map<string, any>();
            // 先添加现有消息
            prev.messages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            // 再添加新消息（会覆盖重复的）
            incomingMessages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            // 按时间排序
            const mergedMessages = Array.from(messageMap.values()).sort((a, b) => {
              const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
              const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
              return timeA - timeB;
            });
            return {
              ...detail,
              messages: mergedMessages,
              hasMoreMessages:
                detail.hasMoreMessages ?? prev.hasMoreMessages,
              nextCursor: detail.nextCursor ?? prev.nextCursor,
              difyConversationId: detail.difyConversationId || prev.difyConversationId,
            };
          }
          // 对于新对话，确保消息去重并按时间排序
          if (detail.messages && detail.messages.length > 0) {
            const messageMap = new Map<string, any>();
            detail.messages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            const uniqueMessages = Array.from(messageMap.values()).sort((a, b) => {
              const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
              const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
              return timeA - timeB;
            });
            return {
              ...detail,
              messages: uniqueMessages,
            };
          }
          return detail;
        });
      } catch (error) {
        console.error("加载对话详情失败:", error);
        reportError("加载对话详情失败，请稍后重试", error instanceof Error ? error.message : undefined);
      } finally {
        // 清除加载标记
        loadingConversationRef.current.delete(conversationId);
      }
    },
    [reportError]
  );

  const loadConversations = useCallback(async (options?: { refreshActive?: boolean; activeConversationId?: string }) => {
    // 使用有效的 pageType（可能包含项目ID）
    try {
      const data = await aiSearchService.getConversations(effectivePageType);
      console.log('[ConversationDebug] 加载对话列表，原始数据:', data.length, '条对话');
      
      // 按ID去重，保留最新的对话（按updated_at排序）
      const conversationMap = new Map<string, Conversation>();
      const duplicateIds: string[] = [];
      data.forEach((conv) => {
        const existing = conversationMap.get(conv.id);
        if (!existing) {
          conversationMap.set(conv.id, conv);
        } else {
          duplicateIds.push(conv.id);
          // 如果已存在，比较更新时间，保留更新的
          const existingTime = existing.updatedAt instanceof Date 
            ? existing.updatedAt.getTime() 
            : new Date(existing.updatedAt).getTime();
          const currentTime = conv.updatedAt instanceof Date 
            ? conv.updatedAt.getTime() 
            : new Date(conv.updatedAt).getTime();
          if (currentTime > existingTime) {
            conversationMap.set(conv.id, conv);
          }
        }
      });
      
      if (duplicateIds.length > 0) {
        console.warn('[ConversationDebug] 发现重复的对话ID:', duplicateIds);
      }
      
      // 转换为数组并按更新时间排序
      const uniqueConversations = Array.from(conversationMap.values()).sort((a, b) => {
        const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
        const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
        return timeB - timeA; // 降序排列，最新的在前
      });
      
      console.log('[ConversationDebug] 去重后的对话列表:', uniqueConversations.length, '条对话，IDs:', uniqueConversations.map(c => c.id));
      setConversations(uniqueConversations);

      if (uniqueConversations.length === 0) {
        setCurrentConversation(null);
        // 如果没有对话，不需要额外加载来源信息（已经在初始化时加载过了）
        return;
      }

      // 确定要激活的对话ID
      let activeId = options?.activeConversationId;
      
      // 如果没有指定，尝试保持当前对话（如果在列表中）
      if (!activeId && currentConversationRef.current?.id) {
        const currentId = currentConversationRef.current.id;
        if (uniqueConversations.some(c => c.id === currentId)) {
          activeId = currentId;
        }
      }
      
      // 如果还是没有，默认选中第一个
      if (!activeId) {
        activeId = uniqueConversations[0].id;
      }

      if (!activeId) {
        return;
      }

      const current = currentConversationRef.current;
      if (
        !current ||
        options?.refreshActive ||
        current.id !== activeId
      ) {
        await loadConversationDetail(activeId);
      }
    } catch (error) {
      console.error("加载对话历史失败:", error);
      reportError("加载对话历史失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  }, [loadConversationDetail, reportError, loadPageTypeSources, effectivePageType]);

  const loadOutputs = async () => {
    try {
      // 使用有效的 pageType（可能包含项目ID）
      const data = await aiSearchService.getOutputs(undefined, effectivePageType);
      setOutputs(data);
    } catch (error) {
      console.error("加载输出内容失败:", error);
      reportError("加载输出内容失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  };

  // 使用 ref 追踪上次的 pageType 和 projectId，避免不必要的重新加载
  const lastPageTypeRef = useRef<string | null>(null);
  const lastProjectIdRef = useRef<string | null>(null);
  
  // 当页面类型或项目ID变化时，重新加载所有信息
  useEffect(() => {
    const currentPageType = config.pageType;
    const currentProjectId = projectId;
    
    // 如果 pageType 和 projectId 都没有变化，跳过
    if (lastPageTypeRef.current === currentPageType && lastProjectIdRef.current === currentProjectId) {
      return;
    }
    
    // 更新 ref
    lastPageTypeRef.current = currentPageType;
    lastProjectIdRef.current = currentProjectId;
    
    console.log('[BaseAISearchPage] 页面类型或项目ID变化，重新加载数据:', {
      pageType: currentPageType,
      projectId: currentProjectId
    });
    
    // 清空状态，防止跨项目数据污染
    setSources([]);
    setConversations([]);
    setOutputs([]);
    setCurrentConversation(null);
    // 重置加载标志和初始化标志
    isLoadingSourcesRef.current = false;
    hasHandledNewConversationRef.current = false;
    isInitializedRef.current = false; // 允许重新初始化

    // 重新加载所有数据
    loadPageTypeSources();
    loadFiles();
    loadConversations();
    
    // 加载输出内容
    const fetchOutputs = async () => {
      try {
        const data = await aiSearchService.getOutputs(undefined, effectivePageType);
        setOutputs(data);
      } catch (error) {
        console.error("加载输出内容失败:", error);
      }
    };
    fetchOutputs();
  }, [config.pageType, projectId, effectivePageType, loadPageTypeSources, loadFiles, loadConversations]);

  const handleLoadMoreMessages = useCallback(async () => {
    if (
      !currentConversation?.id ||
      !currentConversation.nextCursor ||
      isLoadingMoreMessages
    ) {
      return;
    }
    setIsLoadingMoreMessages(true);
    try {
      await loadConversationDetail(currentConversation.id, {
        append: true,
        before: currentConversation.nextCursor,
      });
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [currentConversation, isLoadingMoreMessages, loadConversationDetail]);

  const handleSourcesChange = useCallback(async (newSources: Source[]) => {
    // 先更新状态
    setSources(prevSources => {
      // 保存新添加的来源信息到数据库
      (async () => {
        try {
          const previousSourceIds = new Set(prevSources.map(s => s.id));
          const newSourceIds = new Set(newSources.map(s => s.id));
          
          // 找出新添加的来源
          const addedSources = newSources.filter(s => !previousSourceIds.has(s.id));
          
          // 找出被删除的来源
          const deletedSourceIds = prevSources
            .filter(s => !newSourceIds.has(s.id))
            .map(s => s.id);
          
          // 保存新添加的来源
          if (addedSources.length > 0) {
            console.log('[SourceInfo] 保存新添加的来源:', addedSources.length, '个', {
              pageType: effectivePageType,
              conversationId: currentConversation?.id,
              sources: addedSources.map(s => ({ id: s.id, title: s.title }))
            });
            
            if (currentConversation?.id) {
              // 如果有当前对话，保存到对话关联的来源
              const result = await sourceService.saveSourceInformationBatch(
                addedSources,
                effectivePageType,
                currentConversation.id
              );
              if (result.success) {
                console.log('[SourceInfo] 保存成功（关联对话）:', result.data?.length || 0, '条');
              } else {
                console.error('[SourceInfo] 保存失败（关联对话）:', result.error);
              }
            } else {
              // 如果没有对话，只保存页面类型的来源（使用 effectivePageType 确保项目隔离）
              const result = await sourceService.saveSourceInformationBatch(
                addedSources,
                effectivePageType
              );
              if (result.success) {
                console.log('[SourceInfo] 保存成功（页面类型）:', result.data?.length || 0, '条');
              } else {
                console.error('[SourceInfo] 保存失败（页面类型）:', result.error);
              }
            }
          }
          
          // 删除被移除的来源（软删除）
          if (deletedSourceIds.length > 0) {
            console.log('[SourceInfo] 删除来源:', deletedSourceIds.length, '个');
            for (const sourceId of deletedSourceIds) {
              const result = await sourceService.deleteSourceInformation(sourceId);
              if (!result.success) {
                console.error('[SourceInfo] 删除来源失败:', sourceId, result.error);
              }
            }
          }
        } catch (error) {
          console.error("[SourceInfo] 保存来源信息失败:", error);
          // 不阻止用户操作，只记录错误
        }
      })();
      
      return newSources;
    });
  }, [currentConversation?.id, effectivePageType]);

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSourceIds(selectedIds);
  };

  const handleCreateConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      clearGlobalError();
      
      // 如果已有当前对话，直接返回，避免重复创建
      if (currentConversation) {
        console.log('[ConversationDebug] 已有当前对话，跳过创建:', currentConversation.id);
        return currentConversation;
      }
      
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));
      console.log('[ConversationDebug] 创建新对话，来源数量:', selectedSources.length);

      const conversationRequest: any = {
        title: `对话 ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/')}`,
        sources: selectedSources,
        pageType: effectivePageType, // 使用包含项目ID的 pageType
      };
      
      // 如果提供了projectId，添加到请求中
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          conversationRequest.projectId = projectIdNum;
        }
      }
      
      const conversation = await aiSearchService.createConversation(conversationRequest);

      console.log('[ConversationDebug] 新对话已创建:', conversation.id);

      if (selectedWorkflowId) {
        persistWorkflowSelection(selectedWorkflowId, conversation.id);
      }
      await loadConversations({ activeConversationId: conversation.id });
      return conversation;
    } catch (error) {
      console.error("创建对话失败:", error);
      reportError("创建对话失败，请稍后重试", error instanceof Error ? error.message : undefined);
      return null;
    }
  }, [
    clearGlobalError,
    sources,
    selectedSourceIds,
    reportError,
    selectedWorkflowId,
    persistWorkflowSelection,
    loadConversations,
    currentConversation,
    effectivePageType,
  ]);

  const handleCreateNewConversation = useCallback(async () => {
    try {
      clearGlobalError();
      // 提出新问题时，清空勾选状态和已发送来源
      setSelectedSourceIds([]);
      setSentSourceIds([]);
      
      const conversationRequest: any = {
        title: `对话 ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/')}`,
        sources: [], // 新对话不附带来源，等用户勾选后首次发送时传递
        pageType: effectivePageType, // 使用包含项目ID的 pageType
      };
      
      // 如果提供了projectId，添加到请求中
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          conversationRequest.projectId = projectIdNum;
        }
      }
      
      const conversation = await aiSearchService.createConversation(conversationRequest);

      if (selectedWorkflowId) {
        persistWorkflowSelection(selectedWorkflowId, conversation.id);
      }
      await loadConversations({ activeConversationId: conversation.id });
    } catch (error) {
      console.error("创建新对话失败:", error);
      reportError("创建新对话失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  }, [
    clearGlobalError,
    reportError,
    selectedWorkflowId,
    persistWorkflowSelection,
    loadConversations,
    effectivePageType,
  ]);

  // 标记来源已发送给 Dify，避免重复发送
  const handleSourcesSent = useCallback((sourceIds: string[]) => {
    setSentSourceIds(prev => {
      const newIds = sourceIds.filter(id => !prev.includes(id));
      if (newIds.length === 0) return prev;
      return [...prev, ...newIds];
    });
  }, []);

  const handleSelectConversation = async (conversation: Conversation) => {
    // 切换对话时重置勾选状态和已发送来源
    setSelectedSourceIds([]);
    setSentSourceIds([]);
    
    await loadConversationDetail(conversation.id);
    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, conversation.id);
    }
  };

  const ensureActiveConversation = useCallback(async (): Promise<Conversation | null> => {
    if (currentConversation) {
      return currentConversation;
    }
    return await handleCreateConversation();
  }, [currentConversation, handleCreateConversation]);

  const handleDeleteConversation = async (id: string) => {
    try {
      clearGlobalError();
      await aiSearchService.deleteConversation(id);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        // 如果删除的是当前对话，确保加载页面类型的来源信息
        await loadPageTypeSources();
      }
      await loadConversations();
    } catch (error) {
      console.error("删除对话失败:", error);
      reportError("删除对话失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  };

  // 自动保存当前对话为来源记录（用于当前页面）
  const autoSaveConversationAsSource = useCallback(async (conversation: Conversation | null) => {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return;
    }

    // 检查是否有至少一轮完整的问答（至少一条用户消息和一条AI消息）
    const userMessages = conversation.messages.filter(msg => msg.role === 'user');
    const aiMessages = conversation.messages.filter(msg => msg.role === 'assistant');
    
    if (userMessages.length === 0 || aiMessages.length === 0) {
      return;
    }

    try {
      // 构建对话文本
      const conversationText = conversation.messages.map((msg) => {
        const role = msg.role === 'user' ? '用户' : 'AI助手';
        return `${role}: ${msg.content}`;
      }).join('\n\n');

      // 如果对话文本太长，先截断（保留前2000字符）
      const maxLength = 2000;
      const truncatedText = conversationText.length > maxLength 
        ? conversationText.substring(0, maxLength) + '\n\n...（内容已截断）'
        : conversationText;

      // 生成总结标题和描述
      let summaryTitle = '对话摘要';
      let summaryDescription = truncatedText;

      // 根据页面类型设置默认标题
      if (config.pageType === 'tech-package') {
        summaryTitle = '技术包装对话摘要';
      } else if (config.pageType === 'tech-strategy') {
        summaryTitle = '技术策略对话摘要';
      } else if (config.pageType === 'tech-article') {
        summaryTitle = '技术通稿对话摘要';
      }

      // 尝试从最后一条AI消息中提取关键信息作为标题
      const lastAssistantMessage = [...conversation.messages]
        .reverse()
        .find((m) => m.role === 'assistant');
      
      if (lastAssistantMessage && lastAssistantMessage.content) {
        // 取前100字符作为标题候选
        const contentPreview = lastAssistantMessage.content.substring(0, 100).replace(/\n/g, ' ').trim();
        if (contentPreview.length > 10) {
          summaryTitle = contentPreview.length > 50 
            ? contentPreview.substring(0, 50) + '...'
            : contentPreview;
        }
      }

      // 根据当前页面的 pageType 设置类别
      let category: SourceCategory = 'external';
      if (config.pageType === 'tech-package') {
        category = 'tech-package-qa';
      } else if (config.pageType === 'tech-strategy') {
        category = 'tech-strategy-qa';
      } else if (config.pageType === 'tech-article') {
        category = 'tech-article-qa';
      }

      // 使用 conversation.id 作为 sourceId 的一部分，确保同一对话只保存一次
      const sourceId = `conversation_${conversation.id}_${config.pageType}`;
      
      const source: Source = {
        id: sourceId,
        title: summaryTitle,
        type: 'external',
        description: summaryDescription,
        category: category,
      };

      // 保存到数据库，传递 projectId 确保项目隔离
      // 先检查是否已存在该对话的记录（使用 ref 避免依赖 sources）
      const existingSources = sourcesRef.current.filter(s => s.id === sourceId);
      
      if (existingSources.length > 0) {
        // 如果已存在，更新它（通过删除旧的后创建新的）
        try {
          await sourceService.deleteSourceInformation(sourceId);
        } catch (error) {
          console.warn('[SourceInfo] 删除旧记录失败:', error);
        }
      }

      const saveResult = await sourceService.saveSourceInformation(
        source,
        config.pageType,
        conversation.id,
        projectId || undefined
      );

      if (saveResult.success && saveResult.data) {
        console.log('[SourceInfo] 对话已自动保存为来源:', {
          id: saveResult.data.id,
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
          pageType: config.pageType,
          projectId: projectId
        });
        
        // 刷新来源列表（但不依赖 sources，避免循环）
        await loadPageTypeSources();
      } else {
        console.error('[SourceInfo] 自动保存对话失败:', saveResult.error);
      }
    } catch (error) {
      console.error('[SourceInfo] 自动保存对话异常:', error);
      // 不抛出错误，避免影响用户体验
    }
  }, [config.pageType, projectId, loadPageTypeSources]);

  const handleMessageSent = async (_message: any) => {
    clearGlobalError();
    const conversationId = currentConversation?.id;
    
    // 只刷新对话列表，loadConversations 内部会调用 loadConversationDetail
    // 避免重复加载
    await loadConversations({
      refreshActive: true,
      activeConversationId: conversationId,
    });
    
    // 自动保存当前对话为来源记录
    // 直接获取最新的对话数据，不依赖状态更新
    if (conversationId) {
      try {
        const latestConversation = await aiSearchService.getConversation(conversationId);
        if (latestConversation && latestConversation.messages && latestConversation.messages.length > 0) {
          // 异步保存，不阻塞UI
          autoSaveConversationAsSource(latestConversation).catch(error => {
            console.error('[SourceInfo] 自动保存对话失败:', error);
          });
        }
      } catch (error) {
        console.error('[SourceInfo] 获取最新对话失败:', error);
      }
    }
  };

  const handleSaveToNotes = (content: string) => {
    console.log("保存到项目:", content);
  };

  const handleTriggerFeature = async (featureType: string) => {
    if (!currentConversation) {
      reportError("请先创建对话");
      return;
    }

    if (triggeringFeatureId && triggeringFeatureId !== featureType) {
      return;
    }

    const label = config.featureLabelMap[featureType] || featureType;
    setTriggeringFeatureId(featureType);
    updateTriggerStatus(`正在执行 ${label}…`);
    clearGlobalError();

    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, currentConversation.id);
    }

    try {
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));
      const effectiveSources = selectedSources.length > 0 ? selectedSources : (currentConversation.sources || []);

      const lastAssistantMessage = [...(currentConversation.messages || [])]
        .slice()
        .reverse()
        .find((m) => m.role === "assistant");

      // 构建触发工具的payload，包含contextWindowSize参数
      // contextWindowSize: 5/10/20 表示最近N条消息，0 表示全部历史
      // 此参数会被传递给后端，用于构建对话上下文
      const payload: { featureType: string; messageId?: string; content?: string; sources: Source[]; contextWindowSize?: number; workflowId?: string } = {
        featureType,
        sources: effectiveSources,
        contextWindowSize, // 从DialogueContent的上下文窗口选择器获取
        workflowId: selectedWorkflowId || undefined,
      };

      if (lastAssistantMessage) {
        payload.messageId = lastAssistantMessage.id;
        payload.content = lastAssistantMessage.content;
      }

      const response = await aiSearchService.triggerFeatureAgent(currentConversation.id, payload);

      if (response?.message) {
        setCurrentConversation((prev) => {
          if (!prev) {
            return prev;
          }

          const existingMessages = prev.messages ? [...prev.messages] : [];

          return {
            ...prev,
            messages: [...existingMessages, response.message],
            updatedAt: response.message.createdAt,
          };
        });
      } else {
        const updatedConversation = await aiSearchService.getConversation(currentConversation.id);
        if (updatedConversation) {
          setCurrentConversation(updatedConversation);
        }
      }

      await loadConversations({
        refreshActive: true,
        activeConversationId: currentConversation.id,
      });
      await loadOutputs();

      updateTriggerStatus(`已完成 ${label}`, 2000);
    } catch (error: any) {
      console.error("触发子Agent失败:", error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "触发子Agent失败，请稍后重试";
      reportError(message, error?.response?.data?.details || error?.message);
      const shortMessage = message.length > 60 ? `${message.slice(0, 60)}…` : message;
      updateTriggerStatus(`执行 ${label} 失败：${shortMessage}`, 4000);
    } finally {
      setTriggeringFeatureId(null);
    }
  };

  // 使用 ref 追踪是否已经处理过 newConversation，避免重复创建
  const hasHandledNewConversationRef = useRef(false);
  
  useEffect(() => {
    // 如果 URL 中有 newConversation 参数，强制创建新对话（只执行一次）
    if (shouldCreateNewConversation && !currentConversation && !hasHandledNewConversationRef.current) {
      console.log('[ConversationDebug] 检测到 newConversation 参数，强制创建新对话');
      hasHandledNewConversationRef.current = true;
      handleCreateConversation();
      return;
    }
    
    // 如果 newConversation 参数已清除，重置标志
    if (!shouldCreateNewConversation) {
      hasHandledNewConversationRef.current = false;
    }
    
    // 正常情况：当没有当前对话且有来源被选中时，创建新对话
    // 使用 ref 获取最新的 sources，避免依赖 sources 导致循环
    const currentSources = sourcesRef.current;
    if (!currentConversation && currentSources.length > 0 && selectedSourceIds.length > 0) {
      handleCreateConversation();
    }
  }, [currentConversation, selectedSourceIds, handleCreateConversation, shouldCreateNewConversation]);

  useEffect(() => {
    return () => {
      if (triggerStatusTimerRef.current) {
        window.clearTimeout(triggerStatusTimerRef.current);
      }
    };
  }, []);

  const handleFieldMappingConfigSave = (config: FieldMappingConfigType) => {
    // setFieldMappingConfig(config);
    console.log('保存字段映射配置:', config);
  };

  // 总结当前对话并保存为来源，用于跳转到其他页面
  const summarizeAndSaveConversationForNavigation = useCallback(async (targetPageType: 'tech-strategy' | 'tech-article'): Promise<string | null> => {
    if (!currentConversation || !currentConversation.messages || currentConversation.messages.length === 0) {
      console.log('[SourceInfo] 没有对话内容，无法总结');
      return null;
    }

    try {
      // 构建对话文本
      const conversationText = currentConversation.messages.map((msg) => {
        const role = msg.role === 'user' ? '用户' : 'AI助手';
        return `${role}: ${msg.content}`;
      }).join('\n\n');

      // 如果对话文本太长，先截断（保留前2000字符）
      const maxLength = 2000;
      const truncatedText = conversationText.length > maxLength 
        ? conversationText.substring(0, maxLength) + '\n\n...（内容已截断）'
        : conversationText;

      // 生成总结标题和描述
      let summaryTitle = '技术包装对话摘要';
      let summaryDescription = truncatedText;

      // 尝试从最后一条AI消息中提取关键信息作为标题
      const lastAssistantMessage = [...currentConversation.messages]
        .reverse()
        .find((m) => m.role === 'assistant');
      
      if (lastAssistantMessage && lastAssistantMessage.content) {
        // 取前100字符作为标题候选
        const contentPreview = lastAssistantMessage.content.substring(0, 100).replace(/\n/g, ' ').trim();
        if (contentPreview.length > 10) {
          summaryTitle = contentPreview.length > 50 
            ? contentPreview.substring(0, 50) + '...'
            : contentPreview;
        }
      }

      // 创建来源信息
      // 根据当前页面的 pageType 设置类别，而不是目标页面
      // 因为对话是在当前页面产生的
      const sourceId = `tech_package_conversation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let category: SourceCategory = 'external';
      
      if (config.pageType === 'tech-package') {
        category = 'tech-package-qa';
      } else if (config.pageType === 'tech-strategy') {
        category = 'tech-strategy-qa';
      } else if (config.pageType === 'tech-article') {
        category = 'tech-article-qa';
      }
      
      const source: Source = {
        id: sourceId,
        title: summaryTitle,
        type: 'external',
        description: summaryDescription,
        category: category,
      };

      // 保存到数据库，传递 projectId 确保项目隔离
      const projectIdNum = projectId ? parseInt(projectId) : undefined;
      const saveResult = await sourceService.saveSourceInformation(
        source,
        targetPageType,
        currentConversation.id,
        projectIdNum
      );

      if (saveResult.success && saveResult.data) {
        console.log('[SourceInfo] 对话摘要已保存:', {
          id: saveResult.data.id,
          sourceId: saveResult.data.source_id,
          title: saveResult.data.title,
          pageType: targetPageType,
          projectId: projectIdNum
        });
        // 返回 source_id（字符串），用于 URL 参数
        return saveResult.data.source_id || null;
      } else {
        console.error('[SourceInfo] 保存对话摘要失败:', saveResult.error);
        return null;
      }
    } catch (error) {
      console.error('[SourceInfo] 总结对话失败:', error);
      return null;
    }
  }, [currentConversation, projectId]);

  return (
    <div className={embeddedMode ? "h-full flex flex-col bg-gray-50" : "h-screen flex flex-col bg-gray-50"}>
      {!hideTopNavigation && <TopNavigation />}
      {globalError && (
        <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{globalError}</p>
              {globalErrorDetail && (
                <p className="mt-1 text-xs text-red-600/80 break-words">{globalErrorDetail}</p>
              )}
            </div>
            <button
              onClick={clearGlobalError}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
            >
              关闭
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {showSourceSidebar && (
          <SourceSidebar
            sources={sources}
            selectedSources={selectedSourceIds}
            onSourcesChange={handleSourcesChange}
            onSelectionChange={handleSelectionChange}
            pageType={config.pageType as any}
            projectId={projectId || undefined}
            currentConversation={currentConversation}
            onSummarizeAndNavigate={summarizeAndSaveConversationForNavigation}
            onClose={() => setShowSourceSidebar(false)}
          />
        )}

        <DialogueContent
          conversation={currentConversation}
          sources={sources.filter((s) => selectedSourceIds.includes(s.id))}
          sentSourceIds={sentSourceIds}
          onSourcesSent={handleSourcesSent}
          contextWindowSize={contextWindowSize}
          onContextWindowSizeChange={setContextWindowSize}
          workflowId={selectedWorkflowId}
          hasMoreMessages={currentConversation?.hasMoreMessages}
          onLoadMoreMessages={handleLoadMoreMessages}
          isLoadingMore={isLoadingMoreMessages}
          onMessageSent={handleMessageSent}
          onSaveToNotes={handleSaveToNotes}
          onEnsureConversation={ensureActiveConversation}
          onCreateNewConversation={handleCreateNewConversation}
          availableWorkflows={availableWorkflows}
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowChange={handleWorkflowSelectionChange}
          isWorkflowLoading={isWorkflowLoading}
          dialogueTitle={config.dialogueTitle}
          pageType={config.pageType as any}
          onShowSourceSidebar={() => setShowSourceSidebar(true)}
          onShowConversationList={() => setShowStudioSidebar(true)}
        />

        {showStudioSidebar && (
          <StudioSidebar
            outputs={outputs}
            conversations={conversations}
            onTriggerFeature={handleTriggerFeature}
            executingFeatureId={triggeringFeatureId}
            statusMessage={triggeringStatus || undefined}
            onShowFieldMappingConfig={() => setShowFieldMappingConfig(true)}
            studioTitle={config.studioTitle}
            featureLabelMap={{ ...config.featureLabelMap, ...dynamicLabelMap }}
            enabledToolIds={enabledToolIds}
            pageType={config.pageType as any}
            onDeleteConversation={handleDeleteConversation}
            onClose={() => setShowStudioSidebar(false)}
            currentConversationId={currentConversation?.id}
            onSelectConversation={handleSelectConversation}
          />
        )}
      </div>

      {showFieldMappingConfig && workflowConfig && (
        <FieldMappingConfig
          workflowConfig={workflowConfig}
          onClose={() => setShowFieldMappingConfig(false)}
          onSave={handleFieldMappingConfigSave}
        />
      )}
    </div>
  );
};

export default BaseAISearchPage;

