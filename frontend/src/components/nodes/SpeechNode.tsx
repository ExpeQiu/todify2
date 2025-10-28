import React, { useState } from "react";
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

const SpeechNode: React.FC<SpeechNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
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
      // 设置提交的查询内容并显示对话框
      setSubmittedQuery(query.trim());
      setShowConversation(true);
      
      setInternalLoading(true);
      setAiResponse("AI正在生成发布会稿内容...");

      try {
        // 构建专项-发布会稿工作流的Dify配置
        const speechWorkflowConfig = {
          id: 'speech-workflow',
          name: '专项-发布会稿',
          description: '发布会稿生成工作流',
          apiUrl: 'http://47.113.225.93:8088/api/dify/workflows/run',
          apiKey: 'app-your-api-key', // 需要配置实际的API Key
          enabled: true
        };

        // 准备工作流输入参数，对接 Additional_information 和 sys.query
        const workflowInputs = {
          Additional_information: additionalInfo.trim() || "", // 对接补充信息输入框
          'sys.query': query.trim() // 对接主要查询输入框
        };

        // 调用Dify工作流API
        const result = await workflowAPI.speech(workflowInputs, speechWorkflowConfig);

        if (result.success && result.data) {
          // 设置AI响应内容 - 显示工作流结果输出
          const workflowOutput = result.data.answer || result.data.output || result.data;
          setAiResponse(typeof workflowOutput === 'string' ? workflowOutput : JSON.stringify(workflowOutput, null, 2));

          // 通知父组件执行完成
          onExecute({
            query: query.trim(),
            additionalInfo: additionalInfo.trim(),
            response: workflowOutput,
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
    if (userContent) {
      // 创建一个Blob对象包含用户内容，使用markdown格式
      const blob = new Blob([userContent], {
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
    // 重新生成功能 - 重新触发发布会稿生成
    if (query) {
      handleAiSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-oid="bjc6pve">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="o5eee.m">
        <div className="max-w-7xl mx-auto px-6 py-4" data-oid="2nqmjy0">
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
              <span className="text-sm text-gray-500" data-oid="buaqi::">
                分享
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6" data-oid="i8f74zy">
        {/* 主要内容区域 - 单栏布局，AI对话框占满整个页面 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          data-oid="xtye2j_"
        >
          <div
            className="w-full"
            style={{ height: "calc(100vh - 200px)" }}
            data-oid=".ce84mh"
          >
            {/* AI对话区域 - 占满整个页面 */}
            <div className="p-8 h-full" data-oid="08quqzc">
              <div className="h-full flex flex-col" data-oid="gfded2o">
                {/* 补充信息输入框 (对接工作流 Additional_information) */}
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl" data-oid="enhanced-info-section">
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
                  className="flex items-center gap-3 mb-6"
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
                  className="flex-1 bg-gray-50 rounded-xl p-4 mb-6 overflow-y-auto"
                  style={{ minHeight: "400px", maxHeight: "calc(100vh - 400px)" }}
                  data-oid=".to9y1w"
                >
                  <div className="space-y-4" data-oid="ywydvus">
                    {/* 默认欢迎消息 */}
                    <div className="flex justify-start" data-oid="9crov8h">
                      <div
                        className="flex items-start gap-3"
                        data-oid="8fdkwe."
                      >
                        <div
                          className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          data-oid="98hb-n5"
                        >
                          <Mic
                            className="w-4 h-4 text-blue-600"
                            data-oid="21aytgl"
                          />
                        </div>
                        <div
                          className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-4 max-w-2xl shadow-sm"
                          data-oid="dp9.b63"
                        >
                          <p
                            className="text-sm text-gray-800 leading-relaxed"
                            data-oid="ph23fsc"
                          >
                            您好！我是发布会稿助手，专门为您撰写专业的发布会演讲稿。请输入您的发布会主题和内容，我会为您生成精彩的演讲稿。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 用户问题和AI回答 */}
                    {showConversation && submittedQuery && (
                      <>
                        {/* 用户问题 */}
                        <div className="flex justify-end" data-oid="1l::3k4">
                          <div
                            className="bg-blue-500 text-white rounded-2xl rounded-br-md px-6 py-4 max-w-xl"
                            style={{ width: 'fit-content' }}
                            data-oid="qkkl81x"
                          >
                            <p className="text-sm leading-relaxed" data-oid="spbw3n:">
                              {submittedQuery}
                            </p>
                          </div>
                        </div>

                        {/* AI回答 */}
                        <div className="flex justify-start" data-oid="u1ib23y">
                          <div
                            className="flex items-start gap-3"
                            data-oid="jrz7stm"
                          >
                            <div
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                              data-oid="evi-fya"
                            >
                              <Mic
                                className="w-4 h-4 text-blue-600"
                                data-oid="s7yfce_"
                              />
                            </div>
                            <div
                              className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-6 py-4 shadow-sm"
                              style={{ width: 'fit-content', maxWidth: '80%' }}
                              data-oid="z1u3vkj"
                            >
                              {/* 工作流结果输出显示 */}
                              <div
                                className="text-sm text-gray-800 leading-relaxed"
                                data-oid="64izm28"
                              >
                                {aiResponse ? (
                                  <div className="markdown-content">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeHighlight]}
                                    >
                                      {aiResponse}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  "正在生成发布会稿..."
                                )}
                              </div>

                              {/* 快捷功能按钮 */}
                              {aiResponse && (
                                <div
                                  className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100"
                                  data-oid="9pe2wkw"
                                >
                                  <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                                      liked
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title="点赞"
                                    data-oid="ixqhqhj"
                                  >
                                    <ThumbsUp
                                      className="w-3 h-3"
                                      data-oid="ixqhqhj"
                                    />
                                    <span data-oid="135.0cc">赞</span>
                                  </button>

                                  <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                                      disliked
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                    title="不满意"
                                    data-oid="ixqhqhj"
                                  >
                                    <ThumbsDown
                                      className="w-3 h-3"
                                      data-oid="ixqhqhj"
                                    />
                                    <span data-oid="135.0cc">踩</span>
                                  </button>

                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="复制"
                                    data-oid="vcbtz7r"
                                  >
                                    <Copy
                                      className="w-3 h-3"
                                      data-oid="8q5qwqc"
                                    />
                                    <span data-oid="1:8fhar">复制</span>
                                  </button>

                                  <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="重新生成"
                                    data-oid="vcbtz7r"
                                  >
                                    <RotateCcw
                                      className="w-3 h-3"
                                      data-oid="8q5qwqc"
                                    />
                                    <span data-oid="1:8fhar">重新生成</span>
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

                {/* 输入区域 (对接工作流 sys.query) */}
                <div className="space-y-4" data-oid="yp004h_">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入发布会主题和需要包含的内容..."
                    disabled={isLoading}
                    rows={3}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                    data-oid="a_qm5ec"
                  />

                  <div className="flex gap-3" data-oid="1.5qzw1">
                    <button
                      onClick={handleAiSearch}
                      disabled={internalLoading || !query.trim()}
                      className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
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
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg" data-oid="work-reminder-section">
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
