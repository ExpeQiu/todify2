import React, { useState } from "react";
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
} from "lucide-react";

interface TopNavigationProps {
  currentPageTitle?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ currentPageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  const navigationItems = [
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
      path: "/node/ai-search",
      disabled: true,
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
      disabled: true,
    },
    {
      label: "配置管理",
      icon: Settings,
      path: "/config",
      disabled: true,
    },
  ];

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