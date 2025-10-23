import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  TechPoint,
  TechType,
  TechPriority,
  TechStatus,
  TechPointSearchParams,
} from "../../types/techPoint";
import { Brand } from "../../types/brand";
import { CarModel } from "../../types/carModel";
import { CarSeries } from "../../types/carSeries";
import { brandService } from "../../services/brandService";
import { carModelService } from "../../services/carModelService";
import { carSeriesService } from "../../services/carSeriesService";
import TechPointDetail from "./TechPointDetail";

interface TechPointListProps {
  techPoints: TechPoint[];
  loading: boolean;
  onEdit: (techPoint: TechPoint) => void;
  onDelete: (id: number) => void;
  onSearch: (params: TechPointSearchParams) => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const TechPointList: React.FC<TechPointListProps> = ({
  techPoints,
  loading,
  onEdit,
  onDelete,
  onSearch,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}) => {
  const [searchParams, setSearchParams] = useState<TechPointSearchParams>({
    keyword: "",
    category_id: undefined,
    type: undefined,
    priority: undefined,
    status: undefined,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [selectedTechPoint, setSelectedTechPoint] = useState<TechPoint | null>(
    null,
  );

  // 三层级数据状态
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>();
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>();
  const [selectedSeriesId, setSelectedSeriesId] = useState<
    number | undefined
  >();

  // 加载状态
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // 获取品牌列表
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await brandService.getAll();
      setBrands(response.data || []);
    } catch (error) {
      console.error("获取品牌列表失败:", error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // 根据品牌获取车型列表
  const fetchCarModelsByBrand = async (brandId: number) => {
    setModelsLoading(true);
    try {
      const response = await carModelService.getByBrand(brandId);
      setCarModels(response.data || []);
    } catch (error) {
      console.error("获取车型列表失败:", error);
      setCarModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  // 根据车型获取车系列表
  const fetchCarSeriesByModel = async (modelId: number) => {
    setSeriesLoading(true);
    try {
      const response = await carSeriesService.getByModel(modelId);
      setCarSeries(response.data || []);
    } catch (error) {
      console.error("获取车系列表失败:", error);
      setCarSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  };

  // 初始化加载品牌
  useEffect(() => {
    fetchBrands();
  }, []);

  // 品牌变化时加载车型
  useEffect(() => {
    if (selectedBrandId) {
      fetchCarModelsByBrand(selectedBrandId);
      setSelectedModelId(undefined);
      setSelectedSeriesId(undefined);
      setCarSeries([]);
    } else {
      setCarModels([]);
      setCarSeries([]);
      setSelectedModelId(undefined);
      setSelectedSeriesId(undefined);
    }
  }, [selectedBrandId]);

  // 车型变化时加载车系
  useEffect(() => {
    if (selectedModelId) {
      fetchCarSeriesByModel(selectedModelId);
      setSelectedSeriesId(undefined);
    } else {
      setCarSeries([]);
      setSelectedSeriesId(undefined);
    }
  }, [selectedModelId]);

  const handleSearch = () => {
    onSearch(searchParams);
  };

  const handleReset = () => {
    const resetParams: TechPointSearchParams = {
      keyword: "",
      category_id: undefined,
      type: undefined,
      priority: undefined,
      status: undefined,
    };
    setSearchParams(resetParams);
    setSelectedBrandId(undefined);
    setSelectedModelId(undefined);
    setSelectedSeriesId(undefined);
    onSearch(resetParams);
  };

  const handleDelete = (id: number) => {
    onDelete(id);
    setShowDeleteConfirm(null);
  };

  const getTypeLabel = (type: TechType): string => {
    const typeLabels = {
      [TechType.FEATURE]: "功能特性",
      [TechType.IMPROVEMENT]: "改进优化",
      [TechType.INNOVATION]: "创新技术",
      [TechType.TECHNOLOGY]: "核心技术",
    };
    return typeLabels[type];
  };

  const getPriorityLabel = (priority: TechPriority): string => {
    const priorityLabels = {
      [TechPriority.LOW]: "低",
      [TechPriority.MEDIUM]: "中",
      [TechPriority.HIGH]: "高",
    };
    return priorityLabels[priority];
  };

  const getStatusLabel = (status: TechStatus): string => {
    const statusLabels = {
      [TechStatus.ACTIVE]: "活跃",
      [TechStatus.INACTIVE]: "非活跃",
      [TechStatus.DRAFT]: "草稿",
      [TechStatus.ARCHIVED]: "已归档",
    };
    return statusLabels[status];
  };

  const getPriorityColor = (priority: TechPriority): string => {
    const colors = {
      [TechPriority.LOW]: "bg-green-100 text-green-800",
      [TechPriority.MEDIUM]: "bg-yellow-100 text-yellow-800",
      [TechPriority.HIGH]: "bg-red-100 text-red-800",
    };
    return colors[priority];
  };

  const getStatusColor = (status: TechStatus): string => {
    const colors = {
      [TechStatus.ACTIVE]: "bg-green-100 text-green-800",
      [TechStatus.INACTIVE]: "bg-gray-100 text-gray-800",
      [TechStatus.DRAFT]: "bg-blue-100 text-blue-800",
      [TechStatus.ARCHIVED]: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 搜索和筛选区域 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col space-y-4">
          {/* 搜索框 */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

              <input
                type="text"
                placeholder="搜索技术点名称或描述..."
                value={searchParams.keyword || ""}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, keyword: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              搜索
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              重置
            </button>
          </div>

          {/* 筛选区域 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {/* 品牌筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  品牌
                </label>
                <select
                  value={selectedBrandId || ""}
                  onChange={(e) =>
                    setSelectedBrandId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={brandsLoading}
                >
                  <option value="">全部品牌</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 车型筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  车型
                </label>
                <select
                  value={selectedModelId || ""}
                  onChange={(e) =>
                    setSelectedModelId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedBrandId || modelsLoading}
                >
                  <option value="">全部车型</option>
                  {carModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 车系筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  车系
                </label>
                <select
                  value={selectedSeriesId || ""}
                  onChange={(e) =>
                    setSelectedSeriesId(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedModelId || seriesLoading}
                >
                  <option value="">全部车系</option>
                  {carSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 类型筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={searchParams.type || ""}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      type: (e.target.value as TechType) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部类型</option>
                  <option value={TechType.FEATURE}>功能特性</option>
                  <option value={TechType.IMPROVEMENT}>改进优化</option>
                  <option value={TechType.INNOVATION}>创新技术</option>
                  <option value={TechType.TECHNOLOGY}>核心技术</option>
                </select>
              </div>

              {/* 优先级筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  value={searchParams.priority || ""}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      priority: (e.target.value as TechPriority) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部优先级</option>
                  <option value={TechPriority.LOW}>低</option>
                  <option value={TechPriority.MEDIUM}>中</option>
                  <option value={TechPriority.HIGH}>高</option>
                </select>
              </div>

              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={searchParams.status || ""}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      status: (e.target.value as TechStatus) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部状态</option>
                  <option value={TechStatus.ACTIVE}>活跃</option>
                  <option value={TechStatus.INACTIVE}>非活跃</option>
                  <option value={TechStatus.DRAFT}>草稿</option>
                  <option value={TechStatus.ARCHIVED}>已归档</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 技术点列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : techPoints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无技术点数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    技术点名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {techPoints.map((techPoint) => (
                  <tr key={techPoint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {techPoint.name}
                        </div>
                        {techPoint.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {techPoint.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(techPoint.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(techPoint.priority)}`}
                      >
                        {getPriorityLabel(techPoint.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(techPoint.status)}`}
                      >
                        {getStatusLabel(techPoint.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(techPoint.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedTechPoint(techPoint)}
                          className="text-blue-600 hover:text-blue-900"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(techPoint)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(techPoint.id)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalCount > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  到{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{" "}
                  条，共 <span className="font-medium">{totalCount}</span>{" "}
                  条记录
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  您确定要删除这个技术点吗？此操作不可撤销。
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 技术点详情模态框 */}
      {selectedTechPoint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">技术点详情</h3>
              <button
                onClick={() => setSelectedTechPoint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">关闭</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <TechPointDetail
              techPoint={selectedTechPoint}
              onClose={() => setSelectedTechPoint(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TechPointList;
