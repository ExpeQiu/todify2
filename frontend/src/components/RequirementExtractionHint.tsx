import React from 'react';
import { Lightbulb, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface RequirementExtractionHintProps {
  visible: boolean;
  messageCount: number;
  onDismiss: () => void;
  onExtract?: () => void;
}

const RequirementExtractionHint: React.FC<RequirementExtractionHintProps> = ({
  visible,
  messageCount,
  onDismiss,
  onExtract
}) => {
  if (!visible) return null;

  const canExtract = messageCount >= 3;
  const tips = [
    '明确表达内容场景（技术包装/技术策略/技术通稿）',
    '说明目标受众和用途',
    '提及需要使用的资源（技术点、知识点等）'
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="关闭提示"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-900">需求提取提示</h3>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {messageCount} 轮对话
            </span>
          </div>

          <p className="text-sm text-blue-800 mb-3">
            为了生成更准确的内容，建议在对话中明确以下信息：
          </p>

          <ul className="space-y-1 mb-3">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs text-blue-700 flex items-start space-x-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>

          {canExtract ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                <span>已满足提取条件</span>
              </div>
              {onExtract && (
                <button
                  onClick={onExtract}
                  className="ml-auto px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>立即提取需求</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-blue-600">
              建议至少进行 {3 - messageCount} 轮对话后再提取需求
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementExtractionHint;

