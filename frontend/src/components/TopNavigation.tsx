import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Package,
  Target,
  FileText,
  Mic,
  Settings,
  History,
  Sparkles,
} from "lucide-react";
import publicPageConfigService from "../services/publicPageConfigService";
import { PublicPageConfig } from "../types/publicPageConfig";

interface TopNavigationProps {
  currentPageTitle?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ currentPageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeConfigs, setActiveConfigs] = useState<PublicPageConfig[]>([]);

  // 根据配置名称智能推断模板类型
  const inferTemplateType = (config: PublicPageConfig): 'speech' | 'ai-chat' | null => {
    // 如果已经有模板类型，直接返回
    if (config.templateType === 'speech' || config.templateType === 'ai-chat') {
      return config.templateType;
    }
    
    // 根据配置名称推断
    const name = config.name.toLowerCase();
    if (name.includes('发布会') || name.includes('演讲') || name.includes('speech')) {
      return 'speech';
    }
    if (name.includes('ai问答') || name.includes('问答') || name.includes('ai-chat')) {
      return 'ai-chat';
    }
    
    return null;
  };

  // 加载启用的公共页面配置
  const loadActiveConfigs = async () => {
    try {
      console.log('[TopNavigation] 开始加载配置...');
      const configs = await publicPageConfigService.getAllConfigs();
      console.log('[TopNavigation] 获取到配置列表:', configs);
      // 过滤出已启用的配置，并推断模板类型
      const enabled = configs
        .filter((config) => config.isActive)
        .map((config) => ({
          ...config,
          inferredTemplateType: inferTemplateType(config),
        }))
        .filter((config) => config.inferredTemplateType !== null) as Array<PublicPageConfig & { inferredTemplateType: 'speech' | 'ai-chat' }>;
      console.log('[TopNavigation] 已启用的配置（含推断类型）:', enabled);
      setActiveConfigs(enabled);
    } catch (error: any) {
      // 对于后端未运行的情况，静默处理，不输出错误日志
      const errorStatus = error?.response?.status || 'N/A';
      const errorCode = error?.code;
      if (errorStatus === 500 || errorCode === 'ECONNREFUSED' || errorCode === 'ERR_NETWORK') {
        // 静默失败，保持当前配置状态
        return;
      }
      // 其他错误才输出日志
      console.error('[TopNavigation] 加载配置失败:', error);
    }
  };

  useEffect(() => {
    // 初始加载
    loadActiveConfigs();

    // 监听配置更新事件
    const handleConfigUpdate = () => {
      console.log('[TopNavigation] 收到配置更新事件，重新加载配置');
      loadActiveConfigs();
    };

    console.log('[TopNavigation] 注册事件监听器');
    window.addEventListener('publicPageConfigUpdated', handleConfigUpdate);

    // 监听storage变化（作为备用方案，用于跨标签页通信）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'publicPageConfigsRefresh') {
        console.log('[TopNavigation] 收到storage事件（跨标签页），重新加载配置');
        loadActiveConfigs();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义刷新事件（用于同标签页触发）
    const handleCustomRefresh = (e: Event) => {
      console.log('[TopNavigation] 收到自定义刷新事件（同标签页），重新加载配置');
      loadActiveConfigs();
    };
    window.addEventListener('publicPageConfigsRefresh', handleCustomRefresh);

    // 轮询检查已禁用 - 使用事件监听机制代替
    // const intervalId = setInterval(() => {
    //   console.log('[TopNavigation] 轮询检查配置状态');
    //   loadActiveConfigs();
    // }, 5000);

    return () => {
      console.log('[TopNavigation] 清理事件监听器');
      window.removeEventListener('publicPageConfigUpdated', handleConfigUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('publicPageConfigsRefresh', handleCustomRefresh);
      // clearInterval(intervalId);
    };
  }, []);

  // 根据配置状态判断导航项是否启用
  const isFeatureEnabled = (path: string): boolean => {
    // 检查是否有对应的已启用配置
    const configForPath = activeConfigs.find((config) => {
      // 检查原始模板类型或推断的模板类型
      const templateType = config.templateType || (config as any).inferredTemplateType;
      
      // 根据地址配置匹配
      if (path === '/ai-search' && config.address === 'ai-search') {
        return true;
      }
      if (path === '/node/speech' && templateType === 'speech') {
        return true;
      }
      if (path === '/node/ai-search' && templateType === 'ai-chat') {
        return true;
      }
      return false;
    });
    const enabled = !!configForPath;
    console.log(`[TopNavigation] 路径 ${path} 是否启用:`, enabled, '活跃配置:', activeConfigs);
    return enabled;
  };

  // 动态生成导航项，根据配置状态决定是否启用
  // 使用 useMemo 确保在 activeConfigs 变化时重新计算
  const navigationItems = React.useMemo(() => [
    {
      label: "返回首页",
      icon: ArrowLeft,
      path: "/",
      isBack: true,
      disabled: false,
    },
    {
      label: "AI问答",
      icon: MessageCircle,
      path: "/ai-search",
      disabled: !isFeatureEnabled('/ai-search'),
    },
    {
      label: "技术包装",
      icon: Package,
      path: "/node/tech-package",
      disabled: true,
    },
    {
      label: "技术策略",
      icon: Target,
      path: "/node/promotion-strategy",
      disabled: true,
    },
    {
      label: "技术通稿",
      icon: FileText,
      path: "/node/core-draft",
      disabled: true,
    },
    {
      label: "发布会稿",
      icon: Mic,
      path: "/node/speech",
      disabled: !isFeatureEnabled('/node/speech'),
    },
    {
      label: "配置管理",
      icon: Settings,
      path: "/config",
      disabled: true,
    },
    {
      label: "AI管理",
      icon: Sparkles,
      path: "/ai-management",
      disabled: false,
    },
  ], [activeConfigs]);

  const handleNavigation = (path: string, isBack?: boolean, disabled?: boolean) => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    
    if (isBack) {
      navigate("/");
    } else {
      navigate(path);
    }
  };

  const isCurrentPath = (path: string) => {
    // 对于 /ai-search，需要精确匹配
    if (path === '/ai-search') {
      return location.pathname === '/ai-search';
    }
    return location.pathname === path;
  };

  return (
    <div
      className="bg-white border-b border-gray-200 sticky top-0 z-50"
      data-oid=".tu43vu"
    >
      <div
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10"
        data-oid="8_cl.sx"
      >
        <div className="flex items-center h-14" data-oid="5t6ul1a">
          {/* 导航项目 */}
          <div className="flex items-center space-x-6" data-oid="0mo2mzh">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.path);
              const isBackButton = item.isBack;
              const isDisabled = item.disabled;

              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => handleNavigation(item.path, item.isBack, item.disabled)}
                    disabled={isDisabled && !isBackButton}
                    className={`
                      flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                      ${
                        isDisabled && !isBackButton
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : isBackButton
                            ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            : isCurrent
                              ? "text-blue-600 bg-blue-50 border border-blue-200"
                              : !isDisabled
                                ? "text-blue-600 hover:text-blue-900 hover:bg-blue-50 border border-blue-200"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }
                    `}
                    data-oid="ihzb7gy"
                  >
                    <Icon className="w-3.5 h-3.5" data-oid="23w8k44" />
                    <span className="text-xs" data-oid="2axt_ib">
                      {item.label}
                    </span>
                  </button>
                  
                  {/* 提示框 */}
                  {showTooltip && isDisabled && !isBackButton && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10">
                      增强版-功能开发中
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>



          {/* 当前页面标题 */}
          {currentPageTitle && (
            <div className="ml-auto" data-oid="2zsz-9o">
              <h1
                className="text-base font-semibold text-gray-900"
                data-oid=":v67a9e"
              >
                {currentPageTitle}
              </h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;