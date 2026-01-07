import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, MessageSquare, Target, Package, Newspaper, FolderKanban } from 'lucide-react';
import { Project } from '../../types/project';
import sourceService from '../../services/sourceService';

interface ProjectPageLayoutProps {
  project: Project;
  projectId: string;
  currentPage: 'management' | 'ai-qa' | 'tech-strategy' | 'tech-package' | 'tech-article';
  children: React.ReactNode;
}

const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({
  project,
  projectId,
  currentPage,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sourcesCount, setSourcesCount] = React.useState(0);

  React.useEffect(() => {
    const loadSourcesCount = async () => {
      try {
        const response = await sourceService.loadSourceInformationByProjectId(parseInt(projectId));
        if (response.success && response.data) {
          setSourcesCount(response.data.length);
        }
      } catch (error) {
        console.error('加载来源数量失败:', error);
      }
    };
    loadSourcesCount();
  }, [projectId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNavigate = (page: 'management' | 'ai-qa' | 'tech-strategy' | 'tech-package' | 'tech-article', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const targetPath = `/project/${projectId}/${page === 'ai-qa' ? 'ai-qa' : page}`;
    const currentPath = location.pathname;
    
    console.log('[ProjectPageLayout] 导航信息:', {
      page,
      projectId,
      targetPath,
      currentPath,
      currentPage,
      willNavigate: currentPath !== targetPath
    });
    
    // 如果目标路径与当前路径相同，跳过
    if (currentPath === targetPath) {
      console.log('[ProjectPageLayout] 目标路径与当前路径相同，跳过导航');
      return;
    }
    
    // 强制导航，即使 currentPage 相同（因为可能 URL 已经变化但组件状态未更新）
    console.log('[ProjectPageLayout] 执行导航到:', targetPath);
    
    // 直接使用 navigate，React Router v6 应该能处理
    navigate(targetPath, { replace: false });
    console.log('[ProjectPageLayout] navigate 调用完成');
    
    // 延迟检查 URL 是否真的变化了，如果没有变化则使用 window.location 作为备选
    setTimeout(() => {
      if (window.location.pathname !== targetPath) {
        console.warn('[ProjectPageLayout] URL 未变化，使用 window.location 强制跳转');
        window.location.href = targetPath;
      } else {
        console.log('[ProjectPageLayout] URL 已成功变化:', window.location.pathname);
      }
    }, 150);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 头部导航栏 */}
      <div className="bg-white border-b border-gray-200 z-40 shadow-sm flex-shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* 左侧：返回按钮和项目信息 */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => {
                  const fromTab = (location.state as any)?.fromTab;
                  if (fromTab) {
                    navigate(`/?tab=${fromTab}`);
                  } else {
                    navigate('/');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
              >
                <span className="text-lg">←</span>
                <span>返回</span>
              </button>
              <div className="h-12 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
                <div className="flex items-center space-x-5 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {formatDate(project.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {sourcesCount}个来源
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧：页面导航按钮 */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={(e) => handleNavigate('management', e)}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'management'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4" />
                  <span>项目管理</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleNavigate('ai-qa', e)}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'ai-qa'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>AI问答</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleNavigate('tech-strategy', e)}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'tech-strategy'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>技术策略</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleNavigate('tech-package', e)}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'tech-package'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span>技术包装</span>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleNavigate('tech-article', e)}
                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                  currentPage === 'tech-article'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4" />
                  <span>技术通稿</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ProjectPageLayout;

