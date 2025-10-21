import React from 'react';
import { 
  Package,
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  Copy,
  Share2
} from 'lucide-react';

interface TechPackageChatProps {
  query: string;
  aiResponse: string;
  liked: boolean;
  disliked: boolean;
  loading?: boolean;
  onCopy: () => void;
  onLike: () => void;
  onDislike: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}

const TechPackageChat: React.FC<TechPackageChatProps> = ({
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
  onSubmit
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* AI助手头像和标识 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">技术包装助手</span>
      </div>

      {/* 对话内容区域 - 滚动对话框 */}
      <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-6 overflow-y-auto">
        <div className="space-y-4">
          {/* 默认欢迎消息 */}
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm">
                <p className="text-sm text-gray-800">您好！我是技术包装助手，专门为您提供专业的技术包装服务。请输入您的技术内容，我会为您生成精美的技术包装方案。</p>
              </div>
            </div>
          </div>

          {/* 用户问题和AI回答 */}
          {query && (
            <>
              {/* 用户问题 */}
              <div className="flex justify-end">
                <div className="bg-orange-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                  <p className="text-sm">{query}</p>
                </div>
              </div>
              
              {/* AI回答 */}
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-md shadow-sm">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {aiResponse || '正在生成技术包装方案...'}
                    </p>
                    
                    {/* 快捷功能按钮 */}
                    {aiResponse && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={onCopy}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="复制"
                        >
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </button>
                        
                        <button
                          onClick={onLike}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            liked 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title="点赞"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>点赞</span>
                        </button>
                        
                        <button
                          onClick={onDislike}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                            disliked 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="不符合"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>不符合</span>
                        </button>
                        
                        <button
                          onClick={onShare}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="采纳"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>采纳</span>
                        </button>
                        
                        <button
                          onClick={onRegenerate}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="重新生成"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>重新生成</span>
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
      <div className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="请输入需要技术包装的内容..."
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed"
          rows={3}
        />
        
        <button
          onClick={onSubmit}
          disabled={!query.trim() || loading}
          className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              <span>生成技术包装</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TechPackageChat;