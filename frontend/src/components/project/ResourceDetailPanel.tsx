import React from 'react';
import { X, FileText, Globe, Brain } from 'lucide-react';
import { SourceInformation } from '../../services/sourceService';

interface ResourceDetailPanelProps {
  resource: SourceInformation | any;
  onClose?: () => void;
}

const ResourceDetailPanel: React.FC<ResourceDetailPanelProps> = ({
  resource,
  onClose
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch {
      return '';
    }
  };

  const getIcon = () => {
    if (resource.type === 'file') return <FileText className="w-5 h-5 text-blue-600" />;
    if (resource.type === 'url' || resource.type === 'text') return <Globe className="w-5 h-5 text-green-600" />;
    return <Brain className="w-5 h-5 text-orange-600" />;
  };

  const getTitle = () => {
    if (resource.type === 'file') return '文件详情';
    if (resource.type === 'url' || resource.type === 'text') return '网络信息详情';
    return '知识点详情';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
            <div className="text-base text-gray-900">{resource.title || '未命名'}</div>
          </div>

          {/* URL（如果有） */}
          {resource.url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">链接</label>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {resource.url}
              </a>
            </div>
          )}

          {/* 描述/内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {resource.content ? '内容' : '描述'}
            </label>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {resource.description || resource.content || '暂无描述'}
            </div>
          </div>

          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div className="text-sm text-gray-700">{resource.type}</div>
          </div>

          {/* 创建时间 */}
          {resource.created_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">创建时间</label>
              <div className="text-sm text-gray-700">{formatDate(resource.created_at)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPanel;

