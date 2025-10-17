import React, { useState, useEffect } from 'react';
import { 
  X, 
  Car, 
  Calendar, 
  Building2,
  Tag,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
  Gauge,
  Fuel,
  Zap,
  Target
} from 'lucide-react';
import { CarModel, CarModelStatus } from '../../types/carModel';
import { TechPoint } from '../../types/techPoint';
import { carModelService } from '../../services/carModelService';

interface CarModelDetailProps {
  carModel: CarModel;
  onClose: () => void;
  onEdit?: () => void;
}

const CarModelDetail: React.FC<CarModelDetailProps> = ({
  carModel,
  onClose,
  onEdit
}) => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    specs: true,
    techPoints: true
  });

  // 获取关联的技术点
  useEffect(() => {
    const fetchTechPoints = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await carModelService.getTechPoints(carModel.id);
        setTechPoints(response.data || []);
      } catch (err) {
        setError('获取关联技术点失败');
        console.error('Error fetching tech points:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechPoints();
  }, [carModel.id]);

  // 切换展开/收起状态
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 格式化状态显示
  const getStatusDisplay = (status: CarModelStatus) => {
    const statusMap = {
      [CarModelStatus.ACTIVE]: { text: '在产', color: 'bg-green-100 text-green-800' },
      [CarModelStatus.DISCONTINUED]: { text: '停产', color: 'bg-red-100 text-red-800' },
      [CarModelStatus.PLANNED]: { text: '计划中', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  // 格式化技术点类型
  const getTechPointTypeBadge = (type: string) => {
    const typeConfig = {
      feature: { label: '功能特性', className: 'bg-blue-100 text-blue-800' },
      improvement: { label: '改进优化', className: 'bg-green-100 text-green-800' },
      innovation: { label: '创新技术', className: 'bg-purple-100 text-purple-800' },
      technology: { label: '核心技术', className: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.feature;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // 格式化技术点优先级
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: '高', className: 'bg-red-100 text-red-800' },
      medium: { label: '中', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: '低', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const statusDisplay = getStatusDisplay(carModel.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{carModel.name}</h2>
              <p className="text-sm text-gray-500">车型详情</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                编辑
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('basic')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5" />
                基本信息
              </h3>
              {expandedSections.basic ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.basic && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">品牌：</span>
                    <span className="text-sm text-gray-900">
                      {carModel.brand?.name || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">类别：</span>
                    <span className="text-sm text-gray-900">
                      {carModel.category || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">上市年份：</span>
                    <span className="text-sm text-gray-900">
                      {carModel.launch_year || '-'}
                    </span>
                  </div>
                  
                  {carModel.end_year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">停产年份：</span>
                      <span className="text-sm text-gray-900">
                        {carModel.end_year}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">细分市场：</span>
                    <span className="text-sm text-gray-900">
                      {carModel.market_segment || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">状态：</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">创建时间：</span>
                    <span className="text-sm text-gray-900">
                      {new Date(carModel.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">更新时间：</span>
                    <span className="text-sm text-gray-900">
                      {new Date(carModel.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>



          {/* 元数据信息 */}
          {carModel.metadata && Object.keys(carModel.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <button
                onClick={() => toggleSection('specs')}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  规格参数
                </h3>
                {expandedSections.specs ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSections.specs && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(carModel.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}：
                      </span>
                      <span className="text-sm text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 关联技术点 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => toggleSection('techPoints')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                关联技术点
                <span className="text-sm font-normal text-gray-500">
                  ({techPoints.length})
                </span>
              </h3>
              {expandedSections.techPoints ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.techPoints && (
              <div className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : techPoints.length === 0 ? (
                  <div className="text-center py-8">
                    <Zap className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">暂无关联的技术点</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {techPoints.map((techPoint) => (
                      <div
                        key={techPoint.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {techPoint.name}
                              </h4>
                              {getTechPointTypeBadge(techPoint.type)}
                              {getPriorityBadge(techPoint.priority)}
                            </div>
                            
                            {techPoint.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {techPoint.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {techPoint.id}</span>
                              <span>创建时间: {new Date(techPoint.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <button className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              编辑车型
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarModelDetail;