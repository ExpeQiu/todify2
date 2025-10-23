import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { workflowStatsService } from '../services/workflowStatsService';

interface RealTimeStatsProps {
  refreshInterval?: number; // 刷新间隔（毫秒）
  className?: string;
}

interface RealTimeData {
  timestamp: string;
  activeUsers: number;
  totalSessions: number;
  avgResponseTime: number;
  completionRate: number;
  errorRate: number;
  topNodes: Array<{
    nodeId: string;
    nodeName: string;
    usageCount: number;
  }>;
}

/**
 * 实时统计数据组件
 */
const RealTimeStats: React.FC<RealTimeStatsProps> = ({ 
  refreshInterval = 30000, // 默认30秒刷新一次
  className = '' 
}) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 获取实时数据
  const fetchRealTimeData = async () => {
    try {
      setError(null);
      setIsConnected(true);
      
      // 获取最近1天的统计数据作为实时数据
      const data = await workflowStatsService.getOverallStats(1);
      
      // 模拟实时数据（实际项目中应该从WebSocket或实时API获取）
      const realTimeData: RealTimeData = {
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 50) + 10, // 模拟活跃用户数
        totalSessions: data.overview.totalSessions,
        avgResponseTime: data.overview.avgSessionDuration,
        completionRate: data.overview.completionRate,
        errorRate: Math.random() * 5, // 模拟错误率
        topNodes: data.nodeStats.slice(0, 3).map(node => ({
          nodeId: node.node_id,
          nodeName: workflowStatsService.getNodeDisplayName(node.node_type),
          usageCount: node.total_usage
        }))
      };
      
      setRealTimeData(realTimeData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取实时数据失败');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // 设置定时刷新
  useEffect(() => {
    fetchRealTimeData();
    
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // 手动刷新
  const handleRefresh = () => {
    setLoading(true);
    fetchRealTimeData();
  };

  if (loading && !realTimeData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">加载实时数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <WifiOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm mb-2">连接失败</p>
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            重试连接
          </button>
        </div>
      </div>
    );
  }

  if (!realTimeData) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">实时统计</h3>
            <div className={`ml-2 flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              最后更新: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 实时指标 */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 活跃用户 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">活跃用户</p>
                <p className="text-2xl font-bold text-blue-900">{realTimeData.activeUsers}</p>
              </div>
            </div>
          </div>

          {/* 总会话数 */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">总会话数</p>
                <p className="text-2xl font-bold text-green-900">
                  {workflowStatsService.formatNumber(realTimeData.totalSessions)}
                </p>
              </div>
            </div>
          </div>

          {/* 平均响应时间 */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">平均响应时间</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {workflowStatsService.formatResponseTime(realTimeData.avgResponseTime)}
                </p>
              </div>
            </div>
          </div>

          {/* 完成率 */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">完成率</p>
                <p className="text-2xl font-bold text-purple-900">
                  {workflowStatsService.formatPercentage(realTimeData.completionRate / 100)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 热门节点 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">热门节点</h4>
          <div className="space-y-2">
            {realTimeData.topNodes.map((node, index) => (
              <div key={node.nodeId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {node.nodeName}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {workflowStatsService.formatNumber(node.usageCount)} 次使用
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">系统状态</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">连接状态</span>
              <div className="flex items-center">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-600">已连接</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-red-600">连接断开</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">错误率</span>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  realTimeData.errorRate < 1 ? 'text-green-600' : 
                  realTimeData.errorRate < 3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {realTimeData.errorRate.toFixed(2)}%
                </span>
                {realTimeData.errorRate > 3 && (
                  <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats;
