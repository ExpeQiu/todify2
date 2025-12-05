import React from 'react';
import { Project } from '../../types/project';
import ProjectCard from './ProjectCard';
import { ChevronRight } from 'lucide-react';

interface FeaturedProjectListProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onViewAll?: () => void;
}

const FeaturedProjectList: React.FC<FeaturedProjectListProps> = ({
  projects,
  onProjectClick,
  onViewAll
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">精选项目</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedProjectList;
