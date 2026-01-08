import React, { useState, useMemo } from "react";
import { Plus, FileText, X, FileCode, Brain, Package, Target, Newspaper, MessageSquare } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddSourceModal from "./AddSourceModal";
import AddTextModal from "./AddTextModal";
import EditSourceModal from "./EditSourceModal";
import KnowledgeBaseBrowser from "./KnowledgeBaseBrowser";
import { SourceCategory } from "../../services/sourceService";
import { Conversation } from "../../types/aiSearch";

export interface Source {
  id: string;
  title: string;
  type: "knowledge_base" | "external";
  url?: string;
  description?: string;
  category?: SourceCategory;
}

interface SourceSidebarProps {
  sources?: Source[];
  selectedSources?: string[];
  onSourcesChange?: (sources: Source[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  pageType?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
  projectId?: number;  // 关联的项目ID（可选）
  currentConversation?: Conversation | null;
  onSummarizeAndNavigate?: (targetPageType: 'tech-strategy' | 'tech-article') => Promise<string | null>;
  onClose?: () => void; // 关闭边栏的回调
}

// 获取来源类别的显示信息
const getCategoryInfo = (category?: SourceCategory) => {
  switch (category) {
    case 'technical-translation':
      return {
        label: '技术转译',
        icon: FileCode,
        color: 'bg-blue-100 text-blue-700',
        iconColor: 'text-blue-600',
      };
    case 'ai-qa-summary':
      return {
        label: 'AI问答总结',
        icon: Brain,
        color: 'bg-purple-100 text-purple-700',
        iconColor: 'text-purple-600',
      };
    case 'tech-package-qa':
      return {
        label: '技术包装问答',
        icon: Package,
        color: 'bg-orange-100 text-orange-700',
        iconColor: 'text-orange-600',
      };
    case 'tech-strategy-qa':
      return {
        label: '技术策略问答',
        icon: Target,
        color: 'bg-green-100 text-green-700',
        iconColor: 'text-green-600',
      };
    case 'tech-article-qa':
      return {
        label: '技术通稿问答',
        icon: Newspaper,
        color: 'bg-indigo-100 text-indigo-700',
        iconColor: 'text-indigo-600',
      };
    case 'external':
    default:
      return {
        label: '外部来源',
        icon: FileText,
        color: 'bg-gray-100 text-gray-700',
        iconColor: 'text-gray-600',
      };
  }
};

const SourceSidebar: React.FC<SourceSidebarProps> = ({
  sources = [],
  selectedSources = [],
  onSourcesChange,
  onSelectionChange,
  pageType,
  projectId,
  currentConversation,
  onSummarizeAndNavigate,
  onClose,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showKnowledgeBrowser, setShowKnowledgeBrowser] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [isSelectAll, setIsSelectAll] = useState(false);

  const handleAddSource = () => {
    setShowTextModal(true);
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

  const handleSourceClick = (source: Source) => {
    setEditingSource(source);
  };

  const handleUpdateSource = (updatedSource: Source) => {
    if (onSourcesChange) {
      const newSources = sources.map((s) =>
        s.id === updatedSource.id ? updatedSource : s
      );
      onSourcesChange(newSources);
    }
    setEditingSource(null);
  };

  const handleDeleteSource = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发编辑弹窗
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
      category: newSource.category || 'external', // 确保有 category
    };
    if (onSourcesChange) {
      onSourcesChange([...sources, source]);
    }
    setShowAddModal(false);
  };

  const handleAddTextSource = (newSource: Omit<Source, "id">) => {
    const source: Source = {
      ...newSource,
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // 确保ID唯一
      category: newSource.category || 'external', // 确保有 category
    };
    if (onSourcesChange) {
      onSourcesChange([...sources, source]);
    }
    // 默认选中新添加的来源
    if (onSelectionChange) {
      onSelectionChange([...selectedSources, source.id]);
    }
    setShowTextModal(false);
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

  const handleNavigate = (path: string) => {
    const projectId = searchParams.get('projectId');
    const newConversation = searchParams.get('newConversation');
    const params = new URLSearchParams();
    
    if (projectId) {
      params.append('projectId', projectId);
    }
    if (newConversation) {
      params.append('newConversation', newConversation);
    }
    
    const url = params.toString() ? `${path}?${params.toString()}` : path;
    navigate(url);
  };

  // 按分组组织来源
  const groupedSources = useMemo(() => {
    // AI共创信息：对话总结相关的 category
    const aiCreatedSources = sources.filter(s => 
      s.category === 'ai-qa-summary' || 
      s.category === 'tech-package-qa' || 
      s.category === 'tech-strategy-qa' || 
      s.category === 'tech-article-qa'
    );

    // 技术资源：技术转译
    const techResources = sources.filter(s => 
      s.category === 'technical-translation'
    );

    // 外部来源：其他所有来源
    const externalSources = sources.filter(s => 
      s.category !== 'ai-qa-summary' && 
      s.category !== 'tech-package-qa' && 
      s.category !== 'tech-strategy-qa' && 
      s.category !== 'tech-article-qa' &&
      s.category !== 'technical-translation'
    );

    // 调试日志
    console.log('[SourceSidebar] 分组统计:', {
      total: sources.length,
      aiCreated: aiCreatedSources.length,
      techResources: techResources.length,
      external: externalSources.length,
      categories: sources.map(s => ({ id: s.id, title: s.title, category: s.category }))
    });

    return {
      aiCreated: aiCreatedSources,
      techResources: techResources,
      external: externalSources,
    };
  }, [sources]);

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* 标题和操作按钮 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">来源</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddSource}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            添加外部信息
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

      {/* 来源列表 - 分组显示 */}
      <div className="flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            暂无来源，点击"添加信息"添加来源
          </div>
        ) : (
          <div className="flex flex-col">
            {/* AI共创信息分组 */}
            {groupedSources.aiCreated.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      AI共创信息
                      {groupedSources.aiCreated.length > 0 && (
                        <span className="text-gray-500 font-normal ml-1">
                          ({groupedSources.aiCreated.length})
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {groupedSources.aiCreated.map((source) => {
                    const categoryInfo = getCategoryInfo(source.category);
                    const IconComponent = categoryInfo.icon;
                    
                    return (
                      <div
                        key={source.id}
                        onClick={() => handleSourceClick(source)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.id)}
                          onChange={() => handleSourceToggle(source.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                        />
                        <IconComponent className={`w-5 h-5 ${categoryInfo.iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDeleteSource(source.id, e)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="删除"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 技术资源分组 - 只要有 projectId 就显示 */}
            {projectId && (
              <div className="border-b border-gray-200">
                <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      技术资源
                      {groupedSources.techResources.length > 0 && (
                        <span className="text-gray-500 font-normal ml-1">
                          ({groupedSources.techResources.length})
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
                {groupedSources.techResources.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {groupedSources.techResources.map((source) => {
                      const categoryInfo = getCategoryInfo(source.category);
                      const IconComponent = categoryInfo.icon;
                      
                      return (
                        <div
                          key={source.id}
                          onClick={() => handleSourceClick(source)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSources.includes(source.id)}
                            onChange={() => handleSourceToggle(source.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                          />
                          <IconComponent className={`w-5 h-5 ${categoryInfo.iconColor} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {source.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
                                {categoryInfo.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleDeleteSource(source.id, e)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="删除"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-gray-500 py-2 text-center">暂无技术资源</div>
                  </div>
                )}
              </div>
            )}

            {/* 外部来源分组 */}
            {groupedSources.external.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      外部来源
                      {groupedSources.external.length > 0 && (
                        <span className="text-gray-500 font-normal ml-1">
                          ({groupedSources.external.length})
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {groupedSources.external.map((source) => {
                    const categoryInfo = getCategoryInfo(source.category);
                    const IconComponent = categoryInfo.icon;
                    
                    return (
                      <div
                        key={source.id}
                        onClick={() => handleSourceClick(source)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.id)}
                          onChange={() => handleSourceToggle(source.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                        />
                        <IconComponent className={`w-5 h-5 ${categoryInfo.iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDeleteSource(source.id, e)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="删除"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {pageType === 'tech-strategy' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleNavigate('/tech-package')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              技术包装
            </button>
            <button
              onClick={() => handleNavigate('/tech-article')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              技术通稿
            </button>
          </div>
        </div>
      )}
      {pageType === 'tech-article' && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleNavigate('/tech-package')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              技术包装
            </button>
            <button
              onClick={() => handleNavigate('/tech-strategy')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              技术策略
            </button>
          </div>
        </div>
      )}

      {/* 添加文本来源弹窗 */}
      {showTextModal && (
        <AddTextModal
          onClose={() => setShowTextModal(false)}
          onAddTextSource={handleAddTextSource}
          pageType={pageType}
        />
      )}

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

      {/* 编辑来源弹窗 */}
      {editingSource && (
        <EditSourceModal
          source={editingSource}
          onClose={() => setEditingSource(null)}
          onUpdate={handleUpdateSource}
        />
      )}
    </div>
  );
};

export default SourceSidebar;

