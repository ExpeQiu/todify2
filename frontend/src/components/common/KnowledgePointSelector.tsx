import React, { useState, useEffect } from 'react';
import { Package, FileText, Megaphone, Newspaper, CheckCircle } from 'lucide-react';

// 内容类型枚举
export type ContentType = 'knowledge_point' | 'tech_packaging' | 'tech_promotion' | 'tech_press';

// 内容类型配置
export const CONTENT_TYPES = {
  knowledge_point: {
    id: 'knowledge_point' as ContentType,
    label: '知识点',
    icon: Package,
    color: 'blue',
    description: '原始技术点信息'
  },
  tech_packaging: {
    id: 'tech_packaging' as ContentType,
    label: '技术包装',
    icon: FileText,
    color: 'green',
    description: '基于知识点的包装材料'
  },
  tech_promotion: {
    id: 'tech_promotion' as ContentType,
    label: '技术推广',
    icon: Megaphone,
    color: 'purple',
    description: '基于知识点的推广策略'
  },
  tech_press: {
    id: 'tech_press' as ContentType,
    label: '技术通稿',
    icon: Newspaper,
    color: 'orange',
    description: '基于知识点的通稿内容'
  }
};

// 知识点数据接口
export interface KnowledgePoint {
  id: string;
  vehicleModel: string;    // 车型
  vehicleSeries: string;   // 车系
  techCategory: string;    // 技术分类
  techPoint: string;       // 技术点
  description: string;     // 描述
}

// 选择项接口
export interface SelectionItem {
  knowledgePointId: string;
  contentType: ContentType;
  knowledgePoint: KnowledgePoint;
}

// 组件Props接口
export interface KnowledgePointSelectorProps {
  // 知识点数据
  knowledgePoints?: KnowledgePoint[];
  // 初始选中的项目
  initialSelectedItems?: SelectionItem[];
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
  // 允许选择的内容类型
  allowedContentTypes?: ContentType[];
  // 回调函数
  onSelectionChange?: (selectedItems: SelectionItem[]) => void;
  onSave?: (selectedItems: SelectionItem[]) => void;
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
  initialSelectedItems = [],
  initialExpanded = false,
  title = "关联技术点",
  description = "选择知识点及其关联内容类型，将作为后续AI智能助手的输入信息",
  saveButtonText = "确认选择",
  expandButtonText = { expand: "展开", collapse: "收起" },
  allowedContentTypes = ['knowledge_point', 'tech_packaging', 'tech_promotion', 'tech_press'],
  onSelectionChange,
  onSave,
  onKnowledgePointClick,
  className = "",
  showSaveButton = true,
  collapsible = true
}) => {
  // 状态管理
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>(initialSelectedItems);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleSeries, setVehicleSeries] = useState('');
  const [techCategory, setTechCategory] = useState('');
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>(allowedContentTypes);

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

  // 检查某个知识点的某种内容类型是否已选中
  const isSelected = (knowledgePointId: string, contentType: ContentType): boolean => {
    return selectedItems.some(item => 
      item.knowledgePointId === knowledgePointId && item.contentType === contentType
    );
  };

  // 获取某个知识点已选中的内容类型数量
  const getSelectedContentTypesCount = (knowledgePointId: string): number => {
    return selectedItems.filter(item => item.knowledgePointId === knowledgePointId).length;
  };

  // 处理内容类型选择（红框2的选择）
  const handleContentTypeToggle = (contentType: ContentType) => {
    setSelectedContentTypes(prev => {
      if (prev.includes(contentType)) {
        // 取消选择该类型，同时移除所有相关的已选项
        const newTypes = prev.filter(type => type !== contentType);
        setSelectedItems(prevItems => 
          prevItems.filter(item => item.contentType !== contentType)
        );
        return newTypes;
      } else {
        // 添加该类型
        return [...prev, contentType];
      }
    });
  };

  // 处理内容类型选择
  const handleContentTypeSelect = (knowledgePoint: KnowledgePoint, contentType: ContentType) => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.knowledgePointId === knowledgePoint.id && item.contentType === contentType
      );

      if (existingIndex >= 0) {
        // 取消选择
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // 添加选择
        return [...prev, {
          knowledgePointId: knowledgePoint.id,
          contentType,
          knowledgePoint
        }];
      }
    });
  };

  // 保存选择处理函数
  const handleSaveSelection = () => {
    if (onSave) {
      onSave(selectedItems);
    }
    
    // 如果可收起，保存后自动收起
    if (collapsible) {
      setShowKnowledgeSelection(false);
    }
  };

  // 重置筛选条件
  const resetFilters = () => {
    setVehicleModel('');
    setVehicleSeries('');
    setTechCategory('');
  };

  // 清空所有选择
  const clearAllSelections = () => {
    setSelectedItems([]);
    setSelectedContentTypes(allowedContentTypes); // 重置为默认的所有类型
  };

  // 获取内容类型的样式类
  const getContentTypeStyle = (contentType: ContentType, selected: boolean = false) => {
    const config = CONTENT_TYPES[contentType];
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer";
    
    if (selected) {
      switch (config.color) {
        case 'blue': return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-300`;
        case 'green': return `${baseClasses} bg-green-100 text-green-800 border border-green-300`;
        case 'purple': return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-300`;
        case 'orange': return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-300`;
        default: return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-300`;
      }
    } else {
      return `${baseClasses} bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100`;
    }
  };

  // 监听选中项变化，触发回调
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  return (
    <div className={`h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <div className="flex-shrink-0 p-6 border-b border-gray-100">
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
      </div>

      {(showKnowledgeSelection || !collapsible) && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-6 space-y-4">
            {/* 内容类型说明 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">可选择的内容类型：</h4>
              <div className="grid grid-cols-2 gap-3">
                {allowedContentTypes.map(contentType => {
                  const config = CONTENT_TYPES[contentType];
                  const Icon = config.icon;
                  const isSelected = selectedContentTypes.includes(contentType);
                  return (
                    <div 
                      key={contentType} 
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-100 border-blue-300 text-blue-800' 
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleContentTypeToggle(contentType)}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : `text-${config.color}-500`}`} />
                      <div>
                        <div className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {config.label}
                          {isSelected && <span className="ml-1">✓</span>}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                          {config.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  重置筛选
                </button>
                <button
                  onClick={clearAllSelections}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  清空选择
                </button>
              </div>
              <div className="text-sm text-gray-500">
                已选择 {selectedItems.length} 项内容
              </div>
            </div>

          </div>

          {/* 知识点列表 - 可滚动区域 */}
          <div className="flex-1 overflow-auto p-6 pt-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">车型</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">车系</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">技术分类</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">技术点</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">描述</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">选择内容类型</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredKnowledgePoints.length > 0 ? (
                    filteredKnowledgePoints.map(kp => (
                      <tr key={kp.id} className="hover:bg-gray-50">
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
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {selectedContentTypes.map(contentType => {
                              const config = CONTENT_TYPES[contentType];
                              const Icon = config.icon;
                              const selected = isSelected(kp.id, contentType);
                              
                              return (
                                <div
                                  key={contentType}
                                  onClick={() => handleContentTypeSelect(kp, contentType)}
                                  className={getContentTypeStyle(contentType, selected)}
                                  title={`${selected ? '取消选择' : '选择'} ${config.label}`}
                                >
                                  <Icon className="w-3 h-3" />
                                  <span>{config.label}</span>
                                  {selected && <CheckCircle className="w-3 h-3" />}
                                </div>
                              );
                            })}
                          </div>
                          {getSelectedContentTypesCount(kp.id) > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              已选择 {getSelectedContentTypesCount(kp.id)} 种内容类型
                            </div>
                          )}
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
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveSelection}
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saveButtonText} ({selectedItems.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointSelector;