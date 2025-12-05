import React from 'react';
import { Project } from '../../types/project';
import ProjectCard from './ProjectCard';
import NewProjectCard from './NewProjectCard';

interface RecentProjectListProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onNewProjectClick?: () => void;
  onProjectMenuClick?: (e: React.MouseEvent, project: Project) => void;
}

const RecentProjectList: React.FC<RecentProjectListProps> = ({
  projects,
  onProjectClick,
  onNewProjectClick,
  onProjectMenuClick
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">最近打开过的项目</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {onNewProjectClick && (
          <NewProjectCard onClick={onNewProjectClick} />
        )}
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
            onMenuClick={(e) => onProjectMenuClick?.(e, project)}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentProjectList;
