import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, Info, Car, ChevronDown, ChevronRight } from 'lucide-react';
import { CarSeries, CarSeriesStatus } from '../../types/carSeries';
import { TechPoint } from '../../types/techPoint';
import { carSeriesService } from '../../services/carSeriesService';

interface CarSeriesDetailProps {
  carSeries: CarSeries;
  onClose: () => void;
}

const CarSeriesDetail: React.FC<CarSeriesDetailProps> = ({ carSeries, onClose }) => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    specs: false,
    techPoints: false
  });

  useEffect(() => {
    fetchTechPoints();
  }, [carSeries.id]);

  const fetchTechPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      // 暂时使用空数组，等待后端API实现
      setTechPoints([]);
    } catch (error) {
      console.error('获取技术点失败:', error);
      setError('获取技术点失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusLabel = (status: CarSeriesStatus): string => {
    const statusLabels = {
      [CarSeriesStatus.ACTIVE]: '在产',
      [CarSeriesStatus.DISCONTINUED]: '停产',
      [CarSeriesStatus.PLANNED]: '计划中'
    };
    return statusLabels[status];
  };

  const getStatusColor = (status: CarSeriesStatus): string => {
    const colors = {
      [CarSeriesStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [CarSeriesStatus.DISCONTINUED]: 'bg-red-100 text-red-800',
      [CarSeriesStatus.PLANNED]: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const getTechPointTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      'engine': 'bg-red-100 text-red-800',
      'transmission': 'bg-blue-100 text-blue-800',
      'chassis': 'bg-green-100 text-green-800',
      'body': 'bg-yellow-100 text-yellow-800',
      'interior': 'bg-purple-100 text-purple-800',
      'safety': 'bg-orange-100 text-orange-800',
      'technology': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    
    return typeColors[type] || typeColors['other'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {carSeries.model?.brand?.name || '未知品牌'} - {carSeries.model?.name || '未知车型'} - {carSeries.name}
            </h2>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(carSeries.status)}`}>
              {getStatusLabel(carSeries.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('basicInfo')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5" />
                基本信息
              </h3>
              {expandedSections.basicInfo ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.basicInfo && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                    <p className="text-sm text-gray-900">{carSeries.model?.brand?.name || '未知品牌'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">车型</label>
                    <p className="text-sm text-gray-900">{carSeries.model?.name || '未知车型'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">车系名称</label>
                    <p className="text-sm text-gray-900">{carSeries.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">细分市场</label>
                    <p className="text-sm text-gray-900">{carSeries.market_segment || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">上市年份</label>
                    <p className="text-sm text-gray-900">{carSeries.launch_year || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">停产年份</label>
                    <p className="text-sm text-gray-900">{carSeries.end_year || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(carSeries.status)}`}>
                      {getStatusLabel(carSeries.status)}
                    </span>
                  </div>
                </div>
                
                {/* 描述信息 */}
                {carSeries.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {carSeries.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 规格参数 (metadata) */}
          {carSeries.metadata && Object.keys(carSeries.metadata).length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection('specs')}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  规格参数
                </h3>
                {expandedSections.specs ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {expandedSections.specs && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(carSeries.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 技术点 */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('techPoints')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5" />
                技术点 ({techPoints.length})
              </h3>
              {expandedSections.techPoints ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.techPoints && (
              <div className="px-4 pb-4 border-t border-gray-200">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">加载技术点...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">
                    {error}
                  </div>
                ) : techPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无技术点数据
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {techPoints.map((techPoint) => (
                      <div key={techPoint.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{techPoint.name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTechPointTypeBadge(techPoint.type)}`}>
                            {techPoint.type}
                          </span>
                        </div>
                        {techPoint.description && (
                           <p className="text-sm text-gray-600 mb-2">{techPoint.description}</p>
                         )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 时间信息 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              时间信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                <p className="text-sm text-gray-900">
                  {carSeries.created_at ? new Date(carSeries.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">更新时间</label>
                <p className="text-sm text-gray-900">
                  {carSeries.updated_at ? new Date(carSeries.updated_at).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesDetail;