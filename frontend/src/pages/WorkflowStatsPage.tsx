import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Eye,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  workflowStatsService, 
  WorkflowStatsOverview, 
  NodeUsageStat,
  NodeAdoptionRate,
  WorkflowCompletionStats,
  CommonExitPoint
} from '../services/workflowStatsService';

/**
 * 工作流统计页面
 */
const WorkflowStatsPage: React.FC = () => {
  const [statsData, setStatsData] = useState<WorkflowStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'workflow' | 'adoption'>('overview');

  // 获取统计数据
  const fetchStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowStatsService.getOverallStats(selectedDays);
      setStatsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, [selectedDays]);

  // 下载统计数据
  const handleDownload = async () => {
    try {
      await workflowStatsService.downloadStats(selectedDays, 'json');
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStatsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">暂无统计数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">智能工作流统计</h1>
              <p className="text-gray-600 mt-1">全面了解功能使用情况</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 时间范围选择 */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>最近1天</option>
                  <option value={7}>最近7天</option>
                  <option value={30}>最近30天</option>
                  <option value={90}>最近90天</option>
                </select>
              </div>
              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>导出数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总使用次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStatsService.formatNumber(statsData.overview.totalUsage)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总会话数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStatsService.formatNumber(statsData.overview.totalSessions)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">完成率</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStatsService.formatPercentage(statsData.overview.completionRate / 100)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均满意度</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsData.overview.avgSatisfaction.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: '概览', icon: Eye },
                { key: 'nodes', label: '节点统计', icon: BarChart3 },
                { key: 'workflow', label: '工作流分析', icon: TrendingUp },
                { key: 'adoption', label: '采纳率分析', icon: Target }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 概览标签页 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 节点使用统计 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">节点使用统计</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {statsData.nodeStats.map((node) => (
                      <div key={node.node_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            {workflowStatsService.getNodeDisplayName(node.node_type)}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {workflowStatsService.formatNumber(node.total_usage)} 次使用
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">响应时间</p>
                            <p className="font-medium">
                              {workflowStatsService.formatResponseTime(node.avg_response_time)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">采纳率</p>
                            <p className="font-medium">
                              {workflowStatsService.formatPercentage(node.adoption_rate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">编辑率</p>
                            <p className="font-medium">
                              {workflowStatsService.formatPercentage(node.edit_rate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 工作流完成情况 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">工作流完成情况</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="font-medium text-gray-900">完成会话</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {statsData.workflowStats.completed_sessions}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900">放弃会话</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {statsData.workflowStats.abandoned_sessions}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-900">平均时长</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {workflowStatsService.formatResponseTime(statsData.workflowStats.avg_session_duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 节点统计标签页 */}
            {activeTab === 'nodes' && (
              <div className="space-y-6">
                {statsData.nodeStats.map((node) => (
                  <div key={node.node_id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {workflowStatsService.getNodeDisplayName(node.node_type)}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {node.total_sessions} 个会话
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">总使用次数</p>
                        <p className="text-xl font-bold text-gray-900">
                          {workflowStatsService.formatNumber(node.total_usage)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">独立用户</p>
                        <p className="text-xl font-bold text-gray-900">
                          {workflowStatsService.formatNumber(node.total_users)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">平均响应时间</p>
                        <p className="text-xl font-bold text-gray-900">
                          {workflowStatsService.formatResponseTime(node.avg_response_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">平均质量评分</p>
                        <p className="text-xl font-bold text-gray-900">
                          {node.avg_quality_score.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-600">点赞: {node.total_likes}</span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsDown className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-gray-600">点踩: {node.total_dislikes}</span>
                        </div>
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-gray-600">重新生成: {node.total_regenerations}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-600">采纳: {node.total_adoptions}</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="h-4 w-4 text-yellow-500 mr-2" />
                          <span className="text-gray-600">编辑: {node.total_edits}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 工作流分析标签页 */}
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                {/* 工作流完成率 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">工作流完成率</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">总体完成率</p>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${statsData.overview.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            {workflowStatsService.formatPercentage(statsData.overview.completionRate / 100)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">平均会话时长</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {workflowStatsService.formatResponseTime(statsData.workflowStats.avg_session_duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 常见退出点 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">常见退出点</h3>
                  <div className="space-y-3">
                    {statsData.commonExitPoints.map((exitPoint, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">
                              {exitPoint.exit_count} 次
                            </span>
                            <span className="font-medium text-gray-900">
                              {workflowStatsService.getNodeDisplayName(exitPoint.exit_node_id)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {exitPoint.exit_reason === 'user_abandon' ? '用户放弃' : 
                             exitPoint.exit_reason === 'error' ? '系统错误' : 
                             exitPoint.exit_reason === 'completion' ? '正常完成' : exitPoint.exit_reason}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">平均退出时长</p>
                            <p className="font-medium">
                              {workflowStatsService.formatResponseTime(exitPoint.avg_duration_before_exit)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">平均完成率</p>
                            <p className="font-medium">
                              {workflowStatsService.formatPercentage(exitPoint.avg_completion_rate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 采纳率分析标签页 */}
            {activeTab === 'adoption' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">节点采纳率分析</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {statsData.nodeAdoptionRates.map((node) => (
                    <div key={node.nodeId} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {workflowStatsService.getNodeDisplayName(node.nodeId)}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {workflowStatsService.formatNumber(node.totalUsage)} 次使用
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">直接采纳率</span>
                            <span className="text-sm font-medium text-gray-900">
                              {workflowStatsService.formatPercentage(node.adoptionRate / 100)}
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${node.adoptionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">编辑后采纳率</span>
                            <span className="text-sm font-medium text-gray-900">
                              {workflowStatsService.formatPercentage(node.editRate / 100)}
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${node.editRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-sm">
                          <div>
                            <p className="text-gray-600">平均响应时间</p>
                            <p className="font-medium">
                              {workflowStatsService.formatResponseTime(node.avgResponseTime)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">平均质量评分</p>
                            <p className="font-medium">
                              {node.avgQualityScore.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatsPage;
