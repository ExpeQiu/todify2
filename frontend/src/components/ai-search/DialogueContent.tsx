import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Paperclip, X, AlertCircle, RotateCcw, Loader2, Plus, History } from "lucide-react";
import { Message, Source, Conversation } from "../../types/aiSearch";
import { aiSearchService } from "../../services/aiSearchService";
import MessageItem from "./MessageItem";

interface DialogueContentProps {
  conversation: Conversation | null;
  sources: Source[];
  contextWindowSize: number;
  onContextWindowSizeChange?: (value: number) => void;
  workflowId?: string | null;
  hasMoreMessages?: boolean;
  onLoadMoreMessages?: () => void;
  isLoadingMore?: boolean;
  onMessageSent?: (message: Message) => void;
  onSaveToNotes?: (content: string) => void;
  onEnsureConversation?: () => Promise<Conversation | null>;
  onCreateNewConversation?: () => Promise<void>;
  onShowHistory?: () => void;
  availableWorkflows?: Array<{ id: string; name: string }>;
  selectedWorkflowId?: string | null;
  onWorkflowChange?: (workflowId: string) => void;
  isWorkflowLoading?: boolean;
  dialogueTitle?: string;
}

const DialogueContent: React.FC<DialogueContentProps> = ({
  conversation,
  sources,
  contextWindowSize,
  onContextWindowSizeChange,
  workflowId,
  hasMoreMessages,
  onLoadMoreMessages,
  isLoadingMore,
  onMessageSent,
  onSaveToNotes,
  onEnsureConversation,
  onCreateNewConversation,
  onShowHistory,
  availableWorkflows = [],
  selectedWorkflowId,
  onWorkflowChange,
  isWorkflowLoading = false,
  dialogueTitle = "AI内容助手",
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSubmissionRef = useRef<{ content: string; files: File[] } | null>(null);

  // 同步对话消息
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages || []);
    } else {
      setMessages([]);
    }
    setErrorMessage(null);
    setErrorDetail(null);
  }, [conversation]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (override?: { content: string; files: File[] }) => {
    const draftContent = override?.content ?? query.trim();
    const draftFiles = override?.files ?? selectedFiles;

    if (!draftContent && draftFiles.length === 0) return;

    let activeConversation = conversation;

    if (!activeConversation && onEnsureConversation) {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setErrorDetail(null);
        const ensured = await onEnsureConversation();
        if (!ensured) {
          setIsLoading(false);
          setErrorMessage("请先在左侧选择来源并创建对话");
          return;
        }
        activeConversation = ensured;
        setMessages(ensured.messages || []);
      } catch (error: any) {
        console.error("创建对话失败:", error);
        setIsLoading(false);
        setErrorMessage(error?.message || "创建对话失败，请稍后重试");
        return;
      }
    }

    if (!activeConversation) {
      setErrorMessage("请先创建对话");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setErrorDetail(null);

    try {
      const submission = {
        content: draftContent || "已上传文件",
        files: draftFiles,
      };
      lastSubmissionRef.current = submission;

      // 检测是否是首次发送（messages.length === 0 且 sources.length > 0）
      const isFirstMessage = messages.length === 0 && sources.length > 0;
      
      // 构建文件列表和知识库名称（仅在首次发送时）
      let fileList: string | undefined;
      let knowledgeBaseNames: string | undefined;
      
      if (isFirstMessage) {
        // 筛选文件（type === 'external'）
        const fileSources = sources.filter((s) => s.type === 'external');
        if (fileSources.length > 0) {
          fileList = fileSources.map((s) => s.title).join(', ');
        }
        
        // 筛选知识库（type === 'knowledge_base'）
        const knowledgeBaseSources = sources.filter((s) => s.type === 'knowledge_base');
        if (knowledgeBaseSources.length > 0) {
          knowledgeBaseNames = knowledgeBaseSources.map((s) => s.title).join(', ');
        }
      }

      const response = await aiSearchService.sendMessage(activeConversation.id, {
        content: submission.content,
        sources: sources,
        files: submission.files,
        contextWindowSize,
        workflowId: workflowId || undefined,
        fileList: fileList,
        knowledgeBaseNames: knowledgeBaseNames,
      });

      if (response.userMessage && response.aiMessage) {
        const newMessages = [
          ...messages,
          response.userMessage,
          response.aiMessage,
        ];
        setMessages(newMessages);

        if (onMessageSent) {
          onMessageSent(response.aiMessage);
        }
      } else if (response.userMessage) {
        const newMessages = [...messages, response.userMessage];
        setMessages(newMessages);
      }

      if (response.error) {
        setErrorMessage(response.error);
        setErrorDetail(response.errorDetail || null);
      }

      if (!override) {
        setQuery("");
      }
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("发送消息失败:", error);
      setErrorMessage(error?.response?.data?.error || "发送消息失败，请稍后重试");
      setErrorDetail(error?.message || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const translateErrorMessage = (msg: string | null): string | null => {
    if (!msg) return null;
    const m = msg.trim();
    if (m.includes("fieldMappingService.getFieldMappingConfig is not a function")) {
      return "获取字段映射配置失败：缺少 getFieldMappingConfig 方法";
    }
    return m;
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-lg font-semibold text-gray-900">{dialogueTitle}</h2>
          {conversation ? (
            <p className="text-xs text-gray-500 mt-1">{conversation.title}</p>
          ) : (
            <div className="text-xs text-transparent mt-1">占位</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 当前工作流选择 */}
          {availableWorkflows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">当前工作流</span>
              <div className="relative">
                <select
                  value={selectedWorkflowId || ""}
                  onChange={(event) => {
                    if (onWorkflowChange && event.target.value) {
                      onWorkflowChange(event.target.value);
                    }
                  }}
                  className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={availableWorkflows.length === 0 || isWorkflowLoading}
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
          )}
          <button
            onClick={async () => {
              if (onCreateNewConversation) {
                await onCreateNewConversation();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            提出一个新问题
          </button>
          <button
            onClick={() => {
              if (onShowHistory) {
                onShowHistory();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <History className="w-4 h-4" />
            查看历史对话
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {sources.length}个来源
            </p>
            <p className="text-gray-600">开始输入问题以获取AI回答</p>
          </div>
        ) : (
          <div>
            {hasMoreMessages && (
              <div className="mb-4 flex items-center justify-center">
                <button
                  onClick={() => onLoadMoreMessages?.()}
                  disabled={isLoadingMore || !onLoadMoreMessages}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      加载中…
                    </>
                  ) : (
                    "加载更多历史"
                  )}
                </button>
              </div>
            )}
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onCopy={async (content) => {
                  await navigator.clipboard.writeText(content);
                }}
                onSave={(content) => {
                  if (onSaveToNotes) {
                    onSaveToNotes(content);
                  }
                }}
              />
            ))}
            {isLoading && (
              <div className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {errorMessage && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-red-700">{translateErrorMessage(errorMessage)}</p>
                  {lastSubmissionRef.current && !isLoading && (
                    <button
                      onClick={() => {
                        if (!conversation || !lastSubmissionRef.current) {
                          return;
                        }
                        setQuery(lastSubmissionRef.current.content === "已上传文件" ? "" : lastSubmissionRef.current.content);
                        handleSend(lastSubmissionRef.current);
                      }}
                      className="flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      重试
                    </button>
                  )}
                </div>
                {errorDetail && (
                  <p className="mt-1 text-xs text-red-600/80 break-words">{errorDetail}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 已选择的文件 */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
              >
                <span className="text-sm text-gray-700 truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入框和按钮 */}
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="添加文件"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex flex-col">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="开始输入..."
              rows={1}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{sources.length}个来源</span>
                <label className="flex items-center gap-1">
                  <span>上下文窗口:</span>
                  <select
                    value={contextWindowSize}
                    onChange={(event) => {
                      const value = parseInt(event.target.value, 10);
                      onContextWindowSizeChange?.(value);
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value={5}>最近5条</option>
                    <option value={10}>最近10条</option>
                    <option value={20}>最近20条</option>
                    <option value={0}>全部历史</option>
                  </select>
                </label>
              </div>
              <span className="text-xs text-gray-400">Enter发送，Shift+Enter换行</span>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={isLoading || (!query.trim() && selectedFiles.length === 0)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="发送"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogueContent;