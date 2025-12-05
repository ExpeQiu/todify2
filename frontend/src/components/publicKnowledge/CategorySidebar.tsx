import React, { useState } from 'react';
import {
  CategoryTreeNode,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '../../types/publicKnowledge';
import { Folder, FolderOpen, Plus, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface CategorySidebarProps {
  categories: CategoryTreeNode[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onCreateCategory: (data: CreateCategoryDTO) => void;
  onUpdateCategory: (id: number, data: UpdateCategoryDTO) => void;
  onDeleteCategory: (id: number) => void;
  editingCategory: CategoryTreeNode | null;
  setEditingCategory: (category: CategoryTreeNode | null) => void;
  showCategoryForm: boolean;
  setShowCategoryForm: (show: boolean) => void;
  loading: boolean;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  editingCategory,
  setEditingCategory,
  showCategoryForm,
  setShowCategoryForm,
  loading,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [parentIdForNew, setParentIdForNew] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      return;
    }
    onCreateCategory({
      name: newCategoryName.trim(),
      parent_id: parentIdForNew,
    });
    setNewCategoryName('');
    setParentIdForNew(null);
    setShowCategoryForm(false);
  };

  const handleUpdateCategory = (id: number) => {
    if (!editingName.trim()) {
      setEditingCategory(null);
      return;
    }
    onUpdateCategory(id, { name: editingName.trim() });
    setEditingCategory(null);
    setEditingName('');
  };

  const renderCategory = (category: CategoryTreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const isEditing = editingCategory?.id === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center group px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {/* 展开/收起按钮 */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5 mr-1" />
          )}

          {/* 文件夹图标 */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
          )}

          {/* 分类名称 */}
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleUpdateCategory(category.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateCategory(category.id);
                } else if (e.key === 'Escape') {
                  setEditingCategory(null);
                  setEditingName('');
                }
              }}
              className="flex-1 px-2 py-0.5 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 text-sm truncate"
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </span>
          )}

          {/* 操作按钮 */}
          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(category);
                  setEditingName(category.name);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="重命名"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentIdForNew(category.id);
                  setShowCategoryForm(true);
                }}
                className="p-1 hover:bg-gray-200 rounded"
                title="添加子分类"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(category.id);
                }}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="删除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 子分类 */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">分类</h2>
        <button
          onClick={() => {
            setParentIdForNew(null);
            setShowCategoryForm(true);
          }}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
          title="添加分类"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* 新建分类表单 */}
      {showCategoryForm && (
        <form
          onSubmit={handleCreateCategory}
          className="mb-4 p-2 bg-gray-50 rounded border border-gray-200"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="分类名称"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              创建
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCategoryForm(false);
                setNewCategoryName('');
                setParentIdForNew(null);
              }}
              className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 全部文件 */}
      <div
        className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 mb-2 ${
          selectedCategoryId === null ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
        }`}
        onClick={() => onSelectCategory(null)}
      >
        <Folder className="w-4 h-4 mr-2" />
        <span className="text-sm">全部文件</span>
      </div>

      {/* 分类列表 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">暂无分类</div>
      ) : (
        <div className="space-y-1">
          {categories.map((category) => renderCategory(category))}
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
