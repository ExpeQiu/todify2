import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Project } from '../types/project';
import { ProjectFormData } from '../types/project';
import projectService from '../services/projectService';
import FeaturedProjectList from '../components/project/FeaturedProjectList';
import RecentProjectList from '../components/project/RecentProjectList';
import NewProjectModal from '../components/project/NewProjectModal';
import NewProjectCard from '../components/project/NewProjectCard';
import ProjectCard from '../components/project/ProjectCard';
import { Plus, List, Grid, ChevronDown, Search, User, Settings } from 'lucide-react';

type TabType = 'all' | 'my' | 'featured';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从 URL 参数中读取标签页，如果没有则默认为 'featured'
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const initialTab: TabType = (tabFromUrl && ['all', 'my', 'featured'].includes(tabFromUrl)) 
    ? tabFromUrl 
    : 'featured';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'date'>('recent');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 当 URL 参数变化时，更新 activeTab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType | null;
    if (tabFromUrl && ['all', 'my', 'featured'].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // 加载数据
  useEffect(() => {
    loadProjects();
  }, [activeTab, sortBy]);

  const loadProjects = async (forceLoadAll = false) => {
    setIsLoading(true);
    try {
      // 加载精选项目
      const featuredResponse = await projectService.getFeaturedProjects(4);
      if (featuredResponse.success && featuredResponse.data) {
        setFeaturedProjects(featuredResponse.data);
      }

      // 加载最近项目
      const recentResponse = await projectService.getRecentProjects(20);
      if (recentResponse.success && recentResponse.data) {
        setRecentProjects(recentResponse.data);
      }

      // 加载所有项目（用于"全部"和"我的项目"标签，或强制加载时）
      if (forceLoadAll || activeTab === 'all' || activeTab === 'my') {
        const allResponse = await projectService.getProjects({
          page: 1,
          pageSize: 100,
          orderBy: sortBy === 'recent' ? 'last_opened_at' : sortBy === 'name' ? 'name' : 'created_at',
          orderDirection: sortBy === 'recent' ? 'DESC' : 'ASC'
        });
        if (allResponse.success && allResponse.data) {
          setAllProjects(allResponse.data.data);
        }
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (data: ProjectFormData) => {
    const response = await projectService.createProject(data);
    if (response.success) {
      // 创建成功后，切换到"我的项目"标签页以显示新创建的项目
      setActiveTab('my');
      // 强制重新加载所有数据（包括所有项目列表）
      await loadProjects(true);
    } else {
      alert(response.error || '创建项目失败');
    }
  };

  const handleProjectClick = async (project: Project) => {
    // 更新最后打开时间
    await projectService.updateLastOpenedAt(project.id);
    // 导航到项目资源管理页面，并传递当前标签页作为返回时的上下文
    navigate(`/project/${project.id}/resources`, { state: { fromTab: activeTab } });
  };

  const handleProjectMenuClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    // TODO: 实现项目菜单（编辑、删除等）
    console.log('Project menu clicked:', project);
  };

  const getDisplayProjects = () => {
    switch (activeTab) {
      case 'featured':
        return featuredProjects;
      case 'my':
        return allProjects;
      case 'all':
        return allProjects;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧标签页 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchParams({ tab: 'all' });
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => {
                  setActiveTab('my');
                  setSearchParams({ tab: 'my' });
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'my'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                我的项目
              </button>
              <button
                onClick={() => {
                  setActiveTab('featured');
                  setSearchParams({ tab: 'featured' });
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                精选项目
              </button>
              <button
                onClick={() => navigate('/public-knowledge')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                公共知识库
              </button>
              <button
                onClick={() => navigate('/tech-point-library')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                技术点库
              </button>
            </div>

            {/* 右侧操作栏 */}
            <div className="flex items-center space-x-4">
              {/* 全局搜索 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="全局搜索..."
                  onClick={() => {
                    // TODO: 实现全局搜索功能
                    console.log('全局搜索被点击');
                  }}
                  className="pl-10 pr-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                />
              </div>

              {/* 视图切换 */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button className="p-2 hover:bg-gray-100">
                  <List className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 border-l border-gray-300">
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* 排序 */}
              <div className="relative">
                <button className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  <span>最近</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Agent助手按钮 */}
              {/* 
                新对话默认挂在"非关联项目"下（不传递projectId）
                不同项目下的技术包装、技术策略、技术通稿的对话保持独立：
                - 非关联项目：使用默认 pageType（如 tech-package）
                - 关联项目：使用 pageType-project-{projectId}（如 tech-package-project-3）
                对话记录、来源信息等都按 pageType 隔离
              */}
              <button
                onClick={() => {
                  // 不传递 projectId，确保新对话默认关联到"非关联项目"
                  navigate('/tech-package?newConversation=true');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agent助手</span>
              </button>

              {/* 用户按钮和下拉菜单 */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                  title="用户"
                >
                  <User className="w-4 h-4" />
                  <span>用户</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {/* 下拉菜单 */}
                {userMenuOpen && (
                  <>
                    {/* 背景遮罩，点击关闭菜单 */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    {/* 下拉菜单内容 */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          navigate('/ai-management');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Agent设置</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'featured' ? (
              <>
                <FeaturedProjectList
                  projects={featuredProjects}
                  onProjectClick={handleProjectClick}
                />
                <RecentProjectList
                  projects={recentProjects}
                  onProjectClick={handleProjectClick}
                  onNewProjectClick={() => setIsNewProjectModalOpen(true)}
                  onProjectMenuClick={handleProjectMenuClick}
                />
              </>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {activeTab === 'all' ? '全部项目' : '我的项目'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NewProjectCard onClick={() => setIsNewProjectModalOpen(true)} />
                  {getDisplayProjects().map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project)}
                      onMenuClick={(e) => handleProjectMenuClick(e, project)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新建项目对话框 */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
};

export default HomePage;
