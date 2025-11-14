import React, { useState } from "react";
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
} from "lucide-react";
import { BaseNodeProps } from "../../types/nodeComponent";
import { workflowAPI } from "../../services/api";
import KnowledgePointSelector, {
  KnowledgePoint,
  SelectionItem,
  ContentType,
} from "../common/KnowledgePointSelector";
import "./NodeComponent.css";

interface PromotionStrategyNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const PromotionStrategyNode: React.FC<PromotionStrategyNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
  aiRole,
  mode,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术策略");
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null); // 支持多轮对话

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
    if (query.trim()) {
      setInternalLoading(true);
      setAiResponse("AI正在生成技术策略内容...");

      try {
        let result;
        
        // 如果提供了aiRole，优先使用AI角色服务
        if (aiRole) {
          console.log('使用AI角色服务:', aiRole.name);
          const { aiRoleService } = await import('../../services/aiRoleService');
          
          const roleResponse = await aiRoleService.chatWithRole(
            aiRole.id,
            query.trim(),
            {},
            conversationId || undefined
          );
          
          if (roleResponse.success && roleResponse.data) {
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
          result = await workflowAPI.promotionStrategy(query.trim(), undefined, conversationId || undefined);
        }

        if (result.success && result.data) {
          // 更新conversationId以支持多轮对话
          if (result.data.conversation_id && result.data.conversation_id !== conversationId) {
            setConversationId(result.data.conversation_id);
            console.log('🔄 PromotionStrategyNode更新conversation_id:', result.data.conversation_id);
          } else if (result.data.conversationId && result.data.conversationId !== conversationId) {
            setConversationId(result.data.conversationId);
            console.log('🔄 PromotionStrategyNode更新conversationId:', result.data.conversationId);
          }

          // 设置AI响应内容
          setAiResponse(result.data.answer || "抱歉，未能生成技术策略内容。");

          // 通知父组件执行完成
          onExecute({
            query: query.trim(),
            response: result.data.answer,
            metadata: result.data.metadata,
          });
        } else {
          setAiResponse(result.error || "技术策略生成失败，请稍后重试。");
        }
      } catch (error) {
        console.error("技术策略生成错误:", error);
        setAiResponse("网络错误，请检查连接后重试。");
      } finally {
        setInternalLoading(false);
      }
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
    if (userContent) {
      // 创建一个Blob对象包含用户内容，使用markdown格式
      const blob = new Blob([userContent], {
        type: "text/markdown;charset=utf-8",
      });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `promotion-strategy-result-${new Date().toISOString().slice(0, 10)}.md`;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      URL.revokeObjectURL(url);
    }
  };

  // 快捷功能按钮处理函数
  const handleCopy = async () => {
    if (aiResponse) {
      try {
        await navigator.clipboard.writeText(aiResponse);
        // 可以添加一个临时的成功提示
        console.log("内容已复制到剪贴板");
      } catch (err) {
        console.error("复制失败:", err);
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

  const handleShare = () => {
    // 传递功能 - 可以将内容传递到用户编辑区
    if (aiResponse) {
      setUserContent(aiResponse);
    }
  };

  const handleRegenerate = () => {
    // 重新生成功能 - 重新触发技术策略生成
    if (query) {
      handleAiSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-oid="1hdayoe">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="7ud:y0m">
        <div className="max-w-7xl mx-auto px-6 py-4" data-oid="d9t0w_d">
          <div className="flex items-center justify-between" data-oid="ad3zwz2">
            <div className="flex items-center gap-4" data-oid="10whd9u">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                data-oid="_gp-n2j"
              >
                <ArrowLeft className="w-4 h-4" data-oid="ygu5qob" />
                <span className="text-sm" data-oid="1t-1-_.">
                  返回
                </span>
              </button>
              <div className="flex items-center gap-3" data-oid="l6t-buh">
                <div
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                  data-oid="-2srqn:"
                >
                  <Target
                    className="w-4 h-4 text-blue-600"
                    data-oid="j1td:xx"
                  />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid="xij_wkr"
                >
                  技术策略
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3" data-oid="5h_:bwe">
              <span className="text-sm text-gray-500" data-oid="252rcty">
                中文
              </span>
              <span className="text-sm text-gray-500" data-oid="t8r2z3p">
                分享
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6" data-oid="jyadkj4">
        {/* 选择知识点区域 */}
        <KnowledgePointSelector
          knowledgePoints={knowledgePoints}
          initialSelectedItems={selectedItems}
          allowedContentTypes={[
            "knowledge_point",
            "tech_packaging",
            "tech_promotion",
            "tech_press",
          ]}
          initialExpanded={showKnowledgeSelection}
          onSelectionChange={(selectedItems) => {
            setSelectedItems(selectedItems);
          }}
          onSave={(selectedItems) => {
            const content = selectedItems
              .map((item) => {
                if (item.contentType === "knowledge_point") {
                  const kp = item.knowledgePoint;
                  return `【${kp.vehicleModel} - ${kp.techCategory}】${kp.techPoint}: ${kp.description}`;
                }
                return `【${item.contentType}】${item.knowledgePoint.techPoint}`;
              })
              .join("\n\n");

            if (content) {
              setUserContent((prev) =>
                prev ? `${prev}\n\n${content}` : content,
              );
            }
          }}
          className="mb-6"
          data-oid="47sn2za"
        />

        {/* 主要内容区域 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          data-oid="o-kzjrr"
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ height: "calc(100vh - 200px)" }}
            data-oid="k1cvt1o"
          >
            {/* 左侧AI对话区域 */}
            <div className="p-8 border-r border-gray-200" data-oid="hdmgrwn">
              <div className="h-full flex flex-col" data-oid="k:bkd35">
                {/* AI助手头像和标识 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="owaafaj"
                >
                  <div
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                    data-oid="q24hlvi"
                  >
                    <Target
                      className="w-5 h-5 text-blue-600"
                      data-oid="hffxo_a"
                    />
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700"
                    data-oid="g._y6o:"
                  >
                    技术策略助手
                  </span>
                </div>

                {/* 对话内容区域 - 滚动对话框 */}
                <div
                  className="flex-1 bg-gray-50 rounded-xl p-4 mb-6 overflow-y-auto"
                  data-oid="_ctruy3"
                >
                  <div className="space-y-4" data-oid="8m53bgj">
                    {/* 默认欢迎消息 */}
                    <div className="flex justify-start" data-oid="r2rvu2u">
                      <div
                        className="flex items-start gap-3"
                        data-oid="2ldxywc"
                      >
                        <div
                          className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          data-oid="zojlngg"
                        >
                          <Target
                            className="w-4 h-4 text-blue-600"
                            data-oid="-kw1:pt"
                          />
                        </div>
                        <div
                          className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                          data-oid="jsrb66."
                        >
                          <p
                            className="text-sm text-gray-800"
                            data-oid="2h9sr1e"
                          >
                            您好！我是技术策略助手，专门为您制定专业的技术推广策略。请输入您的技术内容，我会为您生成有效的推广策略方案。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 用户问题和AI回答 */}
                    {query && (
                      <>
                        {/* 用户问题 */}
                        <div className="flex justify-end" data-oid="4-0ya9a">
                          <div
                            className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs"
                            data-oid="qo0w-9e"
                          >
                            <p className="text-sm" data-oid="zyupqgq">
                              {query}
                            </p>
                          </div>
                        </div>

                        {/* AI回答 */}
                        <div className="flex justify-start" data-oid="hvr__rg">
                          <div
                            className="flex items-start gap-3"
                            data-oid="g:w___g"
                          >
                            <div
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                              data-oid="bwc__uk"
                            >
                              <Target
                                className="w-4 h-4 text-blue-600"
                                data-oid="2.t_-fw"
                              />
                            </div>
                            <div
                              className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                              data-oid="e8zxmn6"
                            >
                              <p
                                className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                data-oid="asl--yc"
                              >
                                {aiResponse || "正在生成技术策略方案..."}
                              </p>

                              {/* 快捷功能按钮 */}
                              {aiResponse && (
                                <div
                                  className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                                  data-oid="6r12qk5"
                                >
                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="复制"
                                    data-oid="ry2gr-w"
                                  >
                                    <Copy
                                      className="w-3 h-3"
                                      data-oid="7q8c_n_"
                                    />

                                    <span data-oid="xpwgruj">复制</span>
                                  </button>

                                  <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      liked
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title="点赞"
                                    data-oid="jrlv7o5"
                                  >
                                    <ThumbsUp
                                      className="w-3 h-3"
                                      data-oid="0ivywl4"
                                    />

                                    <span data-oid="zl72v:6">点赞</span>
                                  </button>

                                  <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      disliked
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                    title="不符合"
                                    data-oid="g49bp8m"
                                  >
                                    <ThumbsDown
                                      className="w-3 h-3"
                                      data-oid="chg9ve1"
                                    />

                                    <span data-oid="g57w8dd">不符合</span>
                                  </button>

                                  <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="采纳"
                                    data-oid="uyfhygy"
                                  >
                                    <Share2
                                      className="w-3 h-3"
                                      data-oid="8zpo9.c"
                                    />

                                    <span data-oid="udrtzhk">采纳</span>
                                  </button>

                                  <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="重新生成"
                                    data-oid="kay2_a:"
                                  >
                                    <RotateCcw
                                      className="w-3 h-3"
                                      data-oid="q4::n-4"
                                    />

                                    <span data-oid="hl6gl:b">重新生成</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 输入区域 */}
                <div className="space-y-4" data-oid="sx4h-31">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="请输入需要制定策略的技术内容..."
                    disabled={isLoading}
                    rows={3}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                    data-oid="i922g:1"
                  />

                  <div className="flex gap-3" data-oid="ju00src">
                    <button
                      onClick={handleAiSearch}
                      disabled={internalLoading || !query.trim()}
                      className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      data-oid="c_b6aku"
                    >
                      {internalLoading ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                            data-oid="kj0t_0p"
                          ></div>
                          <span data-oid="hlxkjj.">生成中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" data-oid="0u7aa1:" />
                          <span data-oid="l5.qjs-">生成推广策略</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧用户编辑区域 */}
            <div className="p-8" data-oid="2aqhy5y">
              <div className="h-full flex flex-col" data-oid="i91.x1.">
                {/* 编辑区标题 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="5sy:z9_"
                >
                  <div
                    className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center"
                    data-oid="z9uqga4"
                  >
                    <BookOpen
                      className="w-4 h-4 text-green-600"
                      data-oid="zwtzu9q"
                    />
                  </div>
                  <h2
                    className="text-lg font-semibold text-gray-900"
                    data-oid="04s.h2_"
                  >
                    编辑修订
                  </h2>
                </div>

                {/* 编辑文本区域 */}
                <div className="flex-1 mb-6" data-oid="i7cz17m">
                  <textarea
                    value={userContent}
                    onChange={(e) => setUserContent(e.target.value)}
                    placeholder="在这里编辑和完善技术策略内容..."
                    className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed min-h-[500px]"
                    data-oid="f4df7b-"
                  />
                </div>

                {/* 采纳建议和导出按钮 */}
                <div className="flex gap-4" data-oid="fxkwkws">
                  <button
                    onClick={handleAdopt}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="htl:8i5"
                  >
                    <ArrowRight className="w-4 h-4" data-oid="9r5m_zo" />
                    <span data-oid="nqfjym1">保存知识点</span>
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={!userContent}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="ui176r:"
                  >
                    <Download className="w-4 h-4" data-oid="ch.8q:2" />
                    <span data-oid="ump5nax">导出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 知识点保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay" data-oid="01du4h2">
            <div className="modal-content" data-oid="698l7ya">
              <div className="modal-header" data-oid="iwl.oak">
                <h3 className="modal-title" data-oid="kkf4emj">
                  <Save className="w-5 h-5 text-blue-600" data-oid="r1u:cnk" />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="o22:rhs"
                >
                  <X className="w-5 h-5" data-oid="3mo8mxq" />
                </button>
              </div>

              <div className="modal-body" data-oid=".ht2vlj">
                <p className="modal-description" data-oid="xvgn4fr">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid="qz30ej_">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="lmo5kuz"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="5ktizxb">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="04nvl8r"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="6ak9xwk"
                >
                  {isSaving ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        data-oid="xsfnfc9"
                      ></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="fnukwmj" />
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

export default PromotionStrategyNode;
