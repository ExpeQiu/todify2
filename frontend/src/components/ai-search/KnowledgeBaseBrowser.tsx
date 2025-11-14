import React, { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadTechPoints();
  }, []);

  const loadTechPoints = async () => {
    setLoading(true);
    try {
      const response = await techPointService.getTechPoints({
        page: 1,
        pageSize: 100,
      });
      if (response.success && response.data) {
        setTechPoints(response.data.data || []);
      }
    } catch (error) {
      console.error("加载技术点失败:", error);
    } finally {
      setLoading(false);
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
                    {tp.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {tp.category.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            已选择 {selectedItems.size} 项
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

