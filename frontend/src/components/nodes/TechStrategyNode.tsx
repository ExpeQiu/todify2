import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Brain,
  ArrowLeft,
  Target,
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
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
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
    <div className="min-h-screen bg-gray-50" data-oid="n8wj1d.">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="t:c5bw-">
        <div className="max-w-7xl mx-auto px-6 py-4" data-oid="m_2_t0g">
          <div className="flex items-center justify-between" data-oid="qhprqju">
            <div className="flex items-center gap-4" data-oid="xefyahy">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                data-oid="vsriuk7"
              >
                <ArrowLeft className="w-4 h-4" data-oid="ydbq3qr" />
                <span className="text-sm" data-oid="gd3:wm:">
                  返回
                </span>
              </button>
              <div className="flex items-center gap-3" data-oid="j0.7_2s">
                <div
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                  data-oid="mu84osu"
                >
                  <Target
                    className="w-4 h-4 text-blue-600"
                    data-oid="97gzt14"
                  />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid=".j6mt:1"
                >
                  技术策略
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3" data-oid="-d.vc_j">
              <span className="text-sm text-gray-500" data-oid="y1jxgu9">
                中文
              </span>
              <span className="text-sm text-gray-500" data-oid="ccvy59_">
                分享
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6" data-oid="aaa814k">
        {/* 知识点选择器 */}
        <KnowledgePointSelector
          knowledgePoints={[]}
          initialSelectedItems={selectedItems}
          allowedContentTypes={[
            "knowledge_point",
            "tech_strategy",
            "tech_promotion",
            "tech_press",
          ]}
          initialExpanded={true}
          onSelectionChange={(selectedItems) => {
            setSelectedItems(selectedItems);
          }}
          onSave={(selectedItems) => {
            const content = selectedItems
              .filter((item) => item.contentType !== "knowledge_point")
              .map((item) => {
                const kp = item.knowledgePoint;
                return `【${kp.vehicleModel} - ${kp.techCategory}】${kp.techPoint}: ${kp.description}`;
              })
              .join("\n\n");

            if (content) {
              setUserContent((prev) =>
                prev ? `${prev}\n\n${content}` : content,
              );
            }
          }}
          className="mb-6"
          data-oid="d8uvl4g"
        />

        {/* 主要内容区域 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          style={{ maxHeight: "70vh" }}
          data-oid="yvqyxfx"
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden"
            data-oid="fg74_zm"
          >
            {/* 左侧AI对话区域 */}
            <div
              className="p-8 border-r border-gray-200 flex flex-col overflow-hidden"
              data-oid="yd.xzqx"
            >
              <div className="flex-1 overflow-y-auto" data-oid="5h22ctr">
                <AIInterArea
                  pageType="tech_strategy"
                  query={query}
                  aiResponse={aiResponse}
                  liked={liked}
                  disliked={disliked}
                  onCopy={handleCopy}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onShare={handleShare}
                  onRegenerate={handleRegenerate}
                  onQueryChange={setQuery}
                  onSubmit={handleAiSearch}
                  loading={internalLoading}
                  chatHistory={chatHistory}
                  hasGenerated={hasGenerated}
                  hasSelectedKnowledgePoints={selectedItems.length > 0}
                  data-oid="zg.zsso"
                />
              </div>
            </div>

            {/* 右侧编辑区域 */}
            <div
              className="p-8 flex flex-col overflow-hidden"
              data-oid="3i63dk:"
            >
              <div className="h-full flex flex-col" data-oid="pix0u7f">
                {/* 编辑区域标题 */}
                <div
                  className="flex items-center justify-between mb-6 flex-shrink-0"
                  data-oid="92.xcoj"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center"
                      data-oid="-llk8s_"
                    >
                      <BookOpen
                        className="w-4 h-4 text-green-600"
                        data-oid="-qtuy:i"
                      />
                    </div>
                    <h2
                      className="text-lg font-semibold text-gray-900"
                      data-oid=":w2f61r"
                    >
                      编辑修订
                    </h2>
                  </div>
                  
                  {/* 预览/编辑切换按钮 */}
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
                  >
                    {isEditMode ? (
                      <>
                        <Eye className="w-4 h-4" />
                        预览
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </>
                    )}
                  </button>
                </div>

                {/* 文本编辑/预览区域 */}
                <div className="flex-1 mb-6 overflow-hidden" data-oid="isxa6c3">
                  {isEditMode ? (
                    <textarea
                      value={userContent}
                      onChange={(e) => setUserContent(e.target.value)}
                      placeholder="在这里编辑和完善技术策略内容..."
                      className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed overflow-y-auto"
                      data-oid="fqtkebj"
                    />
                  ) : (
                    <div className="w-full h-full p-4 border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto">
                       {userContent ? (
                         <div className="prose prose-sm max-w-none">
                           <ReactMarkdown 
                             remarkPlugins={[remarkGfm]}
                             rehypePlugins={[rehypeHighlight]}
                           >
                             {userContent}
                           </ReactMarkdown>
                         </div>
                       ) : (
                         <div className="text-gray-500 text-sm italic">
                           暂无内容，请先编辑或从AI回复中采纳内容...
                         </div>
                       )}
                     </div>
                  )}
                </div>

                {/* 底部操作按钮 */}
                <div className="flex gap-4 flex-shrink-0" data-oid="_xtzsk.">
                  <button
                    onClick={handleSave}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="d0m9q5:"
                  >
                    <ArrowRight className="w-4 h-4" data-oid="jrrym-2" />
                    <span data-oid=":z3ulze">保存技术策略点</span>
                  </button>

                  <button
                    onClick={() => {
                      const element = document.createElement('a');
                      const file = new Blob([userContent], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = '技术策略内容.txt';
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    disabled={!userContent}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="am87jxw"
                  >
                    <Download className="w-4 h-4" data-oid="29cq84y" />
                    <span data-oid="1_p8lpt">导出</span>
                  </button>
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
