import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Trash2, Edit3, Car, Zap, Users } from 'lucide-react';
import { CarSeries, UpdateCarSeriesFormData } from '../types/carSeries';
import { TechPoint } from '../types/techPoint';
import { carSeriesService } from '../services/carSeriesService';
import { techPointService } from '../services/techPointService';

interface KeyCarModel {
  id?: number;
  name: string;
  description: string;
  price_range: string;
  key_features: string[];
  market_position: string;
}

interface Competitor {
  id?: number;
  name: string;
  brand: string;
  model: string;
  comparison_points: string[];
  competitive_advantage: string;
}

const CarSeriesEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [carSeries, setCarSeries] = useState<CarSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 基本信息
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    market_segment: '',
    launch_year: undefined as number | undefined,
    end_year: undefined as number | undefined,
  });
  
  // 关键车型配置
  const [keyCarModels, setKeyCarModels] = useState<KeyCarModel[]>([]);
  const [showAddCarModel, setShowAddCarModel] = useState(false);
  const [editingCarModel, setEditingCarModel] = useState<KeyCarModel | null>(null);
  
  // 技术点关联
  const [associatedTechPoints, setAssociatedTechPoints] = useState<TechPoint[]>([]);
  const [availableTechPoints, setAvailableTechPoints] = useState<TechPoint[]>([]);
  const [showTechPointSelector, setShowTechPointSelector] = useState(false);
  
  // 竞争对手关联
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);

  // 加载车系数据
  useEffect(() => {
    const loadCarSeries = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await carSeriesService.getById(parseInt(id));
        
        if (response.success && response.data) {
          const series = response.data;
          setCarSeries(series);
          
          // 设置基本信息
          setBasicInfo({
            name: series.name,
            description: series.description || '',
            market_segment: series.market_segment || '',
            launch_year: series.launch_year,
            end_year: series.end_year,
          });
          
          // 解析metadata中的关键车型和竞争对手信息
          if (series.metadata) {
            const metadata = typeof series.metadata === 'string' 
              ? JSON.parse(series.metadata) 
              : series.metadata;
            
            setKeyCarModels(metadata.keyCarModels || []);
            setCompetitors(metadata.competitors || []);
          }
          
          // 加载关联的技术点
          const techPointsResponse = await carSeriesService.getTechPoints(parseInt(id));
          if (techPointsResponse.success && techPointsResponse.data) {
            setAssociatedTechPoints(techPointsResponse.data);
          }
        } else {
          setError('车系不存在或加载失败');
        }
      } catch (err) {
        setError('加载车系信息失败');
        console.error('Load car series error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCarSeries();
  }, [id]);

  // 加载可用技术点
  useEffect(() => {
    const loadTechPoints = async () => {
      try {
        const response = await techPointService.getTechPoints();
        if (response.success && response.data) {
          setAvailableTechPoints(response.data.data || []);
        }
      } catch (err) {
        console.error('Load tech points error:', err);
      }
    };

    loadTechPoints();
  }, []);

  // 保存车系信息
  const handleSave = async () => {
    if (!carSeries) return;
    
    try {
      setSaving(true);
      
      const updateData: UpdateCarSeriesFormData = {
        name: basicInfo.name,
        description: basicInfo.description,
        market_segment: basicInfo.market_segment,
        launch_year: basicInfo.launch_year,
        end_year: basicInfo.end_year,
        metadata: {
          keyCarModels,
          competitors,
          techPointIds: associatedTechPoints.map(tp => tp.id)
        }
      };
      
      const response = await carSeriesService.update(carSeries.id, updateData);
      
      if (response.success) {
        navigate(`/car-series/${carSeries.id}`);
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 关键车型管理
  const handleAddCarModel = (carModel: KeyCarModel) => {
    if (editingCarModel) {
      setKeyCarModels(prev => prev.map(cm => 
        cm === editingCarModel ? carModel : cm
      ));
      setEditingCarModel(null);
    } else {
      setKeyCarModels(prev => [...prev, carModel]);
    }
    setShowAddCarModel(false);
  };

  const handleEditCarModel = (carModel: KeyCarModel) => {
    setEditingCarModel(carModel);
    setShowAddCarModel(true);
  };

  const handleDeleteCarModel = (carModel: KeyCarModel) => {
    setKeyCarModels(prev => prev.filter(cm => cm !== carModel));
  };

  // 技术点管理
  const handleAddTechPoint = (techPoint: TechPoint) => {
    if (!associatedTechPoints.find(tp => tp.id === techPoint.id)) {
      setAssociatedTechPoints(prev => [...prev, techPoint]);
    }
  };

  const handleRemoveTechPoint = (techPoint: TechPoint) => {
    setAssociatedTechPoints(prev => prev.filter(tp => tp.id !== techPoint.id));
  };

  // 竞争对手管理
  const handleAddCompetitor = (competitor: Competitor) => {
    if (editingCompetitor) {
      setCompetitors(prev => prev.map(c => 
        c === editingCompetitor ? competitor : c
      ));
      setEditingCompetitor(null);
    } else {
      setCompetitors(prev => [...prev, competitor]);
    }
    setShowAddCompetitor(false);
  };

  const handleEditCompetitor = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setShowAddCompetitor(true);
  };

  const handleDeleteCompetitor = (competitor: Competitor) => {
    setCompetitors(prev => prev.filter(c => c !== competitor));
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
                onClick={() => navigate(`/car-series/${id}`)}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                返回详情
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">编辑车系</h1>
                <p className="text-gray-600">{carSeries.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/car-series/${id}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 基本信息 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">基本信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    车系名称 *
                  </label>
                  <input
                    type="text"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入车系名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    市场细分
                  </label>
                  <input
                    type="text"
                    value={basicInfo.market_segment}
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, market_segment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如：紧凑型SUV、中大型轿车"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上市年份
                  </label>
                  <input
                    type="number"
                    value={basicInfo.launch_year || ''}
                    onChange={(e) => setBasicInfo(prev => ({ 
                      ...prev, 
                      launch_year: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    停产年份
                  </label>
                  <input
                    type="number"
                    value={basicInfo.end_year || ''}
                    onChange={(e) => setBasicInfo(prev => ({ 
                      ...prev, 
                      end_year: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="留空表示仍在产"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  车系描述
                </label>
                <textarea
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入车系描述..."
                />
              </div>
            </div>

            {/* 关键车型配置 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-blue-600" />
                  关键车型配置
                </h2>
                <button
                  onClick={() => {
                    setEditingCarModel(null);
                    setShowAddCarModel(true);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加车型
                </button>
              </div>
              
              {keyCarModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无关键车型配置</p>
                  <p className="text-sm">点击上方按钮添加关键车型</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keyCarModels.map((carModel, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{carModel.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{carModel.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {carModel.price_range}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {carModel.market_position}
                            </span>
                          </div>
                          {carModel.key_features.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">关键特性：</p>
                              <div className="flex flex-wrap gap-1">
                                {carModel.key_features.map((feature, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditCarModel(carModel)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCarModel(carModel)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 竞争对手关联 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-red-600" />
                  竞争对手关联
                </h2>
                <button
                  onClick={() => {
                    setEditingCompetitor(null);
                    setShowAddCompetitor(true);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加竞争对手
                </button>
              </div>
              
              {competitors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无竞争对手信息</p>
                  <p className="text-sm">点击上方按钮添加竞争对手</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {competitors.map((competitor, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                          <p className="text-gray-600 text-sm">{competitor.brand} - {competitor.model}</p>
                          <p className="text-gray-600 text-sm mt-1">{competitor.competitive_advantage}</p>
                          {competitor.comparison_points.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">对比要点：</p>
                              <div className="flex flex-wrap gap-1">
                                {competitor.comparison_points.map((point, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                                    {point}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditCompetitor(competitor)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompetitor(competitor)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧技术点关联 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  技术点关联
                </h2>
                <button
                  onClick={() => setShowTechPointSelector(true)}
                  className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  关联技术点
                </button>
              </div>
              
              {associatedTechPoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无关联技术点</p>
                  <p className="text-sm">点击上方按钮关联技术点</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {associatedTechPoints.map((techPoint) => (
                    <div key={techPoint.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{techPoint.name}</h4>
                        <p className="text-gray-600 text-xs mt-1">{techPoint.category?.name || '未分类'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveTechPoint(techPoint)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 添加/编辑关键车型模态框 */}
      {showAddCarModel && (
        <CarModelModal
          carModel={editingCarModel}
          onSave={handleAddCarModel}
          onCancel={() => {
            setShowAddCarModel(false);
            setEditingCarModel(null);
          }}
        />
      )}

      {/* 添加/编辑竞争对手模态框 */}
      {showAddCompetitor && (
        <CompetitorModal
          competitor={editingCompetitor}
          onSave={handleAddCompetitor}
          onCancel={() => {
            setShowAddCompetitor(false);
            setEditingCompetitor(null);
          }}
        />
      )}

      {/* 技术点选择器模态框 */}
      {showTechPointSelector && (
        <TechPointSelector
          availableTechPoints={availableTechPoints}
          selectedTechPoints={associatedTechPoints}
          onSelect={handleAddTechPoint}
          onClose={() => setShowTechPointSelector(false)}
        />
      )}
    </div>
  );
};

// 关键车型模态框组件
interface CarModelModalProps {
  carModel: KeyCarModel | null;
  onSave: (carModel: KeyCarModel) => void;
  onCancel: () => void;
}

const CarModelModal: React.FC<CarModelModalProps> = ({ carModel, onSave, onCancel }) => {
  const [formData, setFormData] = useState<KeyCarModel>({
    name: carModel?.name || '',
    description: carModel?.description || '',
    price_range: carModel?.price_range || '',
    key_features: carModel?.key_features || [],
    market_position: carModel?.market_position || '',
  });
  
  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        key_features: [...prev.key_features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_features: prev.key_features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {carModel ? '编辑关键车型' : '添加关键车型'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              车型名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入车型名称"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              车型描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入车型描述"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格区间
              </label>
              <input
                type="text"
                value={formData.price_range}
                onChange={(e) => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如：20-30万"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                市场定位
              </label>
              <input
                type="text"
                value={formData.market_position}
                onChange={(e) => setFormData(prev => ({ ...prev, market_position: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如：入门级、旗舰版"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关键特性
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入特性后按回车添加"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                添加
              </button>
            </div>
            {formData.key_features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.key_features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 竞争对手模态框组件
interface CompetitorModalProps {
  competitor: Competitor | null;
  onSave: (competitor: Competitor) => void;
  onCancel: () => void;
}

const CompetitorModal: React.FC<CompetitorModalProps> = ({ competitor, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Competitor>({
    name: competitor?.name || '',
    brand: competitor?.brand || '',
    model: competitor?.model || '',
    comparison_points: competitor?.comparison_points || [],
    competitive_advantage: competitor?.competitive_advantage || '',
  });
  
  const [newPoint, setNewPoint] = useState('');

  const handleAddPoint = () => {
    if (newPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        comparison_points: [...prev.comparison_points, newPoint.trim()]
      }));
      setNewPoint('');
    }
  };

  const handleRemovePoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      comparison_points: prev.comparison_points.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.brand.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {competitor ? '编辑竞争对手' : '添加竞争对手'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              竞品名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入竞品名称"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品牌 *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入品牌名称"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                车型
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入车型"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              竞争优势
            </label>
            <textarea
              value={formData.competitive_advantage}
              onChange={(e) => setFormData(prev => ({ ...prev, competitive_advantage: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请描述相对于该竞品的优势"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              对比要点
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入对比要点后按回车添加"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPoint())}
              />
              <button
                type="button"
                onClick={handleAddPoint}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                添加
              </button>
            </div>
            {formData.comparison_points.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.comparison_points.map((point, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-red-100 text-red-800"
                  >
                    {point}
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(index)}
                      className="ml-1 text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 技术点选择器组件
interface TechPointSelectorProps {
  availableTechPoints: TechPoint[];
  selectedTechPoints: TechPoint[];
  onSelect: (techPoint: TechPoint) => void;
  onClose: () => void;
}

const TechPointSelector: React.FC<TechPointSelectorProps> = ({
  availableTechPoints,
  selectedTechPoints,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTechPoints = availableTechPoints.filter(tp =>
    !selectedTechPoints.find(stp => stp.id === tp.id) &&
    (tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (tp.category?.name && tp.category.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">选择技术点</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="搜索技术点..."
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredTechPoints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>没有可选择的技术点</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTechPoints.map((techPoint) => (
                <div
                  key={techPoint.id}
                  onClick={() => onSelect(techPoint)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{techPoint.name}</h4>
                  <p className="text-sm text-gray-600">{techPoint.category?.name || '未分类'}</p>
                  {techPoint.description && (
                    <p className="text-xs text-gray-500 mt-1">{techPoint.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesEditPage;