import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Settings, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";
import SourceSidebar, { Source } from "../components/ai-search/SourceSidebar";
import DialogueContent from "../components/ai-search/DialogueContent";
import StudioSidebar from "../components/ai-search/StudioSidebar";
import { getPageConfig } from "../configs/pageConfigs";
import ConversationList from "../components/ai-search/ConversationList";
import FieldMappingConfig from "../components/ai-search/FieldMappingConfig";
import { Conversation, OutputContent, WorkflowConfig, FieldMappingConfig as FieldMappingConfigType } from "../types/aiSearch";
import { aiSearchService } from "../services/aiSearchService";
import { agentWorkflowService } from "../services/agentWorkflowService";
import { AgentWorkflow } from "../types/agentWorkflow";
import api from "../services/api";

const FEATURE_LABEL_MAP: Record<string, string> = {
  "five-view-analysis": "技术转译",
  "three-fix-analysis": "用户场景挖掘",
  "tech-matrix": "发布会场景化",
  "propagation-strategy": "领导人口语化",
  "exhibition-video": "展具与视频",
  translation: "翻译",
  "ppt-outline": "技术讲稿",
  script: "脚本",
};

const MESSAGE_PAGE_SIZE = 30;
const WORKFLOW_SELECTION_KEY = "ai-search.workflows.selection";
const WORKFLOW_SELECTION_KEY_TECH_PACKAGE = "ai-search.workflows.selection.tech-package";
const WORKFLOW_SELECTION_KEY_PRESS_RELEASE = "ai-search.workflows.selection.press-release";
const WORKFLOW_DEFAULT_KEY = "__default__";

