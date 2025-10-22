import React, { useState } from "react";
import {
  Brain,
  ArrowLeft,
  Package,
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

interface AiSearchNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const AiSearchNode: React.FC<AiSearchNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("信息检索");
  const [aiResponse, setAiResponse] = useState("您好！我是AI智能助手，很高兴为您服务。请输入您的技术问题，我会为您提供专业的解答和建议。");
  const [userContent, setUserContent] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

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
      setAiResponse("AI正在分析您的问题...");

      try {
        // 调用后端AI搜索API
        const result = await workflowAPI.aiSearch(query.trim());

        if (result.success && result.data) {
          // 设置AI响应内容
          setAiResponse(result.data.answer || "抱歉，未能获取到有效回答。");

          // 通知父组件执行完成
          onExecute({
            query: query.trim(),
            response: result.data.answer,
            metadata: result.data.metadata,
          });
        } else {
          setAiResponse(result.error || "AI搜索失败，请稍后重试。");
        }
      } catch (error) {
        console.error("AI搜索错误:", error);
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
      link.download = `ai-search-result-${new Date().toISOString().slice(0, 10)}.md`;

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
    // 重新生成功能 - 重新触发AI搜索
    if (query) {
      handleAiSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-oid="ln7nzgn">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="qqhly84">
        <div className="max-w-7xl mx-auto px-6 py-4" data-oid="f:hu17e">
          <div className="flex items-center justify-between" data-oid="4vccufo">
            <div className="flex items-center gap-4" data-oid="b2:ibb7">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                data-oid="b5:48t3"
              >
                <ArrowLeft className="w-4 h-4" data-oid="3_rcq24" />
                <span className="text-sm" data-oid="4z4kr::">
                  返回
                </span>
              </button>
              <div className="flex items-center gap-3" data-oid="_u5.y6c">
                <div
                  className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                  data-oid="bfbqs55"
                >
                  <Brain className="w-4 h-4 text-blue-600" data-oid="92br7dy" />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid="ngfd777"
                >
                  AI智能助手
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3" data-oid="ovihde3">
              <span className="text-sm text-gray-500" data-oid="vtipysd">
                中文
              </span>
              <span className="text-sm text-gray-500" data-oid="5r-_mcy">
                分享
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6" data-oid="j47zir.">
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
          data-oid="sg0e074"
        />

        {/* 主要内容区域 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          data-oid="2t.-sti"
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ height: "calc(100vh - 200px)" }}
            data-oid="b6-6m:n"
          >
            {/* 左侧AI对话区域 */}
            <div className="p-8 border-r border-gray-200" data-oid="m:cclt_">
              <div className="h-full flex flex-col" data-oid="2gcb079">
                {/* AI助手头像和标识 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="nzd8h5m"
                >
                  <div
                    className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                    data-oid="n5-w7ir"
                  >
                    <Brain
                      className="w-5 h-5 text-blue-600"
                      data-oid="hkj9d-9"
                    />
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700"
                    data-oid="pf86jg0"
                  >
                    AI智能助手
                  </span>
                </div>

                {/* 对话内容区域 - 滚动对话框 */}
                <div
                  className="bg-gray-50 rounded-xl p-4 mb-6 overflow-y-auto overflow-x-hidden"
                  style={{
                    height: "530px",
                    maxHeight: "530px",
                    minHeight: "200px",
                  }}
                  data-oid="7ueoa6n"
                >
                  <div className="space-y-4" data-oid="m9q0bvl">
                    {/* 默认欢迎消息 */}
                    <div className="flex justify-start" data-oid="7lbbb77">
                      <div
                        className="flex items-start gap-3"
                        data-oid="1_jmgns"
                      >
                        <div
                          className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          data-oid="mjwlwps"
                        >
                          <Brain
                            className="w-4 h-4 text-blue-600"
                            data-oid="he:9rwc"
                          />
                        </div>
                        <div
                          className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                          data-oid="ll2l7y7"
                        >
                              <p
                                className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                style={{
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  boxSizing: "border-box",
                                }}
                                data-oid="lvjchpy"
                              >
                                {aiResponse}
                              </p>

                              {/* 快捷功能按钮 */}
                              {aiResponse && (
                                <div
                                  className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                                  data-oid="aa0b8nn"
                                >
                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="复制"
                                    data-oid="gpoyi9o"
                                  >
                                    <Copy
                                      className="w-3 h-3"
                                      data-oid="724ryku"
                                    />

                                    <span data-oid="_nwyjfx">复制</span>
                                  </button>

                                  <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      liked
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title="点赞"
                                    data-oid="3-e:zjq"
                                  >
                                    <ThumbsUp
                                      className="w-3 h-3"
                                      data-oid="buw0aj3"
                                    />

                                    <span data-oid="fs9ud2x">点赞</span>
                                  </button>

                                  <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      disliked
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                    title="不符合"
                                    data-oid="k611u6-"
                                  >
                                    <ThumbsDown
                                      className="w-3 h-3"
                                      data-oid=":lop1ny"
                                    />

                                    <span data-oid="ip.p41n">不符合</span>
                                  </button>

                                  <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="采纳"
                                    data-oid=":xh4any"
                                  >
                                    <Share2
                                      className="w-3 h-3"
                                      data-oid="jc-ofej"
                                    />

                                    <span data-oid="_:hg1qu">采纳</span>
                                  </button>

                                  <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                    title="重新生成"
                                    data-oid="3v2s6fx"
                                  >
                                    <RotateCcw
                                      className="w-3 h-3"
                                      data-oid="zdhzf6e"
                                    />

                                    <span data-oid="d7o7669">重新生成</span>
                                  </button>
                                </div>
                              )}
                        </div>
                      </div>
                    </div>

                    {/* 用户问题和AI回答 */}
                    {query && (
                      <>
                        {/* 用户问题 */}
                        <div className="flex justify-end" data-oid="k9gxxeg">
                          <div
                            className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs"
                            data-oid="fuxo6kd"
                          >
                            <p
                              className="text-sm"
                              style={{
                                maxHeight: "100px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                boxSizing: "border-box",
                              }}
                              data-oid="8v0m:0."
                            >
                              {query}
                            </p>
                          </div>
                        </div>

                        {/* AI回答 */}
                        <div className="flex justify-start" data-oid="7b5imc_">
                          <div
                            className="flex items-start gap-3"
                            data-oid="dpkgvqb"
                          >
                            <div
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                              data-oid="dqd_.xx"
                            >
                              <Brain
                                className="w-4 h-4 text-blue-600"
                                data-oid="auuzdg."
                              />
                            </div>
                            <div
                              className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                              data-oid="j14f97w"
                            >
                              <p
                                className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                style={{
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  boxSizing: "border-box",
                                }}
                                data-oid="lvjchpy"
                              >
                                {aiResponse || "正在思考中..."}
                              </p>

                              {/* 快捷功能按钮 */}
                              {aiResponse && (
                                <div
                                  className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                                  data-oid="aa0b8nn"
                                >
                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="复制"
                                    data-oid="gpoyi9o"
                                  >
                                    <Copy
                                      className="w-3 h-3"
                                      data-oid="724ryku"
                                    />

                                    <span data-oid="_nwyjfx">复制</span>
                                  </button>

                                  <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      liked
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title="点赞"
                                    data-oid="3-e:zjq"
                                  >
                                    <ThumbsUp
                                      className="w-3 h-3"
                                      data-oid="buw0aj3"
                                    />

                                    <span data-oid="fs9ud2x">点赞</span>
                                  </button>

                                  <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      disliked
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                    title="不符合"
                                    data-oid="k611u6-"
                                  >
                                    <ThumbsDown
                                      className="w-3 h-3"
                                      data-oid=":lop1ny"
                                    />

                                    <span data-oid="ip.p41n">不符合</span>
                                  </button>

                                  <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="采纳"
                                    data-oid=":xh4any"
                                  >
                                    <Share2
                                      className="w-3 h-3"
                                      data-oid="jc-ofej"
                                    />

                                    <span data-oid="_:hg1qu">采纳</span>
                                  </button>

                                  <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                    title="重新生成"
                                    data-oid="3v2s6fx"
                                  >
                                    <RotateCcw
                                      className="w-3 h-3"
                                      data-oid="zdhzf6e"
                                    />

                                    <span data-oid="d7o7669">重新生成</span>
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
                <div className="space-y-4" data-oid="7616ns6">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="请输入您的问题..."
                    disabled={isLoading}
                    rows={3}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                    data-oid="1bim60r"
                  />

                  <div className="flex gap-3" data-oid="e4cj15q">
                    <button
                      onClick={handleAiSearch}
                      disabled={internalLoading || !query.trim()}
                      className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      data-oid="92o8o:b"
                    >
                      {internalLoading ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                            data-oid="67spx-5"
                          ></div>
                          <span data-oid="8g77fuc">AI分析中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" data-oid="y0mvnsp" />
                          <span data-oid="euds_qw">发送问题</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧用户编辑区域 */}
            <div className="p-8" data-oid="mzpss0n">
              <div className="h-full flex flex-col" data-oid="td4ua_2">
                {/* 编辑区标题 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="z39-ozq"
                >
                  <div
                    className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center"
                    data-oid="xhyleju"
                  >
                    <BookOpen
                      className="w-4 h-4 text-green-600"
                      data-oid="pcoj5u2"
                    />
                  </div>
                  <h2
                    className="text-lg font-semibold text-gray-900"
                    data-oid="dv_rruv"
                  >
                    编辑修订
                  </h2>
                </div>

                {/* 编辑文本区域 */}
                <div className="flex-1 mb-6" data-oid="ts19s2:">
                  <textarea
                    value={userContent}
                    onChange={(e) => setUserContent(e.target.value)}
                    placeholder="在这里编辑和完善内容..."
                    className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed min-h-[500px]"
                    data-oid="_bwm6b4"
                  />
                </div>

                {/* 采纳建议和导出按钮 */}
                <div className="flex gap-4" data-oid="-w.j7rn">
                  <button
                    onClick={handleAdopt}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="pp-v_ah"
                  >
                    <ArrowRight className="w-4 h-4" data-oid="4d9u6gm" />
                    <span data-oid="bgqmkkt">保存知识点</span>
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={!userContent}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="a8bvq9b"
                  >
                    <Download className="w-4 h-4" data-oid="f481-z8" />
                    <span data-oid="mpnk1k_">导出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 知识点保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay" data-oid="fyx.l5g">
            <div className="modal-content" data-oid="ppu69qo">
              <div className="modal-header" data-oid="kb.:kk9">
                <h3 className="modal-title" data-oid="ez6z209">
                  <Save className="w-5 h-5 text-blue-600" data-oid=".5fnk6m" />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="2q4dyu:"
                >
                  <X className="w-5 h-5" data-oid="p76vo2:" />
                </button>
              </div>

              <div className="modal-body" data-oid="39iwpe4">
                <p className="modal-description" data-oid=":thcj66">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid="ri.cx-9">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="d4nm:sb"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="u6buix.">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="xzglpxe"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="-wjmv72"
                >
                  {isSaving ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        data-oid="3.iwj63"
                      ></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="_8kixis" />
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

export default AiSearchNode;
