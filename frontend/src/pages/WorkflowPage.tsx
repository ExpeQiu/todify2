import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Package, Target, FileText, Mic } from "lucide-react";

import { workflowAPI } from "../services/api";
import configService from "../services/configService";
import type { DifyAPIConfig } from "../services/configService";
import "./WorkflowPage.css";

import TopNavigation from "../components/TopNavigation";
import LoadingAnimation, { LoadingOverlay } from "../components/LoadingAnimation";
import type { AIRoleConfig } from "../types/aiRole";

import { useWorkflowStore } from "@/features/workflow/model/workflowStore";
import { useWorkflowChat } from "@/features/workflow/hooks/useWorkflowChat";
import { useWorkflowEditor } from "@/features/workflow/hooks/useWorkflowEditor";
import { useWorkflowSteps } from "@/features/workflow/hooks/useWorkflowSteps";
import { useWorkflowAnalytics } from "@/features/workflow/hooks/useWorkflowAnalytics";
import { useDifyConfigsQuery, useWorkflowConfigsQuery } from "@/features/workflow/api/configQueries";
import { useAgentWorkflowsQuery, useAIRolesQuery } from "@/features/workflow/api/agentQueries";
import { useSaveDocumentMutation, useExportDocumentMutation } from "@/features/workflow/api/documentMutations";
import { StepSidebar } from "@/features/workflow/ui/StepSidebar";
import { BottomNavigation } from "@/features/workflow/ui/BottomNavigation";
import { ChatHeader } from "@/features/workflow/ui/ChatHeader";
import { ChatMessages } from "@/features/workflow/ui/ChatMessages";
import { ChatInput } from "@/features/workflow/ui/ChatInput";
import { EditorPanel } from "@/features/workflow/ui/EditorPanel";

const mapStepLabelToKey = (label: string) => {
  if (label.includes("AI问答") || label.includes("ai-qa")) return "smartSearch";
  if (label.includes("技术包装") || label.includes("tech-package")) return "techPackage";
  if (label.includes("技术策略") || label.includes("tech-strategy")) return "techStrategy";
  if (label.includes("技术通稿") || label.includes("tech-article") || label.includes("core-draft")) {
    return "coreDraft";
  }
  if (label.includes("演讲稿") || label.includes("speech")) return "speechGeneration";
  return label;
};

const iconByIndex = [MessageCircle, Package, Target, FileText, Mic];

