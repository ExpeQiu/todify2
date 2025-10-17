import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

// 知识点数据接口
export interface KnowledgePoint {
  id: string;
  vehicleModel: string;    // 车型
  vehicleSeries: string;   // 车系
  techCategory: string;    // 技术分类
  techPoint: string;       // 技术点
  description: string;     // 描述
}

// 组件Props接口
export interface KnowledgePointSelectorProps {
  // 知识点数据
  knowledgePoints?: KnowledgePoint[];
  // 初始选中的知识点ID列表
  initialSelectedPoints?: string[];
  // 初始展开状态
  initialExpanded?: boolean;
  // 标题
  title?: string;
  // 描述文本
  description?: string;
  // 保存按钮文本
  saveButtonText?: string;
  // 展开/收起按钮文本
  expandButtonText?: {
    expand: string;
    collapse: string;
  };
  // 回调函数
  onSelectionChange?: (selectedPoints: KnowledgePoint[]) => void;
  onSave?: (selectedPoints: KnowledgePoint[]) => void;
  onKnowledgePointClick?: (knowledgePoint: KnowledgePoint) => void;
  // 样式自定义
  className?: string;
  // 是否显示保存按钮
  showSaveButton?: boolean;
  // 是否可以展开/收起
  collapsible?: boolean;
}

const KnowledgePointSelector: React.FC<KnowledgePointSelectorProps> = ({
  knowledgePoints = [],
  initialSelectedPoints = [],
  initialExpanded = false,
  title = "选择知识点",
  description = "匹配后的知识点信息，将作为后续AI智能助手的输入信息",
  saveButtonText = "选择知识点",
  expandButtonText = { expand: "展开", collapse: "收起" },
  onSelectionChange,
  onSave,
  onKnowledgePointClick,
  className = "",
  showSaveButton = true,
  collapsible = true
}) => {
  // 状态管理
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>(initialSelectedPoints);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleSeries, setVehicleSeries] = useState('');
  const [techCategory, setTechCategory] = useState('');
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(initialExpanded);

  // 获取车型选项
  const vehicleModels = [...new Set(knowledgePoints.map(kp => kp.vehicleModel))];
  
  // 获取车系选项（基于选中的车型）
  const vehicleSeries_options = [...new Set(
    knowledgePoints
      .filter(kp => !vehicleModel || kp.vehicleModel === vehicleModel)
      .map(kp => kp.vehicleSeries)
  )];
  
  // 获取技术分类选项（基于选中的车型和车系）
  const techCategories = [...new Set(
    knowledgePoints
      .filter(kp => {
        const matchVehicle = !vehicleModel || kp.vehicleModel === vehicleModel;
        const matchSeries = !vehicleSeries || kp.vehicleSeries === vehicleSeries;
        return matchVehicle && matchSeries;
      })
      .map(kp => kp.techCategory)
  )];
  
  // 过滤知识点
  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchVehicle = !vehicleModel || kp.vehicleModel === vehicleModel;
    const matchSeries = !vehicleSeries || kp.vehicleSeries === vehicleSeries;
    const matchCategory = !techCategory || kp.techCategory === techCategory;
    return matchVehicle && matchSeries && matchCategory;
  });

  // 知识点选择处理函数
  const handleKnowledgePointSelect = (pointId: string) => {
    setSelectedKnowledgePoints(prev => {
      const newSelection = prev.includes(pointId)
        ? prev.filter(id => id !== pointId)
        : [...prev, pointId];
      
      return newSelection;
    });
  };

  // 保存知识点处理函数
  const handleSaveKnowledgePoints = () => {
    const selectedPoints = knowledgePoints.filter(kp => selectedKnowledgePoints.includes(kp.id));
    
    if (onSave) {
      onSave(selectedPoints);
    }
    
    // 如果可收起，保存后自动收起
    if (collapsible) {
      setShowKnowledgeSelection(false);
    }
  };

  // 重置筛选条件
  const resetFilters = () => {
    setVehicleModel('');
    setTechCategory('');
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    const allFilteredIds = filteredKnowledgePoints.map(kp => kp.id);
    const isAllSelected = allFilteredIds.every(id => selectedKnowledgePoints.includes(id));
    
    if (isAllSelected) {
      // 取消选择当前筛选结果中的所有项
      setSelectedKnowledgePoints(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // 选择当前筛选结果中的所有项
      setSelectedKnowledgePoints(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // 监听选中项变化，触发回调
  useEffect(() => {
    if (onSelectionChange && selectedKnowledgePoints.length > 0) {
      const selectedPoints = knowledgePoints.filter(kp => selectedKnowledgePoints.includes(kp.id));
      onSelectionChange(selectedPoints);
    }
  }, [selectedKnowledgePoints]);

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          {collapsible && (
            <button
              onClick={() => setShowKnowledgeSelection(!showKnowledgeSelection)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span className="text-sm">
                {showKnowledgeSelection ? expandButtonText.collapse : expandButtonText.expand}
              </span>
            </button>
          )}
        </div>

        {(showKnowledgeSelection || !collapsible) && (
          <div className="space-y-4">
            {/* 筛选条件 */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">车型</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setVehicleModel('');
                      setVehicleSeries('');
                      setTechCategory('');
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      !vehicleModel 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    全部车型
                  </button>
                  {vehicleModels.map(model => (
                    <button
                      key={model}
                      onClick={() => {
                        setVehicleModel(model);
                        setVehicleSeries('');
                        setTechCategory('');
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        vehicleModel === model 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">车系</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setVehicleSeries('');
                      setTechCategory('');
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      !vehicleSeries 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                    }`}
                  >
                    全部车系
                  </button>
                  {vehicleSeries_options.map(series => (
                    <button
                      key={series}
                      onClick={() => {
                        setVehicleSeries(series);
                        setTechCategory('');
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        vehicleSeries === series 
                          ? 'bg-purple-500 text-white border-purple-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {series}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">技术分类</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTechCategory('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      !techCategory 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                    }`}
                  >
                    全部分类
                  </button>
                  {techCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setTechCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        techCategory === category 
                          ? 'bg-green-500 text-white border-green-500' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {filteredKnowledgePoints.every(kp => selectedKnowledgePoints.includes(kp.id)) ? '取消全选' : '全选'}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  重置筛选
                </button>
              </div>
              <div className="text-sm text-gray-500">
                已选择 {selectedKnowledgePoints.length} 个知识点
              </div>
            </div>

            {/* 知识点表格 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">选择</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">车型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">车系</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">技术分类</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">技术点</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">描述</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredKnowledgePoints.length > 0 ? (
                    filteredKnowledgePoints.map(kp => (
                      <tr key={kp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedKnowledgePoints.includes(kp.id)}
                            onChange={() => handleKnowledgePointSelect(kp.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onKnowledgePointClick?.(kp)}
                        >
                          {kp.vehicleModel}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onKnowledgePointClick?.(kp)}
                        >
                          {kp.vehicleSeries}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onKnowledgePointClick?.(kp)}
                        >
                          {kp.techCategory}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => onKnowledgePointClick?.(kp)}
                        >
                          {kp.techPoint}
                        </td>
                        <td 
                          className="px-4 py-3 text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                          onClick={() => onKnowledgePointClick?.(kp)}
                        >
                          {kp.description}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        暂无匹配的知识点
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 保存按钮 */}
            {showSaveButton && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveKnowledgePoints}
                  disabled={selectedKnowledgePoints.length === 0}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saveButtonText}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgePointSelector;