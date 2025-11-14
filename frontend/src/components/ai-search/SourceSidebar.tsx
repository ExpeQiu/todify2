import React, { useState } from "react";
import { Plus, Search, FileText, X, Edit } from "lucide-react";
import AddSourceModal from "./AddSourceModal";
import KnowledgeBaseBrowser from "./KnowledgeBaseBrowser";

export interface Source {
  id: string;
  title: string;
  type: "knowledge_base" | "external";
  url?: string;
  description?: string;
}

interface SourceSidebarProps {
  sources?: Source[];
  selectedSources?: string[];
  onSourcesChange?: (sources: Source[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  pageType?: 'tech-package' | 'press-release';
}

const SourceSidebar: React.FC<SourceSidebarProps> = ({
  sources = [],
  selectedSources = [],
  onSourcesChange,
  onSelectionChange,
  pageType,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showKnowledgeBrowser, setShowKnowledgeBrowser] = useState(false);
  const [isSelectAll, setIsSelectAll] = useState(false);

  const handleAddSource = () => {
    setShowAddModal(true);
  };

  const handleExplore = () => {
    setShowKnowledgeBrowser(true);
  };

  const handleSelectAll = () => {
    const newSelectAll = !isSelectAll;
    setIsSelectAll(newSelectAll);
    if (onSelectionChange) {
      if (newSelectAll) {
        onSelectionChange(sources.map((s) => s.id));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    if (onSelectionChange) {
      const newSelection = selectedSources.includes(sourceId)
        ? selectedSources.filter((id) => id !== sourceId)
        : [...selectedSources, sourceId];
      onSelectionChange(newSelection);
      setIsSelectAll(newSelection.length === sources.length && sources.length > 0);
    }
  };

  const handleDeleteSource = (sourceId: string) => {
    if (onSourcesChange) {
      const newSources = sources.filter((s) => s.id !== sourceId);
      onSourcesChange(newSources);
      if (onSelectionChange) {
        onSelectionChange(
          selectedSources.filter((id) => id !== sourceId)
        );
      }
    }
  };

  const handleAddExternalSource = (newSource: Omit<Source, "id">) => {
    const source: Source = {
      ...newSource,
      id: `external_${Date.now()}`,
    };
    if (onSourcesChange) {
      onSourcesChange([...sources, source]);
    }
    setShowAddModal(false);
  };

  const handleSelectFromKnowledgeBase = (selectedItems: any[]) => {
    const newSources: Source[] = selectedItems.map((item) => ({
      id: `kb_${item.id}`,
      title: item.title || item.techPoint || "未命名知识点",
      type: "knowledge_base" as const,
      description: item.description,
    }));
    if (onSourcesChange) {
      onSourcesChange([...sources, ...newSources]);
    }
    setShowKnowledgeBrowser(false);
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* 标题和操作按钮 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">来源</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddSource}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加文件
          </button>
          <button
            onClick={handleExplore}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            知识库选择
          </button>
        </div>
      </div>

      {/* 选择所有来源 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelectAll}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">选择所有来源</span>
        </label>
      </div>

      {/* 来源列表 */}
      <div className="flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            暂无来源，点击"添加文件"或"知识库选择"添加来源
          </div>
        ) : (
          <div className="p-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                />
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {source.title}
                  </p>
                  {source.type === "external" && (
                    <span className="text-xs text-gray-500">
                      外部来源
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="删除"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加来源弹窗 */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onAddExternalSource={handleAddExternalSource}
          pageType={pageType}
        />
      )}

      {/* 知识库浏览器 */}
      {showKnowledgeBrowser && (
        <KnowledgeBaseBrowser
          onClose={() => setShowKnowledgeBrowser(false)}
          onSelect={handleSelectFromKnowledgeBase}
        />
      )}
    </div>
  );
};

export default SourceSidebar;