const AISearchPage: React.FC = () => {
  const location = useLocation();
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
  const [enabledToolIds, setEnabledToolIds] = useState<string[] | undefined>(undefined);
  const triggerStatusTimerRef = useRef<number | null>(null);
  const workflowSelectionRef = useRef<Record<string, string>>({});
  const activeWorkflow = useMemo(
    () => availableWorkflows.find((workflow) => workflow.id === selectedWorkflowId) || null,
    [availableWorkflows, selectedWorkflowId]
  );

  // 根据当前路由确定页面标题和类型
  const pageTitle = useMemo(() => {
    if (location.pathname === '/node/speech') {
      return '发布会稿';
    }
    return '技术包装';
  }, [location.pathname]);

  // 根据当前路由确定页面类型
  const pageType = useMemo(() => {
    if (location.pathname === '/node/speech') {
      return 'press-release';
    }
    return 'tech-package';
  }, [location.pathname]);

  const loadWorkflowSelectionFromStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      // 根据页面类型选择不同的localStorage键
      const storageKey = pageType === 'press-release' 
        ? WORKFLOW_SELECTION_KEY_PRESS_RELEASE 
        : WORKFLOW_SELECTION_KEY_TECH_PACKAGE;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("解析工作流选择缓存失败:", error);
      return {};
    }
  }, [pageType]);

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
          // 根据页面类型选择不同的localStorage键
          const storageKey = pageType === 'press-release' 
            ? WORKFLOW_SELECTION_KEY_PRESS_RELEASE 
            : WORKFLOW_SELECTION_KEY_TECH_PACKAGE;
          window.localStorage.setItem(storageKey, JSON.stringify(map));
        } catch (error) {
          console.warn("保存工作流选择缓存失败:", error);
        }
      }
    },
    [pageType]
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
    loadFiles(); // 加载已保存的文件列表
    
    // 监听文件上传事件，自动刷新文件列表
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
      // 先尝试清理乱码文件
      try {
        const cleanupApi = await import("../services/api");
        await cleanupApi.default.delete('/ai-search/files/garbled/cleanup');
      } catch (error) {
        // 清理失败不影响文件列表加载
        console.warn('清理乱码文件失败:', error);
      }

      const files = await aiSearchService.getFiles({ pageType });
      // 将文件转换为Source格式
      const fileSources: Source[] = files.map((file) => ({
        id: `file_${file.id || file.fileId}`,
        title: file.name,
        type: 'external' as const,
        url: file.url,
        description: `文件大小: ${formatFileSize(file.size)}`,
      }));
      
      // 完全替换文件来源，避免重复
      setSources((prev) => {
        // 保留非文件来源（知识库来源等）
        const nonFileSources = prev.filter((s) => !s.id.startsWith('file_'));
        // 使用数据库中的文件列表，完全替换文件来源
        return [...nonFileSources, ...fileSources];
      });
    } catch (error) {
      console.error('加载文件列表失败:', error);
    }
  }, [pageType]);

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
        const mappings = await aiSearchService.getAllFieldMappingConfigs();
        // 统一使用 press-release（不再支持 speech）
        const pageKey = pageType;
        const setIds = new Set<string>();
        for (const item of mappings) {
          const fos = Array.isArray(item.config?.featureObjects) ? item.config.featureObjects : [];
          for (const f of fos) {
            if ((f as any).pageType === pageKey && f.featureType) {
              setIds.add(f.featureType);
            }
          }
        }
        if (setIds.size > 0) {
          setEnabledToolIds(Array.from(setIds));
        } else {
          setEnabledToolIds(getPageConfig(pageType as any).enabledToolIds);
        }
      } catch {
        setEnabledToolIds(getPageConfig(pageType as any).enabledToolIds);
      }
    };
    loadEnabledToolsForPage();
  }, [pageType]);

  const handleWorkflowSelectionChange = useCallback(
    (workflowId: string) => {
      if (!workflowId) return;
      setSelectedWorkflowId(workflowId);
      persistWorkflowSelection(workflowId, currentConversation?.id);
    },
    [currentConversation?.id, persistWorkflowSelection]
  );

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

    const fallback =
      storedForConversation ||
      configId ||
      storedDefault ||
      availableWorkflows[0]?.id ||
      null;

    if (fallback && fallback !== selectedWorkflowId) {
      setSelectedWorkflowId(fallback);
    }
  }, [currentConversation?.id, workflowConfig?.id, availableWorkflows, selectedWorkflowId]);

  useEffect(() => {
    if (selectedWorkflowId) {
      persistWorkflowSelection(selectedWorkflowId, currentConversation?.id);
    }
  }, [selectedWorkflowId, currentConversation?.id, persistWorkflowSelection]);

  // 加载工作流配置
  const loadWorkflowConfig = async () => {
    try {
      const config = await aiSearchService.getWorkflowConfig(pageType);
      setWorkflowConfig(config);
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
      const data = await aiSearchService.getConversations();
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
      const data = await aiSearchService.getOutputs();
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
    // 重新加载当前对话
    if (currentConversation) {
      await loadConversationDetail(currentConversation.id);
    }
    await loadConversations({
      refreshActive: true,
      activeConversationId: currentConversation?.id,
    });
  };

  const handleSaveToNotes = (content: string) => {
    // TODO: 实现保存到笔记功能
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

    const label = FEATURE_LABEL_MAP[featureType] || featureType;
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

      const payload: { featureType: string; messageId?: string; content?: string; sources: Source[]; contextWindowSize?: number; workflowId?: string } = {
        featureType,
        sources: effectiveSources,
        contextWindowSize,
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

  // 如果没有当前对话，自动创建
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
      {/* 顶部导航栏 */}
      <TopNavigation currentPageTitle={pageTitle} />
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
      
      {/* 主要内容区域 - 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 - 来源选择 */}
        <SourceSidebar
          sources={sources}
          selectedSources={selectedSourceIds}
          onSourcesChange={handleSourcesChange}
          onSelectionChange={handleSelectionChange}
          pageType={pageType}
        />

        {/* 中间栏 - 对话内容 */}
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
        />

        {/* 右侧栏 - Studio */}
        <StudioSidebar
          outputs={outputs}
          onShowConversationList={() => setShowConversationList(true)}
          onTriggerFeature={handleTriggerFeature}
          executingFeatureId={triggeringFeatureId}
          statusMessage={triggeringStatus || undefined}
          onShowFieldMappingConfig={() => setShowFieldMappingConfig(true)}
          enabledToolIds={enabledToolIds}
        />
      </div>

      {/* 对话历史列表 */}
      {showConversationList && (
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setShowConversationList(false)}
        />
      )}

      {/* 字段映射配置弹窗 */}
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

export default AISearchPage;

