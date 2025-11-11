import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Settings, Loader2 } from "lucide-react";
import TopNavigation from "../components/TopNavigation";
import SourceSidebar, { Source } from "../components/ai-search/SourceSidebar";
import DialogueContent from "../components/ai-search/DialogueContent";
import StudioSidebar from "../components/ai-search/StudioSidebar";
import ConversationList from "../components/ai-search/ConversationList";
import FieldMappingConfig from "../components/ai-search/FieldMappingConfig";
import { Conversation, OutputContent, WorkflowConfig, FieldMappingConfig as FieldMappingConfigType } from "../types/aiSearch";
import { aiSearchService } from "../services/aiSearchService";
import { agentWorkflowService } from "../services/agentWorkflowService";
import { AgentWorkflow } from "../types/agentWorkflow";

const FEATURE_LABEL_MAP: Record<string, string> = {
  "five-view-analysis": "五看分析",
  "three-fix-analysis": "三定分析",
  "tech-matrix": "技术矩阵",
  "propagation-strategy": "传播策略",
  "exhibition-video": "展具与视频",
  translation: "翻译",
  "ppt-outline": "技术讲稿",
  script: "脚本",
};

const MESSAGE_PAGE_SIZE = 30;
const WORKFLOW_SELECTION_KEY = "ai-search.workflows.selection";
const WORKFLOW_DEFAULT_KEY = "__default__";

const AISearchPage: React.FC = () => {
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
      const raw = window.localStorage.getItem(WORKFLOW_SELECTION_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("解析工作流选择缓存失败:", error);
      return {};
    }
  }, []);

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
          window.localStorage.setItem(WORKFLOW_SELECTION_KEY, JSON.stringify(map));
        } catch (error) {
          console.warn("保存工作流选择缓存失败:", error);
        }
      }
    },
    []
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const config = await aiSearchService.getWorkflowConfig();
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

  const handleSourcesChange = (newSources: Source[]) => {
    setSources(newSources);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSourceIds(selectedIds);
  };

  const handleCreateConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      clearGlobalError();
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));

      const conversation = await aiSearchService.createConversation({
        title: `对话 ${new Date().toLocaleString()}`,
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
      <TopNavigation currentPageTitle="AI技术问答" />
      <div className="mx-4 mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">当前工作流</span>
          <div className="relative">
            <select
              value={selectedWorkflowId || ""}
              onChange={(event) => handleWorkflowSelectionChange(event.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={availableWorkflows.length === 0}
            >
              <option value="" disabled>
                {isWorkflowLoading ? "加载中..." : "请选择工作流"}
              </option>
              {availableWorkflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 011.414 1.414l-3 3A1 1 0 0110 12z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            {isWorkflowLoading && (
              <Loader2 className="absolute -right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>
        </div>
        {activeWorkflow?.description && (
          <span
            className="max-w-2xl truncate text-xs text-gray-500"
            title={activeWorkflow.description}
          >
            {activeWorkflow.description}
          </span>
        )}
      </div>
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
      
      {/* 字段映射配置按钮 */}
      <div className="absolute top-20 right-4 z-10">
        <button
          onClick={() => setShowFieldMappingConfig(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
          title="配置字段映射"
        >
          <Settings className="w-4 h-4" />
          字段映射
        </button>
      </div>

      {/* 主要内容区域 - 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 - 来源选择 */}
        <SourceSidebar
          sources={sources}
          selectedSources={selectedSourceIds}
          onSourcesChange={handleSourcesChange}
          onSelectionChange={handleSelectionChange}
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
        />

        {/* 右侧栏 - Studio */}
        <StudioSidebar
          outputs={outputs}
          onShowConversationList={() => setShowConversationList(true)}
          onTriggerFeature={handleTriggerFeature}
          executingFeatureId={triggeringFeatureId}
          statusMessage={triggeringStatus || undefined}
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

