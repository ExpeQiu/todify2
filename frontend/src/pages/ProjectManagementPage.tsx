import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { Project } from '../types/project';
import { TechPoint } from '../types/techPoint';
import { SourceInformation } from '../services/sourceService';
import { ConversationRecord } from '../services/chatHistoryService';
import projectService from '../services/projectService';
import api from '../services/api';
import ProjectPageLayout from '../components/project/ProjectPageLayout';
import TechPointListSidebar from '../components/project/TechPointListSidebar';
import ResourceSidebar from '../components/project/ResourceSidebar';
import TechPointDetailPanel from '../components/project/TechPointDetailPanel';
import ResourceDetailPanel from '../components/project/ResourceDetailPanel';
import ConversationDetailPanel from '../components/project/ConversationDetailPanel';

type RightPanelContent = 
  | { type: 'resource'; data: SourceInformation | any }
  | { type: 'conversation'; data: ConversationRecord }
  | null;

const ProjectManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTechPoint, setSelectedTechPoint] = useState<TechPoint | null>(null);
  const [rightPanelContent, setRightPanelContent] = useState<RightPanelContent>(null);
  const [techPointListRefreshTrigger, setTechPointListRefreshTrigger] = useState(0);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // 处理从技术点库返回的选中技术点
  useEffect(() => {
    const selectedTechPointIds = searchParams.get('selectedTechPointIds');
    if (selectedTechPointIds && projectId) {
      handleAddTechPointsFromLibrary(selectedTechPointIds);
    }
  }, [searchParams, projectId]);

  const handleAddTechPointsFromLibrary = async (selectedTechPointIdsStr: string) => {
    if (!projectId) return;

    const techPointIds = selectedTechPointIdsStr
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (techPointIds.length === 0) {
      // 清除 URL 参数
      setSearchParams({});
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      // 批量添加技术点到项目
      for (const techPointId of techPointIds) {
        try {
          const response = await api.post(`/projects/${projectId}/relations`, {
            relationType: 'tech_point',
            relationId: techPointId
          });

          if (response.data?.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`添加技术点 ${techPointId} 失败:`, error);
          failCount++;
        }
      }

      // 清除 URL 参数
      setSearchParams({});

      // 显示结果消息
      if (successCount > 0) {
        message.success(`成功添加 ${successCount} 个技术点到项目`);
        // 刷新技术点列表
        setTechPointListRefreshTrigger(prev => prev + 1);
      }
      if (failCount > 0) {
        message.warning(`${failCount} 个技术点添加失败，可能已存在`);
      }
    } catch (error) {
      console.error('添加技术点失败:', error);
      message.error('添加技术点失败');
      // 清除 URL 参数
      setSearchParams({});
    }
  };

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

  const handleSelectTechPoint = (techPoint: TechPoint) => {
    setSelectedTechPoint(techPoint);
    setRightPanelContent(null);
  };

  const handleSelectResource = (resource: SourceInformation | any) => {
    setRightPanelContent({ type: 'resource', data: resource });
  };

  const handleSelectConversation = (conversation: ConversationRecord) => {
    setRightPanelContent({ type: 'conversation', data: conversation });
  };

  const handleCloseRightPanel = () => {
    setRightPanelContent(null);
  };

  const handleTechPointSave = () => {
    // 刷新技术点列表数据
    // 可以触发重新加载
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!project) {
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

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目ID不存在</p>
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
      currentPage="management"
    >
      <div className="flex h-full">
        {/* 左侧边栏 - 技术点列表 */}
        <div className="w-80 border-r border-gray-200 flex-shrink-0 overflow-hidden bg-white">
          <TechPointListSidebar
            project={project}
            selectedTechPointId={selectedTechPoint?.id}
            onSelectTechPoint={handleSelectTechPoint}
            refreshTrigger={techPointListRefreshTrigger}
          />
        </div>

        {/* 中间区域 - 技术点详情 */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {selectedTechPoint === null ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-sm">请从左侧选择技术点查看详情</p>
              </div>
            </div>
          ) : (
            <TechPointDetailPanel
              techPoint={selectedTechPoint}
              projectId={parseInt(projectId)}
              onSave={handleTechPointSave}
            />
          )}
        </div>

        {/* 右侧边栏 - 资源与对话 */}
        <div className="w-80 border-l border-gray-200 flex-shrink-0 overflow-hidden bg-white">
          {rightPanelContent === null ? (
            <ResourceSidebar
              project={project}
              onSelectResource={handleSelectResource}
              onSelectConversation={handleSelectConversation}
            />
          ) : rightPanelContent.type === 'resource' ? (
            <ResourceDetailPanel
              resource={rightPanelContent.data}
              onClose={handleCloseRightPanel}
            />
          ) : (
            <ConversationDetailPanel
              conversation={rightPanelContent.data}
              onClose={handleCloseRightPanel}
            />
          )}
        </div>
      </div>
    </ProjectPageLayout>
  );
};

export default ProjectManagementPage;

