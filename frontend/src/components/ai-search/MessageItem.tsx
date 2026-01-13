import React from "react";
import { Bot, User, Copy, Save, Check, File, FileText, LayoutGrid, Loader2, Wrench } from "lucide-react";
import { Message } from "../../types/aiSearch";
import StructuredContentView from "./result-renderers/StructuredContentView";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MessageItemProps {
  message: Message;
  onCopy?: (content: string) => void;
  onSave?: (content: string) => void;
}

const FEATURE_LABEL_MAP: Record<string, string> = {
  "five-view-analysis": "技术转译",
  "three-fix-analysis": "用户场景挖掘",
  "tech-matrix": "发布会场景化",
  "propagation-strategy": "领导人口语化",
  "exhibition-video": "展具与视频",
  translation: "翻译",
  "ppt-outline": "技术讲稿",
  script: "脚本",
};

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onCopy,
  onSave,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"text" | "structured">("text");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onCopy) {
        onCopy(message.content);
      }
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSave) {
      onSave(message.content);
    }
  };

  const formatTime = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUser = message.role === "user";
  const featureType = message.outputs?.metadata?.featureType;
  const featureLabel = featureType ? FEATURE_LABEL_MAP[featureType] || featureType : null;
  const triggeredAt = message.outputs?.metadata?.triggeredAt;
  
  // 检测工具调用信息（主 Agent 调用专家工具）
  const toolCalls = message.outputs?.metadata?.toolCalls || [];
  const hasToolCalls = Array.isArray(toolCalls) && toolCalls.length > 0;
  const structuredContent = React.useMemo(() => {
    const outputs = message.outputs;
    if (!outputs) return null;

    if (outputs.structured) {
      return outputs.structured;
    }

    if (outputs.metadata?.structuredResult) {
      return outputs.metadata.structuredResult;
    }

    const rawContent = outputs.content;
    const parseJson = (value: string) => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    if (rawContent && typeof rawContent === "object") {
      return rawContent;
    }

    if (typeof rawContent === "string") {
      const trimmed = rawContent.trim();
      if (!trimmed) {
        return null;
      }

      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        const parsed = parseJson(trimmed);
        if (parsed) {
          return parsed;
        }
      }

      const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1) {
        if (lines.every((line) => /^[-*•]/.test(line))) {
          return lines.map((line) => line.replace(/^[-*•]\s*/, ""));
        }
        if (lines.every((line) => /^\d+\./.test(line))) {
          return lines.map((line) => line.replace(/^\d+\.\s*/, ""));
        }

        const keyValuePairs = lines
          .map((line) => line.match(/^(.*?)[：:]\s*(.*)$/))
          .filter(Boolean) as RegExpMatchArray[];
        if (keyValuePairs.length >= lines.length * 0.6) {
          return keyValuePairs.reduce<Record<string, string>>((acc, match) => {
            acc[match[1].trim()] = match[2].trim();
            return acc;
          }, {});
        }
      }
    }

    return null;
  }, [message.outputs]);

  React.useEffect(() => {
    // 默认始终显示文本视图
    setViewMode("text");
  }, [message.id]);

  return (
    <div className={`flex gap-4 mb-6 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-blue-600" : "bg-blue-100"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 ${isUser ? "items-end" : ""}`}>
        {/* 工具调用状态卡片 */}
        {!isUser && hasToolCalls && (
          <div className="mb-3 space-y-2">
            {toolCalls.map((toolCall: any, index: number) => {
              const toolName = toolCall.toolName || toolCall.name || '未知工具';
              const toolLabel = toolName.replace('Consult_', '').replace(/_/g, ' ');
              const isComplete = toolCall.status === 'complete' || toolCall.status === 'success';
              const isError = toolCall.status === 'error';
              const isRunning = !isComplete && !isError;
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                    isError
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : isComplete
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isError ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {isRunning ? '正在调用' : isError ? '调用失败' : '已完成'} {toolLabel}
                  </span>
                  {toolCall.error && (
                    <span className="ml-auto text-red-600">错误: {toolCall.error}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? "bg-blue-600 text-white ml-auto"
              : "bg-gray-100 text-gray-900"
          }`}
          style={{ maxWidth: "80%" }}
        >
          {viewMode === "structured" && structuredContent ? (
            <div className="space-y-3">
              <StructuredContentView data={structuredContent} title={featureLabel || "结构化结果"} />
            </div>
          ) : (
            <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
              isUser 
                ? "prose-invert [&>*]:text-white [&_strong]:text-white [&_em]:text-white [&_li]:text-white [&_td]:text-white [&_th]:text-white" 
                : "prose-gray"
            }`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // 自定义代码块样式
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <pre className={`rounded-md p-3 overflow-x-auto my-2 ${
                        isUser 
                          ? "bg-gray-800 text-gray-100" 
                          : "bg-gray-800 text-gray-100"
                      }`}>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                        isUser 
                          ? "bg-gray-800 text-gray-100" 
                          : "bg-gray-200 text-gray-900"
                      }`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // 自定义段落样式
                  p: ({ children }) => (
                    <p className={`mb-2 last:mb-0 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </p>
                  ),
                  // 自定义列表样式
                  ul: ({ children }) => (
                    <ul className={`list-disc list-inside mb-2 space-y-1 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className={`list-decimal list-inside mb-2 space-y-1 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className={isUser ? "text-white" : "text-gray-900"}>
                      {children}
                    </li>
                  ),
                  // 自定义标题样式
                  h1: ({ children }) => (
                    <h1 className={`text-xl font-bold mb-2 mt-3 first:mt-0 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={`text-lg font-bold mb-2 mt-3 first:mt-0 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={`text-base font-bold mb-2 mt-2 first:mt-0 ${isUser ? "text-white" : "text-gray-900"}`}>
                      {children}
                    </h3>
                  ),
                  // 自定义链接样式
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`underline ${
                        isUser 
                          ? "text-blue-200 hover:text-blue-100" 
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      {children}
                    </a>
                  ),
                  // 自定义引用样式
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-4 pl-4 my-2 italic ${
                      isUser 
                        ? "border-gray-300 text-gray-200" 
                        : "border-gray-400 text-gray-600"
                    }`}>
                      {children}
                    </blockquote>
                  ),
                  // 自定义表格样式
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="min-w-full border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className={`border border-gray-300 px-3 py-2 text-left font-semibold ${
                      isUser 
                        ? "bg-gray-700 text-white border-gray-600" 
                        : "bg-gray-200 text-gray-900"
                    }`}>
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className={`border border-gray-300 px-3 py-2 ${
                      isUser 
                        ? "text-white border-gray-600" 
                        : "text-gray-900"
                    }`}>
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {!isUser && structuredContent && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setViewMode("text")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                  viewMode === "text"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                <FileText className="w-3 h-3" />
                文本
              </button>
              <button
                onClick={() => setViewMode("structured")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                  viewMode === "structured"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                结构化
              </button>
            </div>
          )}

          {!isUser && featureLabel && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
              <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                子Agent：{featureLabel}
              </span>
              {triggeredAt && (
                <span className="text-[10px] text-gray-500">
                  {`触发于 ${formatTime(triggeredAt)}`}
                </span>
              )}
            </div>
          )}

          {/* 显示输出文件 */}
          {!isUser && message.outputs?.files && message.outputs.files.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs font-medium mb-2 text-gray-600">附件:</div>
              <div className="space-y-1">
                {message.outputs.files.map((file: any, index: number) => (
                  <a
                    key={index}
                    href={file.url || file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <File className="w-3 h-3" />
                    {file.name || file.filename || `文件 ${index + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 显示元数据 */}
          {!isUser && message.outputs?.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  元数据
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(message.outputs.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* 来源信息 */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            来源: {message.sources.map((s) => s.title).join(", ")}
          </div>
        )}

        {/* 操作按钮 */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="复制"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  复制
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="保存到项目"
            >
              {saved ? (
                <>
                  <Check className="w-3 h-3" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  保存
                </>
              )}
            </button>
          </div>
        )}

        {/* 时间戳 */}
        <div className="text-xs text-gray-400 mt-1">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