const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    trackStepActivated,
    trackAISearchSuccess,
    trackMessageLike,
    trackMessageDislike,
    trackSessionEnd,
  } = useWorkflowAnalytics();

  const {
    loading,
    loadingText,
    loadingProgress,
    processError,
    setProcessError,
    isProcessing,
    difyConfigs,
    setDifyConfigs,
    workflowConfigs,
    setWorkflowConfigs,
    configsLoaded,
    setConfigsLoaded,
    inputMessage,
    setInputMessage,
    isTyping,
    setIsTyping,
    conversationId,
    setConversationId,
    isFullscreenEditor,
    smartWorkflow,
    setSmartWorkflow,
    setWorkflowAgents,
    useAgentWorkflow,
    setUseAgentWorkflow,
    setSteps,
  } = useWorkflowStore((state) => ({
    loading: state.loading,
    loadingText: state.loadingText,
    loadingProgress: state.loadingProgress,
    processError: state.processError,
    setProcessError: state.setProcessError,
    isProcessing: state.isProcessing,
    difyConfigs: state.difyConfigs,
    setDifyConfigs: state.setDifyConfigs,
    workflowConfigs: state.workflowConfigs,
    setWorkflowConfigs: state.setWorkflowConfigs,
    configsLoaded: state.configsLoaded,
    setConfigsLoaded: state.setConfigsLoaded,
    inputMessage: state.inputMessage,
    setInputMessage: state.setInputMessage,
    isTyping: state.isTyping,
    setIsTyping: state.setIsTyping,
    conversationId: state.conversationId,
    setConversationId: state.setConversationId,
    isFullscreenEditor: state.isFullscreenEditor,
    smartWorkflow: state.smartWorkflow,
    setSmartWorkflow: state.setSmartWorkflow,
    setWorkflowAgents: state.setWorkflowAgents,
    useAgentWorkflow: state.useAgentWorkflow,
    setUseAgentWorkflow: state.setUseAgentWorkflow,
    setSteps: state.setSteps,
  }));

  const {
    chatMessages,
    resetConversation,
    addUserMessage,
    addAssistantMessage,
    updateMessageById,
    setChatMessages,
  } = useWorkflowChat();

  const {
    editorContent,
    isEditing,
    setEditorContentDirect,
    setEditorContentAndScheduleSave,
    toggleEditingMode,
    loadContentForStep,
  } = useWorkflowEditor();

  const {
    steps,
    currentStep,
    progress,
    goToStep,
    goPrevStep,
    goNextStep,
  } = useWorkflowSteps({
    onStepActivated: (step) => {
      trackStepActivated(step.key, step.title);
      setEditorContentDirect(loadContentForStep());
    },
  });

  const {
    data: difyConfigsData,
    isLoading: isDifyConfigsLoading,
    isError: isDifyConfigsError,
    error: difyConfigsError,
  } = useDifyConfigsQuery();

  const {
    data: workflowConfigsData,
    isLoading: isWorkflowConfigsLoading,
    isError: isWorkflowConfigsError,
    error: workflowConfigsError,
  } = useWorkflowConfigsQuery();

  const {
    data: agentWorkflowsData,
    isError: isAgentWorkflowsError,
    error: agentWorkflowsError,
  } = useAgentWorkflowsQuery();

  const {
    data: aiRolesData,
    isError: isAIRolesError,
    error: aiRolesError,
  } = useAIRolesQuery();

  const saveDocumentMutation = useSaveDocumentMutation();
  const exportDocumentMutation = useExportDocumentMutation();

  useEffect(() => {
    if (difyConfigsData) {
      setDifyConfigs(difyConfigsData);
    }
  }, [difyConfigsData, setDifyConfigs]);

  useEffect(() => {
    if (workflowConfigsData) {
      setWorkflowConfigs(workflowConfigsData);
    }
  }, [workflowConfigsData, setWorkflowConfigs]);

  useEffect(() => {
    if (!isDifyConfigsLoading && !isWorkflowConfigsLoading) {
      setConfigsLoaded(true);
    }
  }, [isDifyConfigsLoading, isWorkflowConfigsLoading, setConfigsLoaded]);

  useEffect(() => {
    if (isDifyConfigsError || isWorkflowConfigsError) {
      console.error("加载配置失败:", { difyConfigsError, workflowConfigsError });
      setConfigsLoaded(true);
    }
  }, [isDifyConfigsError, isWorkflowConfigsError, difyConfigsError, workflowConfigsError, setConfigsLoaded]);

  useEffect(() => {
    if (aiRolesData) {
      setWorkflowAgents(aiRolesData);
    }
  }, [aiRolesData, setWorkflowAgents]);

  useEffect(() => {
    if (!agentWorkflowsData) {
      return;
    }

    const workflow = agentWorkflowsData.find((item) => item.name === "智能工作流");

    if (!workflow) {
      setSmartWorkflow(null);
      setUseAgentWorkflow(false);
      return;
    }

    setSmartWorkflow(workflow);
    setUseAgentWorkflow(true);

    const edges = workflow.edges;
    const getOrder = (nodeId: string, cache = new Map<string, number>()): number => {
      if (cache.has(nodeId)) {
        return cache.get(nodeId)!;
      }

      const incoming = edges.filter((edge) => edge.target === nodeId);
      if (incoming.length === 0) {
        cache.set(nodeId, 0);
        return 0;
      }

      const order = Math.max(...incoming.map((edge) => getOrder(edge.source, cache))) + 1;
      cache.set(nodeId, order);
      return order;
    };

    const workflowSteps = workflow.nodes
      .slice()
      .sort((a, b) => getOrder(a.id) - getOrder(b.id))
      .map((node, index) => {
        const label = node.data.label || node.data.agentName || `步骤${index + 1}`;
        const mappedKey = mapStepLabelToKey(label);
        const Icon = iconByIndex[index] || FileText;
        const agent = aiRolesData?.find((item) => item.id === node.agentId);

        return {
          id: index,
          title: label,
          description: index === 0 ? "进行中" : "未开始",
          icon: Icon,
          key: mappedKey,
          status: index === 0 ? "active" : "pending",
          agentId: node.agentId,
          agent,
        };
      });

    setSteps(workflowSteps as any);
  }, [agentWorkflowsData, aiRolesData, setSmartWorkflow, setUseAgentWorkflow, setSteps]);

  useEffect(() => {
    if (isAgentWorkflowsError || isAIRolesError) {
      console.error("加载Agent工作流或AI角色失败:", { agentWorkflowsError, aiRolesError });
      setUseAgentWorkflow(false);
    }
  }, [isAgentWorkflowsError, isAIRolesError, agentWorkflowsError, aiRolesError, setUseAgentWorkflow]);

  useEffect(() => () => {
    trackSessionEnd();
  }, [trackSessionEnd]);

  useEffect(() => {
    setEditorContentDirect(loadContentForStep());
  }, [currentStep, loadContentForStep, setEditorContentDirect]);

  const getStepDifyConfig = useCallback(
    (stepKey: string): DifyAPIConfig | null => {
      if (useAgentWorkflow && smartWorkflow) {
        const step = steps.find((item) => item.key === stepKey && (item as any).agent);
        const agent = step?.agent as AIRoleConfig | undefined;
        if (agent?.difyConfig) {
          return {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            apiUrl: agent.difyConfig.apiUrl,
            apiKey: agent.difyConfig.apiKey,
            enabled: agent.enabled,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
          } as DifyAPIConfig;
        }
      }

      if (!configsLoaded) {
        return null;
      }

      const workflowConfig = workflowConfigs.find((config) => config.stepKey === stepKey);
      if (!workflowConfig?.difyConfigId) {
        return null;
      }

      const config = difyConfigs.find((item) => item.id === workflowConfig.difyConfigId);
      if (!config || !config.enabled) {
        return null;
      }

      return config;
    },
    [configsLoaded, difyConfigs, smartWorkflow, steps, useAgentWorkflow, workflowConfigs],
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      content: inputMessage,
      timestamp: new Date(),
    };

    const messageContext = [...chatMessages, userMessage];

    addUserMessage(inputMessage);
    setInputMessage("");
    setIsTyping(true);

    try {
      let smartSearchConfig = getStepDifyConfig("smartSearch");

      if (!smartSearchConfig) {
        const refreshedDifyConfigs = await configService.getDifyConfigs();
        const refreshedWorkflowConfigs = await configService.getWorkflowConfigs();

        setDifyConfigs(refreshedDifyConfigs);
        setWorkflowConfigs(refreshedWorkflowConfigs);

        const workflowConfig = refreshedWorkflowConfigs.find((item) => item.stepKey === "smartSearch");
        if (workflowConfig) {
          smartSearchConfig =
            refreshedDifyConfigs.find((item) => item.id === workflowConfig.difyConfigId) ?? null;
        }

        if (!smartSearchConfig) {
          const defaultConfig = await configService.getDifyConfig("default-ai-search");
          if (defaultConfig && defaultConfig.enabled) {
            smartSearchConfig = defaultConfig;
          }
        }
      }

      const result = await workflowAPI.aiSearch(
        inputMessage,
        {
          context: messageContext.map((msg) => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        },
        smartSearchConfig && smartSearchConfig.enabled ? smartSearchConfig : undefined,
        conversationId || undefined,
      );

      let responseContent = "抱歉，我无法处理您的请求。";

      if (result.success && result.data) {
        responseContent =
          result.data.result || result.data.answer || "抱歉，未能获取到有效回答。";

        const nextConversationId = result.data.conversationId || result.data.conversation_id;
        if (nextConversationId && nextConversationId !== conversationId) {
          setConversationId(nextConversationId);
        }
      } else if (result.error) {
        responseContent = `抱歉，处理您的请求时出现了问题：${result.error}`;
      }

      addAssistantMessage({ content: responseContent });

      if (result.success && result.data) {
        trackAISearchSuccess();
      }

      setIsTyping(false);
    } catch (error) {
      console.error("智能搜索API调用失败:", error);
      addAssistantMessage({
        content: "抱歉，处理您的请求时出现了错误。请检查智能搜索节点的配置是否正确。",
      });
      setIsTyping(false);
    }
  }, [
    addAssistantMessage,
    addUserMessage,
    chatMessages,
    conversationId,
    getStepDifyConfig,
    inputMessage,
    trackAISearchSuccess,
    setConversationId,
    setDifyConfigs,
    setInputMessage,
    setIsTyping,
    setWorkflowConfigs,
  ]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("复制失败:", error);
    }
  }, []);

  const handleLikeMessage = useCallback(
    (messageId: string) => {
      updateMessageById(messageId, (message) => {
        const nextLiked = !message.liked;
        message.liked = nextLiked;
        if (nextLiked) {
          message.disliked = false;
        }
      });

      const message = chatMessages.find((msg) => msg.id === messageId);
      if (message && !message.disliked) {
        trackMessageLike(messageId, message.content);
      }
    },
    [chatMessages, trackMessageLike, updateMessageById],
  );

  const handleDislikeMessage = useCallback(
    (messageId: string) => {
      updateMessageById(messageId, (message) => {
        const nextDisliked = !message.disliked;
        message.disliked = nextDisliked;
        if (nextDisliked) {
          message.liked = false;
        }
      });

      const message = chatMessages.find((msg) => msg.id === messageId);
      if (message && !message.liked) {
        trackMessageDislike(messageId, message.content);
      }
    },
    [chatMessages, trackMessageDislike, updateMessageById],
  );

  const handleAdoptMessage = useCallback(
    (messageId: string) => {
      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, adopted: !message.adopted }
            : { ...message, adopted: false },
        ),
      );
    },
    [setChatMessages],
  );

  const handleRegenerateMessage = useCallback(
    async (messageId: string) => {
      const messageToRegenerate = chatMessages.find((msg) => msg.id === messageId);
      if (!messageToRegenerate) {
        return;
      }

      updateMessageById(messageId, (message) => {
        message.isRegenerating = true;
      });

      try {
        let smartSearchConfig = getStepDifyConfig("smartSearch");

        if (!smartSearchConfig) {
          await configService.getDifyConfigs();
          await configService.getWorkflowConfigs();
          smartSearchConfig = getStepDifyConfig("smartSearch");

          if (!smartSearchConfig) {
            const defaultConfig = await configService.getDifyConfig("default-ai-search");
            if (defaultConfig && defaultConfig.enabled) {
              smartSearchConfig = defaultConfig;
            }
          }
        }

        const result = await workflowAPI.aiSearch(
          messageToRegenerate.content,
          {
            context: chatMessages.map((msg) => ({
              role: msg.type === "user" ? "user" : "assistant",
              content: msg.content,
            })),
          },
          smartSearchConfig && smartSearchConfig.enabled ? smartSearchConfig : undefined,
        );

        let responseContent = "抱歉，我无法处理您的请求。";

        if (result.success && result.data) {
          responseContent =
            result.data.result || result.data.answer || "抱歉，未能获取到有效回答。";
        } else if (result.error) {
          responseContent = `处理请求时出现问题：${result.error}`;
        }

        updateMessageById(messageId, (message) => {
          message.content = responseContent;
          message.isRegenerating = false;
          message.timestamp = new Date();
        });
      } catch (error) {
        console.error("重新生成消息失败:", error);
        updateMessageById(messageId, (message) => {
          message.isRegenerating = false;
        });
      }
    },
    [chatMessages, getStepDifyConfig, updateMessageById],
  );

  const handleSaveDocument = useCallback(
    (content: string, title?: string) => {
      const effectiveTitle = title || steps[currentStep]?.title || "workflow-draft";
      setEditorContentDirect(content);
      saveDocumentMutation.mutate({ title: effectiveTitle, content });
    },
    [currentStep, saveDocumentMutation, setEditorContentDirect, steps],
  );

  const handleExportDocument = useCallback(
    (content: string, title?: string) => {
      const effectiveTitle = title || steps[currentStep]?.title || "workflow-draft";
      setEditorContentDirect(content);
      exportDocumentMutation.mutate({ title: effectiveTitle, content, format: "pdf" });
    },
    [currentStep, exportDocumentMutation, setEditorContentDirect, steps],
  );

  const triggerSave = useCallback(() => {
    handleSaveDocument(editorContent, steps[currentStep]?.title);
  }, [editorContent, handleSaveDocument, currentStep, steps]);

  const triggerExport = useCallback(() => {
    handleExportDocument(editorContent, steps[currentStep]?.title);
  }, [editorContent, handleExportDocument, currentStep, steps]);

  return (
    <div className="workflow-page">
      <TopNavigation />

      <div className={`workflow-container ${isFullscreenEditor ? "fullscreen-editor" : ""}`}>
        <StepSidebar
          steps={steps}
          currentStep={currentStep}
          progress={progress}
          onStepClick={goToStep}
        />

        <div className="content-section">
          {currentStep === 0 ? (
            <div className="ai-chat-section">
              <ChatHeader
                onResetConversation={resetConversation}
                onOpenHistory={() => navigate("/history")}
                onSave={triggerSave}
                onExport={triggerExport}
              />

              <ChatMessages
                messages={chatMessages}
                isTyping={isTyping}
                processError={processError}
                onAdopt={handleAdoptMessage}
                onCopy={handleCopyMessage}
                onRegenerate={handleRegenerateMessage}
                onLike={handleLikeMessage}
                onDislike={handleDislikeMessage}
                onCloseError={() => setProcessError(null)}
              />

              <ChatInput
                value={inputMessage}
                isProcessing={isProcessing}
                onChange={setInputMessage}
                onSend={handleSendMessage}
                onKeyPress={handleKeyPress}
              />
            </div>
          ) : (
            <EditorPanel
              title={steps.find((step) => step.id === currentStep)?.title}
              content={editorContent}
              isEditing={isEditing}
              onToggleEdit={toggleEditingMode}
              onChange={setEditorContentAndScheduleSave}
              onSave={handleSaveDocument}
              onExport={handleExportDocument}
              error={processError}
              onDismissError={() => setProcessError(null)}
            />
          )}
        </div>
      </div>

      <BottomNavigation
        currentStep={currentStep}
        steps={steps}
        isProcessing={isProcessing}
        onPrev={goPrevStep}
        onNext={goNextStep}
      />

      {loading && (
        <LoadingOverlay isVisible={loading}>
          <LoadingAnimation text={loadingText} progress={loadingProgress} />
        </LoadingOverlay>
      )}
    </div>
  );
};

export default WorkflowPage;
