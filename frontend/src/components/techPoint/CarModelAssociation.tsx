import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Car,
  Calendar,
  FileText,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { CarModel } from "../../types/carModel";
import { carModelService } from "../../services/carModelService";
import { techPointService } from "../../services/techPointService";

interface CarModelAssociationProps {
  techPointId: number;
  onUpdate?: () => void;
}

interface AssociatedCarModel extends CarModel {
  application_status?: string;
  implementation_date?: string;
  notes?: string;
}

interface AssociationFormData {
  carModelId: number;
  applicationStatus: string;
  implementationDate: string;
  notes: string;
}

const CarModelAssociation: React.FC<CarModelAssociationProps> = ({
  techPointId,
  onUpdate,
}) => {
  const [associatedCarModels, setAssociatedCarModels] = useState<
    AssociatedCarModel[]
  >([]);
  const [availableCarModels, setAvailableCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssociation, setEditingAssociation] =
    useState<AssociatedCarModel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 表单数据
  const [formData, setFormData] = useState<AssociationFormData>({
    carModelId: 0,
    applicationStatus: "planned",
    implementationDate: "",
    notes: "",
  });

  // 获取关联的车型
  const fetchAssociatedCarModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await techPointService.getTechPointCarModels(techPointId);
      if (response.success && response.data) {
        setAssociatedCarModels(response.data);
      } else {
        setError(response.error || "获取关联车型失败");
      }
    } catch (err) {
      setError("获取关联车型失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取可用的车型列表
  const fetchAvailableCarModels = async () => {
    try {
      const response = await carModelService.getAll({
        page: 1,
        pageSize: 1000,
      });
      if (response.data) {
        setAvailableCarModels(response.data);
      }
    } catch (err) {
      console.error("获取车型列表失败:", err);
    }
  };

  useEffect(() => {
    fetchAssociatedCarModels();
    fetchAvailableCarModels();
  }, [techPointId]);

  // 处理添加关联
  const handleAddAssociation = async () => {
    if (!formData.carModelId) {
      setError("请选择车型");
      return;
    }

    setLoading(true);
    try {
      const response = await techPointService.associateCarModelToTechPoint(
        techPointId,
        {
          carModelId: formData.carModelId,
          applicationStatus: formData.applicationStatus,
          implementationDate: formData.implementationDate || undefined,
          notes: formData.notes || undefined,
        },
      );

      if (response.success) {
        setShowAddModal(false);
        setFormData({
          carModelId: 0,
          applicationStatus: "planned",
          implementationDate: "",
          notes: "",
        });
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || "关联车型失败");
      }
    } catch (err) {
      setError("关联车型失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑关联
  const handleEditAssociation = async () => {
    if (!editingAssociation) return;

    setLoading(true);
    try {
      const response = await techPointService.updateCarModelAssociation(
        techPointId,
        editingAssociation.id,
        {
          applicationStatus: formData.applicationStatus,
          implementationDate: formData.implementationDate || undefined,
          notes: formData.notes || undefined,
        },
      );

      if (response.success) {
        setShowEditModal(false);
        setEditingAssociation(null);
        setFormData({
          carModelId: 0,
          applicationStatus: "planned",
          implementationDate: "",
          notes: "",
        });
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || "更新关联失败");
      }
    } catch (err) {
      setError("更新关联失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理删除关联
  const handleDeleteAssociation = async (carModelId: number) => {
    if (!confirm("确定要删除这个关联吗？")) return;

    setLoading(true);
    try {
      const response = await techPointService.disassociateCarModelFromTechPoint(
        techPointId,
        carModelId,
      );

      if (response.success) {
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || "删除关联失败");
      }
    } catch (err) {
      setError("删除关联失败");
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const openEditModal = (association: AssociatedCarModel) => {
    setEditingAssociation(association);
    setFormData({
      carModelId: association.id,
      applicationStatus: association.application_status || "planned",
      implementationDate: association.implementation_date || "",
      notes: association.notes || "",
    });
    setShowEditModal(true);
  };

  // 过滤关联车型
  const filteredAssociations = associatedCarModels.filter((association) => {
    const matchesSearch =
      searchTerm === "" ||
      association.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (association.brand?.name &&
        association.brand.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || association.application_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 获取状态颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "planned":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 获取状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="w-4 h-4" data-oid="e5ijkdg" />;
      case "in_progress":
        return <Clock className="w-4 h-4" data-oid="7.5n0-." />;
      case "planned":
        return <Calendar className="w-4 h-4" data-oid="wy:25yf" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4" data-oid="al73x3l" />;
      default:
        return <Clock className="w-4 h-4" data-oid="t4g7lxj" />;
    }
  };

  // 获取状态标签
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "implemented":
        return "已实施";
      case "in_progress":
        return "进行中";
      case "planned":
        return "计划中";
      case "cancelled":
        return "已取消";
      default:
        return "未知";
    }
  };

  if (loading && associatedCarModels.length === 0) {
    return (
      <div className="flex items-center justify-center py-8" data-oid="3dgmtxg">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          data-oid="qm296ko"
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-oid="n-paabo">
      {/* 头部操作区 */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        data-oid="f:futfe"
      >
        <div data-oid="zpijtu:">
          <h4 className="text-lg font-medium text-gray-900" data-oid="wg:puai">
            关联车型
          </h4>
          <p className="text-sm text-gray-500" data-oid="ezsfn4f">
            管理技术点与车型的关联关系
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-oid="21dtx8v"
        >
          <Plus className="w-4 h-4 mr-2" data-oid="itb0hql" />
          添加关联
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4" data-oid="-l2dtpp">
        <div className="flex-1" data-oid="ohn:amc">
          <div className="relative" data-oid="q7jf-dz">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              data-oid="8t00m.l"
            />

            <input
              type="text"
              placeholder="搜索车型名称或品牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-oid="921zzhf"
            />
          </div>
        </div>

        <div className="flex items-center gap-2" data-oid="g:y.dr-">
          <Filter className="w-4 h-4 text-gray-400" data-oid="h8m46tb" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            data-oid="b8hr0:y"
          >
            <option value="all" data-oid="w8malpk">
              所有状态
            </option>
            <option value="planned" data-oid="cy4ooij">
              计划中
            </option>
            <option value="in_progress" data-oid="d9mc9um">
              进行中
            </option>
            <option value="implemented" data-oid="h4ekvc7">
              已实施
            </option>
            <option value="cancelled" data-oid="4x00x5l">
              已取消
            </option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-md p-4"
          data-oid="d2j1.kr"
        >
          <div className="flex" data-oid="pn50wm2">
            <AlertCircle className="w-5 h-5 text-red-400" data-oid="gv3f7ai" />
            <div className="ml-3" data-oid="xioa990">
              <p className="text-sm text-red-800" data-oid="6jsohdb">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
              data-oid="tf9k8ij"
            >
              <X className="w-4 h-4" data-oid="401mnm0" />
            </button>
          </div>
        </div>
      )}

      {/* 关联列表 */}
      <div
        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        data-oid="pdmmfim"
      >
        {filteredAssociations.length === 0 ? (
          <div className="text-center py-8" data-oid="skc4uml">
            <Car
              className="mx-auto h-12 w-12 text-gray-400"
              data-oid="vl:5p-b"
            />

            <h3
              className="mt-2 text-sm font-medium text-gray-900"
              data-oid="38v9e2e"
            >
              暂无关联车型
            </h3>
            <p className="mt-1 text-sm text-gray-500" data-oid=":o9r-k_">
              {searchTerm || statusFilter !== "all"
                ? "没有符合条件的关联车型"
                : "开始添加技术点与车型的关联"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200" data-oid="euv0617">
            {filteredAssociations.map((association) => (
              <div
                key={association.id}
                className="p-6 hover:bg-gray-50"
                data-oid="8:w5a_5"
              >
                <div
                  className="flex items-start justify-between"
                  data-oid="mz4q9w3"
                >
                  <div className="flex-1" data-oid="ygyges7">
                    <div
                      className="flex items-center gap-3 mb-2"
                      data-oid="16jk54c"
                    >
                      <h5
                        className="text-lg font-medium text-gray-900"
                        data-oid="fwsa9iv"
                      >
                        {association.name}
                      </h5>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(association.application_status)}`}
                        data-oid="36x5ee8"
                      >
                        {getStatusIcon(association.application_status)}
                        <span className="ml-1" data-oid="v_v6s.x">
                          {getStatusLabel(association.application_status)}
                        </span>
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600"
                      data-oid="ldgxlh1"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="wb9crkz"
                      >
                        <Car className="w-4 h-4" data-oid="5qo.uex" />
                        <span data-oid="kl1:iyk">
                          品牌: {association.brand?.name || "未知"}
                        </span>
                      </div>

                      {association.launch_year && (
                        <div
                          className="flex items-center gap-2"
                          data-oid="yau3_9b"
                        >
                          <Calendar className="w-4 h-4" data-oid="bagjq1t" />
                          <span data-oid="9yd091e">
                            上市年份: {association.launch_year}
                          </span>
                        </div>
                      )}

                      {association.implementation_date && (
                        <div
                          className="flex items-center gap-2"
                          data-oid="b30a20s"
                        >
                          <Calendar className="w-4 h-4" data-oid="comptd3" />
                          <span data-oid="8y41el-">
                            实施日期: {association.implementation_date}
                          </span>
                        </div>
                      )}

                      {association.notes && (
                        <div
                          className="flex items-start gap-2 md:col-span-2"
                          data-oid="s-etkpz"
                        >
                          <FileText
                            className="w-4 h-4 mt-0.5"
                            data-oid="8xy0zrj"
                          />

                          <span data-oid="q:qxx0m">
                            备注: {association.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 ml-4"
                    data-oid="wkqn3ar"
                  >
                    <button
                      onClick={() => openEditModal(association)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="编辑关联"
                      data-oid="g09rue5"
                    >
                      <Edit3 className="w-4 h-4" data-oid="l8:752v" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssociation(association.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="删除关联"
                      data-oid="n9oa4dy"
                    >
                      <Trash2 className="w-4 h-4" data-oid="tqv-bji" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加关联模态框 */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          data-oid="1ucyp:q"
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            data-oid="ogelj5w"
          >
            <div
              className="flex justify-between items-center mb-4"
              data-oid="2xa.u11"
            >
              <h3
                className="text-lg font-medium text-gray-900"
                data-oid="2:qivli"
              >
                添加车型关联
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
                data-oid="og.b:0z"
              >
                <X className="w-5 h-5" data-oid="yx_z2b4" />
              </button>
            </div>

            <div className="space-y-4" data-oid="5g-w27t">
              <div data-oid="9mf44ye">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="gqdc3k8"
                >
                  选择车型 *
                </label>
                <select
                  value={formData.carModelId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      carModelId: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  data-oid="kcu2w5s"
                >
                  <option value={0} data-oid="i9n:e3_">
                    请选择车型
                  </option>
                  {availableCarModels.map((model) => (
                    <option key={model.id} value={model.id} data-oid="35mn3b-">
                      {model.brand?.name} - {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div data-oid="nt9www-">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="mh.:b6w"
                >
                  应用状态
                </label>
                <select
                  value={formData.applicationStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicationStatus: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="sc6i28l"
                >
                  <option value="planned" data-oid="_x9olq5">
                    计划中
                  </option>
                  <option value="in_progress" data-oid="su_okur">
                    进行中
                  </option>
                  <option value="implemented" data-oid="h5z:u40">
                    已实施
                  </option>
                  <option value="cancelled" data-oid="aeto86j">
                    已取消
                  </option>
                </select>
              </div>

              <div data-oid="fsr99ni">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="tkmzf53"
                >
                  实施日期
                </label>
                <input
                  type="date"
                  value={formData.implementationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      implementationDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="3fs0:o7"
                />
              </div>

              <div data-oid="wlh3f6_">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="sji4k0y"
                >
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="添加备注信息..."
                  data-oid="zneejx_"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6" data-oid="mar2vr_">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-oid="ute_0gz"
              >
                取消
              </button>
              <button
                onClick={handleAddAssociation}
                disabled={loading || !formData.carModelId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-oid="ic3g.iz"
              >
                {loading ? "添加中..." : "添加关联"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑关联模态框 */}
      {showEditModal && editingAssociation && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          data-oid="7v38g7x"
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            data-oid="lp10qus"
          >
            <div
              className="flex justify-between items-center mb-4"
              data-oid="ug9pl_3"
            >
              <h3
                className="text-lg font-medium text-gray-900"
                data-oid="yj_sf-i"
              >
                编辑车型关联
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
                data-oid="j179-zt"
              >
                <X className="w-5 h-5" data-oid="q74p-ql" />
              </button>
            </div>

            <div className="space-y-4" data-oid="jn5.ouv">
              <div data-oid="_0:xbn4">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="5e..r9n"
                >
                  车型
                </label>
                <div
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                  data-oid="518o:u:"
                >
                  {editingAssociation.brand?.name} - {editingAssociation.name}
                </div>
              </div>

              <div data-oid="f6-do2e">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="6fea_4q"
                >
                  应用状态
                </label>
                <select
                  value={formData.applicationStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicationStatus: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="1-9:a0h"
                >
                  <option value="planned" data-oid="i_:iinu">
                    计划中
                  </option>
                  <option value="in_progress" data-oid="cd:btak">
                    进行中
                  </option>
                  <option value="implemented" data-oid="or8y9:r">
                    已实施
                  </option>
                  <option value="cancelled" data-oid="8hexh8e">
                    已取消
                  </option>
                </select>
              </div>

              <div data-oid="ilbjg0n">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="fx_wy:s"
                >
                  实施日期
                </label>
                <input
                  type="date"
                  value={formData.implementationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      implementationDate: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  data-oid="0wfi3vh"
                />
              </div>

              <div data-oid="0v2d9b.">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="2qiibgh"
                >
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="添加备注信息..."
                  data-oid="4mldydd"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6" data-oid="0yg4i1q">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                data-oid="stm:s9y"
              >
                取消
              </button>
              <button
                onClick={handleEditAssociation}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-oid="ttd5fz6"
              >
                {loading ? "更新中..." : "更新关联"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarModelAssociation;
