import React from "react";
import { MoreVertical, Eye, Target, Grid, Megaphone, Video, Languages, Presentation, FileText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StudioTools from "./StudioTools";
import { OutputContent } from "../../types/aiSearch";

interface StudioSidebarProps {
  outputs?: OutputContent[];
  onShowConversationList?: () => void;
  onTriggerFeature: (featureType: string) => void;
  executingFeatureId?: string | null;
  statusMessage?: string;
  onShowFieldMappingConfig?: () => void;
  studioTitle?: string;
  featureLabelMap?: Record<string, string>;
  enabledToolIds?: string[]; // 启用的工具ID列表
  pageType?: string; // 当前页面类型，用于跳转到字段映射管理页面时过滤
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  outputs = [],
  onShowConversationList,
  onTriggerFeature,
  executingFeatureId,
  statusMessage,
  onShowFieldMappingConfig,
  studioTitle = "更多工具箱",
  featureLabelMap = {},
  enabledToolIds,
  pageType,
}) => {
  const navigate = useNavigate();
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
        return '技术讲稿';
      case 'script':
        return '脚本';
      case 'mindmap':
        return '发布会场景化';
      default:
        return '其他';
    }
  };

  // 所有可用的工具项
  const allToolItems = [
    {
      id: 'five-view-analysis',
      label: featureLabelMap['five-view-analysis'] || '技术转译',
      icon: Eye,
    },
    {
      id: 'three-fix-analysis',
      label: featureLabelMap['three-fix-analysis'] || '用户场景挖掘',
      icon: Target,
    },
    {
      id: 'tech-matrix',
      label: featureLabelMap['tech-matrix'] || '发布会场景化',
      icon: Grid,
    },
    {
      id: 'propagation-strategy',
      label: featureLabelMap['propagation-strategy'] || '领导人口语化',
      icon: Megaphone,
    },
    {
      id: 'exhibition-video',
      label: featureLabelMap['exhibition-video'] || '展具与视频',
      icon: Video,
    },
    {
      id: 'translation',
      label: featureLabelMap['translation'] || '翻译',
      icon: Languages,
    },
    {
      id: 'ppt-outline',
      label: featureLabelMap['ppt-outline'] || '技术讲稿',
      icon: Presentation,
    },
    {
      id: 'script',
      label: featureLabelMap['script'] || '脚本',
      icon: FileText,
    },
  ];

  // 扩展：为未在静态列表中的启用ID生成通用工具项
  const staticFiltered = enabledToolIds
    ? allToolItems.filter(item => enabledToolIds.includes(item.id))
    : allToolItems;

  const unknownIds = (enabledToolIds || []).filter(id => !allToolItems.some(item => item.id === id));
  const unknownItems = unknownIds.map(id => ({
    id,
    label: featureLabelMap[id] || id,
    icon: FileText,
  }));

  const toolItems = enabledToolIds ? [...staticFiltered, ...unknownItems] : staticFiltered;

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* 标题 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-lg font-semibold text-gray-900">{studioTitle}</h2>
          {statusMessage ? (
            <p className="text-xs text-gray-500 mt-1">{statusMessage}</p>
          ) : (
            <div className="text-xs text-transparent mt-1">占位</div>
          )}
        </div>
        {onShowFieldMappingConfig && (
          <button
            onClick={() => {
              // 传递当前 pageType 到字段映射管理页面，用于过滤显示
              navigate(`/field-mapping-management${pageType ? `?pageType=${pageType}` : ''}`);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
            title="字段映射管理"
          >
            <Settings className="w-4 h-4" />
            字段映射
          </button>
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
    </div>
  );
};

export default StudioSidebar;

