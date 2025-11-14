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
  AlertTriangle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CarSeries,
  CarSeriesStatus,
  CarSeriesSearchParams,
} from "../../types/carSeries";
import { Brand } from "../../types/brand";
import { CarModel } from "../../types/carModel";
import { carSeriesService } from "../../services/carSeriesService";
import { brandService } from "../../services/brandService";
import { carModelService } from "../../services/carModelService";

interface CarSeriesListProps {
  onEdit: (carSeries: CarSeries) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const CarSeriesList: React.FC<CarSeriesListProps> = ({
  onEdit,
  onDelete,
  onCreate,
}) => {
  const navigate = useNavigate();
  // 数据状态
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 搜索和过滤状态
  const [keyword, setKeyword] = useState("");
  const [searchParams, setSearchParams] = useState<CarSeriesSearchParams>({
    page: 1,
    pageSize: 20,
    orderBy: "created_at",
    orderDirection: "DESC",
  });

  // UI状态
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null,
  );
  const [selectedCarSeries, setSelectedCarSeries] = useState<CarSeries | null>(
    null,
  );
  const [selectedBrandId, setSelectedBrandId] = useState<number>(0);
  const [selectedModelId, setSelectedModelId] = useState<number>(0);

  // 分页状态
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 获取车系列表
  const fetchCarSeries = async (params?: Partial<CarSeriesSearchParams>) => {
    setLoading(true);
    setError("");
    try {
      const searchParams: CarSeriesSearchParams = {
        page: currentPage,
        pageSize: 20,
        orderBy: "created_at",
        orderDirection: "DESC",
        includeModel: true,
        ...params,
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
      console.error("获取车系列表失败:", error);
      setError("获取车系列表失败，请重试");
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
      console.error("获取品牌列表失败:", error);
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
      console.error("获取车型列表失败:", error);
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
    setSearchParams((prev) => ({
      ...prev,
      [key]: value,
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
    setKeyword("");
    setSelectedBrandId(0);
    setSelectedModelId(0);
    setSearchParams({
      page: 1,
      pageSize: 20,
      orderBy: "created_at",
      orderDirection: "DESC",
    });
    setCurrentPage(1);
    fetchCarSeries({
      page: 1,
      pageSize: 20,
      orderBy: "created_at",
      orderDirection: "DESC",
    });
  };

  const handleSort = (field: string) => {
    const newDirection =
      searchParams.orderBy === field && searchParams.orderDirection === "ASC"
        ? "DESC"
        : "ASC";
    const newParams = {
      ...searchParams,
      orderBy: field,
      orderDirection: newDirection as "ASC" | "DESC",
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
      console.error("删除车系失败:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusLabel = (status: CarSeriesStatus): string => {
    const statusLabels = {
      [CarSeriesStatus.ACTIVE]: "在产",
      [CarSeriesStatus.DISCONTINUED]: "停产",
      [CarSeriesStatus.PLANNED]: "计划中",
    };
    return statusLabels[status];
  };

  const getStatusColor = (status: CarSeriesStatus): string => {
    const colors = {
      [CarSeriesStatus.ACTIVE]: "bg-green-100 text-green-800",
      [CarSeriesStatus.DISCONTINUED]: "bg-red-100 text-red-800",
      [CarSeriesStatus.PLANNED]: "bg-blue-100 text-blue-800",
    };
    return colors[status];
  };

  const totalPages = Math.ceil(totalCount / (searchParams.pageSize || 10));

  if (loading && carSeries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" data-oid="ycb6so0">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          data-oid="i:uz0sj"
        ></div>
        <span className="ml-2 text-gray-600" data-oid="p45hqjx">
          加载中...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-oid="miyi2.w">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between" data-oid="3rbkbri">
        <div data-oid="-6iy445">
          <h1 className="text-2xl font-bold text-gray-900" data-oid=".gymqz9">
            车系管理
          </h1>
          <p className="text-gray-600" data-oid="l3ym_v:">
            管理汽车品牌下的车型系列
          </p>
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          data-oid="wf2g-a8"
        >
          <Plus className="w-4 h-4" data-oid="m9:4ma_" />
          新增车系
        </button>
      </div>

      {/* 搜索和过滤区 */}
      <div
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        data-oid="h072wj."
      >
        <div className="flex items-center gap-4 mb-4" data-oid="z_zb4ss">
          {/* 搜索框 */}
          <div className="flex-1 relative" data-oid="00i7niq">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              data-oid="ylgo-i4"
            />

            <input
              type="text"
              placeholder="搜索车系名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-oid=":03p2bp"
            />
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            data-oid="2k17_-v"
          >
            <Search className="w-4 h-4" data-oid=".gwl-ah" />
            搜索
          </button>

          {/* 过滤器切换 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            data-oid="y18yw-:"
          >
            <Filter className="w-4 h-4" data-oid="bdwjrc4" />
            过滤器
          </button>
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4" data-oid="e.nrdl2">
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              data-oid="6iyj3ba"
            >
              {/* 品牌过滤 */}
              <div data-oid="4g9bamz">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="xq.b_3r"
                >
                  品牌
                </label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => handleBrandChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="x0v_pqo"
                >
                  <option value={0} data-oid="iu81dmt">
                    全部品牌
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id} data-oid="-sef1s0">
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 车型过滤 */}
              <div data-oid="1y06n66">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="wwdqbpi"
                >
                  车型
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleModelChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={selectedBrandId === 0}
                  data-oid="kioyxxj"
                >
                  <option value={0} data-oid="s5wl:0g">
                    {selectedBrandId === 0 ? "请先选择品牌" : "全部车型"}
                  </option>
                  {carModels.map((carModel) => (
                    <option
                      key={carModel.id}
                      value={carModel.id}
                      data-oid="5nm92ej"
                    >
                      {carModel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 状态过滤 */}
              <div data-oid="9djvx0w">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="hc39vkc"
                >
                  状态
                </label>
                <select
                  value={searchParams.status || ""}
                  onChange={(e) =>
                    handleFilterChange("status", e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="23i6t:1"
                >
                  <option value="" data-oid="gmtmopr">
                    全部状态
                  </option>
                  <option value={CarSeriesStatus.ACTIVE} data-oid="e.4wjlg">
                    在产
                  </option>
                  <option
                    value={CarSeriesStatus.DISCONTINUED}
                    data-oid="dcgdzbk"
                  >
                    停产
                  </option>
                  <option value={CarSeriesStatus.PLANNED} data-oid="qtttcc1">
                    计划中
                  </option>
                </select>
              </div>
            </div>

            {/* 过滤器操作 */}
            <div
              className="flex items-center justify-end gap-2 mt-4"
              data-oid="h3_tiaf"
            >
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                data-oid="5ahmyqx"
              >
                清除过滤器
              </button>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                data-oid="_p5b7fv"
              >
                应用过滤器
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
          data-oid="g2x4blx"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" data-oid="cvcblh." />
          {error}
        </div>
      )}

      {/* 车系列表 */}
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        data-oid="fka9j_v"
      >
        {/* 表格头部 */}
        <div
          className="px-6 py-4 border-b border-gray-200 bg-gray-50"
          data-oid="2tx0weg"
        >
          <div className="flex items-center justify-between" data-oid="pv_z41l">
            <h3
              className="text-lg font-medium text-gray-900"
              data-oid="m6re.9n"
            >
              车系列表 ({totalCount} 条记录)
            </h3>
            {loading && (
              <div
                className="flex items-center gap-2 text-sm text-gray-500"
                data-oid="vsn_0ul"
              >
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
                  data-oid="j60n5ru"
                ></div>
                加载中...
              </div>
            )}
          </div>
        </div>

        {/* 表格内容 */}
        {carSeries.length === 0 ? (
          <div className="text-center py-12" data-oid="vvt3z5z">
            <div className="text-gray-400 mb-2" data-oid="m4x3mma">
              <Search className="w-12 h-12 mx-auto" data-oid=":g6lo.g" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900 mb-1"
              data-oid="1wd21_m"
            >
              暂无车系数据
            </h3>
            <p className="text-gray-500" data-oid="5z98-7f">
              {keyword || selectedBrandId > 0 || selectedModelId > 0
                ? "没有找到符合条件的车系，请尝试调整搜索条件"
                : "还没有添加任何车系，点击上方按钮开始添加"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-oid="1_hti27">
            <table className="w-full" data-oid="i.qbptq">
              <thead className="bg-gray-50" data-oid="11m__2o">
                <tr data-oid="93gxndt">
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                    data-oid=".i:ww7i"
                  >
                    车系名称
                    {searchParams.orderBy === "name" && (
                      <span className="ml-1" data-oid="2jiqs4y">
                        {searchParams.orderDirection === "ASC" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    data-oid="uha8x6a"
                  >
                    所属品牌
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    data-oid="86m3iwm"
                  >
                    所属车型
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    data-oid="5kwnd3n"
                  >
                    细分市场
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    data-oid=".vh3fz-"
                  >
                    年份
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                    data-oid="d.x6bhj"
                  >
                    状态
                    {searchParams.orderBy === "status" && (
                      <span className="ml-1" data-oid="x7yphoc">
                        {searchParams.orderDirection === "ASC" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("created_at")}
                    data-oid="89f6ubf"
                  >
                    创建时间
                    {searchParams.orderBy === "created_at" && (
                      <span className="ml-1" data-oid="k_idatz">
                        {searchParams.orderDirection === "ASC" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    data-oid="k0nvzss"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody
                className="bg-white divide-y divide-gray-200"
                data-oid="s04vm55"
              >
                {carSeries.map((series) => (
                  <tr
                    key={series.id}
                    className="hover:bg-gray-50"
                    data-oid="8piu9x7"
                  >
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      data-oid="j2.ozwj"
                    >
                      <div data-oid="q7o74iz">
                        <div
                          className="text-sm font-medium text-gray-900"
                          data-oid="2a4p13w"
                        >
                          {series.name}
                        </div>
                        {series.description && (
                          <div
                            className="text-sm text-gray-500 truncate max-w-xs"
                            data-oid="5ckiwt9"
                          >
                            {series.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      data-oid="2knbk6h"
                    >
                      {series.model?.brand?.name || "-"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      data-oid="l_0hrw5"
                    >
                      {series.model?.name || "-"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      data-oid="ppwmiv:"
                    >
                      {series.market_segment || "-"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      data-oid="0h6vi.r"
                    >
                      {series.launch_year && series.end_year
                        ? `${series.launch_year}-${series.end_year}`
                        : series.launch_year
                          ? `${series.launch_year}-`
                          : "-"}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      data-oid="do6vh38"
                    >
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(series.status)}`}
                        data-oid="2ee1k_f"
                      >
                        {getStatusLabel(series.status)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      data-oid="7vbik:g"
                    >
                      {new Date(series.created_at).toLocaleDateString()}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      data-oid="jqlqnjs"
                    >
                      <div
                        className="flex items-center justify-end gap-2"
                        data-oid="7zblk7q"
                      >
                        <button
                          onClick={() => navigate(`/car-series/${series.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="查看详情"
                          data-oid="4zm21kn"
                        >
                          <Eye className="w-4 h-4" data-oid="k2egfsj" />
                        </button>
                        <button
                          onClick={() => onEdit(series)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                          title="编辑"
                          data-oid="6iyo_ul"
                        >
                          <Edit className="w-4 h-4" data-oid="79hsegx" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(series.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="删除"
                          data-oid="-.dd3.i"
                        >
                          <Trash2 className="w-4 h-4" data-oid="a:fiyon" />
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
          <div
            className="px-6 py-4 border-t border-gray-200 bg-gray-50"
            data-oid="36ml6n2"
          >
            <div
              className="flex items-center justify-between"
              data-oid="8.2pahv"
            >
              <div className="text-sm text-gray-700" data-oid="m7g0vea">
                显示第 {(currentPage - 1) * (searchParams.pageSize || 10) + 1}{" "}
                到{" "}
                {Math.min(
                  currentPage * (searchParams.pageSize || 10),
                  totalCount,
                )}{" "}
                条，共 {totalCount} 条记录
              </div>
              <div className="flex items-center gap-2" data-oid="mll703f">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-oid="ch6h497"
                >
                  <ChevronLeft className="w-4 h-4" data-oid="d28:sp5" />
                </button>

                {/* 页码 */}
                <div className="flex items-center gap-1" data-oid="fu:_r4e">
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
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-oid="vist68a"
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
                  data-oid="uul47gx"
                >
                  <ChevronRight className="w-4 h-4" data-oid="kpddfc." />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-oid="0o1pmzz"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            data-oid="c7_-2o_"
          >
            <div className="p-6" data-oid="xkl9doc">
              <div className="flex items-center gap-3 mb-4" data-oid="l6b-4-d">
                <div
                  className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"
                  data-oid="odje251"
                >
                  <AlertTriangle
                    className="w-5 h-5 text-red-600"
                    data-oid="2.d6.nx"
                  />
                </div>
                <div data-oid="l1.6l94">
                  <h3
                    className="text-lg font-medium text-gray-900"
                    data-oid="o_4soge"
                  >
                    确认删除
                  </h3>
                  <p className="text-sm text-gray-500" data-oid="7c-7hdi">
                    此操作不可撤销
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6" data-oid="6br_:8i">
                确定要删除这个车系吗？删除后相关的技术点数据也将被删除。
              </p>
              <div
                className="flex items-center justify-end gap-3"
                data-oid="y4_9a0e"
              >
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  data-oid="h0tp.02"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  data-oid="1r.2nx0"
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
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-oid="s43fmjn"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            data-oid="-uucpk8"
          >
            <div
              className="flex items-center justify-between p-6 border-b border-gray-200"
              data-oid="__lj7c6"
            >
              <h2
                className="text-xl font-bold text-gray-900"
                data-oid="lsv__zm"
              >
                车系详情
              </h2>
              <button
                onClick={() => setSelectedCarSeries(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                data-oid="pmhu5nk"
              >
                <X className="w-5 h-5" data-oid="w1brlw_" />
              </button>
            </div>
            <div className="p-6" data-oid="x1qfv41">
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                data-oid="ri:5yf9"
              >
                <div data-oid="v:mk8.x">
                  <h3
                    className="text-lg font-medium text-gray-900 mb-4"
                    data-oid="6l9pal5"
                  >
                    基本信息
                  </h3>
                  <dl className="space-y-3" data-oid="0sf3kt.">
                    <div data-oid="sslljr9">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="fdil4ay"
                      >
                        车系名称
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="y:tz8ce">
                        {selectedCarSeries.name}
                      </dd>
                    </div>
                    <div data-oid="lm7:rk_">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="25vbsou"
                      >
                        所属品牌
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="yt7xs4i">
                        {selectedCarSeries.model?.brand?.name || "-"}
                      </dd>
                    </div>
                    <div data-oid="v7l7gzi">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="5thpf3_"
                      >
                        所属车型
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="8s7qkqo">
                        {selectedCarSeries.model?.name || "-"}
                      </dd>
                    </div>
                    <div data-oid="9k-oscz">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="e64f1-k"
                      >
                        细分市场
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="vdu6g81">
                        {selectedCarSeries.market_segment || "-"}
                      </dd>
                    </div>
                    <div data-oid="14wsl7j">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="exx9sdv"
                      >
                        状态
                      </dt>
                      <dd data-oid="bvfd4jz">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCarSeries.status)}`}
                          data-oid="23luo6x"
                        >
                          {getStatusLabel(selectedCarSeries.status)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div data-oid="ipq58-4">
                  <h3
                    className="text-lg font-medium text-gray-900 mb-4"
                    data-oid="bx7.20z"
                  >
                    时间信息
                  </h3>
                  <dl className="space-y-3" data-oid="8kaf6tq">
                    <div data-oid="_aj8s8q">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="0xi1zjs"
                      >
                        上市年份
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="zcp-ykq">
                        {selectedCarSeries.launch_year || "-"}
                      </dd>
                    </div>
                    <div data-oid="q3.6g3c">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="k0sbtj5"
                      >
                        停产年份
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="w9xk2v3">
                        {selectedCarSeries.end_year || "-"}
                      </dd>
                    </div>
                    <div data-oid="x6wy0ak">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="gtbol:q"
                      >
                        创建时间
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="y-dpm4n">
                        {new Date(
                          selectedCarSeries.created_at,
                        ).toLocaleString()}
                      </dd>
                    </div>
                    <div data-oid="j_xrp17">
                      <dt
                        className="text-sm font-medium text-gray-500"
                        data-oid="t5se_yf"
                      >
                        更新时间
                      </dt>
                      <dd className="text-sm text-gray-900" data-oid="hqtf6wb">
                        {new Date(
                          selectedCarSeries.updated_at,
                        ).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              {selectedCarSeries.description && (
                <div className="mt-6" data-oid="so75_5k">
                  <h3
                    className="text-lg font-medium text-gray-900 mb-2"
                    data-oid="fri9c6a"
                  >
                    描述
                  </h3>
                  <p className="text-sm text-gray-700" data-oid="cmq9.-p">
                    {selectedCarSeries.description}
                  </p>
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
