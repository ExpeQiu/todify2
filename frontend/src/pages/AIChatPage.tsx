import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Plus, ArrowLeft, Bot, User, Zap, FileText, Megaphone, Newspaper, Presentation, Copy, RotateCcw, ThumbsUp, ThumbsDown, MoreHorizontal, History, MessageSquare } from "lucide-react";
import { workflowAPI } from "../services/api";
import { configService } from "../services/configService";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  isRegenerating?: boolean;
}

interface SidebarItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  progress?: number;
  isActive?: boolean;
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("智能助手");
  const [conversationId, setConversationId] = useState<string | null>(null); // 支持多轮对话
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sidebarItems: SidebarItem[] = [
    {
      id: "ai-assistant",
      name: "智能助手",
      icon: <Bot className="w-5 h-5" />,
      isActive: true,
    },
    {
      id: "tech-packaging",
      name: "技术包装",
      icon: <Zap className="w-5 h-5" />,
      progress: 0,
    },
    {
      id: "promotion-strategy", 
      name: "推广策略",
      icon: <Megaphone className="w-5 h-5" />,
      progress: 0,
    },
    {
      id: "tech-newsletter",
      name: "技术通稿",
      icon: <Newspaper className="w-5 h-5" />,
      progress: 0,
    },
    {
      id: "press-release",
      name: "发布会稿",
      icon: <Presentation className="w-5 h-5" />,
      progress: 0,
    },
  ];

  // 开始新对话的函数
  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage("");
    console.log('🆕 开始新对话，重置conversationId');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 获取智能工作流AI问答的Dify配置
      const aiQAConfig = await configService.getDifyConfig("smart-workflow-ai-qa");
      
      // 调用AI问答API，传递conversationId支持多轮对话
      const result = await workflowAPI.aiSearch(
        inputMessage.trim(),
        { 
          context: messages.map(msg => ({ 
            role: msg.sender === 'user' ? 'user' : 'assistant', 
            content: msg.content 
          }))
        },
        (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined,
        conversationId || undefined
      );

      let responseContent = "抱歉，我无法处理您的请求。";
      
      if (result.success && result.data) {
        // 处理不同的返回格式
        if (result.data.result) {
          responseContent = result.data.result;
        } else if (result.data.answer) {
          responseContent = result.data.answer;
        } else {
          responseContent = "抱歉，未能获取到有效回答。";
        }

        // 更新conversationId以支持多轮对话
        if (result.data.conversation_id && result.data.conversation_id !== conversationId) {
          setConversationId(result.data.conversation_id);
          console.log('🔄 AIChatPage更新conversation_id:', result.data.conversation_id);
        } else if (result.data.conversationId && result.data.conversationId !== conversationId) {
          setConversationId(result.data.conversationId);
          console.log('🔄 AIChatPage更新conversationId:', result.data.conversationId);
        }
      } else if (result.error) {
        responseContent = `处理请求时出现问题：${result.error}`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI问答API调用失败:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `抱歉，服务暂时不可用。错误信息：${error instanceof Error ? error.message : '未知错误'}`,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowSelect = (workflowId: string, workflowName: string) => {
    setSelectedWorkflow(workflowName);
    // 这里可以添加切换工作流的逻辑
  };

  // 快捷操作处理函数
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 可以添加复制成功的提示
      console.log('消息已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleLikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, liked: !msg.liked, disliked: false }
        : msg
    ));
  };

  const handleDislikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, disliked: !msg.disliked, liked: false }
        : msg
    ));
  };

  const handleRegenerateMessage = async (messageId: string) => {
    // 找到要重新生成的消息
    const messageToRegenerate = messages.find(msg => msg.id === messageId);
    if (!messageToRegenerate) return;

    // 标记消息为重新生成中
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isRegenerating: true }
        : msg
    ));

    try {
      // 获取AI问答的Dify配置
      const aiQAConfig = await configService.getDifyConfig("default-ai-search");
      
      if (!aiQAConfig) {
        throw new Error("AI问答配置未找到");
      }

      // 重新调用AI问答API - 只有启用时才传递配置
      const result = await workflowAPI.aiSearch(
        messageToRegenerate.content,
        {},
        (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined
      );

      let responseContent = "抱歉，我无法处理您的请求。";
      
      if (result.success && result.data) {
        if (result.data.result) {
          responseContent = result.data.result;
        } else if (result.data.answer) {
          responseContent = result.data.answer;
        } else {
          responseContent = "抱歉，未能获取到有效回答。";
        }
      } else if (result.error) {
        responseContent = `处理请求时出现问题：${result.error}`;
      }

      // 更新消息内容
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              content: responseContent, 
              isRegenerating: false,
              timestamp: new Date()
            }
          : msg
      ));
    } catch (error) {
      console.error('重新生成消息失败:', error);
      
      // 恢复消息状态
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isRegenerating: false }
          : msg
      ));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航栏 */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* 顶部返回按钮 */}
        <div className="p-4 border-b border-gray-100">
          <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm">返回首页</span>
          </button>
        </div>

        {/* 工作流进度 */}
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs text-gray-500 mb-2">工作流进度</div>
          <div className="text-sm font-medium text-gray-800">0%</div>
        </div>

        {/* 工作流列表 */}
        <div className="flex-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 cursor-pointer transition-colors border-b border-gray-50 ${
                item.isActive
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleWorkflowSelect(item.id, item.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${item.isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {item.icon}
                  </div>
                  <span className={`ml-3 text-sm ${
                    item.isActive ? "text-blue-600 font-medium" : "text-gray-700"
                  }`}>
                    {item.name}
                  </span>
                </div>
                {item.progress !== undefined && (
                  <div className="text-xs text-gray-400">
                    {item.progress}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部标题栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">AI问答</h1>
              <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  技术包装
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                  技术策略
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                  技术通稿
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                  发布会稿
                </span>
                {conversationId && (
                  <span className="flex items-center text-green-600">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    多轮对话中
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={startNewConversation}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md border-2 border-blue-500"
                style={{ minWidth: '120px', zIndex: 1000 }}
              >
                <Plus className="w-4 h-4" />
                <span>新对话</span>
              </button>
              <button
                onClick={() => (window.location.href = "/history")}
                className="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md border-2 border-green-500"
                style={{ minWidth: '140px', zIndex: 1000 }}
              >
                <History className="w-4 h-4" />
                <span>搜索历史记录</span>
              </button>
            </div>
          </div>
        </div>

        {/* 聊天消息区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>
                <p className="text-gray-500 text-sm max-w-md">
                  我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg group relative ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === "ai" && (
                        <Bot className="w-4 h-4 mt-1 text-blue-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.sender === "user" ? "text-blue-100" : "text-gray-400"
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI消息的快捷操作按钮 - 移到消息框外部 */}
                    {message.sender === "ai" && (
                      <div className="absolute -right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white border border-gray-200 rounded-lg shadow-md p-0.5 z-10">
                        {/* 复制按钮 */}
                        <button
                          onClick={() => handleCopyMessage(message.content)}
                          className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-all duration-150 hover:scale-105"
                          title="复制消息"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-600 hover:text-gray-800" />
                        </button>
                        
                        {/* 重新生成按钮 */}
                        <button
                          onClick={() => handleRegenerateMessage(message.id)}
                          disabled={message.isRegenerating}
                          className="flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                          title="重新生成"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 text-gray-600 hover:text-gray-800 ${message.isRegenerating ? 'animate-spin' : ''}`} />
                        </button>
                        
                        {/* 点赞按钮 */}
                        <button
                          onClick={() => handleLikeMessage(message.id)}
                          className={`flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-all duration-150 hover:scale-105 ${
                            message.liked ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:text-gray-800'
                          }`}
                          title="点赞"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* 点踩按钮 */}
                        <button
                          onClick={() => handleDislikeMessage(message.id)}
                          className={`flex items-center justify-center w-7 h-7 hover:bg-gray-100 rounded-md transition-all duration-150 hover:scale-105 ${
                            message.disliked ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:text-gray-800'
                          }`}
                          title="点踩"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 底部输入区域 */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="询问任何问题"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <div className="w-5 h-5 bg-gray-400 rounded"></div>
            </button>

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;