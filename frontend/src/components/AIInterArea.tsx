import React from 'react';
import { 
  Brain,
  Package,
  FileText,
  Megaphone,
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  Copy,
  Share2
} from 'lucide-react';

// 页面类型枚举
export type PageType = 'ai_qa' | 'tech_package' | 'tech_strategy' | 'tech_newsletter' | 'press_release';

// 页面配置
const PAGE_CONFIG = {
  ai_qa: {
    icon: Brain,
    title: 'AI问答助手',
    welcomeMessage: '您好！我是AI问答助手，可以为您解答各种技术问题。请输入您的问题，我会为您提供详细的解答。',
    placeholder: '请输入您的问题...',
    buttonText: '获取答案',
    loadingText: '思考中...',
    responsePrefix: '正在为您解答...',
    color: 'blue'
  },
  tech_package: {
    icon: Package,
    title: '技术包装助手',
    welcomeMessage: '您好！我是技术包装助手，专门为您提供专业的技术包装服务。请输入您的技术内容，我会为您生成精美的技术包装方案。',
    placeholder: '请输入需要技术包装的内容...',
    buttonText: '生成技术包装',
    loadingText: '生成中...',
    responsePrefix: '正在生成技术包装方案...',
    color: 'orange'
  },
  tech_strategy: {
    icon: FileText,
    title: '技术策略助手',
    welcomeMessage: '您好！我是技术策略助手，专注于为您制定专业的技术发展策略。请描述您的技术需求，我会为您提供战略性建议。',
    placeholder: '请描述您的技术策略需求...',
    buttonText: '生成技术策略',
    loadingText: '策划中...',
    responsePrefix: '正在制定技术策略...',
    color: 'purple'
  },
  tech_newsletter: {
    icon: FileText,
    title: '技术通稿助手',
    welcomeMessage: '您好！我是技术通稿助手，专门为您撰写专业的技术通稿。请提供技术要点，我会为您生成规范的通稿内容。',
    placeholder: '请输入技术通稿的核心内容...',
    buttonText: '生成技术通稿',
    loadingText: '撰写中...',
    responsePrefix: '正在撰写技术通稿...',
    color: 'green'
  },
  press_release: {
    icon: Megaphone,
    title: '发布会稿助手',
    welcomeMessage: '您好！我是发布会稿助手，专门为您撰写专业的发布会演讲稿。请提供发布内容要点，我会为您生成精彩的演讲稿。',
    placeholder: '请输入发布会的核心内容...',
    buttonText: '生成发布会稿',
    loadingText: '撰写中...',
    responsePrefix: '正在撰写发布会稿...',
    color: 'red'
  }
};

// 颜色样式配置
const COLOR_STYLES: Record<string, {
  primary: string;
  light: string;
  text: string;
  hover: string;
  focus: string;
}> = {
  blue: {
    primary: 'bg-blue-500 hover:bg-blue-600',
    light: 'bg-blue-100',
    text: 'text-blue-600',
    hover: 'hover:text-blue-600 hover:bg-blue-50',
    focus: 'focus:ring-blue-500'
  },
  orange: {
    primary: 'bg-orange-500 hover:bg-orange-600',
    light: 'bg-orange-100',
    text: 'text-orange-600',
    hover: 'hover:text-orange-600 hover:bg-orange-50',
    focus: 'focus:ring-orange-500'
  },
  purple: {
    primary: 'bg-purple-500 hover:bg-purple-600',
    light: 'bg-purple-100',
    text: 'text-purple-600',
    hover: 'hover:text-purple-600 hover:bg-purple-50',
    focus: 'focus:ring-purple-500'
  },
  green: {
    primary: 'bg-green-500 hover:bg-green-600',
    light: 'bg-green-100',
    text: 'text-green-600',
    hover: 'hover:text-green-600 hover:bg-green-50',
    focus: 'focus:ring-green-500'
  },
  red: {
    primary: 'bg-red-500 hover:bg-red-600',
    light: 'bg-red-100',
    text: 'text-red-600',
    hover: 'hover:text-red-600 hover:bg-red-50',
    focus: 'focus:ring-red-500'
  }
};

interface AIInterAreaProps {
  pageType: PageType;
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
  onSubmit
}) => {
  const config = PAGE_CONFIG[pageType];
  const IconComponent = config.icon;
  const colorStyle = COLOR_STYLES[config.color];

  return (
    <div className="h-full flex flex-col">
      {/* AI助手头像和标识 */}
      <div className="flex-shrink-0 flex items-center gap-3 mb-4 px-1">
        <div className={`w-8 h-8 ${colorStyle.light} rounded-full flex items-center justify-center`}>
          <IconComponent className={`w-4 h-4 ${colorStyle.text}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">{config.title}</span>
      </div>

      {/* 对话内容区域 - 滚动对话框 */}
      <div className="flex-1 bg-gray-50 rounded-lg p-3 mb-4 overflow-y-auto min-h-0">
        <div className="space-y-3">
          {/* 默认欢迎消息 */}
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className={`w-6 h-6 ${colorStyle.light} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                <IconComponent className={`w-3 h-3 ${colorStyle.text}`} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg rounded-tl-sm px-3 py-2 max-w-xs shadow-sm">
                <p className="text-xs text-gray-800 leading-relaxed">{config.welcomeMessage}</p>
              </div>
            </div>
          </div>

          {/* 用户问题和AI回答 */}
          {query && (
            <>
              {/* 用户问题 */}
              <div className="flex justify-end">
                <div className={`${colorStyle.primary.split(' ')[0]} text-white rounded-lg rounded-br-sm px-3 py-2 max-w-xs`}>
                  <p className="text-xs">{query}</p>
                </div>
              </div>
              
              {/* AI回答 */}
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 ${colorStyle.light} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                    <IconComponent className={`w-3 h-3 ${colorStyle.text}`} />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg rounded-tl-sm px-3 py-2 max-w-xs shadow-sm">
                    <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {aiResponse || config.responsePrefix}
                    </p>
                    
                    {/* 快捷功能按钮 */}
                    {aiResponse && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={onCopy}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 ${colorStyle.hover} rounded transition-colors`}
                          title="复制"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>复制</span>
                        </button>
                        
                        <button
                          onClick={onLike}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded transition-colors ${
                            liked 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title="点赞"
                        >
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>点赞</span>
                        </button>
                        
                        <button
                          onClick={onDislike}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded transition-colors ${
                            disliked 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="不符合"
                        >
                          <ThumbsDown className="w-2.5 h-2.5" />
                          <span>不符合</span>
                        </button>
                        
                        <button
                          onClick={onShare}
                          className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="采纳"
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          <span>采纳</span>
                        </button>
                        
                        <button
                          onClick={onRegenerate}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-600 ${colorStyle.hover} rounded transition-colors`}
                          title="重新生成"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
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
      <div className="flex-shrink-0 space-y-3">
        <textarea
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={config.placeholder}
          className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 ${colorStyle.focus} focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed`}
          rows={2}
        />
        
        <button
          onClick={onSubmit}
          disabled={!query.trim() || loading}
          className={`w-full px-4 py-2.5 ${colorStyle.primary} text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
              <span>{config.loadingText}</span>
            </>
          ) : (
            <>
              <IconComponent className="w-3.5 h-3.5" />
              <span>{config.buttonText}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIInterArea;