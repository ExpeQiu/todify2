import React, { useState, useEffect } from "react";
import { X, Search, Check, RefreshCw } from "lucide-react";
import { techPointService } from "../../services/techPointService";
import { TechPoint } from "../../types/techPoint";

interface KnowledgeBaseBrowserProps {
  onClose: () => void;
  onSelect: (items: any[]) => void;
}

const KnowledgeBaseBrowser: React.FC<KnowledgeBaseBrowserProps> = ({
  onClose,
  onSelect,
}) => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [techPointsWithAssociations, setTechPointsWithAssociations] = useState<Map<number, {
    category?: { id: number; name: string };
    carModels?: Array<{ id: number; name: string; brand?: { name: string } }>;
  }>>(new Map());

  useEffect(() => {
    loadTechPoints();
  }, []);

  const loadTechPoints = async () => {
    setLoading(true);
    try {
      // 从 todify3 数据库加载技术点
      const response = await techPointService.getTechPoints({
        page: 1,
        pageSize: 100,
      });
      if (response.success && response.data) {
        const points = response.data.data || [];
        setTechPoints(points);
        
        // 加载关联信息（技术领域和车型）
        await loadAssociations(points);
      }
    } catch (error) {
      console.error("加载技术点失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssociations = async (points: TechPoint[]) => {
    const associations = new Map();
    
    // 批量加载关联信息
    for (const point of points) {
      try {
        // 加载车型关联
        const carModelsResponse = await techPointService.getTechPointAssociatedCarModels(point.id);
        const carModels = carModelsResponse.success && carModelsResponse.data ? carModelsResponse.data : [];
        
        associations.set(point.id, {
          category: point.category,
          carModels: carModels.map((cm: any) => ({
            id: cm.id,
            name: cm.name,
            brand: cm.brand,
          })),
        });
      } catch (error) {
        console.error(`加载技术点 ${point.id} 关联信息失败:`, error);
        associations.set(point.id, {
          category: point.category,
          carModels: [],
        });
      }
    }
    
    setTechPointsWithAssociations(associations);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await techPointService.syncFromTechHub();
      if (response.success && response.data) {
        // 同步成功后重新加载数据
        await loadTechPoints();
        const stats = response.data;
        alert(`同步成功！总计 ${stats.total} 条，新增 ${stats.created} 条，更新 ${stats.updated} 条，错误 ${stats.errors} 条`);
      } else {
        alert(`同步失败：${response.error || '未知错误'}`);
      }
    } catch (error) {
      console.error("同步失败:", error);
      alert("同步失败，请稍后重试");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirm = () => {
    const selected = techPoints.filter((tp) => selectedItems.has(tp.id));
    onSelect(
      selected.map((tp) => ({
        id: tp.id,
        title: tp.name,
        techPoint: tp.name,
        description: tp.description || "",
      }))
    );
    onClose();
  };

  const filteredTechPoints = techPoints.filter((tp) =>
    tp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tp.description && tp.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">选择知识库</h2>
            {selectedItems.size > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                已选择 {selectedItems.size} 项
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索技术点..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 内容列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredTechPoints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "未找到匹配的技术点" : "暂无技术点"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTechPoints.map((tp) => (
                <div
                  key={tp.id}
                  onClick={() => handleToggleSelect(tp.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedItems.has(tp.id)
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedItems.has(tp.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedItems.has(tp.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {tp.name}
                    </h3>
                    {tp.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {tp.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(() => {
                        const associations = techPointsWithAssociations.get(tp.id);
                        const category = associations?.category || tp.category;
                        const carModels = associations?.carModels || [];
                        
                        return (
                          <>
                            {category && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                技术领域: {category.name}
                              </span>
                            )}
                            {carModels.length > 0 && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                车型: {carModels.slice(0, 3).map((cm) => 
                                  cm.brand?.name ? `${cm.brand.name} ${cm.name}` : cm.name
                                ).join(', ')}
                                {carModels.length > 3 && ` 等${carModels.length}款`}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '同步中...' : '知识库更新'}
            </button>
            <div className="text-sm text-gray-600">
              已选择 {selectedItems.size} 项
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseBrowser;

