import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import TechPackageNode from "../components/nodes/TechPackageNode";
import CoreDraftNode from "../components/nodes/CoreDraftNode";
import SpeechNode from "../components/nodes/SpeechNode";
import AiSearchNode from "../components/nodes/AiSearchNode";
import { getNodeById } from "../config/workflowNodes";
import LoadingAnimation, {
  LoadingButton,
} from "../components/LoadingAnimation";
import PageTransition, { AnimatedPage } from "../components/PageTransition";
import TopNavigation from "../components/TopNavigation";

// 节点组件映射
const nodeComponents = {
  tech_package: TechPackageNode,
  core_draft: CoreDraftNode,
  speech: SpeechNode,
  ai_search: AiSearchNode,
  ai_qa: AiSearchNode, // ai_qa 也映射到 AiSearchNode
};

const NodePage: React.FC = () => {
  const { nodeType } = useParams<{ nodeType: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // 获取节点信息 - 将URL中的连字符转换为下划线
  const nodeId = nodeType ? nodeType.replace(/-/g, "_") : null;
  const node = nodeId ? getNodeById(nodeId) : null;
  const NodeComponent = node
    ? nodeComponents[node.type as keyof typeof nodeComponents]
    : null;

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
