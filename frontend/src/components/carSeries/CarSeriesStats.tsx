import React from 'react';
import { CarSeriesStats as StatsType } from '../../types/carSeries';
import { useCarSeriesStats } from '../../hooks/useCarSeries';

interface CarSeriesStatsProps {
  className?: string;
}

const CarSeriesStats: React.FC<CarSeriesStatsProps> = ({ className = '' }) => {
  const { stats, loading, error } = useCarSeriesStats();

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
          {error || '无法加载统计数据'}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'discontinued': return 'bg-red-500';
      case 'planned': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '在产';
      case 'discontinued': return '停产';
      case 'planned': return '计划中';
      default: return status;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">车系统计</h3>
      
      {/* 总览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-blue-100">车系总数</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
          <div className="text-green-100">在产车系</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{Object.keys(stats.byBrand).length}</div>
          <div className="text-purple-100">品牌数量</div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{Object.keys(stats.bySegment).length}</div>
          <div className="text-orange-100">细分市场</div>
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
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}></div>
                  <span className="text-sm text-gray-600">{getStatusLabel(status)}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 按品牌统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">按品牌分布</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(stats.byBrand)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([brand, count]) => (
              <div key={brand} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600 truncate" title={brand}>{brand}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 按细分市场统计 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">按细分市场分布</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(stats.bySegment)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([segment, count]) => (
              <div key={segment} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-sm text-gray-600 truncate" title={segment}>{segment}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesStats;