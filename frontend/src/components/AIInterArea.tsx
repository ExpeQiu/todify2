import React from "react";
import {
  Brain,
  Package,
  FileText,
  Megaphone,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Copy,
  Share2,
} from "lucide-react";

// 页面类型定义
export type PageType =
  | "ai_qa"
  | "tech_package"
  | "promotion_strategy"
  | "core_draft"
  | "speech";

// 页面配置
const PAGE_CONFIG = {
  ai_qa: {
    icon: Brain,
    title: "AI问答助手",
    welcomeMessage:
      "您好！我是AI问答助手，可以为您解答各种技术问题。请输入您的问题，我会为您提供详细的解答。",
    placeholder: "请输入您的问题...",
    defaultInput: "",
    buttonText: "获取答案",
    loadingText: "思考中...",
    responsePrefix: "正在为您解答...",
    color: "blue",
  },
  tech_package: {
    icon: Package,
    title: "技术包装助手",
    welcomeMessage:
      "您好！我是技术包装助手，专门为您提供专业的技术包装服务。请输入您的技术内容，我会为您生成精美的技术包装方案。",
    placeholder: "请输入您的修改意见...",
    defaultInput: '请生成一份 关于 "关联技术点" 的  技术包装内容。',
    buttonText: "生成技术包装",
    loadingText: "生成中...",
    responsePrefix: "正在生成技术包装方案...",
    color: "orange",
  },
  promotion_strategy: {
    icon: FileText,
    title: "推广策略助手",
    welcomeMessage:
      "您好！我是推广策略助手，专注于为您制定专业的推广发展策略。请描述您的推广需求，我会为您提供战略性建议。",
    placeholder: "请描述您的修改意见...",
    defaultInput: "",
    buttonText: "生成推广策略",
    loadingText: "策划中...",
    responsePrefix: "正在制定推广策略...",
    color: "purple",
  },
  core_draft: {
    icon: FileText,
    title: "核心稿件助手",
    welcomeMessage:
      "您好！我是核心稿件助手，专门为您撰写专业的核心稿件。请提供稿件要点，我会为您生成规范的稿件内容。",
    placeholder: "请输入您的修改意见...",
    defaultInput: "",
    buttonText: "生成核心稿件",
    loadingText: "撰写中...",
    responsePrefix: "正在撰写核心稿件...",
    color: "green",
  },
  speech: {
    icon: Megaphone,
    title: "演讲稿助手",
    welcomeMessage:
      "您好！我是演讲稿助手，专门为您撰写专业的演讲稿。请提供演讲内容要点，我会为您生成精彩的演讲稿。",
    placeholder: "请输入您的修改意见...",
    defaultInput: "",
    buttonText: "生成演讲稿",
    loadingText: "撰写中...",
    responsePrefix: "正在撰写演讲稿...",
    color: "red",
  },
};

// 颜色样式配置
const COLOR_STYLES: Record<
  string,
  {
    primary: string;
    light: string;
    text: string;
    hover: string;
    focus: string;
  }
> = {
  blue: {
    primary: "bg-blue-500 hover:bg-blue-600",
    light: "bg-blue-100",
    text: "text-blue-600",
    hover: "hover:text-blue-600 hover:bg-blue-50",
    focus: "focus:ring-blue-500",
  },
  orange: {
    primary: "bg-orange-500 hover:bg-orange-600",
    light: "bg-orange-100",
    text: "text-orange-600",
    hover: "hover:text-orange-600 hover:bg-orange-50",
    focus: "focus:ring-orange-500",
  },
  purple: {
    primary: "bg-purple-500 hover:bg-purple-600",
    light: "bg-purple-100",
    text: "text-purple-600",
    hover: "hover:text-purple-600 hover:bg-purple-50",
    focus: "focus:ring-purple-500",
  },
  green: {
    primary: "bg-green-500 hover:bg-green-600",
    light: "bg-green-100",
    text: "text-green-600",
    hover: "hover:text-green-600 hover:bg-green-50",
    focus: "focus:ring-green-500",
  },
  red: {
    primary: "bg-red-500 hover:bg-red-600",
    light: "bg-red-100",
    text: "text-red-600",
    hover: "hover:text-red-600 hover:bg-red-50",
    focus: "focus:ring-red-500",
  },
};

// 对话消息接口
interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: number;
  liked?: boolean;
  disliked?: boolean;
}

