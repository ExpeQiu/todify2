import React, { useState, useEffect } from 'react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Workflow,
  Settings,
  ExternalLink
} from 'lucide-react';
import { AIRoleConfig } from '../types/aiRole';
import { aiSearchService } from '../services/aiSearchService';
import { useNavigate } from 'react-router-dom';

interface NodeConfigStatus {
  nodeType: string;
  nodeName: string;
  icon: React.ReactNode;
  configured: boolean;
  roleId?: string;
  roleName?: string;
  source: 'independent-page' | 'workflow' | 'field-mapping';
  path?: string;
}

interface AIRoleConfigInfoBoxProps {
  roles: AIRoleConfig[];
  onRefresh?: () => void;
  hideHeader?: boolean; // 是否隐藏标题栏
}

/**
 * AI角色配置信息框
 * 显示需要配置AI角色的节点及其配置状态
 */
const AIRoleConfigInfoBox: React.FC<AIRoleConfigInfoBoxProps> = ({ roles, onRefresh, hideHeader = false }) => {
  const [expanded, setExpanded] = useState(true);
  const [nodeStatuses, setNodeStatuses] = useState<NodeConfigStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNodeStatuses();
  }, [roles]);

  const loadNodeStatuses = async () => {
    setLoading(true);
    try {
      const statuses: NodeConfigStatus[] = [];

      // 1. 独立页面节点（已删除 node/* 功能子页面，不再显示）
      // 这些节点对应的页面已删除，因此不再在配置信息框中显示

      // 2. 工作流Agent节点（需要检查工作流中的agent节点）
      // 这里可以通过API获取工作流信息，暂时显示提示
      statuses.push({
        nodeType: 'workflow-agent',
        nodeName: '工作流Agent节点',
        icon: <Workflow className="w-4 h-4" />,
        configured: false, // 需要从工作流API获取实际状态
        source: 'workflow',
        path: '/agent-workflow'
      });

      // 3. 字段映射功能对象（需要检查字段映射配置）
      const featureTypes = [
        { type: 'five-view-analysis', name: '技术转译（五看）', label: '五看分析' },
        { type: 'three-fix-analysis', name: '用户场景挖掘（三定）', label: '三定分析' },
        { type: 'tech-matrix', name: '技术矩阵', label: '技术矩阵' },
        { type: 'propagation-strategy', name: '传播策略', label: '传播策略' },
        { type: 'exhibition-video', name: '展具与视频', label: '展具与视频' },
        { type: 'translation', name: '翻译', label: '翻译' },
        { type: 'ppt-outline', name: '技术讲稿', label: '技术讲稿' },
        { type: 'script', name: '脚本', label: '脚本' },
      ];

      // 从字段映射配置中获取agentId配置状态
      try {
        const fieldMappingConfigs = await aiSearchService.getAllFieldMappingConfigs();
        const allFeatureObjects = fieldMappingConfigs.flatMap(
          config => config.config.featureObjects || []
        );

        featureTypes.forEach(feature => {
          const featureConfig = allFeatureObjects.find(
            (fo: any) => fo.featureType === feature.type && fo.agentId
          );
          const configured = !!featureConfig?.agentId;
          const roleId = featureConfig?.agentId;
          const matchedRole = roleId ? roles.find(r => r.id === roleId) : null;

          statuses.push({
            nodeType: feature.type,
            nodeName: feature.name,
            icon: <Settings className="w-4 h-4" />,
            configured,
            roleId,
            roleName: matchedRole?.name,
            source: 'field-mapping',
            path: '/field-mapping-management'
          });
        });
      } catch (error) {
        // 如果获取字段映射配置失败，显示为未配置
        console.warn('获取字段映射配置失败:', error);
        featureTypes.forEach(feature => {
          statuses.push({
            nodeType: feature.type,
            nodeName: feature.name,
            icon: <Settings className="w-4 h-4" />,
            configured: false,
            source: 'field-mapping',
            path: '/field-mapping-management'
          });
        });
      }

      setNodeStatuses(statuses);
    } catch (error) {
      console.error('加载节点配置状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const configuredCount = nodeStatuses.filter(s => s.configured).length;
  const totalCount = nodeStatuses.length;
  const unconfiguredNodes = nodeStatuses.filter(s => !s.configured);

  const handleGoToNode = (path: string) => {
    if (path && path !== '#') {
      navigate(path);
    }
  };

  const handleGoToFieldMapping = () => {
    navigate('/field-mapping-management');
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-700">
          <Info className="w-5 h-5" />
          <span className="font-medium">正在加载配置状态...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      {/* 标题栏 */}
      {!hideHeader && (
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI角色配置状态</h3>
              <p className="text-sm text-gray-600">
                已配置 {configuredCount} / {totalCount} 个节点
                {unconfiguredNodes.length > 0 && (
                  <span className="text-orange-600 ml-2">
                    · {unconfiguredNodes.length} 个待配置
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* 内容区域 */}
      {(hideHeader || expanded) && (
        <div className={`px-4 pb-4 space-y-3 ${hideHeader ? 'pt-4' : ''}`}>
          {/* 独立页面节点已移除 - node/* 功能子页面已删除 */}
          
          {/* 工作流Agent节点 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              工作流Agent节点
            </h4>
            <div className="space-y-2">
              {nodeStatuses
                .filter(s => s.source === 'workflow')
                .map((status, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-1.5 rounded bg-yellow-100">
                        {status.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {status.nodeName}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          在工作流编辑器中为Agent节点配置AI角色
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToNode(status.path || '/agent-workflow');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      前往配置
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* 字段映射功能对象 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              字段映射功能对象
            </h4>
            <div className="space-y-2">
              {nodeStatuses
                .filter(s => s.source === 'field-mapping')
                .map((status, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      status.configured
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-1.5 rounded ${
                        status.configured ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {status.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {status.nodeName}
                        </div>
                        {status.configured && status.roleName ? (
                          <div className="text-xs text-gray-600 mt-0.5">
                            已配置: {status.roleName}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 mt-0.5">
                            在字段映射配置中设置agentId
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.configured ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToFieldMapping();
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          前往配置
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 操作提示 */}
          {unconfiguredNodes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">
                    配置提示
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    <ul className="list-disc list-inside space-y-1">
                      <li>工作流Agent节点：在工作流编辑器中为Agent节点选择AI角色</li>
                      <li>字段映射功能对象：在字段映射管理页面为功能对象配置agentId</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRoleConfigInfoBox;
