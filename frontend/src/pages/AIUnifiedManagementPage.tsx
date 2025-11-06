import React from 'react';
import { Bot, Workflow, MessageSquare, ExternalLink, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import TopNavigation from '../components/TopNavigation';
import { useNavigate } from 'react-router-dom';

/**
 * AI统一管理页面
 * 整合AI角色、工作流、多窗口对话、公开页面四个核心功能的统一入口
 */
const AIUnifiedManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const managementModules = [
    {
      id: 'roles',
      title: 'AI角色管理',
      description: '创建和管理AI对话角色，关联Dify工作流配置',
      icon: Bot,
      color: 'blue',
      path: '/ai-roles',
      badge: '基础层',
      features: [
        '创建和配置AI角色',
        '关联Dify服务器工作流',
        '管理角色启用状态',
        '测试Dify连接',
      ],
    },
    {
      id: 'workflow',
      title: 'Agent工作流',
      description: '基于AI角色进行流程编排，创建智能工作流',
      icon: Workflow,
      color: 'green',
      path: '/agent-workflow',
      badge: '编排层',
      features: [
        '可视化工作流设计',
        '节点编排和连接',
        '工作流执行和测试',
        '模板管理',
      ],
    },
    {
      id: 'chat',
      title: '多窗口对话',
      description: '创建AI对话窗口，关联AI角色或Agent工作流',
      icon: MessageSquare,
      color: 'purple',
      path: '/ai-chat-multi',
      badge: '应用层',
      features: [
        '多窗口并发对话',
        '工作流模式支持',
        '实时对话交互',
        '工作流执行监控',
      ],
    },
    {
      id: 'public',
      title: '公开页面配置',
      description: '发布验证OK的AI对话为独立页，供外部用户访问',
      icon: ExternalLink,
      color: 'orange',
      path: '/public-page-configs',
      badge: '发布层',
      features: [
        '创建公开访问页面',
        '配置显示模式',
        '生成访问链接',
        '页面管理',
      ],
    },
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'hover' = 'bg') => {
    const colors: Record<string, Record<string, string>> = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100',
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:bg-green-100',
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100',
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100',
      },
    };
    return colors[color]?.[type] || colors.blue[type];
  };

  const getBadgeClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TopNavigation />

      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">AI统一管理平台</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              四层架构体系：从角色配置到公开发布的完整AI工作流管理
            </p>
          </div>

          {/* 架构流程图 */}
          <div className="mt-12 flex items-center justify-center gap-4">
            {managementModules.map((module, index) => (
              <React.Fragment key={module.id}>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getColorClasses(module.color, 'bg')} ${getColorClasses(module.color, 'border')} border-2`}>
                      <module.icon className={`w-6 h-6 ${getColorClasses(module.color, 'text')}`} />
                    </div>
                    <div className={`mt-2 text-xs px-2 py-0.5 rounded-full border ${getBadgeClasses(module.color)}`}>
                      {module.badge}
                    </div>
                  </div>
                </div>
                {index < managementModules.length - 1 && (
                  <div className="w-12 border-t-2 border-dashed border-gray-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 管理模块卡片网格 */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {managementModules.map((module) => {
            const Icon = module.icon;
            
            return (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(module.path)}
              >
                {/* 卡片头部 */}
                <div className={`p-6 ${getColorClasses(module.color, 'bg')} border-b ${getColorClasses(module.color, 'border')}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-white shadow-md ${getColorClasses(module.color, 'text')}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 功能特性 */}
                <div className="p-6">
                  <div className="space-y-3">
                    {module.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${getColorClasses(module.color, 'bg')}`} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* 进入按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(module.path);
                    }}
                    className={`mt-6 w-full px-4 py-3 rounded-lg font-medium transition-all ${getColorClasses(module.color, 'bg')} ${getColorClasses(module.color, 'text')} ${getColorClasses(module.color, 'hover')} border ${getColorClasses(module.color, 'border')} hover:shadow-md`}
                  >
                    进入 {module.title.split(' ')[0]}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 使用流程说明 */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8" />
              使用流程
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', title: '配置角色', desc: '创建AI角色并关联Dify工作流' },
                { step: '2', title: '编排工作流', desc: '基于角色设计智能工作流程' },
                { step: '3', title: '测试对话', desc: '多窗口测试验证工作流' },
                { step: '4', title: '公开发布', desc: '发布为公开页面供用户访问' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-blue-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIUnifiedManagementPage;