interface AIInterAreaProps {
  pageType: PageType;
  query: string;
  aiResponse: string;
  liked?: boolean;
  disliked?: boolean;
  loading?: boolean;
  onCopy: () => void;
  onLike: (messageId?: string) => void;
  onDislike: (messageId?: string) => void;
  onShare: () => void;
  onRegenerate: () => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
  chatHistory?: ChatMessage[]; // 新增对话历史属性
  hasGenerated?: boolean; // 新增：是否已生成过内容
  hasSelectedKnowledgePoints?: boolean; // 新增：是否已选择关联技术点
}

const AIInterArea: React.FC<AIInterAreaProps> = ({
  pageType,
  query,
  aiResponse,
  liked,
  disliked,
  loading = false,
  onCopy,
  onLike,
  onDislike,
  onShare,
  onRegenerate,
  onQueryChange,
  onSubmit,
  chatHistory = [], // 默认为空数组
  hasGenerated = false, // 默认为false
  hasSelectedKnowledgePoints = false, // 默认为false
}) => {
  const config = PAGE_CONFIG[pageType];
  const IconComponent = config.icon;
  const colorStyle = COLOR_STYLES[config.color];

  // 根据是否已生成内容来决定显示的文本和占位符
  const displayValue = hasGenerated
    ? query
    : query || config.defaultInput || "";
  const displayPlaceholder = hasGenerated
    ? config.placeholder
    : config.defaultInput || config.placeholder;

  // 判断按钮是否可点击：需要有文本内容且已选择关联技术点
  const isButtonDisabled =
    !displayValue.trim() || loading || !hasSelectedKnowledgePoints;

  // 生成友好的提示信息
  const getButtonTooltip = () => {
    if (!displayValue.trim()) {
      return "请输入内容";
    }
    if (!hasSelectedKnowledgePoints) {
      return "请先选择关联技术点";
    }
    return "";
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" data-oid="c6:b8x4">
      {/* 标题栏 */}
      <div
        className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3"
        data-oid="6x3grth"
      >
        <div className="flex items-center gap-3" data-oid="_mw-i8-">
          <div
            className={`w-8 h-8 ${colorStyle.light} rounded-full flex items-center justify-center`}
            data-oid="9db5vwd"
          >
            <IconComponent
              className={`w-4 h-4 ${colorStyle.text}`}
              data-oid="j96oo62"
            />
          </div>
          <h2
            className="text-lg font-semibold text-gray-900"
            data-oid="hif-n:g"
          >
            {config.title}
          </h2>
        </div>
      </div>

      {/* 对话区域 */}
      <div
        className="overflow-y-auto p-4 space-y-4"
        style={{
          height: "500px",
          maxHeight: "500px",
          minHeight: "300px",
        }}
        data-oid="kjabb4s"
      >
        {/* 欢迎消息 */}
        <div className="flex justify-start" data-oid="7dx1nm6">
          <div className="flex items-start gap-2" data-oid="hj.plgf">
            <div
              className={`w-6 h-6 ${colorStyle.light} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
              data-oid="et-t407"
            >
              <IconComponent
                className={`w-3 h-3 ${colorStyle.text}`}
                data-oid="_4y0y_9"
              />
            </div>
            <div
              className="bg-white border border-gray-200 rounded-lg rounded-tl-sm px-3 py-2 max-w-xs shadow-sm"
              data-oid="_oxj4:8"
            >
              <p
                className="text-xs text-gray-800 leading-relaxed"
                style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
                data-oid="rcbnqzv"
              >
                {config.welcomeMessage}
              </p>
            </div>
          </div>
        </div>

        {/* 对话历史 */}
        {chatHistory.map((message) => (
          <div key={message.id} data-oid="w4a:2bm">
            {message.type === "user" ? (
              // 用户消息
              <div className="flex justify-end" data-oid="lnxt9tk">
                <div
                  className="bg-blue-500 text-white rounded-lg rounded-tr-sm px-3 py-2 max-w-xs shadow-sm"
                  data-oid="p5uiha5"
                >
                  <p
                    className="text-xs leading-relaxed"
                    style={{
                      maxHeight: "100px",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }}
                    data-oid="xs29u:f"
                  >
                    {message.content}
                  </p>
                </div>
              </div>
            ) : (
              // AI消息
              <div className="flex justify-start" data-oid="d_-7cnv">
                <div className="flex items-start gap-2" data-oid="_7a1r69">
                  <div
                    className={`w-6 h-6 ${colorStyle.light} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                    data-oid="8vvl.82"
                  >
                    <IconComponent
                      className={`w-3 h-3 ${colorStyle.text}`}
                      data-oid="26gdi2b"
                    />
                  </div>
                  <div
                    className="bg-white border border-gray-200 rounded-lg rounded-tl-sm px-3 py-2 max-w-xs shadow-sm"
                    data-oid="9u4d.ci"
                  >
                    <p
                      className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap"
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        overflowX: "hidden",
                      }}
                      data-oid="lobp.xs"
                    >
                      {message.content}
                    </p>

                    {/* 操作按钮 */}
                    <div
                      className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100"
                      data-oid="2916zl8"
                    >
                      <button
                        onClick={onCopy}
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 ${colorStyle.hover} rounded transition-colors`}
                        title="复制"
                        data-oid="xx.vy3i"
                      >
                        <Copy className="w-2.5 h-2.5" data-oid="bjuki5k" />
                        <span data-oid="zphton-">复制</span>
                      </button>

                      <button
                        onClick={() => onLike(message.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded transition-colors ${
                          message.liked
                            ? "text-green-600 bg-green-50"
                            : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title="点赞"
                        data-oid="dmkdmmv"
                      >
                        <ThumbsUp className="w-2.5 h-2.5" data-oid="iid2oll" />
                        <span data-oid="w0:rwxg">点赞</span>
                      </button>

                      <button
                        onClick={() => onDislike(message.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded transition-colors ${
                          message.disliked
                            ? "text-red-600 bg-red-50"
                            : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title="不符合"
                        data-oid="65-_6zw"
                      >
                        <ThumbsDown
                          className="w-2.5 h-2.5"
                          data-oid="cikd5.o"
                        />

                        <span data-oid="mcdz88b">不符合</span>
                      </button>

                      <button
                        onClick={onShare}
                        className={`flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 ${colorStyle.hover} rounded transition-colors`}
                        title="采纳"
                        data-oid="qo2p8gf"
                      >
                        <Share2 className="w-2.5 h-2.5" data-oid="2r5fziw" />
                        <span data-oid="n_5chx8">采纳</span>
                      </button>

                      <button
                        onClick={onRegenerate}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="重新生成"
                        data-oid="n_ql06f"
                      >
                        <RotateCcw className="w-2.5 h-2.5" data-oid="q_rju4k" />
                        <span data-oid="7i4vno-">重新生成</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-start" data-oid="41b6v5m">
            <div className="flex items-start gap-2" data-oid="z-qmyhk">
              <div
                className={`w-6 h-6 ${colorStyle.light} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                data-oid="4lcc_n_"
              >
                <IconComponent
                  className={`w-3 h-3 ${colorStyle.text}`}
                  data-oid="s1k:5rc"
                />
              </div>
              <div
                className="bg-white border border-gray-200 rounded-lg rounded-tl-sm px-3 py-2 max-w-xs shadow-sm"
                data-oid="y_uvqi9"
              >
                <p
                  className="text-xs text-gray-800 leading-relaxed"
                  style={{
                    maxHeight: "80px",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                  data-oid="cgb:g4x"
                >
                  {config.loadingText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div
        className="flex-shrink-0 space-y-3 p-4 bg-white border-t border-gray-200"
        data-oid="yq217cl"
      >
        <textarea
          value={displayValue}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={displayPlaceholder}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 ${colorStyle.focus} focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed`}
          rows={3}
          style={{
            maxHeight: "120px",
            minHeight: "80px",
          }}
          data-oid="rj7l10z"
        />

        <button
          onClick={onSubmit}
          disabled={isButtonDisabled}
          title={getButtonTooltip()}
          className={`w-full px-4 py-2.5 ${colorStyle.primary} text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm`}
          data-oid=".gfc6nc"
        >
          {loading ? (
            <>
              <div
                className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"
                data-oid="q-ooo34"
              ></div>
              <span data-oid="l.d8xd4">{config.loadingText}</span>
            </>
          ) : (
            <>
              <IconComponent className="w-3.5 h-3.5" data-oid="0hozkh4" />
              <span data-oid="izyi.ts">{config.buttonText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIInterArea;
