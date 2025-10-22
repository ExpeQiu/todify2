import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Package,
  Target,
  FileText,
  Mic,
  Settings,
} from "lucide-react";

interface TopNavigationProps {
  currentPageTitle?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ currentPageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      label: "返回首页",
      icon: ArrowLeft,
      path: "/",
      isBack: true,
    },
    {
      label: "AI问答",
      icon: MessageCircle,
      path: "/node/ai-search",
    },
    {
      label: "技术包装",
      icon: Package,
      path: "/node/tech-package",
    },
    {
      label: "技术策略",
      icon: Target,
      path: "/node/promotion-strategy",
    },
    {
      label: "技术通稿",
      icon: FileText,
      path: "/node/core-draft",
    },
    {
      label: "发布会稿",
      icon: Mic,
      path: "/node/speech",
    },
    {
      label: "配置管理",
      icon: Settings,
      path: "/config",
    },
  ];

  const handleNavigation = (path: string, isBack?: boolean) => {
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

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path, item.isBack)}
                  className={`
                    flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                    ${
                      isBackButton
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