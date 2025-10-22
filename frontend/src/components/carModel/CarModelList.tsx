import React, { useState, useEffect, useCallback } from "react";
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
  Building2,
} from "lucide-react";
import {
  CarModel,
  CarModelSearchParams,
  CarModelStatus,
} from "../../types/carModel";
import { Brand } from "../../types/brand";
import { carModelService } from "../../services/carModelService";
import { brandService } from "../../services/brandService";

interface CarModelListProps {
  onEdit?: (carModel: CarModel) => void;
  onView?: (carModel: CarModel) => void;
  onDelete?: (carModel: CarModel) => void;
}

const CarModelList: React.FC<CarModelListProps> = ({
  onEdit,
  onView,
  onDelete,
}) => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 搜索和分页状态
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  // 排序状态
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // 筛选状态
  const [filters, setFilters] = useState<Partial<CarModelSearchParams>>({
    status: undefined,
    brandId: undefined,
    category: undefined,
    launch_year: undefined,
    market_segment: undefined,
  });

  // 界面状态
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarModels, setSelectedCarModels] = useState<number[]>([]);

  // 获取车型列表
  const fetchCarModels = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

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
        includeBrand: true,
      };

      const response = await carModelService.getAll(params);

      setCarModels(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError("获取车型列表失败");
      console.error("Error fetching car models:", err);
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
      console.error("Error fetching brands:", err);
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
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      status: undefined,
      brandId: undefined,
      category: undefined,
      launch_year: undefined,
      market_segment: undefined,
    });
    setCurrentPage(1);
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("ASC");
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
        setError("删除车型失败");
      }
    }
  };

  // 批量选择
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCarModels(carModels.map((model) => model.id));
    } else {
      setSelectedCarModels([]);
    }
  };

  const handleSelectCarModel = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedCarModels((prev) => [...prev, id]);
    } else {
      setSelectedCarModels((prev) => prev.filter((modelId) => modelId !== id));
    }
  };

  // 获取状态显示
  const getStatusDisplay = (status: CarModelStatus) => {
    const statusMap = {
      [CarModelStatus.ACTIVE]: {
        text: "在产",
        color: "bg-green-100 text-green-800",
      },
      [CarModelStatus.DISCONTINUED]: {
        text: "停产",
        color: "bg-red-100 text-red-800",
      },
      [CarModelStatus.PLANNED]: {
        text: "计划中",
        color: "bg-blue-100 text-blue-800",
      },
    };
    return (
      statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800" }
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6" data-oid="s0gim-o">
      {/* 头部操作区 */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        data-oid="v_2:4an"
      >
        <div data-oid="__duyc2">
          <h1 className="text-2xl font-bold text-gray-900" data-oid="nxi:dgf">
            车型管理
          </h1>
          <p className="text-gray-600" data-oid="-6jyarn">
            管理汽车型号信息
          </p>
        </div>
        <div className="flex items-center gap-2" data-oid="vxlaxnu">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            data-oid="drjm81z"
          >
            <Filter className="w-4 h-4" data-oid="hrnzg0l" />
            筛选
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            data-oid="od4728d"
          >
            <Plus className="w-4 h-4" data-oid=".nvf0uv" />
            新增车型
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="flex gap-2" data-oid="9j7e0g5">
        <div className="flex-1 relative" data-oid="vv.j0h_">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            data-oid="x-upsk:"
          />

          <input
            type="text"
            placeholder="搜索车型名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-oid="r1wow:u"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-oid="12jb:h8"
        >
          搜索
        </button>
      </form>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4" data-oid="h-z5ldg">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            data-oid="lhvgebv"
          >
            <div data-oid="nvgw1lt">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="kf.fnbr"
              >
                品牌
              </label>
              <select
                value={filters.brandId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "brandId",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-oid="6:o1_xn"
              >
                <option value="" data-oid="a9k3tmx">
                  全部品牌
                </option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id} data-oid="jpie-z5">
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div data-oid="tdevdlh">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="10zs28z"
              >
                状态
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) =>
                  handleFilterChange("status", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-oid="fq:wagc"
              >
                <option value="" data-oid="2w6camf">
                  全部状态
                </option>
                <option value={CarModelStatus.ACTIVE} data-oid="4.u43_k">
                  在产
                </option>
                <option value={CarModelStatus.DISCONTINUED} data-oid="q.4y9a7">
                  停产
                </option>
                <option value={CarModelStatus.PLANNED} data-oid="nzwre:d">
                  计划中
                </option>
              </select>
            </div>

            <div data-oid="2xjfgft">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid="r95a.yf"
              >
                上市年份
              </label>
              <input
                type="number"
                placeholder="年份"
                value={filters.launch_year || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "launch_year",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-oid="r6a8jgn"
              />
            </div>

            <div data-oid="vdg_gvg">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                data-oid=".:2uadg"
              >
                细分市场
              </label>
              <input
                type="text"
                placeholder="细分市场"
                value={filters.market_segment || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "market_segment",
                    e.target.value || undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-oid="svhe1q:"
              />
            </div>
          </div>

          <div className="flex justify-end" data-oid="5p2qcir">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              data-oid="7gysjgl"
            >
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          data-oid="aavxt:b"
        >
          {error}
        </div>
      )}

      {/* 车型列表 */}
      <div
        className="bg-white rounded-lg shadow overflow-hidden"
        data-oid="kp-zk0c"
      >
        <div className="overflow-x-auto" data-oid="ghxaeu2">
          <table
            className="min-w-full divide-y divide-gray-200"
            data-oid="bj-3lx9"
          >
            <thead className="bg-gray-50" data-oid="vvncfsm">
              <tr data-oid="mzfoan6">
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="2p0q325"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedCarModels.length === carModels.length &&
                      carModels.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    data-oid="qz61etc"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                  data-oid="7ik-are"
                >
                  车型名称
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="exq4hsu"
                >
                  品牌
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="bi2vrb7"
                >
                  类别
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("launch_year")}
                  data-oid="c6gttpm"
                >
                  上市年份
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="xe2.um:"
                >
                  细分市场
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="7rzjr8o"
                >
                  状态
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("created_at")}
                  data-oid="itzcany"
                >
                  创建时间
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  data-oid="m-jbq9t"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody
              className="bg-white divide-y divide-gray-200"
              data-oid="2m5h4zs"
            >
              {loading ? (
                <tr data-oid="edv39dg">
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                    data-oid="_x5s.e2"
                  >
                    加载中...
                  </td>
                </tr>
              ) : carModels.length === 0 ? (
                <tr data-oid="u4-_bm1">
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                    data-oid="1zk0uvk"
                  >
                    暂无车型数据
                  </td>
                </tr>
              ) : (
                carModels.map((carModel) => {
                  const statusDisplay = getStatusDisplay(carModel.status);
                  return (
                    <tr
                      key={carModel.id}
                      className="hover:bg-gray-50"
                      data-oid="es-eibb"
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        data-oid="tsmtjki"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCarModels.includes(carModel.id)}
                          onChange={(e) =>
                            handleSelectCarModel(carModel.id, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          data-oid="jlf:2qk"
                        />
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        data-oid="27-3zk4"
                      >
                        <div className="flex items-center" data-oid="idoi6.i">
                          <Car
                            className="w-5 h-5 text-gray-400 mr-3"
                            data-oid="d:ndes5"
                          />

                          <div data-oid="0opmh0r">
                            <div
                              className="text-sm font-medium text-gray-900"
                              data-oid="s__on3x"
                            >
                              {carModel.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        data-oid="r8t_:uh"
                      >
                        <div className="flex items-center" data-oid="clbghhq">
                          <Building2
                            className="w-4 h-4 text-gray-400 mr-2"
                            data-oid="qij-zb8"
                          />

                          <span
                            className="text-sm text-gray-900"
                            data-oid="zr-sf_0"
                          >
                            {carModel.brand?.name || "-"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        data-oid="8-61qes"
                      >
                        {carModel.category || "-"}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        data-oid="-e3bx_0"
                      >
                        <div className="flex items-center" data-oid="q.nshog">
                          <Calendar
                            className="w-4 h-4 text-gray-400 mr-2"
                            data-oid="yun0_y_"
                          />

                          <span
                            className="text-sm text-gray-900"
                            data-oid="_yevzwc"
                          >
                            {carModel.launch_year || "-"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        data-oid="6hcecb8"
                      >
                        {carModel.market_segment || "-"}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        data-oid="066_jus"
                      >
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}
                          data-oid="vb6tzyx"
                        >
                          {statusDisplay.text}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        data-oid="x2j04t6"
                      >
                        {new Date(carModel.created_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                        data-oid="8iyd_q5"
                      >
                        <div
                          className="flex items-center justify-end gap-2"
                          data-oid="nfp8fm5"
                        >
                          <button
                            onClick={() => onView?.(carModel)}
                            className="text-blue-600 hover:text-blue-900"
                            title="查看详情"
                            data-oid="olj91q_"
                          >
                            <Eye className="w-4 h-4" data-oid="hy6ed0e" />
                          </button>
                          <button
                            onClick={() => onEdit?.(carModel)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="编辑"
                            data-oid="5d2q8-."
                          >
                            <Edit className="w-4 h-4" data-oid="jp0q3.." />
                          </button>
                          <button
                            onClick={() => handleDelete(carModel)}
                            className="text-red-600 hover:text-red-900"
                            title="删除"
                            data-oid="1hon5pv"
                          >
                            <Trash2 className="w-4 h-4" data-oid="y9id4vd" />
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
          <div
            className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
            data-oid="7:ymeft"
          >
            <div
              className="flex-1 flex justify-between sm:hidden"
              data-oid="swy_fit"
            >
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-oid=".9onk3_"
              >
                上一页
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-oid="l1._ff3"
              >
                下一页
              </button>
            </div>
            <div
              className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"
              data-oid="airkx.7"
            >
              <div data-oid="3bdkkz7">
                <p className="text-sm text-gray-700" data-oid="nw40w.b">
                  显示第{" "}
                  <span className="font-medium" data-oid="o5frfw4">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  到{" "}
                  <span className="font-medium" data-oid="6wcgam3">
                    {Math.min(currentPage * pageSize, total)}
                  </span>{" "}
                  条，共{" "}
                  <span className="font-medium" data-oid="aw.opna">
                    {total}
                  </span>{" "}
                  条记录
                </p>
              </div>
              <div data-oid="o:u7sc2">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  data-oid=".47zye5"
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-oid="qt989gk"
                  >
                    <ChevronLeft className="w-5 h-5" data-oid="41z2gs:" />
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
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                        data-oid="6jbmka7"
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-oid="3gq1btw"
                  >
                    <ChevronRight className="w-5 h-5" data-oid="1wmg:se" />
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
