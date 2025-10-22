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

interface TechStrategyNodeProps extends BaseNodeProps {
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

const TechStrategyNode: React.FC<TechStrategyNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术策略");
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

      // 调用技术策略API
      const response = await workflowAPI.promotionStrategy({
        query,
        selectedKnowledgePoints: selectedItems,
        source: "TechStrategyNode",
      });

      if (response.success && response.data) {
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
      console.error("技术策略生成失败:", error);
      setAiResponse("抱歉，技术策略生成失败，请稍后重试。");
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
    console.log("分享技术策略内容");
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
    console.log("保存技术策略内容:", {
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
    <div className="node-container" data-oid="z348.cp">
      {/* 顶部导航栏 */}
      <div className="node-header" data-oid="2c79e-.">
        <div className="flex items-center justify-between" data-oid="s1o0qd.">
          <div className="flex items-center gap-4" data-oid="bebu-r1">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="tcvd8d1"
            >
              <ArrowLeft className="w-5 h-5" data-oid="khxr9rs" />
              <span data-oid="um3s85y">返回</span>
            </button>
            <div className="flex items-center gap-3" data-oid="pmbc:fi">
              <div
                className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                data-oid="ju1p-xa"
              >
                <FileText
                  className="w-5 h-5 text-blue-600"
                  data-oid="gv5-m1t"
                />
              </div>
              <h1
                className="text-xl font-semibold text-gray-900"
                data-oid="_p2-_u9"
              >
                技术策略
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3" data-oid="4jfce-4">
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              data-oid=":hr65i4"
            >
              <option data-oid="t6g6s7g">中文</option>
              <option data-oid=".1k.6tj">English</option>
            </select>
            <button
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              data-oid="0r9fw0-"
            >
              <Share2 className="w-4 h-4" data-oid="u:1ukwm" />
            </button>
          </div>
        </div>
      </div>

      {/* 知识点选择器 */}
      <div className="mb-6" data-oid="g7.ytso">
        <KnowledgePointSelector
          onSelectionChange={handleSelectionChange}
          allowedContentTypes={
            ["knowledge_point", "tech_strategy"] as ContentType[]
          }
          data-oid="n5:3:zg"
        />
      </div>

      {/* 主要内容区域 */}
      <div className="node-content" data-oid="pb8jden">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          data-oid="fkqum4."
        >
          {/* 左侧：AI交互区域 */}
          <div className="space-y-4" data-oid="lyf59w_">
            <AIInterArea
              pageType="tech_strategy"
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
              data-oid="s:yfgzk"
            />
          </div>

          {/* 右侧：内容编辑区域 */}
          <div className="space-y-4" data-oid="3i55h.b">
            <div
              className="bg-white rounded-xl border border-gray-200 p-6"
              data-oid="n.c3qp:"
            >
              <div
                className="flex items-center justify-between mb-4"
                data-oid="u9iigvr"
              >
                <h3
                  className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                  data-oid=".o3r:c0"
                >
                  <FileText
                    className="w-5 h-5 text-blue-600"
                    data-oid="e1yt_yo"
                  />
                  技术策略内容
                </h3>
                <div className="flex items-center gap-2" data-oid="8mhmhrf">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    data-oid="v5d2kkm"
                  >
                    <Save className="w-4 h-4" data-oid="-52y676" />
                    保存
                  </button>
                </div>
              </div>

              <textarea
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                placeholder="在这里编辑您的技术策略内容..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-oid="-xdrysj"
              />

              <div
                className="flex justify-between items-center mt-4"
                data-oid="ijnp-n9"
              >
                <div className="flex items-center gap-4" data-oid=".:ewnan">
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    data-oid="fy2wpkt"
                  >
                    <Download className="w-4 h-4" data-oid="cw__4jf" />
                    导出
                  </button>
                </div>
                <div className="text-sm text-gray-500" data-oid="iutg-zo">
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
          data-oid="jxjzq8d"
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            data-oid="m-6amxy"
          >
            <div
              className="flex items-center justify-between mb-4"
              data-oid="d1t3asx"
            >
              <h3
                className="text-lg font-semibold text-gray-900"
                data-oid="18de93-"
              >
                保存技术策略内容
              </h3>
              <button
                onClick={handleCancelSave}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                data-oid="vh.0y15"
              >
                <X className="w-5 h-5" data-oid="387se:5" />
              </button>
            </div>

            <div className="mb-6" data-oid="og0jast">
              <KnowledgePointSelector
                knowledgePoints={[]}
                onSelectionChange={setModalSelectedItems}
                allowedContentTypes={
                  ["knowledge_point", "tech_strategy"] as ContentType[]
                }
                data-oid="c::8rba"
              />
            </div>

            <div className="flex justify-end gap-3" data-oid="zx3dci4">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                data-oid="78iu_64"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmSave(modalSelectedItems)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                data-oid="sq:9xi7"
              >
                <Check className="w-4 h-4" data-oid="wfxjn-c" />
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStrategyNode;
