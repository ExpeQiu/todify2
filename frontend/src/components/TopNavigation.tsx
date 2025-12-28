import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Target,
  FileText,
  Home,
  Settings,
  User,
  ChevronDown,
  BookOpen,
} from "lucide-react";

interface TopNavigationProps {
}

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  disabled: boolean;
  category: 'main' | 'management';
  configId?: string;
}

// 主要功能的固定顺序和映射
const MAIN_NAV_ORDER = [
  { name: '项目管理', icon: Home, path: '/', address: null },
  { name: '技术包装', icon: MessageCircle, path: '/tech-package', address: 'tech-package' },
  { name: '技术策略', icon: Target, path: '/tech-strategy', address: 'tech-strategy' },
  { name: '技术通稿', icon: FileText, path: '/tech-article', address: 'tech-article' },
];

// 管理功能的固定顺序和映射
const MANAGEMENT_NAV_ORDER = [
  { name: 'AI角色管理', icon: Settings, path: '/ai-roles' },
  { name: '技术点管理', icon: Settings, path: '/tech-point-library' },
];

// 管理功能相关的子页面路径
const MANAGEMENT_PATHS = [
  '/ai-roles',
  '/tech-point-library',
];


const TopNavigation: React.FC<TopNavigationProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('用户');
  
  // 获取当前登录用户名
  const getCurrentUsername = (): string => {
    try {
      // 尝试从 localStorage 获取用户名（支持多种可能的键名）
      const username = localStorage.getItem('username') || 
                       localStorage.getItem('user_name') || 
                       localStorage.getItem('currentUser') ||
                       localStorage.getItem('userName');
      if (username) {
        // 如果是 JSON 字符串，尝试解析
        try {
          const parsed = JSON.parse(username);
          return parsed.name || parsed.username || parsed.userName || username;
        } catch {
          return username;
        }
      }
    } catch (error) {
      console.warn('获取用户名失败:', error);
    }
    // 默认返回"用户"
    return '用户';
  };
  
  // 初始化用户名
  useEffect(() => {
    setCurrentUsername(getCurrentUsername());
    
    // 监听 localStorage 变化（跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' || e.key === 'user_name' || e.key === 'currentUser' || e.key === 'userName') {
        setCurrentUsername(getCurrentUsername());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（同标签页更新）
    const handleUserUpdate = () => {
      setCurrentUsername(getCurrentUsername());
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // 生成主要功能导航项
  const mainItems: NavigationItem[] = useMemo(() => {
    return MAIN_NAV_ORDER.map((navItem) => ({
      id: navItem.address || 'home',
      label: navItem.name,
      icon: navItem.icon,
      path: navItem.path,
      disabled: false,
      category: 'main' as const,
    }));
  }, []);

  // 生成管理功能导航项
  const managementItems: NavigationItem[] = useMemo(() => {
    return MANAGEMENT_NAV_ORDER.map((navItem) => ({
      id: navItem.path,
      label: navItem.name,
      icon: navItem.icon,
      path: navItem.path,
      disabled: false,
      category: 'management' as const,
    }));
  }, []);

  const handleNavigation = (path: string, disabled?: boolean, itemId?: string) => {
    if (disabled) {
      return;
    }
    // 如果是项目管理（首页），添加 tab=all 参数
    if (path === '/' && itemId === 'home') {
      navigate('/?tab=all');
    } else {
      // 检查当前 URL 是否有 projectId 参数
      const searchParams = new URLSearchParams(location.search);
      const projectId = searchParams.get('projectId');
      const newConversation = searchParams.get('newConversation');
      
      // 如果有 projectId，在跳转时带上它
      if (projectId) {
        let targetUrl = path;
        const targetParams = new URLSearchParams();
        targetParams.append('projectId', projectId);
        
        // 如果是技术包装、技术策略、技术通稿之间的跳转，且当前有 newConversation，也带上它
        const isTechPage = ['/tech-package', '/tech-strategy', '/tech-article'].includes(path);
        if (isTechPage && newConversation) {
          targetParams.append('newConversation', newConversation);
        }
        
        targetUrl += `?${targetParams.toString()}`;
        navigate(targetUrl);
      } else {
        navigate(path);
      }
    }
  };

  const isCurrentPath = (path: string) => {
    // 首页特殊处理
    if (path === '/') {
      // 检查是否是首页路径（忽略查询参数）
      return location.pathname === '/' || location.pathname === '/tech-package';
    }
    // 管理功能特殊处理：如果当前路径是管理功能的子页面，也认为是当前路径
    if (path === '/ai-roles' || path === '/tech-point-library') {
      return MANAGEMENT_PATHS.some(managementPath => 
        location.pathname === managementPath || location.pathname.startsWith(managementPath + '/')
      );
    }
    // 精确匹配
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 渲染导航按钮组
  const renderNavGroup = (items: NavigationItem[], groupIndex: number) => {
    return (
      <div key={groupIndex} className="flex items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const isCurrent = isCurrentPath(item.path);

          return (
            <React.Fragment key={item.id}>
              <button
                onClick={() => handleNavigation(item.path, item.disabled, item.id)}
                disabled={item.disabled}
                className={`
                  relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${
                    item.disabled
                      ? "text-gray-400 cursor-not-allowed opacity-50"
                      : isCurrent
                        ? "text-blue-600 bg-blue-50 shadow-sm"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }
                `}
                title={item.label}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                <span>{item.label}</span>
                
                {/* 当前页面指示器 */}
                {isCurrent && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* 左侧导航项 */}
          <div className="flex items-center">
            {/* 第一组：项目管理 */}
            <div className="flex items-center">
              {renderNavGroup([mainItems[0]], 0)}
            </div>
            
            {/* 分隔符 */}
            <span className="mx-3 text-gray-300">｜</span>

            {/* 第二组：技术包装、技术策略、技术通稿 */}
            <div className="flex items-center">
              {renderNavGroup(mainItems.slice(1), 1)}
            </div>

          </div>

          {/* 右侧：用户标识和下拉菜单 */}
          <div className="flex items-center gap-4">
            {/* 用户标识和下拉菜单 */}
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
                    {managementItems.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = isCurrentPath(item.path);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleNavigation(item.path, item.disabled, item.id);
                            setUserMenuOpen(false);
                          }}
                          disabled={item.disabled}
                          className={`
                            w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium
                            transition-colors duration-200
                            ${
                              item.disabled
                                ? "text-gray-400 cursor-not-allowed opacity-50"
                                : isCurrent
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                    {/* 分隔线 */}
                    <div className="border-t border-gray-200 my-1" />
                    {/* 技术文档入口 */}
                    <button
                      onClick={() => {
                        // 在新窗口打开技术文档
                        const docPath = '/guide/AGENT_ARCHITECTURE_ANALYSIS.html';
                        window.open(docPath, '_blank');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>技术文档</span>
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

export default TopNavigation;
