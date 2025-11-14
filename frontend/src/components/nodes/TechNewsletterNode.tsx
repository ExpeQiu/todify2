import React, { useState } from "react";
import {
  Brain,
  ArrowLeft,
  FileText,
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
} from "lucide-react";
import { BaseNodeProps } from "../../types/nodeComponent";
import { workflowAPI } from "../../services/api";
import KnowledgePointSelector, {
  KnowledgePoint,
  SelectionItem,
  ContentType,
} from "../common/KnowledgePointSelector";
import AIInterArea from "../AIInterArea";
import "./NodeComponent.css";

interface TechNewsletterNodeProps extends BaseNodeProps {
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

const TechNewsletterNode: React.FC<TechNewsletterNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术通稿");
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SelectionItem[]>(
    [],
  );
  
  // 多轮对话支持
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  // 处理AI搜索
  const handleAiSearch = async () => {
    if (!query.trim()) return;

    setInternalLoading(true);
    try {
      // 添加用户消息到历史
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: query,
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, userMessage]);

      // 调用技术通稿API
      const response = await workflowAPI.coreDraft(
        {
          query,
          selectedKnowledgePoints: selectedItems,
          source: "TechNewsletterNode",
        },
        undefined, // difyConfig 参数
        conversationId // conversationId 参数
      );

      if (response.success && response.data) {
        // 更新conversationId以支持多轮对话
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }
        
        setAiResponse(response.data.content || response.data.answer || "");

        // 添加AI响应到历史
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: response.data.content || response.data.answer || "",
          timestamp: Date.now() + 1,
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("技术通稿生成失败:", error);
      setAiResponse("抱歉，技术通稿生成失败，请稍后重试。");
    } finally {
      setInternalLoading(false);
    }
  };

  // 处理点赞
  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  // 处理点踩
  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  // 处理复制
  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
  };

  // 处理分享
  const handleShare = () => {
    // 分享逻辑
    console.log("分享技术通稿内容");
  };

  // 处理重新生成
  const handleRegenerate = () => {
    handleAiSearch();
  };

  // 处理知识点选择变化
  const handleSelectionChange = (items: SelectionItem[]) => {
    setSelectedItems(items);
  };

  // 处理保存
  const handleSave = () => {
    setShowSaveModal(true);
    setModalSelectedItems([...selectedItems]);
  };

  // 确认保存
  const handleConfirmSave = (finalSelectedItems: SelectionItem[]) => {
    console.log("保存技术通稿内容:", {
      content: userContent,
      selectedItems: finalSelectedItems,
      aiResponse,
    });
    setShowSaveModal(false);
  };

  // 取消保存
  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  return (
    <div className="node-container" data-oid="97eq7wk">
      {/* 顶部导航栏 */}
      <div className="node-header" data-oid="pn016r1">
        <div className="flex items-center justify-between" data-oid="-exr.79">
          <div className="flex items-center gap-4" data-oid="172eess">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="5_w-76l"
            >
              <ArrowLeft className="w-5 h-5" data-oid="5im6h8q" />
              <span data-oid="0fkyhy8">返回</span>
            </button>
            <div className="flex items-center gap-3" data-oid="t:0eyz9">
              <div
                className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"
                data-oid="5jewd.e"
              >
                <FileText
                  className="w-5 h-5 text-orange-600"
                  data-oid="o_ui_:l"
                />
              </div>
              <h1
                className="text-xl font-semibold text-gray-900"
                data-oid="74t0b2w"
              >
                技术通稿
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3" data-oid="sknm_x_">
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              data-oid="m-_ief1"
            >
              <option data-oid="7rt9u_f">中文</option>
              <option data-oid="2t2rq_:">English</option>
            </select>
            <button
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="d11z78-"
            >
              <Share2 className="w-4 h-4" data-oid="c4kdd__" />
            </button>
          </div>
        </div>
      </div>

      {/* 知识点选择器 */}
      <div className="mb-6" data-oid="cogf.iw">
        <KnowledgePointSelector
          onSelectionChange={handleSelectionChange}
          allowedContentTypes={
            ["knowledge_point", "tech_newsletter"] as ContentType[]
          }
          data-oid="jy7dkau"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="node-content" data-oid=".rdtzse">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          data-oid="1dywu54"
        >
          {/* 左侧：AI交互区域 */}
          <div className="space-y-4" data-oid="fmuajux">
            <AIInterArea
              pageType="tech_newsletter"
              query={query}
              aiResponse={aiResponse}
              liked={liked}
              disliked={disliked}
              loading={internalLoading}
              onQueryChange={setQuery}
              onSubmit={handleAiSearch}
              onLike={handleLike}
              onDislike={handleDislike}
              onCopy={handleCopy}
              onShare={handleShare}
              onRegenerate={handleRegenerate}
              data-oid="-89oe7x"
            />
          </div>

          {/* 右侧：内容编辑区域 */}
          <div className="space-y-4" data-oid="_hd3tm3">
            <div
              className="bg-white rounded-xl border border-gray-200 p-6"
              data-oid="_0.i8wc"
            >
              <div
                className="flex items-center justify-between mb-4"
                data-oid="xh71e94"
              >
                <h3
                  className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                  data-oid="_xq7v.u"
                >
                  <FileText
                    className="w-5 h-5 text-orange-600"
                    data-oid="v2mu929"
                  />
                  技术通稿内容
                </h3>
                <div className="flex items-center gap-2" data-oid="pfi_hau">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                    data-oid="pn1cz-k"
                  >
                    <Save className="w-4 h-4" data-oid="v7m::yu" />
                    保存
                  </button>
                </div>
              </div>

              <textarea
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                placeholder="在这里编辑您的技术通稿内容..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-oid="cr4d8vj"
              />

              <div
                className="flex justify-between items-center mt-4"
                data-oid="gx7tqzd"
              >
                <div className="flex items-center gap-4" data-oid="wxbubvb">
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    data-oid="p45mmbz"
                  >
                    <Download className="w-4 h-4" data-oid="z:dj8dg" />
                    导出
                  </button>
                </div>
                <div className="text-sm text-gray-500" data-oid="wl-:usw">
                  {userContent.length} 字符
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 保存确认模态框 */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-oid="nzno4ib"
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            data-oid="bu5w_.v"
          >
            <div
              className="flex items-center justify-between mb-4"
              data-oid="so8vd4f"
            >
              <h3
                className="text-lg font-semibold text-gray-900"
                data-oid="jhch6p8"
              >
                保存技术通稿内容
              </h3>
              <button
                onClick={handleCancelSave}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                data-oid="0iaix-y"
              >
                <X className="w-5 h-5" data-oid="5hbtqiv" />
              </button>
            </div>

            <div className="mb-6" data-oid="1e2y14n">
              <KnowledgePointSelector
                knowledgePoints={[]}
                onSelectionChange={setModalSelectedItems}
                allowedContentTypes={
                  ["knowledge_point", "tech_newsletter"] as ContentType[]
                }
                data-oid="ah5mavo"
              />
            </div>

            <div className="flex justify-end gap-3" data-oid="x6tsdjm">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                data-oid="6lnf.er"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmSave(modalSelectedItems)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                data-oid="ypxlutu"
              >
                <Check className="w-4 h-4" data-oid="a1cqisa" />
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechNewsletterNode;
