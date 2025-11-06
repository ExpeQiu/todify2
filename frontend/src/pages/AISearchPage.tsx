import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import TopNavigation from "../components/TopNavigation";
import SourceSidebar, { Source } from "../components/ai-search/SourceSidebar";
import DialogueContent from "../components/ai-search/DialogueContent";
import StudioSidebar from "../components/ai-search/StudioSidebar";
import ConversationList from "../components/ai-search/ConversationList";
import FieldMappingConfig from "../components/ai-search/FieldMappingConfig";
import { Conversation, OutputContent, WorkflowConfig, FieldMappingConfig as FieldMappingConfigType } from "../types/aiSearch";
import { aiSearchService } from "../services/aiSearchService";

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

  // 加载对话历史和输出内容
  useEffect(() => {
    loadConversations();
    loadOutputs();
    loadWorkflowConfig();
  }, []);

  // 加载工作流配置
  const loadWorkflowConfig = async () => {
    try {
      const config = await aiSearchService.getWorkflowConfig();
      setWorkflowConfig(config);
    } catch (error) {
      console.error("加载工作流配置失败:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await aiSearchService.getConversations();
      setConversations(data);
      
      // 如果没有当前对话且有历史对话，选择最新的
      if (!currentConversation && data.length > 0) {
        setCurrentConversation(data[0]);
      }
    } catch (error) {
      console.error("加载对话历史失败:", error);
    }
  };

  const loadOutputs = async () => {
    try {
      const data = await aiSearchService.getOutputs();
      setOutputs(data);
    } catch (error) {
      console.error("加载输出内容失败:", error);
    }
  };

  const handleSourcesChange = (newSources: Source[]) => {
    setSources(newSources);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSourceIds(selectedIds);
  };

  const handleCreateConversation = async () => {
    try {
      const selectedSources = sources.filter((s) => selectedSourceIds.includes(s.id));
      
      if (selectedSources.length === 0) {
        alert("请至少选择一个来源");
        return;
      }

      const conversation = await aiSearchService.createConversation({
        title: `对话 ${new Date().toLocaleString()}`,
        sources: selectedSources,
      });

      setCurrentConversation(conversation);
      await loadConversations();
    } catch (error) {
      console.error("创建对话失败:", error);
      alert("创建对话失败，请稍后重试");
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    // 加载完整的对话详情
    const fullConversation = await aiSearchService.getConversation(conversation.id);
    if (fullConversation) {
      setCurrentConversation(fullConversation);
    }
    setShowConversationList(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await aiSearchService.deleteConversation(id);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
      await loadConversations();
    } catch (error) {
      console.error("删除对话失败:", error);
      alert("删除对话失败，请稍后重试");
    }
  };

  const handleMessageSent = async (message: any) => {
    // 重新加载当前对话
    if (currentConversation) {
      const updated = await aiSearchService.getConversation(currentConversation.id);
      if (updated) {
        setCurrentConversation(updated);
      }
    }
    await loadConversations();
  };

  const handleSaveToNotes = (content: string) => {
    // TODO: 实现保存到笔记功能
    console.log("保存到笔记:", content);
  };

  const handleGenerateOutput = async (
    type: 'ppt' | 'script' | 'mindmap',
    messageId: string,
    content: string
  ) => {
    if (!currentConversation) {
      alert("请先创建对话");
      return;
    }

    try {
      await aiSearchService.generateOutput(
        type,
        currentConversation.id,
        messageId,
        content
      );
      await loadOutputs();
      
      // 重新加载当前对话以更新消息的输出
      const updated = await aiSearchService.getConversation(currentConversation.id);
      if (updated) {
        setCurrentConversation(updated);
      }
    } catch (error) {
      console.error("生成输出内容失败:", error);
      alert("生成输出内容失败，请稍后重试");
    }
  };

  const handleCreatePPT = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      alert("请先进行对话");
      return;
    }
    
    const lastAiMessage = [...currentConversation.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    
    if (lastAiMessage) {
      handleGenerateOutput("ppt", lastAiMessage.id, lastAiMessage.content);
    }
  };

  const handleCreateScript = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      alert("请先进行对话");
      return;
    }
    
    const lastAiMessage = [...currentConversation.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    
    if (lastAiMessage) {
      handleGenerateOutput("script", lastAiMessage.id, lastAiMessage.content);
    }
  };

  const handleCreateMindMap = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      alert("请先进行对话");
      return;
    }
    
    const lastAiMessage = [...currentConversation.messages]
      .reverse()
      .find((m) => m.role === "assistant");
    
    if (lastAiMessage) {
      handleGenerateOutput("mindmap", lastAiMessage.id, lastAiMessage.content);
    }
  };

  // 如果没有当前对话，自动创建
  useEffect(() => {
    if (!currentConversation && sources.length > 0 && selectedSourceIds.length > 0) {
      handleCreateConversation();
    }
  }, [sources, selectedSourceIds]);

  const handleFieldMappingConfigSave = (config: FieldMappingConfigType) => {
    setFieldMappingConfig(config);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <TopNavigation currentPageTitle="AI技术问答" />
      
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
          onMessageSent={handleMessageSent}
          onSaveToNotes={handleSaveToNotes}
          onGenerateOutput={handleGenerateOutput}
        />

        {/* 右侧栏 - Studio */}
        <StudioSidebar
          onCreatePPT={handleCreatePPT}
          onCreateScript={handleCreateScript}
          onCreateMindMap={handleCreateMindMap}
          outputs={outputs}
          onShowConversationList={() => setShowConversationList(true)}
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

