import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Settings, ChevronDown, List, Grid, Plus, FileText } from 'lucide-react';

interface HomeNavigationBarProps {
  currentPath?: string;
}

const HomeNavigationBar: React.FC<HomeNavigationBarProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧标签页 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              全部
            </button>
            <button
              onClick={() => navigate('/?tab=my')}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              我的项目
            </button>
            <button
              onClick={() => navigate('/?tab=featured')}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              精选项目
            </button>
            <button
              onClick={() => navigate('/public-knowledge')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPath === '/public-knowledge'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              公共知识库
            </button>
            <button
              onClick={() => navigate('/tech-point-library')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPath === '/tech-point-library' || currentPath?.startsWith('/tech-point-library')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
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
                        navigate('/article-types');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FileText className="w-4 h-4" />
                      <span>文章类型</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/ai-roles');
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
  );
};

export default HomeNavigationBar;
