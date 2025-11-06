import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import TechPackageNode from "../components/nodes/TechPackageNode";
import CoreDraftNode from "../components/nodes/CoreDraftNode";
import SpeechNode from "../components/nodes/SpeechNode";
import AiSearchNode from "../components/nodes/AiSearchNode";
import PromotionStrategyNode from "../components/nodes/PromotionStrategyNode";
import { getNodeById } from "../config/workflowNodes";
import LoadingAnimation, {
  LoadingButton,
} from "../components/LoadingAnimation";
import PageTransition, { AnimatedPage } from "../components/PageTransition";
import TopNavigation from "../components/TopNavigation";
import { aiRoleService } from "../services/aiRoleService";
import { AIRoleConfig } from "../types/aiRole";
import { 
  findAIRoleForNode, 
  isValidIndependentNodeType,
  IndependentNodeType 
} from "../utils/nodeRoleMapping";
import publicPageConfigService from "../services/publicPageConfigService";
import { PublicPageConfigPreview } from "../types/publicPageConfig";

// 节点组件映射
const nodeComponents = {
  tech_package: TechPackageNode,
  core_draft: CoreDraftNode,
  speech: SpeechNode,
  ai_search: AiSearchNode,
  ai_qa: AiSearchNode, // ai_qa 也映射到 AiSearchNode
  promotion_strategy: PromotionStrategyNode, // 推广策略节点
};

const NodePage: React.FC = () => {
  const { nodeType } = useParams<{ nodeType: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [aiRole, setAiRole] = useState<AIRoleConfig | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<PublicPageConfigPreview | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // 获取节点信息 - 将URL中的连字符转换为下划线
  const nodeId = nodeType ? nodeType.replace(/-/g, "_") : null;
  const node = nodeId ? getNodeById(nodeId) : null;
  const NodeComponent = node
    ? nodeComponents[node.type as keyof typeof nodeComponents]
    : null;

  // 加载公开页面配置（如果存在）
  useEffect(() => {
    const loadPublicConfig = async () => {
      if (!nodeType) {
        setConfigLoading(false);
        return;
      }

      try {
        setConfigLoading(true);
        // 尝试根据地址查找配置
        const configData = await publicPageConfigService.getPublicConfigByAddress(nodeType);
        if (configData && configData.config) {
          setPublicConfig(configData);
          
          // 如果配置中有角色，使用第一个角色
          if (configData.roles && configData.roles.length > 0) {
            const firstRole = configData.roles[0];
            setAiRole({
              ...firstRole,
              createdAt: new Date(firstRole.createdAt),
              updatedAt: new Date(firstRole.updatedAt),
            });
            setRolesLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('未找到公开页面配置，使用默认方式加载:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadPublicConfig();
  }, [nodeType]);

  // 加载AI角色配置（如果没有从公开配置中获取）
  useEffect(() => {
    const loadAIRole = async () => {
      // 如果已经从公开配置中获取了角色，则跳过
      if (aiRole || !nodeType || !isValidIndependentNodeType(nodeType)) {
        setRolesLoading(false);
        return;
      }

      try {
        setRolesLoading(true);
        setRoleError(null);
        
        // 获取所有AI角色
        const allRoles = await aiRoleService.getAIRoles();
        
        // 查找匹配的AI角色
        const matchedRole = findAIRoleForNode(nodeType as IndependentNodeType, allRoles);
        
        if (matchedRole) {
          setAiRole(matchedRole);
        } else {
          setRoleError('未找到匹配的AI角色配置，请前往AI角色管理页面创建对应的角色。');
        }
      } catch (error) {
        console.error('加载AI角色失败:', error);
        setRoleError('加载AI角色配置失败，将使用默认API配置。');
      } finally {
        setRolesLoading(false);
      }
    };

    if (!configLoading) {
      loadAIRole();
    }
  }, [nodeType, configLoading, aiRole]);

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

  // 重新执行
  const handleReExecute = () => {
    setExecutionResult(null);
  };

  // 如果找到了公开配置且模板类型是 speech，使用A问答模版
  if (publicConfig && publicConfig.config.templateType === 'speech') {
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
          <TopNavigation currentPageTitle={publicConfig.config.name || "发布会稿助手"} />

          {/* 主要内容区域 - 使用A问答模版 */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow">
              <SpeechNode
                onExecute={handleNodeExecution}
                initialData={executionResult?.data}
                isLoading={isLoading}
                nodeState={{
                  nodeId: node?.id || 'speech',
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

  if (!node) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">节点未找到</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition isVisible={true}>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <TopNavigation currentPageTitle={node.name} />

        {/* 主要内容区域 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* AI角色配置提示 */}
          {roleError && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-800">{roleError}</span>
                </div>
                <button
                  onClick={() => navigate('/ai-roles')}
                  className="ml-4 px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  去配置
                </button>
              </div>
            </div>
          )}

          {/* AI角色加载中提示 */}
          {(rolesLoading || configLoading) && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-800">正在加载配置...</span>
              </div>
            </div>
          )}

          {/* 节点组件区域 - 全宽布局 */}
          <div className="bg-white rounded-lg shadow">
            {NodeComponent ? (
              React.createElement(NodeComponent, {
                onExecute: handleNodeExecution,
                initialData: executionResult?.data,
                isLoading: isLoading,
                nodeState: {
                  nodeId: node.id,
                  status: isLoading
                    ? "loading"
                    : executionResult
                      ? "completed"
                      : "idle",
                },
                canExecute: !isLoading,
                context: {
                  nodes: {},
                  completedNodes: [],
                  availableNextSteps: [],
                },
                aiRole: aiRole || undefined,
                mode: 'independent',
              })
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                该节点组件开发中...
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default NodePage;
