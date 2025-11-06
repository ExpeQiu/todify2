import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
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

interface CoreDraftNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const CoreDraftNode: React.FC<CoreDraftNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
  aiRole,
  mode,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术通稿");
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);

  // 知识点选择相关状态
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(true);

  // 保存知识点模态框状态
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SelectionItem[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  
  // 多轮对话支持
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
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
      setAiResponse("AI正在生成技术通稿内容...");

      try {
        let result;
        
        // 如果提供了aiRole，优先使用AI角色服务
        if (aiRole && aiRole.difyConfig.connectionType === 'chatflow') {
          console.log('使用AI角色服务:', aiRole.name);
          const { aiRoleService } = await import('../../services/aiRoleService');
          
          const roleResponse = await aiRoleService.chatWithRole(
            aiRole.id,
            query.trim(),
            {},
            conversationId
          );
          
          if (roleResponse.success && roleResponse.data) {
            result = {
              success: true,
              data: {
                answer: roleResponse.data.answer || roleResponse.data.result,
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
          result = await workflowAPI.coreDraft(
            { query: query.trim() }, // promotionStrategy 参数
            undefined, // difyConfig 参数
            conversationId // conversationId 参数
          );
        }

        if (result.success && result.data) {
          // 更新conversationId以支持多轮对话
          if (result.data.conversationId) {
            setConversationId(result.data.conversationId);
          }
          
          // 设置AI响应内容
          setAiResponse(result.data.answer || "抱歉，未能生成技术通稿内容。");

          // 通知父组件执行完成
          onExecute({
            query: query.trim(),
            response: result.data.answer,
            metadata: result.data.metadata,
          });
        } else {
          setAiResponse(result.error || "技术通稿生成失败，请稍后重试。");
        }
      } catch (error) {
        console.error("技术通稿生成错误:", error);
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
      link.download = `core-draft-result-${new Date().toISOString().slice(0, 10)}.md`;

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
    // 重新生成功能 - 重新触发技术通稿生成
    if (query) {
      handleAiSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-oid=":7dnyvg">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200" data-oid="fbm-3t3">
        <div className="max-w-7xl mx-auto px-6 py-4" data-oid="m9_stmz">
          <div className="flex items-center justify-between" data-oid="0ctocep">
            <div className="flex items-center gap-4" data-oid="x138bki">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                data-oid="tmxp2d0"
              >
                <ArrowLeft className="w-4 h-4" data-oid="apb0n3o" />
                <span className="text-sm" data-oid="ofsloqb">
                  返回
                </span>
              </button>
              <div className="flex items-center gap-3" data-oid="34upxpw">
                <div
                  className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
                  data-oid="9891hhg"
                >
                  <FileText
                    className="w-4 h-4 text-purple-600"
                    data-oid="cvh2aj5"
                  />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid="9yup_m:"
                >
                  技术通稿
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3" data-oid=".vtd7h2">
              <span className="text-sm text-gray-500" data-oid="ytvuy0g">
                中文
              </span>
              <span className="text-sm text-gray-500" data-oid="84glgm9">
                分享
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6" data-oid="8c:8:qv">
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
          data-oid="f8ts0nf"
        />

        {/* 主要内容区域 */}
        <div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          data-oid="7pqn9q1"
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ height: "calc(100vh - 200px)" }}
            data-oid="y4d7o4:"
          >
            {/* 左侧AI对话区域 */}
            <div className="p-8 border-r border-gray-200" data-oid="yjg7jay">
              <div className="h-full flex flex-col" data-oid="pzv0nqn">
                {/* AI助手头像和标识 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="l4wu0x0"
                >
                  <div
                    className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
                    data-oid="824a.yh"
                  >
                    <FileText
                      className="w-5 h-5 text-purple-600"
                      data-oid="lv17ls8"
                    />
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700"
                    data-oid="8jniqew"
                  >
                    技术通稿助手
                  </span>
                </div>

                {/* 对话内容区域 - 滚动对话框 */}
                <div
                  className="flex-1 bg-gray-50 rounded-xl p-4 mb-6 overflow-y-auto"
                  data-oid="of5::ed"
                >
                  <div className="space-y-4" data-oid="_pvorsf">
                    {/* 默认欢迎消息 */}
                    <div className="flex justify-start" data-oid="mw2sq1p">
                      <div
                        className="flex items-start gap-3"
                        data-oid="yw96jb4"
                      >
                        <div
                          className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          data-oid="7zxubnt"
                        >
                          <FileText
                            className="w-4 h-4 text-purple-600"
                            data-oid=".xkv:l1"
                          />
                        </div>
                        <div
                          className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                          data-oid="s42xi7a"
                        >
                          <p
                            className="text-sm text-gray-800"
                            data-oid="jgwl.d-"
                          >
                            您好！我是技术通稿助手，专门为您撰写专业的技术通稿文档。请输入您的技术内容，我会为您生成规范的技术通稿。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 用户问题和AI回答 */}
                    {query && (
                      <>
                        {/* 用户问题 */}
                        <div className="flex justify-end" data-oid="ljh9jda">
                          <div
                            className="bg-purple-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs"
                            data-oid="7i4ny30"
                          >
                            <p className="text-sm" data-oid="g11.qb1">
                              {query}
                            </p>
                          </div>
                        </div>

                        {/* AI回答 */}
                        <div className="flex justify-start" data-oid="h3ok6af">
                          <div
                            className="flex items-start gap-3"
                            data-oid="_772g_x"
                          >
                            <div
                              className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                              data-oid="4larqr8"
                            >
                              <FileText
                                className="w-4 h-4 text-purple-600"
                                data-oid="d2yp6nu"
                              />
                            </div>
                            <div
                              className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm"
                              data-oid="jqs3:ip"
                            >
                              <p
                                className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                                data-oid="h-5pi:m"
                              >
                                {aiResponse || "正在生成技术通稿..."}
                              </p>

                              {/* 快捷功能按钮 */}
                              {aiResponse && (
                                <div
                                  className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                                  data-oid="zze8q7."
                                >
                                  <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="复制"
                                    data-oid=":ulshw_"
                                  >
                                    <Copy
                                      className="w-3 h-3"
                                      data-oid="2:bp46p"
                                    />

                                    <span data-oid="6fc8edi">复制</span>
                                  </button>

                                  <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      liked
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title="点赞"
                                    data-oid="jo8v-7e"
                                  >
                                    <ThumbsUp
                                      className="w-3 h-3"
                                      data-oid="-4zx-:8"
                                    />

                                    <span data-oid="fvfmvmx">点赞</span>
                                  </button>

                                  <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                      disliked
                                        ? "text-red-600 bg-red-50"
                                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                    }`}
                                    title="不符合"
                                    data-oid=":jvprfl"
                                  >
                                    <ThumbsDown
                                      className="w-3 h-3"
                                      data-oid="f6jqd9:"
                                    />

                                    <span data-oid="o5z8y3-">不符合</span>
                                  </button>

                                  <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="采纳"
                                    data-oid="ij3tm44"
                                  >
                                    <Share2
                                      className="w-3 h-3"
                                      data-oid="6fweu.0"
                                    />

                                    <span data-oid="_.9sphx">采纳</span>
                                  </button>

                                  <button
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="重新生成"
                                    data-oid="zqasw51"
                                  >
                                    <RotateCcw
                                      className="w-3 h-3"
                                      data-oid="n_-tdea"
                                    />

                                    <span data-oid="4k9s7s_">重新生成</span>
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
                <div className="space-y-4" data-oid="a4jbuf_">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="请输入需要撰写通稿的技术内容..."
                    disabled={isLoading}
                    rows={3}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                    data-oid="5tgqkbb"
                  />

                  <div className="flex gap-3" data-oid="meikejf">
                    <button
                      onClick={handleAiSearch}
                      disabled={internalLoading || !query.trim()}
                      className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                      data-oid="0:tp8pb"
                    >
                      {internalLoading ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                            data-oid="opsjyk0"
                          ></div>
                          <span data-oid="4_nq8s8">生成中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" data-oid=":p-65d6" />
                          <span data-oid="sjxtrb_">生成核心稿件</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧用户编辑区域 */}
            <div className="p-8" data-oid="mk50rbd">
              <div className="h-full flex flex-col" data-oid="_th76s3">
                {/* 编辑区标题 */}
                <div
                  className="flex items-center gap-3 mb-6"
                  data-oid="nm_vbb7"
                >
                  <div
                    className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center"
                    data-oid="ybcffd3"
                  >
                    <BookOpen
                      className="w-4 h-4 text-green-600"
                      data-oid=".qcshzh"
                    />
                  </div>
                  <h2
                    className="text-lg font-semibold text-gray-900"
                    data-oid="z1l9v0-"
                  >
                    编辑修订
                  </h2>
                </div>

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
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 text-sm font-medium"
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
                      placeholder="在这里编辑和完善技术通稿内容..."
                      className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed overflow-y-auto"
                      data-oid="fqtkebj"
                    />
                  ) : (
                    <div className="w-full h-full p-4 border border-gray-200 rounded-xl bg-gray-50 overflow-y-auto">
                       {userContent ? (
                         <div className="markdown-preview prose prose-sm max-w-none">
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

                {/* 采纳建议和导出按钮 */}
                <div className="flex gap-4" data-oid="qeimp52">
                  <button
                    onClick={handleAdopt}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="nm3h55z"
                  >
                    <ArrowRight className="w-4 h-4" data-oid="ews3h68" />
                    <span data-oid="_:9y1-_">保存知识点</span>
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={!userContent}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="ucnslv6"
                  >
                    <Download className="w-4 h-4" data-oid="q1evy3b" />
                    <span data-oid="eq:qmw2">导出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 知识点保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay" data-oid="g6_88it">
            <div className="modal-content" data-oid="sz9uwvx">
              <div className="modal-header" data-oid="vcinyve">
                <h3 className="modal-title" data-oid="t7oh13o">
                  <Save
                    className="w-5 h-5 text-purple-600"
                    data-oid="4u8khe9"
                  />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="wwyexqo"
                >
                  <X className="w-5 h-5" data-oid="z:vmp-d" />
                </button>
              </div>

              <div className="modal-body" data-oid="2emkfgh">
                <p className="modal-description" data-oid="jq7w8pk">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid="d3dcqwn">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="1mh0:ux"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="a.9bmd-">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="1w2a7qm"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="0hw:97q"
                >
                  {isSaving ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        data-oid="a-81v_4"
                      ></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="zcdrjxp" />
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

export default CoreDraftNode;
