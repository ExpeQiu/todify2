import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Package, Target, FileText, Mic } from 'lucide-react';

interface TopNavigationProps {
  currentPageTitle?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ currentPageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { 
      label: '返回首页', 
      icon: ArrowLeft, 
      path: '/', 
      isBack: true 
    },
    { 
      label: 'AI问答', 
      icon: MessageCircle, 
      path: '/node/ai-search' 
    },
    { 
      label: '技术包装', 
      icon: Package, 
      path: '/node/tech-package' 
    },
    { 
      label: '技术策略', 
      icon: Target, 
      path: '/node/promotion-strategy' 
    },
    { 
      label: '技术通稿', 
      icon: FileText, 
      path: '/node/core-draft' 
    },
    { 
      label: '发布会稿', 
      icon: Mic, 
      path: '/node/speech' 
    }
  ];

  const handleNavigation = (path: string, isBack?: boolean) => {
    if (isBack) {
      navigate('/');
    } else {
      navigate(path);
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* 导航项目 */}
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.path);
              const isBackButton = item.isBack;
              
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.path, item.isBack)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isBackButton 
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                      : isCurrent 
                        ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* 当前页面标题 */}
          {currentPageTitle && (
            <div className="ml-auto">
              <h1 className="text-lg font-semibold text-gray-900">{currentPageTitle}</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;