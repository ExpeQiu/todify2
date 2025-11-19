import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Target,
  FileText,
  Mic,
  Home,
  Bot,
  Workflow,
  MessageSquare,
  Layers,
} from "lucide-react";
import publicPageConfigService from "../services/publicPageConfigService";
import { PublicPageConfig } from "../types/publicPageConfig";

interface TopNavigationProps {
  currentPageTitle?: string;
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
  { name: 'AI问答', icon: Home, path: '/', address: null },
  { name: '技术包装', icon: MessageCircle, path: '/tech-package', address: 'tech-package' },
  { name: '技术策略', icon: Target, path: '/tech-strategy', address: 'tech-strategy' },
  { name: '技术通稿', icon: FileText, path: '/tech-article', address: 'tech-article' },
  { name: '发布会稿', icon: Mic, path: '/press-release', address: 'press-release' },
];

// 管理功能的固定顺序和映射
const MANAGEMENT_NAV_ORDER = [
  { name: 'AI角色', icon: Bot, path: '/ai-roles' },
  { name: 'Agent工作流', icon: Workflow, path: '/agent-workflow' },
  { name: '多角色对话', icon: MessageSquare, path: '/ai-chat-multi' },
  { name: '页面配置', icon: Layers, path: '/public-page-configs' },
];


const TopNavigation: React.FC<TopNavigationProps> = ({ currentPageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeConfigs, setActiveConfigs] = useState<PublicPageConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载启用的公共页面配置
  const loadActiveConfigs = async () => {
    try {
      setLoading(true);
      const configs = await publicPageConfigService.getAllConfigs();
      // 过滤出已启用且有地址的配置
      const enabled = configs.filter(
        (config) => config.isActive && config.address
      );
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
    const handleConfigUpdate = () => {
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
    const handleCustomRefresh = () => {
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
    const items: NavigationItem[] = [];

    // 按照固定顺序生成主要功能项
    MAIN_NAV_ORDER.forEach((navItem) => {
      // 如果是AI问答，直接添加
      if (navItem.name === 'AI问答') {
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

  const handleNavigation = (path: string, disabled?: boolean) => {
    if (disabled) {
      return;
    }
    navigate(path);
  };

  const isCurrentPath = (path: string) => {
    // 首页特殊处理
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/tech-package';
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
                onClick={() => handleNavigation(item.path, item.disabled)}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* 第一组：AI问答 */}
          <div className="flex items-center">
            {renderNavGroup([mainItems[0]], 0)}
          </div>
          
          {/* 分隔符 */}
          <span className="mx-3 text-gray-300">｜</span>

          {/* 第二组：技术包装、技术策略、技术通稿、发布会稿 */}
          <div className="flex items-center">
            {renderNavGroup(mainItems.slice(1), 1)}
          </div>

          {/* 分隔符 */}
          <span className="mx-3 text-gray-300">｜</span>

          {/* 第三组：AI角色、Agent工作流、多角色对话、页面配置 */}
          <div className="flex items-center">
            {renderNavGroup(managementItems, 2)}
          </div>

          {/* 分隔符 */}
          {currentPageTitle && (
            <>
              <span className="mx-3 text-gray-300">｜</span>
              {/* 当前页面标题 */}
              <div className="flex items-center">
                <h1 className="text-base font-semibold text-gray-900">
                  {currentPageTitle}
                </h1>
              </div>
            </>
          )}

          {/* 加载状态指示器 */}
          {loading && (
            <div className="ml-4 flex items-center">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
