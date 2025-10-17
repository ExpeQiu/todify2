import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Car,
  Calendar,
  Tag,
  Building2
} from 'lucide-react';
import { CarModel, CarModelSearchParams, CarModelStatus } from '../../types/carModel';
import { Brand } from '../../types/brand';
import { carModelService } from '../../services/carModelService';
import { brandService } from '../../services/brandService';

interface CarModelListProps {
  onEdit?: (carModel: CarModel) => void;
  onView?: (carModel: CarModel) => void;
  onDelete?: (carModel: CarModel) => void;
}

const CarModelList: React.FC<CarModelListProps> = ({
  onEdit,
  onView,
  onDelete
}) => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 搜索和分页状态
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  
  // 排序状态
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // 筛选状态
  const [filters, setFilters] = useState<Partial<CarModelSearchParams>>({
    status: undefined,
    brandId: undefined,
    category: undefined,
    launch_year: undefined,
    market_segment: undefined
  });
  
  // 界面状态
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarModels, setSelectedCarModels] = useState<number[]>([]);

  // 获取车型列表
  const fetchCarModels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: CarModelSearchParams = {
        keyword: searchTerm || undefined,
        page: currentPage,
        pageSize: pageSize,
        orderBy: sortBy,
        orderDirection: sortOrder,
        status: filters.status,
        brandId: filters.brandId,
        category: filters.category,
        launch_year: filters.launch_year,
        market_segment: filters.market_segment,
        includeBrand: true
      };

      const response = await carModelService.getAll(params);
      
      setCarModels(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError('获取车型列表失败');
      console.error('Error fetching car models:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize, sortBy, sortOrder, filters]);

  // 获取品牌列表
  const fetchBrands = useCallback(async () => {
    try {
      const response = await brandService.getAll();
      setBrands(response.data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  useEffect(() => {
    fetchCarModels();
  }, [fetchCarModels]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCarModels();
  };

  // 处理筛选
  const handleFilterChange = (key: keyof CarModelSearchParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      status: undefined,
      brandId: undefined,
      category: undefined,
      launch_year: undefined,
      market_segment: undefined
    });
    setCurrentPage(1);
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  // 处理删除
  const handleDelete = async (carModel: CarModel) => {
    if (window.confirm(`确定要删除车型 "${carModel.name}" 吗？`)) {
      try {
        await carModelService.delete(carModel.id);
        fetchCarModels();
      } catch (err) {
        setError('删除车型失败');
      }
    }
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCarModels(carModels.map(model => model.id));
    } else {
      setSelectedCarModels([]);
    }
  };

  const handleSelectCarModel = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCarModels(prev => [...prev, id]);
    } else {
      setSelectedCarModels(prev => prev.filter(modelId => modelId !== id));
    }
  };

  // 获取状态显示
  const getStatusDisplay = (status: CarModelStatus) => {
    const statusMap = {
      [CarModelStatus.ACTIVE]: { text: '在产', color: 'bg-green-100 text-green-800' },
      [CarModelStatus.DISCONTINUED]: { text: '停产', color: 'bg-red-100 text-red-800' },
      [CarModelStatus.PLANNED]: { text: '计划中', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">车型管理</h1>
          <p className="text-gray-600">管理汽车型号信息</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            新增车型
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索车型名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          搜索
        </button>
      </form>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                品牌
              </label>
              <select
                value={filters.brandId || ''}
                onChange={(e) => handleFilterChange('brandId', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部品牌</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value={CarModelStatus.ACTIVE}>在产</option>
                <option value={CarModelStatus.DISCONTINUED}>停产</option>
                <option value={CarModelStatus.PLANNED}>计划中</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上市年份
              </label>
              <input
                type="number"
                placeholder="年份"
                value={filters.launch_year || ''}
                onChange={(e) => handleFilterChange('launch_year', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                细分市场
              </label>
              <input
                type="text"
                placeholder="细分市场"
                value={filters.market_segment || ''}
                onChange={(e) => handleFilterChange('market_segment', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 车型列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCarModels.length === carModels.length && carModels.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  车型名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  品牌
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类别
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('launch_year')}
                >
                  上市年份
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  细分市场
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : carModels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    暂无车型数据
                  </td>
                </tr>
              ) : (
                carModels.map((carModel) => {
                  const statusDisplay = getStatusDisplay(carModel.status);
                  return (
                    <tr key={carModel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCarModels.includes(carModel.id)}
                          onChange={(e) => handleSelectCarModel(carModel.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Car className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {carModel.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {carModel.brand?.name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {carModel.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {carModel.launch_year || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {carModel.market_segment || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(carModel.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onView?.(carModel)}
                            className="text-blue-600 hover:text-blue-900"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit?.(carModel)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(carModel)}
                            className="text-red-600 hover:text-red-900"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{' '}
                  条，共 <span className="font-medium">{total}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
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
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarModelList;