import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Brain,
  ArrowLeft,
  Mic,
  BookOpen,
  ArrowRight,
  Download,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Share2,
  Sparkles,
  Save,
  X,
  Check,
  Edit3,
  Eye,
} from "lucide-react";
import { BaseNodeProps } from "../../types/nodeComponent";
import { workflowAPI } from "../../services/api";
import KnowledgePointSelector, {
  KnowledgePoint,
  SelectionItem,
  ContentType,
} from "../common/KnowledgePointSelector";
import "./NodeComponent.css";
import "../../styles/markdown.css";

interface SpeechNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

// 对话历史接口
interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: number;
  liked?: boolean;
  disliked?: boolean;
}

const SpeechNode: React.FC<SpeechNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
  aiRole,
  mode,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术发布稿");
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

  // 补充信息输入框状态 (对接工作流 Additional_information)
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  // 对话框显示控制状态
  const [showConversation, setShowConversation] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  
  // 对话历史状态
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // 多轮对话支持
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // 知识点选择相关状态
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(true);

  // 保存知识点模态框状态
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SelectionItem[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const tabs = ["信息检索", "技术包装", "技术策略", "技术通稿", "技术发布稿"];
  
  // 用于自动滚动到最新消息的ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // 模拟知识点数据
  const knowledgePoints: KnowledgePoint[] = [
    {
      id: "1",
      vehicleModel: "Model S",
      vehicleSeries: "Tesla",
      techCategory: "动力系统",
      techPoint: "三元锂电池",
      description: "高能量密度的锂离子电池技术，提供长续航里程",
    },
    {
      id: "2",
      vehicleModel: "Model S",
      vehicleSeries: "Tesla",
      techCategory: "电池管理",
      techPoint: "BMS系统",
      description: "智能电池管理系统，确保电池安全和性能",
    },
    {
      id: "3",
      vehicleModel: "Model S",
      vehicleSeries: "Tesla",
      techCategory: "自动驾驶",
      techPoint: "FSD芯片",
      description: "自主研发的全自动驾驶芯片，算力强大",
    },
    {
      id: "4",
      vehicleModel: "Model 3",
      vehicleSeries: "Tesla",
      techCategory: "动力系统",
      techPoint: "永磁同步电机",
      description: "高效率的永磁同步电机，提供强劲动力",
    },
    {
      id: "5",
      vehicleModel: "Model 3",
      vehicleSeries: "Tesla",
      techCategory: "智能网联",
      techPoint: "车载娱乐系统",
      description: "17英寸触控屏，集成丰富的娱乐功能",
    },
    {
      id: "6",
      vehicleModel: "Model X",
      vehicleSeries: "Tesla",
      techCategory: "车身结构",
      techPoint: "鹰翼门",
      description: "独特的鹰翼门设计，提升乘坐体验",
    },
    {
      id: "7",
      vehicleModel: "Model X",
      vehicleSeries: "Tesla",
      techCategory: "空气动力学",
      techPoint: "主动进气格栅",
      description: "智能调节进气量，优化空气动力学性能",
    },
    {
      id: "8",
      vehicleModel: "Model Y",
      vehicleSeries: "Tesla",
      techCategory: "制造工艺",
      techPoint: "一体化压铸",
      description: "后车身一体化压铸技术，提高结构强度",
    },
  ];

  // 获取唯一的车型和技术分类（如果需要在其他地方使用）
  // const vehicleModels = [...new Set(knowledgePoints.map(kp => kp.vehicleModel))];
  // const techCategories = [...new Set(knowledgePoints.map(kp => kp.techCategory))];

  const handleAiSearch = async () => {
    if (internalLoading) return;
    if (query.trim()) {
      // 设置提交的查询内容并显示对话框
      setSubmittedQuery(query.trim());
      setShowConversation(true);
      
      // 添加用户消息到历史
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: query.trim(),
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, userMessage]);
      
      setInternalLoading(true);
      setAiResponse("AI正在生成发布会稿内容...");

      try {
        let result;
        
        // 如果提供了aiRole，优先使用AI角色服务
        if (aiRole && aiRole.difyConfig.connectionType === 'chatflow') {
          console.log('使用AI角色服务:', aiRole.name);
          const { aiRoleService } = await import('../../services/aiRoleService');
          
          // 合并query和additionalInfo
          const fullQuery = additionalInfo.trim()
            ? `${query.trim()}\n\n补充信息：${additionalInfo.trim()}`
            : query.trim();
          
          const roleResponse = await aiRoleService.chatWithRole(
            aiRole.id,
            fullQuery,
            {},
            conversationId
          );
          
          if (roleResponse.success && roleResponse.data) {
            // 构建统一的响应格式
            result = {
              success: true,
              data: {
                answer: roleResponse.data.answer || roleResponse.data.result,
                conversation_id: roleResponse.data.conversation_id,
                conversationId: roleResponse.data.conversation_id,
              }
            };
          } else {
            result = {
              success: false,
              error: roleResponse.error || 'AI角色调用失败'
            };
          }
        } else {
          // 回退到原有逻辑
          // 准备工作流输入参数，对接 Additional_information 和 sys.query
          const workflowInputs = {
            Additional_information: additionalInfo.trim() || "", // 对接补充信息输入框
            'sys.query': query.trim() // 对接主要查询输入框
          };

          // 调用本地后端API（不传递difyConfig参数，使用本地后端）
          console.log("🔄 SpeechNode calling API with conversationId:", conversationId || 'NEW');
          result = await workflowAPI.speech(workflowInputs, undefined, conversationId);
        }

        console.log("=== SpeechNode API Response Debug ===");
        console.log("Full result:", JSON.stringify(result, null, 2));
        console.log("result.data:", JSON.stringify(result.data, null, 2));
        console.log("result.data type:", typeof result.data);

        if (result.success && result.data) {
          // 提取text字段内容进行显示
          let responseText = '';
          
          // 检查是否使用了AI角色服务（简化格式）
          if (aiRole && aiRole.difyConfig.connectionType === 'chatflow' && result.data.answer) {
            // AI角色服务返回的简化格式
            responseText = result.data.answer;
          } else if (typeof result.data === 'string') {
            try {
              // 尝试解析JSON字符串
              const parsedData = JSON.parse(result.data);
              responseText = parsedData.text || parsedData.answer || parsedData.output || result.data;
            } catch (e) {
              // 如果不是JSON，直接使用字符串内容
              responseText = result.data;
            }
          } else if (result.data.data && result.data.data.outputs && result.data.data.outputs.text) {
            // 优先提取data.outputs.text字段（嵌套的Dify工作流响应格式）
            responseText = result.data.data.outputs.text;
          } else if (result.data.data && result.data.data.outputs && result.data.data.outputs.answer) {
            // 备用：提取data.outputs.answer字段
            responseText = result.data.data.outputs.answer;
          } else if (result.data.outputs && result.data.outputs.text) {
            // 提取outputs.text字段（直接的Dify工作流响应格式）
            responseText = result.data.outputs.text;
          } else if (result.data.outputs && result.data.outputs.answer) {
            // 备用：提取outputs.answer字段
            responseText = result.data.outputs.answer;
          } else if (result.data.text) {
            // 直接提取text字段（兼容其他格式）
            responseText = result.data.text;
          } else {
            // 最后备用字段
            responseText = result.data.answer || result.data.output || JSON.stringify(result.data, null, 2);
          }
          
          console.log("=== Text Extraction Debug ===");
          console.log("Extracted responseText:", responseText);
          console.log("responseText length:", responseText.length);
          
          setAiResponse(responseText);

          // 更新conversationId以支持多轮对话
          // 从 result.data 中提取 conversation_id（这是 DifyWorkflowResponse 的顶级字段）
          const newConversationId = result.data.conversation_id || result.data.conversationId;
          if (newConversationId) {
            setConversationId(newConversationId);
            console.log('🔄 SpeechNode updated conversationId:', newConversationId);
          } else {
            console.warn('⚠️ SpeechNode: No conversation_id in response');
          }

          // 添加AI响应到历史
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: responseText,
            timestamp: Date.now() + 1,
          };
          setChatHistory((prev) => [...prev, aiMessage]);

          // 通知父组件执行完成
          onExecute({
            query: query.trim(),
            additionalInfo: additionalInfo.trim(),
            response: responseText,
            metadata: result.data.metadata,
            workflowInputs: workflowInputs
          });
        } else {
          setAiResponse(result.error || "发布会稿生成失败，请稍后重试。");
        }
      } catch (error) {
        console.error("发布会稿生成错误:", error);
        setAiResponse("网络错误，请检查连接后重试。");
      } finally {
        setInternalLoading(false);
      }
      
      // 清空输入框
      setQuery("");
      setAdditionalInfo("");
    }
  };

  const handleAdopt = () => {
    // 直接打开知识点选择确认框
    setModalSelectedItems(selectedItems);
    setShowSaveModal(true);
  };

  // 处理打开保存模态框
  const handleOpenSaveModal = () => {
    setModalSelectedItems(selectedItems);
    setShowSaveModal(true);
  };

  // 处理关闭保存模态框
  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModalSelectedItems([]);
  };

  // 处理输入框回车键
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (internalLoading) return;
      handleAiSearch();
    }
  };

  // 处理确认保存
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      console.log("保存知识点:", modalSelectedItems);
      // 这里可以添加实际的保存逻辑
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟保存延迟
      alert(`已保存 ${modalSelectedItems.length} 个知识点`);
      setShowSaveModal(false);
      setModalSelectedItems([]);
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    // 导出最后一条AI消息的内容
    const content = getLastAiMessageContent();
    if (content) {
      // 创建一个Blob对象包含用户内容，使用markdown格式
      const blob = new Blob([content], {
        type: "text/markdown;charset=utf-8",
      });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `speech-result-${new Date().toISOString().slice(0, 10)}.md`;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      URL.revokeObjectURL(url);
    }
  };

  // 获取最后一条AI消息的内容
  const getLastAiMessageContent = () => {
    if (chatHistory.length === 0) return '';
    const lastMessage = chatHistory[chatHistory.length - 1];
    return lastMessage.type === 'ai' ? lastMessage.content : '';
  };

  // 快捷功能按钮处理函数
  const handleCopy = async () => {
    const content = getLastAiMessageContent();
    if (content) {
      try {
        await navigator.clipboard.writeText(content);
        console.log("内容已复制到剪贴板");
        alert("内容已复制到剪贴板！");
      } catch (err) {
        console.error("复制失败:", err);
        alert("复制失败，请重试");
      }
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false); // 如果之前不喜欢，取消不喜欢状态
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false); // 如果之前喜欢，取消喜欢状态
  };

  const handleRegenerate = async () => {
    // 重新生成功能 - 不添加新的用户消息，只重新生成AI回复
    const lastUserMessage = [...chatHistory].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage && !internalLoading) {
      setInternalLoading(true);
      
      // 准备工作流输入参数
      const workflowInputs = {
        Additional_information: additionalInfo.trim() || "",
        'sys.query': lastUserMessage.content
      };

      try {
        console.log("🔄 SpeechNode Regenerate with conversationId:", conversationId || 'NEW');
        const result = await workflowAPI.speech(workflowInputs, undefined, conversationId);

        if (result.success && result.data) {
          let responseText = '';
          
          if (typeof result.data === 'string') {
            try {
              const parsedData = JSON.parse(result.data);
              responseText = parsedData.text || parsedData.answer || parsedData.output || result.data;
            } catch (e) {
              responseText = result.data;
            }
          } else if (result.data.data?.outputs?.text) {
            responseText = result.data.data.outputs.text;
          } else if (result.data.data?.outputs?.answer) {
            responseText = result.data.data.outputs.answer;
          } else if (result.data.outputs?.text) {
            responseText = result.data.outputs.text;
          } else if (result.data.outputs?.answer) {
            responseText = result.data.outputs.answer;
          } else if (result.data.text) {
            responseText = result.data.text;
          } else {
            responseText = result.data.answer || result.data.output || JSON.stringify(result.data, null, 2);
          }
          
          setAiResponse(responseText);
          
          // 更新对话历史 - 替换最后一条AI消息
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: responseText,
            timestamp: Date.now() + 1,
          };
          setChatHistory((prev) => {
            const newHistory = [...prev];
            // 移除最后一条AI消息（如果存在）
            if (newHistory.length > 0 && newHistory[newHistory.length - 1].type === 'ai') {
              newHistory.pop();
            }
            // 添加新的AI消息
            newHistory.push(aiMessage);
            return newHistory;
          });
          
          const newConversationId = result.data.conversation_id || result.data.conversationId;
          if (newConversationId) {
            setConversationId(newConversationId);
          }
        } else {
          console.error("重新生成失败:", result.error);
        }
      } catch (error) {
        console.error("重新生成错误:", error);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-oid="bjc6pve">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="o5eee.m">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4" data-oid="2nqmjy0">
          <div className="flex items-center justify-between" data-oid="mqlklep">
            <div className="flex items-center gap-4" data-oid="f2e8kib">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                data-oid="qgx.sm5"
              >
                <ArrowLeft className="w-4 h-4" data-oid="vj7si6q" />
                <span className="text-sm" data-oid="qhvx8og">
                  返回
                </span>
              </button>
              <div className="flex items-center gap-3" data-oid="q-:pwi.">
                <div
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                  data-oid=":rio92h"
                >
                  <Mic className="w-4 h-4 text-blue-600" data-oid="om-sboh" />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid="fc750hw"
                >
                  发布会稿
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3" data-oid="jzeqqx2">
              <span className="text-sm text-gray-500" data-oid="w_b7bqm">
                中文
              </span>
              <button 
                onClick={handleCopy}
                disabled={chatHistory.length === 0 || chatHistory[chatHistory.length - 1].type !== 'ai'}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="将内容复制到剪贴板"
              >
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" data-oid="i8f74zy">
        {/* 主要内容区域 - 单栏布局，AI对话框占满整个页面 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          data-oid="xtye2j_"
        >
          <div
            className="w-full min-h-[calc(100vh-180px)] flex flex-col"
            data-oid=".ce84mh"
          >
            {/* AI对话区域 - 占满整个页面 */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 min-h-0" data-oid="08quqzc">
              <div className="flex-1 flex flex-col min-h-0" data-oid="gfded2o">
                {/* 补充信息输入框 (对接工作流 Additional_information) */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl" data-oid="enhanced-info-section">
                  <div className="flex items-center gap-2 mb-3" data-oid="enhanced-info-header">
                    <Sparkles className="w-5 h-5 text-purple-600" data-oid="enhanced-info-icon" />
                    <span className="text-sm font-medium text-purple-700" data-oid="enhanced-info-title">
                      补充信息
                    </span>
                  </div>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="请输入补充信息，如发布会背景、产品特色、目标受众等，这将帮助AI生成更精准的演讲稿..."
                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-sm bg-white"
                    rows={3}
                    data-oid="enhanced-info-textarea"
                  />
                  <div className="mt-2 text-xs text-purple-600" data-oid="enhanced-info-hint">
                    提示：详细的背景信息将帮助AI生成更专业、更符合您需求的发布会稿
                  </div>
                </div>

                {/* AI助手头像和标识 */}
                <div
                  className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-shrink-0"
                  data-oid="qaq0omf"
                >
                  <div
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                    data-oid="k9941v7"
                  >
                    <Mic className="w-5 h-5 text-blue-600" data-oid=":aibtyi" />
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700"
                    data-oid="vfe-9e7"
                  >
                    发布会稿助手
                  </span>
                </div>

                {/* 对话区域 */}
                <div
                  className="flex-1 bg-gray-50 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 overflow-y-auto min-h-0"
                  data-oid=".to9y1w"
                >
                  <div className="space-y-4" data-oid="ywydvus">
                    {/* 默认欢迎消息 - 只在没有对话历史时显示 */}
                    {chatHistory.length === 0 && (
                    <div className="flex justify-start" data-oid="9crov8h">
                        <div className="flex items-start gap-3" data-oid="8fdkwe.">
                        <div
                          className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          data-oid="98hb-n5"
                        >
                            <Mic className="w-4 h-4 text-blue-600" data-oid="21aytgl" />
                        </div>
                        <div
                          className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-4 max-w-full sm:max-w-2xl lg:max-w-3xl shadow-sm"
                          data-oid="dp9.b63"
                        >
                            <p className="text-sm text-gray-800 leading-relaxed" data-oid="ph23fsc">
                            您好！我是发布会稿助手，专门为您撰写专业的发布会演讲稿。请输入您的发布会主题和内容，我会为您生成精彩的演讲稿。
                          </p>
                        </div>
                      </div>
                    </div>
                    )}

                    {/* 对话历史 */}
                    {chatHistory.map((message) => (
                      <div key={message.id}>
                        {message.type === "user" ? (
                          // 用户消息
                          <div className="flex justify-end" data-oid="user-message">
                          <div
                            className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 sm:px-6 py-4 max-w-full sm:max-w-xl lg:max-w-2xl"
                            style={{ width: 'fit-content', maxWidth: '85%' }}
                              data-oid="user-message-content"
                          >
                              <p className="text-sm leading-relaxed" data-oid="user-message-text">
                                {message.content}
                            </p>
                          </div>
                        </div>
                        ) : (
                          // AI消息
                          <div className="flex justify-start" data-oid="ai-message">
                            <div className="flex items-start gap-3" data-oid="ai-message-wrapper">
                            <div
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                                data-oid="ai-avatar"
                            >
                                <Mic className="w-4 h-4 text-blue-600" data-oid="ai-icon" />
                            </div>
                            <div
                              className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 sm:px-6 py-4 shadow-sm"
                              style={{ width: 'fit-content', maxWidth: '85%' }}
                                data-oid="ai-message-content"
                              >
                                <div className="text-sm text-gray-800 leading-relaxed" data-oid="ai-message-text">
                                  <div className="markdown-content">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight]}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* 加载中的提示 */}
                    {internalLoading && (
                      <div className="flex justify-start" data-oid="loading-message">
                        <div className="flex items-start gap-3" data-oid="loading-wrapper">
                          <div
                            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            data-oid="loading-avatar"
                          >
                            <Mic className="w-4 h-4 text-blue-600" data-oid="loading-icon" />
                          </div>
                          <div
                            className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-6 py-4 shadow-sm"
                            data-oid="loading-content"
                          >
                            <p className="text-sm text-gray-500" data-oid="loading-text">
                              正在生成发布会稿...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 快捷功能按钮 - 仅显示在最后一条AI消息 */}
                    {chatHistory.length > 0 && chatHistory[chatHistory.length - 1].type === "ai" && !internalLoading && (
                      <div className="flex justify-start" data-oid="action-buttons">
                        <div className="flex items-center gap-2 sm:gap-3 ml-0 sm:ml-11 flex-wrap">
                          <button
                            onClick={handleLike}
                            className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                              liked
                                ? "text-green-600 bg-green-50"
                                : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title="点赞"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>赞</span>
                          </button>

                          <button
                            onClick={handleDislike}
                            className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                              disliked
                                ? "text-red-600 bg-red-50"
                                : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title="不满意"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>踩</span>
                          </button>

                          <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="复制"
                          >
                            <Copy className="w-3 h-3" />
                            <span>复制</span>
                          </button>

                          <button
                            onClick={handleRegenerate}
                            className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="重新生成"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>重新生成</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 滚动锚点 */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* 输入区域 (对接工作流 sys.query) */}
                <div className="space-y-3 sm:space-y-4 flex-shrink-0" data-oid="yp004h_">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入发布会主题和需要包含的内容..."
                    disabled={isLoading}
                    rows={3}
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                    data-oid="a_qm5ec"
                  />

                  <div className="flex gap-2 sm:gap-3" data-oid="1.5qzw1">
                    <button
                      onClick={handleAiSearch}
                      disabled={internalLoading || !query.trim()}
                      className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                      data-oid="zv2wugw"
                    >
                      {internalLoading ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                            data-oid="vqw3c4h"
                          ></div>
                          <span data-oid="nv167-g">生成中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" data-oid=":j:-o2a" />
                          <span data-oid="s4s8w4d">生成演讲稿</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 工作使用提醒文字 */}
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg" data-oid="work-reminder-section">
                    <div className="flex items-start gap-2" data-oid="work-reminder-content">
                      <div className="w-4 h-4 bg-orange-400 rounded-full flex-shrink-0 mt-0.5" data-oid="work-reminder-dot"></div>
                      <div className="text-xs text-orange-700 leading-relaxed" data-oid="work-reminder-text">
                        <span className="font-medium">对话提醒：</span>
                        <span className="ml-1">1-生成内容大纲</span>
                        <span className="mx-2 text-orange-500">📝</span>
                        <span>2-生成初稿</span>
                        <span className="mx-2 text-orange-500">📄</span>
                        <span>3-风格化领导发言稿</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 知识点保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay" data-oid="isbwjys">
            <div className="modal-content" data-oid="deyp5jf">
              <div className="modal-header" data-oid="217ikx-">
                <h3 className="modal-title" data-oid=".zcakrw">
                  <Save className="w-5 h-5 text-blue-600" data-oid="m90t0ww" />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="4-6.ldi"
                >
                  <X className="w-5 h-5" data-oid="100sb4c" />
                </button>
              </div>

              <div className="modal-body" data-oid="i4z8t6q">
                <p className="modal-description" data-oid="wnyn8qp">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid="i0weq2w">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="vnyvwgd"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="-msla2j">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="mdyl7wd"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="9uf606k"
                >
                  {isSaving ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        data-oid="tgs9y6g"
                      ></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="z92e3sf" />
                      确认保存 ({modalSelectedItems.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechNode;
