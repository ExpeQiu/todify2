import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Filter, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CarSeries,
  CarSeriesStatus,
  CarSeriesSearchParams
} from '../../types/carSeries';
import { Brand } from '../../types/brand';
import { CarModel } from '../../types/carModel';
import { carSeriesService } from '../../services/carSeriesService';
import { brandService } from '../../services/brandService';
import { carModelService } from '../../services/carModelService';

interface CarSeriesListProps {
  onEdit: (carSeries: CarSeries) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const CarSeriesList: React.FC<CarSeriesListProps> = ({
  onEdit,
  onDelete,
  onCreate
}) => {
  const navigate = useNavigate();
  // 数据状态
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 搜索和过滤状态
  const [keyword, setKeyword] = useState('');
  const [searchParams, setSearchParams] = useState<CarSeriesSearchParams>({
    page: 1,
    pageSize: 20,
    orderBy: 'created_at',
    orderDirection: 'DESC'
  });

  // UI状态
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [selectedCarSeries, setSelectedCarSeries] = useState<CarSeries | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(0);
  const [selectedModelId, setSelectedModelId] = useState<number>(0);

  // 分页状态
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 获取车系列表
  const fetchCarSeries = async (params?: Partial<CarSeriesSearchParams>) => {
    setLoading(true);
    setError('');
    try {
      const searchParams: CarSeriesSearchParams = {
        page: currentPage,
        pageSize: 20,
        orderBy: 'created_at',
        orderDirection: 'DESC',
        includeModel: true,
        ...params
      };

      if (keyword.trim()) {
        searchParams.keyword = keyword.trim();
      }

      if (selectedBrandId > 0) {
        searchParams.brandId = selectedBrandId;
      }

      if (selectedModelId > 0) {
        searchParams.modelId = selectedModelId;
      }

      const response = await carSeriesService.getAll(searchParams);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          setCarSeries(response.data);
          setTotalCount(response.data.length);
        } else {
          setCarSeries([]);
          setTotalCount(0);
        }
      } else {
        setCarSeries([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('获取车系列表失败:', error);
      setError('获取车系列表失败，请重试');
      setCarSeries([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 获取品牌列表
  const fetchBrands = async () => {
    try {
      const response = await brandService.getAll();
      setBrands(response.data || []);
    } catch (error) {
      console.error('获取品牌列表失败:', error);
    }
  };

  // 根据品牌获取车型列表
  const fetchCarModelsByBrand = async (brandId: number) => {
    if (brandId === 0) {
      setCarModels([]);
      return;
    }

    try {
      const response = await carModelService.getByBrand(brandId);
      setCarModels(response.data || []);
    } catch (error) {
      console.error('获取车型列表失败:', error);
      setCarModels([]);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchCarSeries();
    fetchBrands();
  }, []);

  // 当前页变化时重新获取数据
  useEffect(() => {
    fetchCarSeries({ page: currentPage });
  }, [currentPage]);

  // 品牌变化时获取对应车型
  useEffect(() => {
    fetchCarModelsByBrand(selectedBrandId);
    // 清空车型选择
    if (selectedModelId > 0) {
      setSelectedModelId(0);
    }
  }, [selectedBrandId]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCarSeries({ page: 1 });
  };

  const handleFilterChange = (key: keyof CarSeriesSearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBrandChange = (brandId: number) => {
    setSelectedBrandId(brandId);
    setCurrentPage(1);
    fetchCarSeries({ page: 1 });
  };

  const handleModelChange = (modelId: number) => {
    setSelectedModelId(modelId);
    setCurrentPage(1);
    fetchCarSeries({ page: 1 });
  };

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedBrandId(0);
    setSelectedModelId(0);
    setSearchParams({
      page: 1,
      pageSize: 20,
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });
    setCurrentPage(1);
    fetchCarSeries({
      page: 1,
      pageSize: 20,
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });
  };

  const handleSort = (field: string) => {
    const newDirection = searchParams.orderBy === field && searchParams.orderDirection === 'ASC' ? 'DESC' : 'ASC';
    const newParams = {
      ...searchParams,
      orderBy: field,
      orderDirection: newDirection as 'ASC' | 'DESC'
    };
    setSearchParams(newParams);
    fetchCarSeries(newParams);
  };

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id);
      setShowDeleteConfirm(null);
      // 重新获取数据
      fetchCarSeries();
    } catch (error) {
      console.error('删除车系失败:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusLabel = (status: CarSeriesStatus): string => {
    const statusLabels = {
      [CarSeriesStatus.ACTIVE]: '在产',
      [CarSeriesStatus.DISCONTINUED]: '停产',
      [CarSeriesStatus.PLANNED]: '计划中'
    };
    return statusLabels[status];
  };

  const getStatusColor = (status: CarSeriesStatus): string => {
    const colors = {
      [CarSeriesStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [CarSeriesStatus.DISCONTINUED]: 'bg-red-100 text-red-800',
      [CarSeriesStatus.PLANNED]: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const totalPages = Math.ceil(totalCount / (searchParams.pageSize || 10));

  if (loading && carSeries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">车系管理</h1>
          <p className="text-gray-600">管理汽车品牌下的车型系列</p>
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增车系
        </button>
      </div>

      {/* 搜索和过滤区 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索车系名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            搜索
          </button>

          {/* 过滤器切换 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            过滤器
          </button>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 品牌过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => handleBrandChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>全部品牌</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 车型过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车型</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleModelChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={selectedBrandId === 0}
                >
                  <option value={0}>
                    {selectedBrandId === 0 ? '请先选择品牌' : '全部车型'}
                  </option>
                  {carModels.map((carModel) => (
                    <option key={carModel.id} value={carModel.id}>
                      {carModel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 状态过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={searchParams.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部状态</option>
                  <option value={CarSeriesStatus.ACTIVE}>在产</option>
                  <option value={CarSeriesStatus.DISCONTINUED}>停产</option>
                  <option value={CarSeriesStatus.PLANNED}>计划中</option>
                </select>
              </div>
            </div>

            {/* 过滤器操作 */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                清除过滤器
              </button>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                应用过滤器
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 车系列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* 表格头部 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              车系列表 ({totalCount} 条记录)
            </h3>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                加载中...
              </div>
            )}
          </div>
        </div>

        {/* 表格内容 */}
        {carSeries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无车系数据</h3>
            <p className="text-gray-500">
              {keyword || selectedBrandId > 0 || selectedModelId > 0
                ? '没有找到符合条件的车系，请尝试调整搜索条件'
                : '还没有添加任何车系，点击上方按钮开始添加'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    车系名称
                    {searchParams.orderBy === 'name' && (
                      <span className="ml-1">
                        {searchParams.orderDirection === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所属品牌
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所属车型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    细分市场
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    年份
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    状态
                    {searchParams.orderBy === 'status' && (
                      <span className="ml-1">
                        {searchParams.orderDirection === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    创建时间
                    {searchParams.orderBy === 'created_at' && (
                      <span className="ml-1">
                        {searchParams.orderDirection === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carSeries.map((series) => (
                  <tr key={series.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{series.name}</div>
                        {series.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {series.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {series.model?.brand?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {series.model?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {series.market_segment || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {series.launch_year && series.end_year
                        ? `${series.launch_year}-${series.end_year}`
                        : series.launch_year
                        ? `${series.launch_year}-`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(series.status)}`}>
                        {getStatusLabel(series.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(series.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/car-series/${series.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(series)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(series.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
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
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 {(currentPage - 1) * (searchParams.pageSize || 10) + 1} 到{' '}
                {Math.min(currentPage * (searchParams.pageSize || 10), totalCount)} 条，共 {totalCount} 条记录
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* 页码 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                  <p className="text-sm text-gray-500">此操作不可撤销</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                确定要删除这个车系吗？删除后相关的技术点数据也将被删除。
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 车系详情对话框 */}
      {selectedCarSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">车系详情</h2>
              <button
                onClick={() => setSelectedCarSeries(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">车系名称</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">所属品牌</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.model?.brand?.name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">所属车型</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.model?.name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">细分市场</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.market_segment || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">状态</dt>
                      <dd>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCarSeries.status)}`}>
                          {getStatusLabel(selectedCarSeries.status)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">时间信息</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">上市年份</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.launch_year || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">停产年份</dt>
                      <dd className="text-sm text-gray-900">{selectedCarSeries.end_year || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCarSeries.created_at).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(selectedCarSeries.updated_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              {selectedCarSeries.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">描述</h3>
                  <p className="text-sm text-gray-700">{selectedCarSeries.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarSeriesList;