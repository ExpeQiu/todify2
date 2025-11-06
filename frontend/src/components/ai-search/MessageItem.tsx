import React from "react";
import { Bot, User, Copy, Save, Check, File } from "lucide-react";
import { Message } from "../../types/aiSearch";

interface MessageItemProps {
  message: Message;
  onCopy?: (content: string) => void;
  onSave?: (content: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onCopy,
  onSave,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

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

  const formatTime = (date: Date) => {
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
        {/* 消息气泡 */}
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? "bg-blue-600 text-white ml-auto"
              : "bg-gray-100 text-gray-900"
          }`}
          style={{ maxWidth: "80%" }}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

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
              title="保存到笔记"
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
