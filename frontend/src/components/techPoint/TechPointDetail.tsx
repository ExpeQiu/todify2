import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Target, 
  FileText, 
  Mic, 
  Car, 
  Calendar,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  BookOpen,
  Plus
} from 'lucide-react';
import { TechPoint } from '../../types/techPoint';
import { CarModel } from '../../types/carModel';
import { KnowledgePoint } from '../../types/knowledgePoint';
import { techPointService } from '../../services/techPointService';
import { knowledgePointService } from '../../services/knowledgePointService';
import CarModelAssociation from './CarModelAssociation';
import KnowledgePointManager from '../knowledgePoint/KnowledgePointManager';

interface TechPointDetailProps {
  techPoint: TechPoint;
  onClose: () => void;
}

interface AssociatedContent {
  packagingMaterials: any[];
  promotionStrategies: any[];
  pressReleases: any[];
  speeches: any[];
}



const TechPointDetail: React.FC<TechPointDetailProps> = ({ techPoint, onClose }) => {
  const [associatedContent, setAssociatedContent] = useState<AssociatedContent | null>(null);
  const [associatedCarModels, setAssociatedCarModels] = useState<CarModel[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    knowledgePoints: true,
    packaging: false,
    promotion: false,
    press: false,
    speeches: false,
    carModels: false
  });

  useEffect(() => {
    fetchAssociatedData();
    fetchKnowledgePoints();
  }, [techPoint.id]);

  const fetchKnowledgePoints = async () => {
    try {
      const response = await knowledgePointService.getByTechPointId(techPoint.id, {
        page: 1,
        pageSize: 100
      });
      
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (err) {
      console.error('获取知识点失败:', err);
    }
  };

  const fetchAssociatedData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [contentResponse, carModelsResponse] = await Promise.all([
        techPointService.getTechPointAssociatedContent(techPoint.id),
        techPointService.getTechPointAssociatedCarModels(techPoint.id)
      ]);

      if (contentResponse.success && contentResponse.data) {
        setAssociatedContent(contentResponse.data);
      }

      if (carModelsResponse.success && carModelsResponse.data) {
        setAssociatedCarModels(carModelsResponse.data);
      }
    } catch (err) {
      setError('获取关联数据失败');
    } finally {
      setLoading(false);
    }
  };



  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-orange-100 text-orange-800';
      case 'comfort': return 'bg-teal-100 text-teal-800';
      case 'technology': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const renderContentSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    sectionKey: string,
    renderItem: (item: any, index: number) => React.ReactNode
  ) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{items.length} 项内容</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="border-t border-gray-200 p-6">
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, index) => renderItem(item, index))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>暂无相关内容</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Info className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchAssociatedData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{techPoint.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(techPoint.type)}`}>
                  {techPoint.type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(techPoint.priority)}`}>
                  {techPoint.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(techPoint.status)}`}>
                  {techPoint.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">技术点名称</label>
                  <p className="text-gray-900 mt-1">{techPoint.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">分类</label>
                  <p className="text-gray-900 mt-1">{techPoint.category?.name || '未分类'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatDate(techPoint.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">更新时间</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatDate(techPoint.updated_at)}
                  </p>
                </div>
              </div>
              {techPoint.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">描述</label>
                  <p className="text-gray-900 mt-1">{techPoint.description}</p>
                </div>
              )}
            </div>

            {/* Knowledge Points Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('knowledgePoints')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">知识点记录</h3>
                    <p className="text-sm text-gray-500">管理技术点相关的知识点内容</p>
                  </div>
                </div>
                {expandedSections.knowledgePoints ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSections.knowledgePoints && (
                <div className="border-t border-gray-200 p-6">
                  <KnowledgePointManager
                    techPointId={techPoint.id}
                    techPointName={techPoint.name}
                  />
                </div>
              )}
            </div>



            {/* Associated Content Sections */}
            {associatedContent && (
              <>
                {renderContentSection(
                  '包装材料',
                  <Package className="w-5 h-5 text-blue-600" />,
                  associatedContent.packagingMaterials,
                  'packaging',
                  (item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>类型: {item.type}</span>
                            <span>状态: {item.status}</span>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}

                {renderContentSection(
                  '推广策略',
                  <Target className="w-5 h-5 text-blue-600" />,
                  associatedContent.promotionStrategies,
                  'promotion',
                  (item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>目标: {item.target}</span>
                            <span>预算: {item.budget}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {renderContentSection(
                  '新闻稿',
                  <FileText className="w-5 h-5 text-blue-600" />,
                  associatedContent.pressReleases,
                  'press',
                  (item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>发布日期: {formatDate(item.publishDate)}</span>
                            <span>媒体: {item.media}</span>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}

                {renderContentSection(
                  '演讲内容',
                  <Mic className="w-5 h-5 text-blue-600" />,
                  associatedContent.speeches,
                  'speeches',
                  (item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>演讲者: {item.speaker}</span>
                            <span>日期: {formatDate(item.date)}</span>
                            <span>地点: {item.venue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {/* Car Model Association */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('carModels')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Car className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">关联车型管理</h3>
                    <p className="text-sm text-gray-500">管理技术点与车型的关联关系</p>
                  </div>
                </div>
                {expandedSections.carModels ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedSections.carModels && (
                <div className="border-t border-gray-200 p-6">
                  <CarModelAssociation
              techPointId={techPoint.id}
              onUpdate={fetchAssociatedData}
            />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechPointDetail;