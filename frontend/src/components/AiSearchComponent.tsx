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
  Send,
  Loader2,
  Save,
  X,
  Check,
} from "lucide-react";
import { workflowAPI } from "../services/api";
import KnowledgePointSelector, {
  KnowledgePoint,
  SelectionItem,
  ContentType,
} from "./common/KnowledgePointSelector";
import "./nodes/NodeComponent.css";

interface AiSearchComponentProps {
  onResult?: (result: any) => void;
  initialQuery?: string;
  showKnowledgeSelector?: boolean;
  className?: string;
  compact?: boolean;
}

const AiSearchComponent: React.FC<AiSearchComponentProps> = ({
  onResult,
  initialQuery = "",
  showKnowledgeSelector = true,
  className = "",
  compact = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [aiResponse, setAiResponse] = useState("");
  const [userContent, setUserContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(true); // 始终显示知识点选择器
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);

  // 新增：知识点保存确认模态框状态
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SelectionItem[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAiSearch = async () => {
    if (query.trim()) {
      setIsLoading(true);
      setAiResponse("AI正在分析您的问题...");

      try {
        // 调用后端AI搜索API
        const result = await workflowAPI.aiSearch(query.trim(), {
          selectedKnowledgePoints: selectedItems,
        });

        if (result.success && result.data) {
          // 设置AI响应内容
          const response = result.data.answer || "抱歉，未能获取到有效回答。";
          setAiResponse(response);

          // 通知父组件
          if (onResult) {
            onResult({
              query: query.trim(),
              response: response,
              metadata: result.data.metadata,
              selectedKnowledgePoints: selectedItems,
            });
          }
        } else {
          setAiResponse(result.error || "AI搜索失败，请稍后重试。");
        }
      } catch (error) {
        console.error("AI搜索错误:", error);
        setAiResponse("网络错误，请检查连接后重试。");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 将AI响应内容保存到用户内容区域
  const handleAdopt = () => {
    if (aiResponse && aiResponse !== "AI正在分析您的问题...") {
      setUserContent(aiResponse);
    }
  };

  // 新增：打开知识点保存确认模态框
  const handleOpenSaveModal = () => {
    console.log(
      "点击保存知识点按钮，当前选择的知识点数量:",
      selectedItems.length,
    );
    console.log("选择的知识点:", selectedItems);
    console.log("showSaveModal状态:", showSaveModal);

    // 直接打开模态框，不管是否已选择知识点
    setModalSelectedItems([...selectedItems]); // 复制当前选择的知识点
    setShowSaveModal(true);
    console.log("设置showSaveModal为true");
  };

  // 新增：关闭知识点保存确认模态框
  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModalSelectedItems([]);
  };

  // 新增：确认保存知识点
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      // 这里可以调用API保存知识点
      console.log("保存知识点:", modalSelectedItems);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 保存成功后关闭模态框
      setShowSaveModal(false);
      setModalSelectedItems([]);

      // 可以添加成功提示
      console.log("知识点保存成功");
    } catch (error) {
      console.error("保存知识点失败:", error);
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
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiSearch();
    }
  };

  return (
    <div
      className={`ai-search-component ${compact ? "compact" : ""} ${className}`}
      data-oid="ub4y0aq"
    >
      {/* 头部 */}
      <div className="ai-search-header" data-oid="hiw0oj4">
        <div className="header-left" data-oid="f63l5_y">
          <Brain className="header-icon text-blue-600" data-oid="-fz.3lg" />
          <h2
            className="text-xl font-semibold text-gray-800"
            data-oid="2kdx325"
          >
            AI智能助手
          </h2>
        </div>
        <div className="header-description" data-oid="x_vde5k">
          <p className="text-sm text-gray-600" data-oid="pfc3c.w">
            您好！我是AI智能助手，很高兴为您服务。请输入您的技术问题，我会为您提供专业的解答和建议。
          </p>
        </div>
      </div>

      {/* 知识点选择器 */}
      {showKnowledgeSelection && (
        <div className="knowledge-selector-section" data-oid="q2rxczv">
          <KnowledgePointSelector
            knowledgePoints={knowledgePoints}
            initialSelectedItems={selectedItems}
            initialExpanded={false}
            title="选择相关知识点"
            description="选择相关的技术知识点，AI将基于这些信息为您提供更精准的回答"
            onSelectionChange={setSelectedItems}
            showSaveButton={false}
            collapsible={true}
            data-oid="bnm87n8"
          />
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="ai-search-content" data-oid="hu4wfu7">
        {/* 输入区域 */}
        <div className="input-section" data-oid="7w-9mtr">
          <div className="input-container" data-oid="wv4of17">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题..."
              className="query-input"
              rows={compact ? 2 : 3}
              disabled={isLoading}
              data-oid=":u_ze7h"
            />

            <button
              onClick={handleAiSearch}
              disabled={!query.trim() || isLoading}
              className="send-button"
              data-oid="j96:51r"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" data-oid="l9t95di" />
              ) : (
                <Send className="w-4 h-4" data-oid="1x78ta8" />
              )}
              {isLoading ? "发送中..." : "发送问题"}
            </button>
          </div>
        </div>

        {/* AI响应区域 */}
        {aiResponse && (
          <div
            className="response-section-fixed"
            style={{
              marginBottom: "28px",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "white",
            }}
            data-oid="moo7pg3"
          >
            <div
              className="response-header-fixed"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 20px",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderBottom: "1px solid #e2e8f0",
                fontWeight: "600",
                flexShrink: "0",
                minHeight: "60px",
              }}
              data-oid="m_nqagl"
            >
              <Sparkles className="w-5 h-5 text-blue-600" data-oid="3f9.tbt" />
              <span className="font-medium text-gray-800" data-oid="o.dacsj">
                AI回答
              </span>
              <div className="response-actions" data-oid="i-nemfp">
                <button
                  onClick={handleLike}
                  className={`action-btn ${liked ? "liked" : ""}`}
                  title="点赞"
                  data-oid="va.hrq-"
                >
                  <ThumbsUp className="w-4 h-4" data-oid="imyf0wh" />
                </button>
                <button
                  onClick={handleDislike}
                  className={`action-btn ${disliked ? "disliked" : ""}`}
                  title="点踩"
                  data-oid="oni6_ay"
                >
                  <ThumbsDown className="w-4 h-4" data-oid="4sn83h6" />
                </button>
                <button
                  onClick={handleCopy}
                  className="action-btn"
                  title="复制"
                  data-oid="pmbc2md"
                >
                  <Copy className="w-4 h-4" data-oid="lu7fe-h" />
                </button>
                <button
                  onClick={handleShare}
                  className="action-btn"
                  title="传递到编辑区"
                  data-oid="l4hzibg"
                >
                  <Share2 className="w-4 h-4" data-oid="yo25pxe" />
                </button>
                <button
                  onClick={handleRegenerate}
                  className="action-btn"
                  title="重新生成"
                  disabled={isLoading}
                  data-oid="b6c8-j_"
                >
                  <RotateCcw className="w-4 h-4" data-oid="7p:hlyg" />
                </button>
              </div>
            </div>
            <div
              className="response-content-fixed"
              style={{
                padding: "0",
                flex: "1",
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: "0",
                background: "white",
              }}
              data-oid="gytjo:y"
            >
              <div
                className="ai-response-fixed"
                style={{
                  lineHeight: "1.7",
                  color: "#334155",
                  margin: "20px",
                  whiteSpace: "pre-wrap",
                  fontSize: "15px",
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  padding: "20px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #3b82f6",
                  wordWrap: "break-word",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
                data-oid="63pui6v"
              >
                {aiResponse}
              </div>
              {!isLoading && aiResponse !== "AI正在分析您的问题..." && (
                <button
                  onClick={handleAdopt}
                  className="adopt-button-fixed"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                    flexShrink: "0",
                    alignSelf: "flex-start",
                    margin: "0 20px 20px 20px",
                  }}
                  data-oid="ft6z4:."
                >
                  <ArrowRight className="w-4 h-4" data-oid=".hcv.59" />
                  采纳回答
                </button>
              )}
            </div>
          </div>
        )}

        {/* 用户编辑区域 */}
        {userContent && (
          <div className="user-content-section" data-oid="s2zhz2c">
            <div className="content-header" data-oid=".oa-z_l">
              <BookOpen className="w-5 h-5 text-green-600" data-oid="zhv_-ir" />
              <span className="font-medium text-gray-800" data-oid="scbl-oo">
                编辑修订
              </span>
              <div className="header-actions" data-oid="al5v9mr">
                <button
                  onClick={handleOpenSaveModal}
                  className="save-knowledge-button"
                  disabled={false} // 移除禁用条件，让用户可以点击
                  data-oid="5n73s5e"
                >
                  <Save className="w-4 h-4" data-oid="0z2y7st" />
                  保存知识点 ({selectedItems.length})
                </button>
                <button
                  onClick={handleExport}
                  className="export-button"
                  data-oid="gg9ls3m"
                >
                  <Download className="w-4 h-4" data-oid="_-_7wc9" />
                  导出
                </button>
              </div>
            </div>
            <div className="content-editor" data-oid=":h:z2vi">
              <textarea
                value={userContent}
                onChange={(e) => setUserContent(e.target.value)}
                placeholder="在这里编辑和完善内容..."
                className="content-textarea"
                rows={8}
                data-oid="6iwphsi"
              />
            </div>
          </div>
        )}

        {/* 知识点保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay" data-oid="iimuf9y">
            <div className="modal-content" data-oid="wvyl0yh">
              <div className="modal-header" data-oid="qaujyzs">
                <h3 className="modal-title" data-oid="ulzwmhe">
                  <Save className="w-5 h-5 text-blue-600" data-oid="48ax1yf" />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                  data-oid="pz.v53g"
                >
                  <X className="w-5 h-5" data-oid="ojsl:7z" />
                </button>
              </div>

              <div className="modal-body" data-oid="gqw8xq0">
                <p className="modal-description" data-oid="_4g0vvt">
                  您即将保存以下 {modalSelectedItems.length}{" "}
                  个知识点，请确认选择：
                </p>

                <div className="knowledge-points-preview" data-oid=".msrhy7">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                    data-oid="v-a85yw"
                  />
                </div>
              </div>

              <div className="modal-footer" data-oid="8wd577p">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                  data-oid="x_3b_ar"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                  data-oid="j8zdh_c"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        data-oid="tjme1m_"
                      />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" data-oid="xdvkncf" />
                      确认保存 ({modalSelectedItems.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style data-oid="mqazvn0">{`
        .ai-search-component {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: 1px solid #f1f5f9;
          height: 100vh;
          max-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .ai-search-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          max-height: 80px;
          overflow: hidden;
        }

        .ai-search-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .header-icon {
          width: 28px;
          height: 28px;
          filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
        }

        .knowledge-selector-section {
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
          max-height: 100px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .ai-search-content {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .input-section {
          margin-bottom: 28px;
          max-height: 120px;
          overflow: hidden;
        }

        .input-container {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .query-input {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.3s ease;
          background: #fafbfc;
          font-family: inherit;
        }

        .query-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: white;
          transform: translateY(-1px);
        }

        .query-input::placeholder {
          color: #94a3b8;
          font-style: italic;
        }

        .send-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          font-size: 14px;
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .send-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .send-button:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* 全新的响应区域样式 */
        .response-section-fixed {
          margin-bottom: 28px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          height: 500px;
          max-height: 500px;
          min-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .response-header-fixed {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
          flex-shrink: 0;
          min-height: 60px;
          max-height: 60px;
        }

        .response-content-fixed {
          padding: 0;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
          max-height: 440px;
          background: white;
        }

        .ai-response-fixed {
          line-height: 1.7;
          color: #334155;
          margin: 20px;
          white-space: pre-wrap;
          font-size: 15px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          flex-shrink: 0;
          min-height: auto;
          max-height: 350px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* p元素严格高度限制 */
        .ai-search-component p {
          margin: 0 0 12px 0;
          line-height: 1.5;
          color: #374151;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-height: 120px !important;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0;
          box-sizing: border-box;
        }
        
        .ai-response-fixed p {
          margin: 0 0 16px 0;
          line-height: 1.6;
          color: #374151;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-height: 150px !important;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        
        .modal-description p {
          max-height: 80px !important;
          height: auto;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 8px 0;
          box-sizing: border-box;
        }

        /* 全局p元素限制 */
        p {
          max-height: 120px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }

        .adopt-button-fixed {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 12px 20px !important;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
          flex-shrink: 0 !important;
          align-self: flex-start !important;
          margin: 0 20px 20px 20px !important;
        }

        .user-content-section {
          margin-bottom: 28px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          max-height: 70vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .content-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
        }

        .response-actions {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }

        .action-btn {
          padding: 8px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          position: relative;
        }

        .action-btn:hover {
          background: #e2e8f0;
          color: #334155;
          transform: scale(1.1);
        }

        .action-btn.liked {
          color: #10b981;
          background: #ecfdf5;
        }

        .action-btn.disliked {
          color: #ef4444;
          background: #fef2f2;
        }


        .adopt-button-fixed:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.2s ease;
        }

        .export-button:hover {
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          transform: translateY(-1px);
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .save-knowledge-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .save-knowledge-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .save-knowledge-button:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* 模态框样式 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
        }

        .modal-close-button:hover:not(:disabled) {
          background: #e2e8f0;
          color: #475569;
        }

        .modal-close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-body {
          padding: 20px 24px;
          max-height: 50vh;
          overflow-y: auto;
        }

        .modal-description {
          margin: 0 0 20px 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .knowledge-points-preview {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #fafbfc;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px 24px;
          border-top: 1px solid #e2e8f0;
          background: #fafbfc;
        }

        .modal-cancel-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-cancel-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #475569;
        }

        .modal-cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-confirm-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .modal-confirm-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .modal-confirm-button:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .content-textarea {
          width: 100%;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
          background: #fafbfc;
          transition: all 0.2s ease;
          min-height: 200px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .content-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }

        /* 全局高度约束 - 严格限制 */
        * {
          box-sizing: border-box;
        }
        
        .ai-search-component * {
          max-height: inherit;
        }
        
        .ai-search-component div {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        
        .ai-search-component div:not(.response-content-fixed):not(.ai-response-fixed) {
          max-height: 100vh !important;
        }

        /* 全局div元素严格限制 */
        div {
          max-height: 100vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }

        /* 特定div元素的更严格限制 */
        .ai-search-header {
          max-height: 80px !important;
        }

        .knowledge-selector-section {
          max-height: 100px !important;
        }

        .input-section {
          max-height: 120px !important;
        }

        .response-section-fixed {
          max-height: 500px !important;
          height: 500px !important;
        }

        .response-content-fixed {
          max-height: 440px !important;
        }

        .ai-response-fixed {
          max-height: 350px !important;
        }

        .user-content-section {
          max-height: 70vh !important;
        }
        /* 移除所有媒体查询的动态高度调整，保持固定高度 */
      `}</style>
    </div>
  );
};

export default AiSearchComponent;
