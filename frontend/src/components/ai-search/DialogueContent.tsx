import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Paperclip, X } from "lucide-react";
import { Message, Source, Conversation } from "../../types/aiSearch";
import { aiSearchService } from "../../services/aiSearchService";
import MessageItem from "./MessageItem";

interface DialogueContentProps {
  conversation: Conversation | null;
  sources: Source[];
  onMessageSent?: (message: Message) => void;
  onSaveToNotes?: (content: string) => void;
  onGenerateOutput?: (type: 'ppt' | 'script' | 'mindmap', messageId: string, content: string) => void;
}

const DialogueContent: React.FC<DialogueContentProps> = ({
  conversation,
  sources,
  onMessageSent,
  onSaveToNotes,
  onGenerateOutput,
}) => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 同步对话消息
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages || []);
    } else {
      setMessages([]);
    }
  }, [conversation]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() && selectedFiles.length === 0) return;
    if (!conversation) {
      alert("请先创建对话");
      return;
    }

    setIsLoading(true);

    try {
      // 发送消息
      const response = await aiSearchService.sendMessage(conversation.id, {
        content: query.trim() || "已上传文件",
        sources: sources,
        files: selectedFiles,
      });

      // 更新消息列表
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

      // 清空输入和文件
      setQuery("");
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      alert("发送消息失败，请稍后重试");
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

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">对话</h2>
          {conversation && (
            <p className="text-xs text-gray-500 mt-1">{conversation.title}</p>
          )}
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
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {sources.length}个来源
              </span>
              <span className="text-xs text-gray-400">
                Enter发送，Shift+Enter换行
              </span>
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