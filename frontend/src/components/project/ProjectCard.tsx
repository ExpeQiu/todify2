import React from 'react';
import { Project } from '../../types/project';
import { MoreVertical, Globe } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onMenuClick?: (e: React.MouseEvent) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMenuClick }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div
      className="relative group cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
      onClick={onClick}
    >
      {/* 封面图片或图标 */}
      {project.cover_image ? (
        <div className="w-full h-32 bg-cover bg-center" style={{ backgroundImage: `url(${project.cover_image})` }} />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          {project.icon ? (
            <span className="text-4xl">{project.icon}</span>
          ) : (
            <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-semibold">{project.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-4">
        {/* 标题和菜单 */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
            {project.name}
          </h3>
          {onMenuClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick(e);
              }}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 日期和来源数量 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
          <span>{formatDate(project.created_at)}</span>
          <span className="flex items-center gap-1">
            <span>{project.sourceCount || 0}个来源</span>
          </span>
        </div>
      </div>

      {/* 公开标识（如果有） */}
      {project.type === 'featured' && (
        <div className="absolute top-2 right-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
            <Globe className="w-3 h-3 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
