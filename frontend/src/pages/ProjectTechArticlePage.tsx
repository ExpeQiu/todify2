import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project } from '../types/project';
import projectService from '../services/projectService';
import ProjectPageLayout from '../components/project/ProjectPageLayout';
import EmbeddedTechArticlePage from '../components/embedded-pages/EmbeddedTechArticlePage';

const ProjectTechArticlePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await projectService.getProjectById(parseInt(projectId));
      if (response.success && response.data) {
        setProject(response.data);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project || !projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectPageLayout
      project={project}
      projectId={projectId}
      currentPage="tech-article"
    >
      <EmbeddedTechArticlePage projectId={projectId} />
    </ProjectPageLayout>
  );
};

export default ProjectTechArticlePage;

