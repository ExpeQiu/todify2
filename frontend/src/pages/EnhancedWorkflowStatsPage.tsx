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
  Eye,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { 
  workflowStatsService, 
  WorkflowStatsOverview, 
  NodeUsageStat
} from '../services/workflowStatsService';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  MetricCard, 
  ProgressBar, 
  StatsTable 
} from '../components/charts/WorkflowStatsCharts';
import RealTimeStats from '../components/RealTimeStats';

/**
 * 增强版工作流统计页面
 */
const EnhancedWorkflowStatsPage: React.FC = () => {
  const [statsData, setStatsData] = useState<WorkflowStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'realtime' | 'export'>('overview');
  const [chartData, setChartData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30秒刷新一次

  // 获取统计数据
  const fetchStatsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowStatsService.getOverallStats(selectedDays);
      setStatsData(data);
      setLastUpdate(new Date());
      
      // 准备图表数据
      prepareChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新数据
  const handleRefresh = () => {
    fetchStatsData();
  };

  // 切换自动刷新
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // 准备图表数据
  const prepareChartData = (data: WorkflowStatsOverview) => {
    const chartData = {
      // 节点使用统计柱状图数据
      nodeUsageBar: data.nodeStats.map(node => ({
        name: workflowStatsService.getNodeDisplayName(node.node_type),
        value: node.total_usage
      })),
      
      // 响应时间柱状图数据
      responseTimeBar: data.nodeStats.map(node => ({
        name: workflowStatsService.getNodeDisplayName(node.node_type),
        value: node.avg_response_time
      })),
      
      // 采纳率饼图数据
      adoptionPie: [
        {
          name: '直接采纳',
          value: data.nodeAdoptionRates.reduce((sum, node) => sum + node.adoptionRate, 0) / data.nodeAdoptionRates.length
        },
        {
          name: '编辑后采纳',
          value: data.nodeAdoptionRates.reduce((sum, node) => sum + node.editRate, 0) / data.nodeAdoptionRates.length
        },
        {
          name: '放弃',
          value: 100 - (data.nodeAdoptionRates.reduce((sum, node) => sum + node.adoptionRate + node.editRate, 0) / data.nodeAdoptionRates.length)
        }
      ],
      
      // 工作流完成情况饼图数据
      completionPie: [
        {
          name: '完成',
          value: data.workflowStats.completed_sessions
        },
        {
          name: '放弃',
          value: data.workflowStats.abandoned_sessions
        },
        {
          name: '错误',
          value: data.workflowStats.error_sessions
        }
      ],
      
      // 节点交互统计表格数据
      nodeInteractionTable: data.nodeStats.map(node => ({
        nodeName: workflowStatsService.getNodeDisplayName(node.node_type),
        totalUsage: node.total_usage,
        likes: node.total_likes,
        dislikes: node.total_dislikes,
        regenerations: node.total_regenerations,
        adoptions: node.total_adoptions,
        edits: node.total_edits,
        avgResponseTime: workflowStatsService.formatResponseTime(node.avg_response_time),
        adoptionRate: workflowStatsService.formatPercentage(node.adoption_rate),
        editRate: workflowStatsService.formatPercentage(node.edit_rate)
      }))
    };
    
    setChartData(chartData);
  };

  // 初始加载和天数变化时刷新数据
  useEffect(() => {
    fetchStatsData();
  }, [selectedDays]);

  // 自动刷新逻辑
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStatsData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedDays]);

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

  if (!statsData || !chartData) {
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
              <h1 className="text-3xl font-bold text-gray-900">智能工作流统计分析</h1>
              <p className="text-gray-600 mt-1">全面了解功能使用情况和性能指标</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* 刷新控制 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>刷新</span>
                </button>
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>{autoRefresh ? '自动刷新' : '手动刷新'}</span>
                </button>
                <span className="text-sm text-gray-500">
                  最后更新: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
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
          <MetricCard
            title="总使用次数"
            value={workflowStatsService.formatNumber(statsData.overview.totalUsage)}
            icon={BarChart3}
            color="bg-blue-100"
          />
          <MetricCard
            title="总会话数"
            value={workflowStatsService.formatNumber(statsData.overview.totalSessions)}
            icon={Users}
            color="bg-green-100"
          />
          <MetricCard
            title="完成率"
            value={workflowStatsService.formatPercentage(statsData.overview.completionRate / 100)}
            icon={Target}
            color="bg-yellow-100"
          />
          <MetricCard
            title="平均满意度"
            value={statsData.overview.avgSatisfaction.toFixed(1)}
            icon={ThumbsUp}
            color="bg-purple-100"
          />
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'overview', label: '概览', icon: Eye },
                { key: 'charts', label: '图表分析', icon: BarChart3 },
                { key: 'realtime', label: '实时监控', icon: Activity },
                { key: 'export', label: '数据导出', icon: Download }
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
              <div className="space-y-8">
                {/* 工作流完成情况 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">工作流完成情况</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">完成率分析</h4>
                      <div className="space-y-4">
                        <ProgressBar
                          value={statsData.overview.completionRate}
                          max={100}
                          label="总体完成率"
                          color="#10B981"
                        />
                        <ProgressBar
                          value={statsData.overview.avgCompletionRate}
                          max={100}
                          label="平均节点完成率"
                          color="#3B82F6"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">会话统计</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">完成会话</p>
                          <p className="text-2xl font-bold text-green-600">
                            {statsData.workflowStats.completed_sessions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">放弃会话</p>
                          <p className="text-2xl font-bold text-red-600">
                            {statsData.workflowStats.abandoned_sessions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">平均时长</p>
                          <p className="text-lg font-bold text-blue-600">
                            {workflowStatsService.formatResponseTime(statsData.workflowStats.avg_session_duration)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">平均满意度</p>
                          <p className="text-lg font-bold text-purple-600">
                            {statsData.workflowStats.avg_satisfaction_score?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 节点使用统计 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">节点使用统计</h3>
                  <StatsTable
                    data={chartData.nodeInteractionTable}
                    columns={[
                      { key: 'nodeName', label: '节点名称' },
                      { key: 'totalUsage', label: '使用次数' },
                      { key: 'likes', label: '点赞' },
                      { key: 'dislikes', label: '点踩' },
                      { key: 'regenerations', label: '重新生成' },
                      { key: 'adoptions', label: '采纳' },
                      { key: 'edits', label: '编辑' },
                      { key: 'avgResponseTime', label: '平均响应时间' },
                      { key: 'adoptionRate', label: '采纳率' },
                      { key: 'editRate', label: '编辑率' }
                    ]}
                  />
                </div>
              </div>
            )}

            {/* 图表分析标签页 */}
            {activeTab === 'charts' && (
              <div className="space-y-8">
                {/* 节点使用统计图表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChart
                    data={chartData.nodeUsageBar}
                    title="节点使用次数统计"
                    xKey="name"
                    yKey="value"
                    color="#3B82F6"
                  />
                  <BarChart
                    data={chartData.responseTimeBar}
                    title="节点平均响应时间"
                    xKey="name"
                    yKey="value"
                    color="#10B981"
                  />
                </div>

                {/* 采纳率分析图表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PieChart
                    data={chartData.adoptionPie}
                    title="内容采纳率分析"
                    labelKey="name"
                    valueKey="value"
                    colors={['#10B981', '#F59E0B', '#EF4444']}
                  />
                  <PieChart
                    data={chartData.completionPie}
                    title="工作流完成情况"
                    labelKey="name"
                    valueKey="value"
                    colors={['#10B981', '#EF4444', '#F59E0B']}
                  />
                </div>
              </div>
            )}

            {/* 实时监控标签页 */}
            {activeTab === 'realtime' && (
              <div>
                <RealTimeStats refreshInterval={30000} />
              </div>
            )}

            {/* 数据导出标签页 */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">数据导出选项</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">导出格式</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="radio" name="format" value="json" defaultChecked className="mr-2" />
                          <span className="text-sm text-gray-700">JSON格式（推荐）</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="format" value="csv" className="mr-2" />
                          <span className="text-sm text-gray-700">CSV格式</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">导出内容</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm text-gray-700">节点使用统计</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm text-gray-700">用户交互数据</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm text-gray-700">工作流会话统计</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm text-gray-700">内容处理统计</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      <span>导出统计数据</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkflowStatsPage;
