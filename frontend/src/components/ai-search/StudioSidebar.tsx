import React from "react";
import { Plus, MoreVertical, Eye, Target, Grid, Megaphone, Video, Languages, Presentation, FileText, History } from "lucide-react";
import StudioTools from "./StudioTools";
import { OutputContent } from "../../types/aiSearch";

interface StudioSidebarProps {
  outputs?: OutputContent[];
  onShowConversationList?: () => void;
  onTriggerFeature: (featureType: string) => void;
  executingFeatureId?: string | null;
  statusMessage?: string;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  outputs = [],
  onShowConversationList,
  onTriggerFeature,
  executingFeatureId,
  statusMessage,
}) => {
  const formatDaysAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return "今天";
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'ppt':
        return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />;
      case 'script':
        return <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />;
      case 'mindmap':
        return <Grid className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />;
    }
  };

  const getOutputTypeLabel = (type: string) => {
    switch (type) {
      case 'ppt':
        return 'PPT大纲';
      case 'script':
        return '脚本';
      case 'mindmap':
        return '技术矩阵';
      default:
        return '其他';
    }
  };

  const toolItems = [
    {
      id: 'five-view-analysis',
      label: '五看分析',
      icon: Eye,
    },
    {
      id: 'three-fix-analysis',
      label: '三定分析',
      icon: Target,
    },
    {
      id: 'tech-matrix',
      label: '技术矩阵',
      icon: Grid,
    },
    {
      id: 'propagation-strategy',
      label: '传播策略',
      icon: Megaphone,
    },
    {
      id: 'exhibition-video',
      label: '展具与视频',
      icon: Video,
    },
    {
      id: 'translation',
      label: '翻译',
      icon: Languages,
    },
    {
      id: 'ppt-outline',
      label: 'PPT大纲',
      icon: Presentation,
    },
    {
      id: 'script',
      label: '脚本',
      icon: FileText,
    },
  ];

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">更多</h2>
          {onShowConversationList && (
            <button
              onClick={onShowConversationList}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="查看对话历史"
            >
              <History className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        {statusMessage && (
          <p className="mt-2 text-xs text-gray-500">{statusMessage}</p>
        )}
      </div>

      {/* 工具网格 */}
      <div className="p-4 border-b border-gray-200">
        <StudioTools
          items={toolItems}
          onTrigger={onTriggerFeature}
          executingId={executingFeatureId}
        />
      </div>

      {/* 相关内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">相关内容</h3>
          {outputs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无相关内容
            </div>
          ) : (
            <div className="space-y-3">
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  {getOutputIcon(output.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{output.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getOutputTypeLabel(output.type)} · {formatDaysAgo(output.createdAt)}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          添加笔记
        </button>
      </div>
    </div>
  );
};

export default StudioSidebar;

