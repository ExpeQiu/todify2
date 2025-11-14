import React, { useState } from "react";
import {
  Brain,
  ArrowLeft,
  Megaphone,
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
  FileText,
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

interface PressReleaseNodeProps extends BaseNodeProps {
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

const PressReleaseNode: React.FC<PressReleaseNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("发布会稿");
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

      // 调用发布会稿API
      const response = await workflowAPI.speech({
        query,
        selectedKnowledgePoints: selectedItems,
        source: "PressReleaseNode",
      }, undefined, conversationId);

      if (response.success && response.data) {
        setAiResponse(response.data.content || response.data.answer || "");

        // 更新conversationId以支持多轮对话
        if (response.data?.conversationId) {
          setConversationId(response.data.conversationId);
        }

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
      console.error("发布会稿生成失败:", error);
      setAiResponse("抱歉，发布会稿生成失败，请稍后重试。");
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
    console.log("分享发布会稿内容");
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
    console.log("保存发布会稿内容:", {
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
    <div className="node-container" data-oid="nxpky:o">
      {/* 顶部导航栏 */}
      <div className="node-header" data-oid="p7whih9">
        <div className="flex items-center justify-between" data-oid="jlvwa15">
          <div className="flex items-center gap-4" data-oid="xef_ti7">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="1ehalm-"
            >
              <ArrowLeft className="w-5 h-5" data-oid="r-450ht" />
              <span data-oid="_z:p5at">返回</span>
            </button>
            <div className="flex items-center gap-3" data-oid="9of9uyl">
              <div
                className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
                data-oid="o_-4j0t"
              >
                <Megaphone
                  className="w-5 h-5 text-green-600"
                  data-oid="hd3l-u8"
                />
              </div>
              <h1
                className="text-xl font-semibold text-gray-900"
                data-oid="rorgf8s"
              >
                发布会稿
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3" data-oid="fur5fvy">
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              data-oid="c6it3xj"
            >
              <option data-oid="-ra88y1">中文</option>
              <option data-oid="iv5li76">English</option>
            </select>
            <button
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="dsqe580"
            >
              <Share2 className="w-4 h-4" data-oid="qtu5i8h" />
            </button>
          </div>
        </div>
      </div>

      {/* 知识点选择器 */}
      <div className="mb-6" data-oid="vl-cy-o">
        <KnowledgePointSelector
          onSelectionChange={handleSelectionChange}
          allowedContentTypes={
            ["knowledge_point", "press_release"] as ContentType[]
          }
          data-oid="wghgt2x"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="node-content" data-oid="s-cxoxx">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          data-oid="axs:vfk"
        >
          {/* 左侧：AI交互区域 */}
          <div className="space-y-4" data-oid="fvdfrxh">
            <AIInterArea
              pageType="press_release"
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
              data-oid="ma:zq_n"
            />
          </div>

          {/* 右侧：内容编辑区域 */}
          <div className="space-y-4" data-oid="tlnkped">
            <div
              className="bg-white rounded-xl border border-gray-200 p-6"
              data-oid="7l73-k4"
            >
              <div
                className="flex items-center justify-between mb-4"
                data-oid="3p0.xhz"
              >
                <h3
                  className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                  data-oid="pa:4shz"
                >
                  <Megaphone
                    className="w-5 h-5 text-green-600"
                    data-oid="wrvtu3."
                  />
                  发布会稿内容
                </h3>
                <div className="flex items-center gap-2" data-oid="a8vcb4x">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    data-oid=".u1grkw"
                  >
                    <Save className="w-4 h-4" data-oid="eqzy_zv" />
                    保存
                  </button>
                </div>
              </div>

              <textarea
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                placeholder="在这里编辑您的发布会稿内容..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                data-oid="5xc9tec"
              />

              <div
                className="flex justify-between items-center mt-4"
                data-oid="fc3wvfq"
              >
                <div className="flex items-center gap-4" data-oid="nghaqqi">
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    data-oid="hm-35sh"
                  >
                    <Download className="w-4 h-4" data-oid="7qke:m-" />
                    导出
                  </button>
                </div>
                <div className="text-sm text-gray-500" data-oid="m-p0-35">
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
          data-oid="1bmo0f3"
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            data-oid="3xbxp6j"
          >
            <div
              className="flex items-center justify-between mb-4"
              data-oid="g_oskx4"
            >
              <h3
                className="text-lg font-semibold text-gray-900"
                data-oid="dir5xlx"
              >
                保存发布会稿内容
              </h3>
              <button
                onClick={handleCancelSave}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                data-oid=".pbm2yv"
              >
                <X className="w-5 h-5" data-oid="-qlc42y" />
              </button>
            </div>

            <div className="mb-6" data-oid="xr5bek1">
              <KnowledgePointSelector
                knowledgePoints={[]}
                onSelectionChange={setModalSelectedItems}
                allowedContentTypes={
                  ["knowledge_point", "press_release"] as ContentType[]
                }
                data-oid="blomj8f"
              />
            </div>

            <div className="flex justify-end gap-3" data-oid="e4qnh4f">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                data-oid="qw0oiwp"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmSave(modalSelectedItems)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                data-oid="9ni0l41"
              >
                <Check className="w-4 h-4" data-oid="0otns8k" />
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PressReleaseNode;
