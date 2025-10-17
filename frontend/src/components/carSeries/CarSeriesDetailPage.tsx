import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, Settings, Zap } from 'lucide-react';
import { carSeriesService } from '../../services/carSeriesService';
import { CarSeries } from '../../types/carSeries';
import { TechPoint } from '../../types/techPoint';

const CarSeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [carSeries, setCarSeries] = useState<CarSeries | null>(null);
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 获取车系详情
        const carSeriesResponse = await carSeriesService.getById(parseInt(id));
        if (carSeriesResponse.success && carSeriesResponse.data) {
          setCarSeries(carSeriesResponse.data);
        } else {
          setError('获取车系信息失败');
          return;
        }
        
        // 获取关联的技术点
        const techPointsResponse = await carSeriesService.getTechPoints(parseInt(id));
        if (techPointsResponse.success && techPointsResponse.data) {
          setTechPoints(techPointsResponse.data);
        }
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !carSeries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">出错了</h2>
          <p className="text-gray-600 mb-4">{error || '车系不存在'}</p>
          <button
            onClick={() => navigate('/car-series')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回车系列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/car-series')}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </button>

            </div>
            <button
              onClick={() => navigate(`/car-series/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              编辑车系
            </button>
          </div>
        </div>

        {/* 车系基本信息 */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">车系名称</label>
                <p className="text-lg font-semibold">{carSeries.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">车型ID</label>
                <p className="text-lg">{carSeries.model_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(carSeries.status)}`}>
                  {carSeries.status === 'active' ? '在产' : 
                   carSeries.status === 'discontinued' ? '停产' : 
                   carSeries.status === 'planned' ? '计划中' : carSeries.status}
                </span>
              </div>
              {carSeries.launch_year && (
                <div>
                  <label className="text-sm font-medium text-gray-500">上市年份</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{carSeries.launch_year}</span>
                  </div>
                </div>
              )}
              {carSeries.end_year && (
                <div>
                  <label className="text-sm font-medium text-gray-500">停产年份</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{carSeries.end_year}</span>
                  </div>
                </div>
              )}
              {carSeries.market_segment && (
                <div>
                  <label className="text-sm font-medium text-gray-500">市场细分</label>
                  <p className="text-lg">{carSeries.market_segment}</p>
                </div>
              )}
            </div>
            
            {carSeries.description && (
              <>
                <hr className="my-4" />
                <div>
                  <label className="text-sm font-medium text-gray-500">描述</label>
                  <p className="mt-1 text-gray-700">{carSeries.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 关联技术点 */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {techPoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无关联的技术点</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {techPoints.map((techPoint) => (
                  <div key={techPoint.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg leading-tight">{techPoint.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(techPoint.priority)}`}>
                            {techPoint.priority === 'high' ? '高' : 
                             techPoint.priority === 'medium' ? '中' : 
                             techPoint.priority === 'low' ? '低' : techPoint.priority}
                          </span>
                        </div>
                        
                        {techPoint.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {techPoint.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{techPoint.category?.name || '未分类'}</span>
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(techPoint.status)}`}>
                            {techPoint.status === 'active' ? '活跃' : 
                             techPoint.status === 'inactive' ? '非活跃' : 
                             techPoint.status === 'archived' ? '已归档' : techPoint.status}
                          </span>
                        </div>
                        
                        {techPoint.created_at && (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>创建于 {formatDate(techPoint.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesDetailPage;