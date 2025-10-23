import React from "react";
import { TechPointStats as StatsType } from "../../types/techPoint";
import { useTechPointStats } from "../../hooks/useTechPoints";

interface TechPointStatsProps {
  className?: string;
}

const TechPointStats: React.FC<TechPointStatsProps> = ({ className = "" }) => {
  const { stats, loading, error } = useTechPointStats();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-red-500 text-center">
          {error || "无法加载统计数据"}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      case "draft":
        return "bg-yellow-500";
      case "archived":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "bg-blue-500";
      case "improvement":
        return "bg-green-500";
      case "innovation":
        return "bg-purple-500";
      case "technology":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">技术点统计</h3>

      {/* 总览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-blue-100">技术点总数</div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
          <div className="text-green-100">活跃技术点</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.byPriority.high || 0}</div>
          <div className="text-purple-100">高优先级</div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">
            {Object.keys(stats.byType).length}
          </div>
          <div className="text-orange-100">技术类型</div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 按状态统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">按状态分布</h4>
          <div className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {status}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 按类型统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">按类型分布</h4>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${getTypeColor(type)} mr-2`}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {type}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 按优先级统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            按优先级分布
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${getPriorityColor(priority)} mr-2`}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {priority}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechPointStats;
