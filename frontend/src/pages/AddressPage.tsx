import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SpeechNode from "../components/nodes/SpeechNode";
import PageTransition from "../components/PageTransition";
import TopNavigation from "../components/TopNavigation";
import publicPageConfigService from "../services/publicPageConfigService";
import { PublicPageConfigPreview } from "../types/publicPageConfig";
import { AIRoleConfig } from "../types/aiRole";

// 保留的路由路径，不应该被当作地址配置处理
const RESERVED_ROUTES = [
  'workflow', 'config', 'tech-points', 'car-series', 'ai-search-test',
  'ai-chat', 'workflow-stats', 'enhanced-workflow-stats', 'history',
  'ai-roles', 'ai-chat-multi', 'agent-workflow', 'public-page-configs',
  'ai-management', 'public-chat'
];

/**
 * 根据地址（address）加载公开页面配置并渲染对应模版的页面
 * 路由：/ai-search, /tech-package 等
 */
const AddressPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [publicConfig, setPublicConfig] = useState<PublicPageConfigPreview | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载公开页面配置
  useEffect(() => {
    const loadPublicConfig = async () => {
      if (!address) {
        setError('地址参数缺失');
        setConfigLoading(false);
        return;
      }

      // 检查是否是保留路由
      if (RESERVED_ROUTES.includes(address)) {
        setError('该路径为系统保留路径');
        setConfigLoading(false);
        return;
      }

      try {
        setConfigLoading(true);
        setError(null);
        // 根据地址查找配置
        const configData = await publicPageConfigService.getPublicConfigByAddress(address);
        if (configData && configData.config) {
          setPublicConfig(configData);
        } else {
          setError('未找到对应的页面配置');
        }
      } catch (err: any) {
        console.error('加载配置失败:', err);
        // 如果404，说明不是有效的地址配置，跳转到首页
        if (err.response?.status === 404) {
          navigate('/');
          return;
        }
        setError(err.message || '加载配置失败');
      } finally {
        setConfigLoading(false);
      }
    };

    loadPublicConfig();
  }, [address, navigate]);

  // 处理节点执行
  const handleNodeExecution = async (inputData: any) => {
    setIsLoading(true);
    try {
      // 模拟执行过程
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = {
        success: true,
        message: "执行成功",
        data: inputData,
        timestamp: new Date().toISOString(),
      };

      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : "执行失败",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 加载中状态
  if (configLoading) {
    return (
      <PageTransition isVisible={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载配置...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 错误状态
  if (error || !publicConfig) {
    return (
      <PageTransition isVisible={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || '配置未找到'}
            </h1>
            <p className="text-gray-600 mb-4">
              {error || '未找到对应的页面配置，请检查地址是否正确'}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 如果配置的模板类型是 speech，使用发布会稿模版（A问答模版）
  if (publicConfig.config.templateType === 'speech') {
    const speechRole = publicConfig.roles && publicConfig.roles.length > 0 
      ? {
          ...publicConfig.roles[0],
          createdAt: new Date(publicConfig.roles[0].createdAt),
          updatedAt: new Date(publicConfig.roles[0].updatedAt),
        }
      : undefined;

    return (
      <PageTransition isVisible={true}>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航栏 */}
          <TopNavigation currentPageTitle={publicConfig.config.name || "A问答模版"} />

          {/* 主要内容区域 - 使用A问答模版 */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow">
              <SpeechNode
                onExecute={handleNodeExecution}
                initialData={executionResult?.data}
                isLoading={isLoading}
                nodeState={{
                  nodeId: 'speech',
                  status: isLoading ? "loading" : executionResult ? "completed" : "idle",
                }}
                canExecute={!isLoading}
                context={{
                  nodes: {},
                  completedNodes: [],
                  availableNextSteps: [],
                }}
                aiRole={speechRole}
                mode="independent"
              />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 其他模板类型可以在这里扩展
  return (
    <PageTransition isVisible={true}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">模版类型不支持</h1>
          <p className="text-gray-600 mb-4">
            当前配置的模版类型暂不支持显示
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default AddressPage;

