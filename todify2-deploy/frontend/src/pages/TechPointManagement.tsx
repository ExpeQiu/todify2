import React, { useState, useEffect } from "react";
import {
  TechPoint,
  TechPointFormData,
  TechPointSearchParams,
} from "../types/techPoint";
import { useTechPoints } from "../hooks/useTechPoints";
import TechPointStats from "../components/techPoint/TechPointStats";
import TechPointList from "../components/techPoint/TechPointList";
import TechPointForm from "../components/techPoint/TechPointForm";

const TechPointManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTechPoint, setEditingTechPoint] = useState<
    TechPoint | undefined
  >();
  const [searchParams, setSearchParams] = useState<TechPointSearchParams>({});

  const {
    techPoints,
    loading,
    error,
    pagination,
    fetchTechPoints,
    createTechPoint,
    updateTechPoint,
    deleteTechPoint,
    searchTechPoints,
  } = useTechPoints();

  // 初始加载数据
  useEffect(() => {
    fetchTechPoints();
  }, [fetchTechPoints]);

  const handleCreateNew = () => {
    setEditingTechPoint(undefined);
    setShowForm(true);
  };

  const handleEdit = (techPoint: TechPoint) => {
    setEditingTechPoint(techPoint);
    setShowForm(true);
  };

  const handleFormSubmit = async (
    formData: TechPointFormData,
  ): Promise<boolean> => {
    try {
      if (editingTechPoint) {
        await updateTechPoint(editingTechPoint.id, formData);
      } else {
        await createTechPoint(formData);
      }

      return true;
    } catch (error) {
      console.error("保存技术点失败:", error);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTechPoint(id);
    } catch (error) {
      console.error("删除技术点失败:", error);
    }
  };

  const handleSearch = async (params: TechPointSearchParams) => {
    setSearchParams(params);

    // 如果搜索参数为空，则获取全部数据
    const hasSearchParams = Object.values(params).some(
      (value) => value !== undefined && value !== "" && value !== null,
    );

    if (hasSearchParams && params.keyword) {
      await searchTechPoints(params.keyword, params);
    } else {
      await fetchTechPoints();
    }
  };

  const handlePageChange = async (page: number) => {
    // 根据当前是否有搜索参数决定调用哪个方法
    if (searchParams.keyword) {
      await searchTechPoints(searchParams.keyword, { ...searchParams, page });
    } else {
      await fetchTechPoints({ page });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTechPoint(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">技术点管理</h1>
              <p className="mt-2 text-gray-600">
                管理和维护技术点信息，包括创建、编辑、删除和搜索功能
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              创建技术点
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">操作失败</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="mb-8">
          <TechPointStats />
        </div>

        {/* 技术点列表 */}
        <TechPointList
          techPoints={techPoints}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSearch={handleSearch}
          totalCount={pagination.total}
          currentPage={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />

        {/* 表单对话框 */}
        {showForm && (
          <TechPointForm
            techPoint={editingTechPoint}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default TechPointManagement;
