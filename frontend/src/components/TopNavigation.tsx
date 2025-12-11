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
} from "lucide-react";
import publicPageConfigService from "../services/publicPageConfigService";
import { PublicPageConfig } from "../types/publicPageConfig";

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

// 管理功能的固定顺序和映射（合并为Agent配置）
const MANAGEMENT_NAV_ORDER = [
  { name: 'Agent配置', icon: Settings, path: '/ai-management' },
];

// Agent配置相关的子页面路径
const AGENT_CONFIG_PATHS = [
  '/ai-roles',
  '/agent-workflow',
  '/ai-chat-multi',
  '/public-page-configs',
  '/ai-management',
];


const TopNavigation: React.FC<TopNavigationProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeConfigs, setActiveConfigs] = useState<PublicPageConfig[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 加载启用的公共页面配置
  const loadActiveConfigs = async () => {
    try {
      console.log('[TopNavigation] 开始加载配置...');
      setLoading(true);
      const configs = await publicPageConfigService.getAllConfigs();
      console.log('[TopNavigation] 获取到所有配置:', configs.map(c => ({ id: c.id, name: c.name, isActive: c.isActive, address: c.address })));
      // 过滤出已启用且有地址的配置
      const enabled = configs.filter(
        (config) => config.isActive && config.address
      );
      console.log('[TopNavigation] 过滤后的启用配置:', enabled.map(c => ({ id: c.id, name: c.name, isActive: c.isActive, address: c.address })));
      setActiveConfigs(enabled);
    } catch (error: any) {
      // 对于后端未运行的情况，静默处理
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        return;
      }
      console.error('[TopNavigation] 加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初始加载
    loadActiveConfigs();

    // 监听配置更新事件
    const handleConfigUpdate = (event?: Event) => {
      console.log('[TopNavigation] 收到配置更新事件:', event);
      loadActiveConfigs();
    };

    window.addEventListener('publicPageConfigUpdated', handleConfigUpdate);

    // 监听storage变化（跨标签页通信）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'publicPageConfigsRefresh') {
        loadActiveConfigs();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义刷新事件（同标签页触发）
    const handleCustomRefresh = (event?: Event) => {
      console.log('[TopNavigation] 收到自定义刷新事件:', event);
      loadActiveConfigs();
    };
    window.addEventListener('publicPageConfigsRefresh', handleCustomRefresh);

    return () => {
      window.removeEventListener('publicPageConfigUpdated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('publicPageConfigsRefresh', handleCustomRefresh);
    };
  }, []);

  // 动态生成主要功能导航项
  const mainItems: NavigationItem[] = useMemo(() => {
    console.log('[TopNavigation] 重新计算 mainItems，activeConfigs:', activeConfigs.map(c => ({ id: c.id, name: c.name, isActive: c.isActive, address: c.address })));
    const items: NavigationItem[] = [];

    // 按照固定顺序生成主要功能项
    MAIN_NAV_ORDER.forEach((navItem) => {
      // 如果是项目管理，直接添加
      if (navItem.name === '项目管理') {
        items.push({
          id: 'home',
          label: navItem.name,
          icon: navItem.icon,
          path: navItem.path,
          disabled: false,
          category: 'main',
        });
        return;
      }

      // 其他功能：从配置中查找对应的配置
      const config = activeConfigs.find(
        (c) => c.address === navItem.address || c.name === navItem.name
      );

      if (config) {
        console.log(`[TopNavigation] 找到配置 ${navItem.name}:`, config);
        items.push({
          id: config.id,
          label: config.name,
          icon: navItem.icon,
          path: `/${config.address}`,
          disabled: false,
          category: 'main',
          configId: config.id,
        });
      } else {
        console.log(`[TopNavigation] 未找到配置 ${navItem.name}，将显示为禁用状态`);
        // 如果配置不存在，仍然显示但禁用
        items.push({
          id: `placeholder-${navItem.address}`,
          label: navItem.name,
          icon: navItem.icon,
          path: navItem.path,
          disabled: true,
          category: 'main',
        });
      }
    });

    console.log('[TopNavigation] 生成的 mainItems:', items.map(i => ({ id: i.id, label: i.label, disabled: i.disabled })));
    return items;
  }, [activeConfigs]);

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
    // Agent配置特殊处理：如果当前路径是Agent配置的子页面，也认为是当前路径
    if (path === '/ai-management') {
      return AGENT_CONFIG_PATHS.some(agentPath => 
        location.pathname === agentPath || location.pathname.startsWith(agentPath + '/')
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

          {/* 右侧：加载状态和用户标识 */}
          <div className="flex items-center gap-4">
            {/* 加载状态指示器 */}
            {loading && (
              <div className="flex items-center">
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* 用户标识和下拉菜单 */}
            <div className="relative flex items-center">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                title={currentUsername}
              >
                <User className="w-4 h-4" />
                <span>{currentUsername}</span>
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
