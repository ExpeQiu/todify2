import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
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
import "../../styles/markdown.css";

interface TechPackageNodeProps extends BaseNodeProps {
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

const TechPackageNode: React.FC<TechPackageNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false,
  aiRole,
  mode,
}) => {
  const [query, setQuery] = useState(initialData?.query || "");
  const [activeTab, setActiveTab] = useState("技术包装");
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState(`# 测试标题

## 二级标题

**这是粗体文本**

- 列表项目1
- 列表项目2

---

> 这是一个引用

\`\`\`javascript
console.log("代码块测试");
\`\`\``);
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false); // 新增状态：是否已生成过内容
  const [disliked, setDisliked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true); // 默认为编辑模式

  // 对话历史状态
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // 知识点选择相关状态
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(true);

  // 保存模态框相关状态
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

  // AI搜索处理函数
  const handleAiSearch = async () => {
    if (!query.trim()) return;

    setInternalLoading(true);
    setAiResponse("");
    setLiked(false);
    setDisliked(false);

    // 添加用户消息到历史记录
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: query,
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      let response;
      
      // 如果提供了aiRole，优先使用AI角色服务
      if (aiRole) {
        console.log('使用AI角色服务:', aiRole.name);
        const { aiRoleService } = await import('../../services/aiRoleService');
        
        // 构建查询字符串（包含知识点信息）
        const knowledgePointsText = selectedItems
          .filter((item) => item.contentType === "knowledge_point")
          .map((item) => item.name)
          .join('、');
        
        const fullQuery = knowledgePointsText 
          ? `${query.trim()}\n\n相关知识点：${knowledgePointsText}`
          : query.trim();
        
        const roleResponse = await aiRoleService.chatWithRole(
          aiRole.id,
          fullQuery,
          {},
          conversationId
        );
        
        if (roleResponse.success && roleResponse.data) {
          // 构建统一的响应格式
          response = {
            success: true,
            data: {
              answer: roleResponse.data.answer || roleResponse.data.result,
              conversationId: roleResponse.data.conversation_id,
            }
          };
        } else {
          response = {
            success: false,
            error: roleResponse.error || 'AI角色调用失败'
          };
        }
      } else {
        // 回退到原有逻辑
        response = await workflowAPI.techPackage({
          query: query,
          selectedKnowledgePoints: selectedItems.filter(
            (item) => item.contentType === "knowledge_point",
          ),
        }, undefined, undefined, conversationId);
      }

      if (response.success) {
        // 更新conversationId以支持多轮对话
        if (response.data?.conversationId) {
          setConversationId(response.data.conversationId);
        }
        
        // 处理Dify工作流的响应格式
        const responseData = response.data;
        let content = "";

        // 尝试从不同的字段获取内容
        if (responseData.data && responseData.data.outputs) {
          // Dify工作流响应格式
          const outputs = responseData.data.outputs;
          content =
            outputs.answer || outputs.text || outputs.reasoning_content || "";
        } else if (responseData.answer) {
          // 直接的answer字段
          content = responseData.answer;
        } else if (responseData.content) {
          // 传统的content字段
          content = responseData.content;
        } else {
          // 默认内容
          content = "技术包装方案已生成，请查看右侧编辑区域进行进一步完善。";
        }

        setAiResponse(content);

        // 设置已生成状态为true
        setHasGenerated(true);

        // 添加AI响应到历史记录
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: content,
          timestamp: Date.now() + 1,
        };
        setChatHistory((prev) => [...prev, aiMessage]);

        // 执行工作流
        if (onExecute) {
          onExecute({
            query,
            response: content,
            selectedKnowledgePoints: selectedItems,
            rawResponse: responseData,
            userContent: userContent, // 添加编辑区内容
          });
        }
      } else {
        const errorContent = "生成失败，请重试。";
        setAiResponse(errorContent);

        // 添加错误响应到历史记录
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: errorContent,
          timestamp: Date.now() + 1,
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("AI搜索失败:", error);
      const errorContent = "网络错误，请检查连接后重试。";
      setAiResponse(errorContent);

      // 添加错误响应到历史记录
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: errorContent,
        timestamp: Date.now() + 1,
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setInternalLoading(false);
      // 清空输入框
      setQuery("");
    }
  };

  const handleAdopt = () => {
    // 将 AI 响应内容复制到编辑区域
    if (aiResponse) {
      setUserContent(aiResponse);
    }

    // 设置默认选择技术包装类型的知识点
    const defaultSelections: SelectionItem[] = knowledgePoints.map((kp) => ({
      knowledgePointId: kp.id,
      contentType: "tech_packaging" as ContentType,
      knowledgePoint: kp,
    }));

    setModalSelectedItems(defaultSelections);
    setShowSaveModal(true);
  };

  // 打开保存模态框
  const handleOpenSaveModal = () => {
    setShowSaveModal(true);
    setModalSelectedItems([...selectedItems]);
  };

  // 关闭保存模态框
  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModalSelectedItems([]);
  };

  // 确认保存
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      // 这里可以调用保存API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 模拟保存过程

      // 保存成功后关闭模态框
      setShowSaveModal(false);
      setModalSelectedItems([]);

      // 可以显示成功提示
      console.log("知识点保存成功");
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!userContent) return;

    // 创建下载链接
    const element = document.createElement("a");
    const file = new Blob([userContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `tech-package-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // 清理URL对象
    URL.revokeObjectURL(element.href);
  };

  // 复制功能
  const handleCopy = async () => {
    if (!aiResponse) return;

    try {
      await navigator.clipboard.writeText(aiResponse);
      // 这里可以显示复制成功的提示
      console.log("内容已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  // 处理点赞
  const handleLike = (messageId?: string) => {
    if (messageId) {
      // 更新历史记录中的点赞状态
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, liked: !msg.liked, disliked: false }
            : msg,
        ),
      );
    } else {
      // 兼容旧的点赞逻辑
      setLiked(!liked);
      setDisliked(false);
    }
  };

  // 处理点踩
  const handleDislike = (messageId?: string) => {
    if (messageId) {
      // 更新历史记录中的点踩状态
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, disliked: !msg.disliked, liked: false }
            : msg,
        ),
      );
    } else {
      // 兼容旧的点踩逻辑
      setDisliked(!disliked);
      setLiked(false);
    }
  };

  const handleShare = () => {
    // 采纳功能 - 将AI回答复制到用户内容区域
    if (aiResponse) {
      setUserContent(aiResponse);
    }
  };

  const handleRegenerate = () => {
    // 重新生成 - 重新调用AI搜索
    handleAiSearch();
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
                  className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                  data-oid="mu84osu"
                >
                  <Package
                    className="w-4 h-4 text-orange-600"
                    data-oid="97gzt14"
                  />
                </div>
                <h1
                  className="text-lg font-semibold text-gray-900"
                  data-oid=".j6mt:1"
                >
                  技术包装
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
                  pageType="tech_package"
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        isEditMode 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => setIsEditMode(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        !isEditMode 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      预览
                    </button>
                  </div>
                </div>

                {/* 文本编辑/预览区域 */}
                <div className="flex-1 mb-6 overflow-hidden" data-oid="isxa6c3">
                  {isEditMode ? (
                    <textarea
                      value={userContent}
                      onChange={(e) => setUserContent(e.target.value)}
                      placeholder="在这里编辑和完善技术包装内容..."
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

                {/* 底部操作按钮 */}
                <div className="flex gap-4 flex-shrink-0" data-oid="_xtzsk.">
                  <button
                    onClick={handleAdopt}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    data-oid="d0m9q5:"
                  >
                    <ArrowRight className="w-4 h-4" data-oid="jrrym-2" />
                    <span data-oid=":z3ulze">保存技术包装点</span>
                  </button>

                  <button
                    onClick={handleExport}
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
          <div className="modal-overlay" data-oid="or02g5q">
            <div className="modal-content" data-oid="jkb.o5q">
              <div className="modal-header" data-oid="wrfz8j3">
                <h3 className="modal-title" data-oid="3-1endv">
                  <Save
                    className="w-5 h-5 text-orange-600"
                    data-oid="b35-bok"
                  />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="104.:5b"
                >
                  <X className="w-5 h-5" data-oid="8:rh1l2" />
                </button>
              </div>

              <div className="modal-body" data-oid="eji7.bm">
                <p className="modal-description" data-oid="ze1oo2k">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid="g6ihmlx">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    allowedContentTypes={["tech_packaging"]}
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="._airco"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="2rl2x3l">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="l_s1iir"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="efyl8jj"
                >
                  {isSaving ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        data-oid="8z-0-kd"
                      ></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="mij8w:3" />
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

export default TechPackageNode;
