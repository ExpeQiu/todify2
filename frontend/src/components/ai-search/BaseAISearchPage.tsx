/**
 * 基础AI搜索页面组件
 * 包含所有通用逻辑，通过配置来区分不同页面的行为
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import TopNavigation from "../TopNavigation";
import SourceSidebar, { Source } from "./SourceSidebar";
import DialogueContent from "./DialogueContent";
import StudioSidebar from "./StudioSidebar";
import ConversationList from "./ConversationList";
import FieldMappingConfig from "./FieldMappingConfig";
import { Conversation, OutputContent, WorkflowConfig, FieldMappingConfig as FieldMappingConfigType } from "../../types/aiSearch";
import { aiSearchService } from "../../services/aiSearchService";
import { agentWorkflowService } from "../../services/agentWorkflowService";
import { AgentWorkflow } from "../../types/agentWorkflow";
import { PageConfig } from "../../configs/pageConfigs";
import { pageToolConfigService } from "../../services/pageToolConfigService";

const MESSAGE_PAGE_SIZE = 30;
const WORKFLOW_DEFAULT_KEY = "__default__";

interface BaseAISearchPageProps {
  config: PageConfig;
}

const BaseAISearchPage: React.FC<BaseAISearchPageProps> = ({ config }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [outputs, setOutputs] = useState<OutputContent[]>([]);
  const [showConversationList, setShowConversationList] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [fieldMappingConfig, setFieldMappingConfig] = useState<FieldMappingConfigType | null>(null);
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
  const triggerStatusTimerRef = useRef<number | null>(null);
  const workflowSelectionRef = useRef<Record<string, string>>({});
  const activeWorkflow = useMemo(
    () => availableWorkflows.find((workflow) => workflow.id === selectedWorkflowId) || null,
    [availableWorkflows, selectedWorkflowId]
  );

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

  // 加载对话历史和输出内容
  useEffect(() => {
    loadConversations();
    loadOutputs();
    loadWorkflowConfig();
    loadFiles();
    
    const handleFilesUploaded = () => {
      loadFiles();
    };
    window.addEventListener('filesUploaded', handleFilesUploaded);
    
    return () => {
      window.removeEventListener('filesUploaded', handleFilesUploaded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      try {
        const cleanupApi = await import("../../services/api");
        await cleanupApi.default.delete('/ai-search/files/garbled/cleanup');
      } catch (error) {
        console.warn('清理乱码文件失败:', error);
      }

      const files = await aiSearchService.getFiles({ pageType: config.pageType });
      const fileSources: Source[] = files.map((file) => ({
        id: `file_${file.id || file.fileId}`,
        title: file.name,
        type: 'external' as const,
        url: file.url,
        description: `文件大小: ${formatFileSize(file.size)}`,
      }));
      
      setSources((prev) => {
        const nonFileSources = prev.filter((s) => !s.id.startsWith('file_'));
        return [...nonFileSources, ...fileSources];
      });
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  }, [config.pageType]);

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

  useEffect(() => {
    const loadEnabledToolsForPage = async () => {
      try {
        console.log('[BaseAISearchPage] 加载工具配置，pageType:', config.pageType);
        
        // 1. 优先从数据库加载页面工具配置
        const dbConfig = await pageToolConfigService.getByPageType(config.pageType);
        if (dbConfig && dbConfig.enabledToolIds && dbConfig.enabledToolIds.length > 0) {
          console.log('[BaseAISearchPage] 从数据库配置加载工具:', dbConfig.enabledToolIds);
          setEnabledToolIds(dbConfig.enabledToolIds);
          setDynamicLabelMap(dbConfig.featureLabelMap || {});
          return;
        }

        // 2. 如果没有数据库配置，尝试从字段映射配置中加载
        const mappings = await aiSearchService.getAllFieldMappingConfigs();
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
        
        if (setIds.size > 0) {
          setEnabledToolIds(Array.from(setIds));
          setDynamicLabelMap(labels);
        } else {
          // 3. 如果都没有，回退到使用配置中的默认工具列表
          console.log('[BaseAISearchPage] 未找到字段映射配置，使用默认配置:', config.enabledToolIds);
          setEnabledToolIds(config.enabledToolIds || []);
          setDynamicLabelMap({});
        }
      } catch (error) {
        console.error('[BaseAISearchPage] 加载工具配置失败:', error);
        // 出错时也回退到使用配置中的默认工具列表
        setEnabledToolIds(config.enabledToolIds || []);
        setDynamicLabelMap({});
      }
    };
    loadEnabledToolsForPage();
  }, [config.pageType, config.enabledToolIds, selectedWorkflowId]);

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
      workflowConfig?.id && workflowIds.has(workflowConfig.id) ? workflowConfig.id : undefined;

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
  }, [currentConversation?.id, workflowConfig?.id, availableWorkflows, selectedWorkflowId, defaultWorkflowFromMapping]);

  useEffect(() => {
    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, currentConversation?.id);
    }
  }, [selectedWorkflowId, currentConversation?.id, persistWorkflowSelection]);

  const loadWorkflowConfig = async () => {
    try {
      const workflowConfig = await aiSearchService.getWorkflowConfig(config.pageType);
      setWorkflowConfig(workflowConfig);
    } catch (error) {
      console.error("加载工作流配置失败:", error);
      reportError("加载工作流配置失败", error instanceof Error ? error.message : undefined);
    }
  };

  const loadConversationDetail = useCallback(
    async (
      conversationId: string,
      options?: {
        append?: boolean;
        before?: string;
      }
    ) => {
      if (!conversationId) return;
      try {
        const detail = await aiSearchService.getConversation(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
          before: options?.before,
        });
        if (!detail) {
          return;
        }
        setCurrentConversation((prev) => {
          if (options?.append && prev && prev.id === conversationId) {
            const previousMessages = prev.messages || [];
            const newMessages = detail.messages || [];
            const mergedMessages = [...newMessages, ...previousMessages];
            return {
              ...prev,
              messages: mergedMessages,
              sources: detail.sources,
              hasMoreMessages: detail.hasMoreMessages,
              nextCursor: detail.nextCursor,
            };
          }
          if (prev && prev.id === conversationId && prev.messages?.length) {
            const incomingMessages = detail.messages || [];
            const incomingIds = new Set(incomingMessages.map((item) => item.id));
            const preservedMessages = (prev.messages || []).filter(
              (message) => !incomingIds.has(message.id)
            );
            return {
              ...detail,
              messages: [...preservedMessages, ...incomingMessages],
              hasMoreMessages:
                detail.hasMoreMessages ?? prev.hasMoreMessages,
              nextCursor: detail.nextCursor ?? prev.nextCursor,
            };
          }
          return detail;
        });
      } catch (error) {
        console.error("加载对话详情失败:", error);
        reportError("加载对话详情失败，请稍后重试", error instanceof Error ? error.message : undefined);
      }
    },
    [reportError]
  );

  const loadConversations = useCallback(async (options?: { refreshActive?: boolean; activeConversationId?: string }) => {
    try {
      const data = await aiSearchService.getConversations(config.pageType);
      setConversations(data);

      if (data.length === 0) {
        setCurrentConversation(null);
        return;
      }

      const activeId =
        options?.activeConversationId ||
        currentConversation?.id ||
        data[0].id;

      if (!activeId) {
        return;
      }

      if (
        !currentConversation ||
        options?.refreshActive ||
        currentConversation.id !== activeId
      ) {
        await loadConversationDetail(activeId);
      }
    } catch (error) {
      console.error("加载对话历史失败:", error);
      reportError("加载对话历史失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  }, [currentConversation, loadConversationDetail, reportError]);

  const loadOutputs = async () => {
    try {
      const data = await aiSearchService.getOutputs(undefined, config.pageType);
      setOutputs(data);
    } catch (error) {
      console.error("加载输出内容失败:", error);
      reportError("加载输出内容失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  };

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

  const handleSourcesChange = useCallback((newSources: Source[]) => {
    setSources(newSources);
  }, []);

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSourceIds(selectedIds);
  };

  const handleCreateConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      clearGlobalError();
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));

      const conversation = await aiSearchService.createConversation({
        title: `对话 ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/')}`,
        sources: selectedSources,
        pageType: config.pageType,
      });

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
  ]);

  const handleCreateNewConversation = useCallback(async () => {
    try {
      clearGlobalError();
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));

      const conversation = await aiSearchService.createConversation({
        title: `对话 ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '/')}`,
        sources: selectedSources,
        pageType: config.pageType,
      });

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
    sources,
    selectedSourceIds,
    reportError,
    selectedWorkflowId,
    persistWorkflowSelection,
    loadConversations,
  ]);

  const handleShowHistory = useCallback(() => {
    setShowConversationList(true);
  }, []);

  const handleSelectConversation = async (conversation: Conversation) => {
    await loadConversationDetail(conversation.id);
    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, conversation.id);
    }
    setShowConversationList(false);
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
      }
      await loadConversations();
    } catch (error) {
      console.error("删除对话失败:", error);
      reportError("删除对话失败，请稍后重试", error instanceof Error ? error.message : undefined);
    }
  };

  const handleMessageSent = async (message: any) => {
    clearGlobalError();
    if (currentConversation) {
      await loadConversationDetail(currentConversation.id);
    }
    await loadConversations({
      refreshActive: true,
      activeConversationId: currentConversation?.id,
    });
  };

  const handleSaveToNotes = (content: string) => {
    console.log("保存到笔记:", content);
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

  useEffect(() => {
    if (!currentConversation && sources.length > 0 && selectedSourceIds.length > 0) {
      handleCreateConversation();
    }
  }, [currentConversation, sources, selectedSourceIds, handleCreateConversation]);

  useEffect(() => {
    return () => {
      if (triggerStatusTimerRef.current) {
        window.clearTimeout(triggerStatusTimerRef.current);
      }
    };
  }, []);

  const handleFieldMappingConfigSave = (config: FieldMappingConfigType) => {
    setFieldMappingConfig(config);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopNavigation currentPageTitle={config.pageTitle} />
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
        <SourceSidebar
          sources={sources}
          selectedSources={selectedSourceIds}
          onSourcesChange={handleSourcesChange}
          onSelectionChange={handleSelectionChange}
          pageType={config.pageType}
        />

        <DialogueContent
          conversation={currentConversation}
          sources={sources.filter((s) => selectedSourceIds.includes(s.id))}
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
          onShowHistory={handleShowHistory}
          availableWorkflows={availableWorkflows}
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowChange={handleWorkflowSelectionChange}
          isWorkflowLoading={isWorkflowLoading}
          dialogueTitle={config.dialogueTitle}
        />

        <StudioSidebar
          outputs={outputs}
          onShowConversationList={() => setShowConversationList(true)}
          onTriggerFeature={handleTriggerFeature}
          executingFeatureId={triggeringFeatureId}
          statusMessage={triggeringStatus || undefined}
          onShowFieldMappingConfig={() => setShowFieldMappingConfig(true)}
          studioTitle={config.studioTitle}
          featureLabelMap={{ ...config.featureLabelMap, ...dynamicLabelMap }}
          enabledToolIds={enabledToolIds}
          pageType={config.pageType}
        />
      </div>

      {showConversationList && (
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setShowConversationList(false)}
        />
      )}

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

