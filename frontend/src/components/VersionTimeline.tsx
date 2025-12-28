import React, { useState } from 'react';
import { History, RotateCcw, Clock, User, Bot, ChevronDown, ChevronUp } from 'lucide-react';

export interface ContentVersion {
  versionId: string;
  content: string;
  timestamp: Date;
  changeDescription?: string;
  changedBy: 'system' | 'user';
}

interface VersionTimelineProps {
  versions: ContentVersion[];
  currentVersionId: string;
  onRevert: (versionId: string) => Promise<void>;
  onVersionHover?: (version: ContentVersion | null) => void;
}

const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  currentVersionId,
  onRevert,
  onVersionHover
}) => {
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [hoveredVersionId, setHoveredVersionId] = useState<string | null>(null);

  // 按时间倒序排列
  const sortedVersions = [...versions].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const handleVersionHover = (version: ContentVersion | null) => {
    setHoveredVersionId(version?.versionId || null);
    onVersionHover?.(version || null);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <History className="w-4 h-4" />
          <span className="text-sm">暂无版本历史</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <History className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">版本历史</h3>
        <span className="text-xs text-gray-500">({versions.length}个版本)</span>
      </div>

      <div className="relative">
        {/* 时间线 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {sortedVersions.map((version, index) => {
            const isCurrent = version.versionId === currentVersionId;
            const isExpanded = expandedVersionId === version.versionId;
            const isHovered = hoveredVersionId === version.versionId;

            return (
              <div
                key={version.versionId}
                className="relative pl-10"
                onMouseEnter={() => handleVersionHover(version)}
                onMouseLeave={() => handleVersionHover(null)}
              >
                {/* 时间线节点 */}
                <div className="absolute left-0 top-2">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      isCurrent
                        ? 'bg-blue-500 border-blue-500'
                        : version.changedBy === 'user'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-gray-400 border-gray-400'
                    }`}
                  />
                </div>

                {/* 版本卡片 */}
                <div
                  className={`bg-gray-50 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : isHovered
                      ? 'border-gray-300 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-3">
                    {/* 版本头部 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {version.changedBy === 'user' ? (
                            <User className="w-3 h-3 text-green-600" />
                          ) : (
                            <Bot className="w-3 h-3 text-blue-600" />
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            {version.changedBy === 'user' ? '手动修改' : '自动生成'}
                          </span>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              当前版本
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 font-medium">
                          {version.changeDescription || '无描述'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className="text-xs text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(version.timestamp)}</span>
                        </span>
                      </div>
                    </div>

                    {/* 版本内容预览 */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200 max-h-48 overflow-y-auto">
                        <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-6">
                          {version.content.substring(0, 500)}
                          {version.content.length > 500 ? '...' : ''}
                        </p>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setExpandedVersionId(isExpanded ? null : version.versionId)}
                        className="text-xs text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>收起</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>展开</span>
                          </>
                        )}
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => onRevert(version.versionId)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>回退到此版本</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VersionTimeline;

