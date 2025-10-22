import React, { useState, useEffect } from "react";
import {
  X,
  Car,
  Calendar,
  Building2,
  Tag,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
  Gauge,
  Fuel,
  Zap,
  Target,
} from "lucide-react";
import { CarModel, CarModelStatus } from "../../types/carModel";
import { TechPoint } from "../../types/techPoint";
import { carModelService } from "../../services/carModelService";

interface CarModelDetailProps {
  carModel: CarModel;
  onClose: () => void;
  onEdit?: () => void;
}

const CarModelDetail: React.FC<CarModelDetailProps> = ({
  carModel,
  onClose,
  onEdit,
}) => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    specs: true,
    techPoints: true,
  });

  // 获取关联的技术点
  useEffect(() => {
    const fetchTechPoints = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await carModelService.getTechPoints(carModel.id);
        setTechPoints(response.data || []);
      } catch (err) {
        setError("获取关联技术点失败");
        console.error("Error fetching tech points:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechPoints();
  }, [carModel.id]);

  // 切换展开/收起状态
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 格式化状态显示
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

  // 格式化技术点类型
  const getTechPointTypeBadge = (type: string) => {
    const typeConfig = {
      feature: { label: "功能特性", className: "bg-blue-100 text-blue-800" },
      improvement: {
        label: "改进优化",
        className: "bg-green-100 text-green-800",
      },
      innovation: {
        label: "创新技术",
        className: "bg-purple-100 text-purple-800",
      },
      technology: {
        label: "核心技术",
        className: "bg-orange-100 text-orange-800",
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.feature;
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${config.className}`}
        data-oid="yujk5mt"
      >
        {config.label}
      </span>
    );
  };

  // 格式化技术点优先级
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: "高", className: "bg-red-100 text-red-800" },
      medium: { label: "中", className: "bg-yellow-100 text-yellow-800" },
      low: { label: "低", className: "bg-gray-100 text-gray-800" },
    };

    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig.medium;
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${config.className}`}
        data-oid="dr6yy9j"
      >
        {config.label}
      </span>
    );
  };

  const statusDisplay = getStatusDisplay(carModel.status);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-oid="bjjgxly"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        data-oid="jh5ahqu"
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          data-oid="btl25d0"
        >
          <div className="flex items-center gap-3" data-oid="r8wn_ny">
            <Car className="w-6 h-6 text-blue-600" data-oid="f:tpo2h" />
            <div data-oid="5e7_n:e">
              <h2
                className="text-xl font-bold text-gray-900"
                data-oid="o_h7c.u"
              >
                {carModel.name}
              </h2>
              <p className="text-sm text-gray-500" data-oid="e3q.efe">
                车型详情
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2" data-oid="7uekd4h">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                data-oid="k.qwtnu"
              >
                编辑
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              data-oid="jublsi0"
            >
              <X className="w-5 h-5" data-oid="0ntosdc" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6" data-oid="chv_kln">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4" data-oid="w0_br0k">
            <button
              onClick={() => toggleSection("basic")}
              className="flex items-center justify-between w-full text-left"
              data-oid="c159l9w"
            >
              <h3
                className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                data-oid="ofa-8ty"
              >
                <Info className="w-5 h-5" data-oid="i311s5y" />
                基本信息
              </h3>
              {expandedSections.basic ? (
                <ChevronDown
                  className="w-5 h-5 text-gray-400"
                  data-oid="7p:sik4"
                />
              ) : (
                <ChevronRight
                  className="w-5 h-5 text-gray-400"
                  data-oid="yba9h9:"
                />
              )}
            </button>

            {expandedSections.basic && (
              <div
                className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                data-oid="f7d-0o4"
              >
                <div className="space-y-3" data-oid="42m7jco">
                  <div className="flex items-center gap-2" data-oid="0yq1leh">
                    <Building2
                      className="w-4 h-4 text-gray-400"
                      data-oid="bt070_3"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="z5-.axu"
                    >
                      品牌：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="g1x29hx">
                      {carModel.brand?.name || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" data-oid="kn4hqjv">
                    <Tag className="w-4 h-4 text-gray-400" data-oid="lo1jw1g" />
                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="-q7fjhp"
                    >
                      类别：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="wbf.sm_">
                      {carModel.category || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" data-oid="1i8l0nj">
                    <Calendar
                      className="w-4 h-4 text-gray-400"
                      data-oid="tzrn807"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="q5.:tcd"
                    >
                      上市年份：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="2zdfatw">
                      {carModel.launch_year || "-"}
                    </span>
                  </div>

                  {carModel.end_year && (
                    <div className="flex items-center gap-2" data-oid="7.ix2c_">
                      <Calendar
                        className="w-4 h-4 text-gray-400"
                        data-oid="crnh:dm"
                      />

                      <span
                        className="text-sm font-medium text-gray-700"
                        data-oid="w7yvckk"
                      >
                        停产年份：
                      </span>
                      <span
                        className="text-sm text-gray-900"
                        data-oid="y5p8lvt"
                      >
                        {carModel.end_year}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3" data-oid="h28vzpd">
                  <div className="flex items-center gap-2" data-oid="qrbthpk">
                    <MapPin
                      className="w-4 h-4 text-gray-400"
                      data-oid="jqwnsz_"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="_:n8eq4"
                    >
                      细分市场：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="i4q-bn4">
                      {carModel.market_segment || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" data-oid="aye718n">
                    <Target
                      className="w-4 h-4 text-gray-400"
                      data-oid="m7g_fp_"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="03po-y_"
                    >
                      状态：
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}
                      data-oid="xn-.ej-"
                    >
                      {statusDisplay.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" data-oid="u2-kcas">
                    <Calendar
                      className="w-4 h-4 text-gray-400"
                      data-oid="lgf3js9"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="6gp3ne-"
                    >
                      创建时间：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="bidf5b7">
                      {new Date(carModel.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" data-oid="oolc7z:">
                    <Calendar
                      className="w-4 h-4 text-gray-400"
                      data-oid="_ffegnx"
                    />

                    <span
                      className="text-sm font-medium text-gray-700"
                      data-oid="a9qh64x"
                    >
                      更新时间：
                    </span>
                    <span className="text-sm text-gray-900" data-oid="776m-nr">
                      {new Date(carModel.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 元数据信息 */}
          {carModel.metadata && Object.keys(carModel.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4" data-oid="4lyg3.t">
              <button
                onClick={() => toggleSection("specs")}
                className="flex items-center justify-between w-full text-left"
                data-oid="qkpavsp"
              >
                <h3
                  className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                  data-oid="v35edf-"
                >
                  <Gauge className="w-5 h-5" data-oid="8jfnfbt" />
                  规格参数
                </h3>
                {expandedSections.specs ? (
                  <ChevronDown
                    className="w-5 h-5 text-gray-400"
                    data-oid="iww_ub8"
                  />
                ) : (
                  <ChevronRight
                    className="w-5 h-5 text-gray-400"
                    data-oid="82hv6wz"
                  />
                )}
              </button>

              {expandedSections.specs && (
                <div
                  className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                  data-oid="xv5bwan"
                >
                  {Object.entries(carModel.metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2"
                      data-oid="1_yyu0f"
                    >
                      <span
                        className="text-sm font-medium text-gray-700 capitalize"
                        data-oid="0lley9."
                      >
                        {key.replace(/_/g, " ")}：
                      </span>
                      <span
                        className="text-sm text-gray-900"
                        data-oid="5p5376j"
                      >
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 关联技术点 */}
          <div className="bg-gray-50 rounded-lg p-4" data-oid="sv6q_76">
            <button
              onClick={() => toggleSection("techPoints")}
              className="flex items-center justify-between w-full text-left"
              data-oid="u5pjhtc"
            >
              <h3
                className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                data-oid="u_oid5v"
              >
                <Zap className="w-5 h-5" data-oid="uo5v5js" />
                关联技术点
                <span
                  className="text-sm font-normal text-gray-500"
                  data-oid="uvclbl8"
                >
                  ({techPoints.length})
                </span>
              </h3>
              {expandedSections.techPoints ? (
                <ChevronDown
                  className="w-5 h-5 text-gray-400"
                  data-oid="ho_54et"
                />
              ) : (
                <ChevronRight
                  className="w-5 h-5 text-gray-400"
                  data-oid="7xy-r_."
                />
              )}
            </button>

            {expandedSections.techPoints && (
              <div className="mt-4" data-oid="0or9duc">
                {loading ? (
                  <div
                    className="flex items-center justify-center py-8"
                    data-oid="g72apcv"
                  >
                    <div
                      className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
                      data-oid="adz2nnh"
                    ></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8" data-oid="o16gv58">
                    <p className="text-sm text-red-600" data-oid="3mi3kws">
                      {error}
                    </p>
                  </div>
                ) : techPoints.length === 0 ? (
                  <div className="text-center py-8" data-oid="uqju6um">
                    <Zap
                      className="mx-auto h-8 w-8 text-gray-400"
                      data-oid="4x_ici:"
                    />

                    <p
                      className="mt-2 text-sm text-gray-500"
                      data-oid=":53ip.p"
                    >
                      暂无关联的技术点
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" data-oid="y_uuvh.">
                    {techPoints.map((techPoint) => (
                      <div
                        key={techPoint.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                        data-oid="od1gtvq"
                      >
                        <div
                          className="flex items-start justify-between"
                          data-oid="f-svjry"
                        >
                          <div className="flex-1" data-oid="ujj-m6i">
                            <div
                              className="flex items-center gap-2 mb-2"
                              data-oid="b_:8c3j"
                            >
                              <h4
                                className="text-sm font-medium text-gray-900"
                                data-oid="si9_meu"
                              >
                                {techPoint.name}
                              </h4>
                              {getTechPointTypeBadge(techPoint.type)}
                              {getPriorityBadge(techPoint.priority)}
                            </div>

                            {techPoint.description && (
                              <p
                                className="text-sm text-gray-600 mb-2"
                                data-oid="rwny1eo"
                              >
                                {techPoint.description}
                              </p>
                            )}

                            <div
                              className="flex items-center gap-4 text-xs text-gray-500"
                              data-oid="lexbg9l"
                            >
                              <span data-oid="fnuwu1p">ID: {techPoint.id}</span>
                              <span data-oid="32abo6q">
                                创建时间:{" "}
                                {new Date(
                                  techPoint.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            className="text-blue-600 hover:text-blue-800"
                            data-oid="2icihih"
                          >
                            <ExternalLink
                              className="w-4 h-4"
                              data-oid="7yjot30"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div
          className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50"
          data-oid="a1-amv3"
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            data-oid="6_8w9th"
          >
            关闭
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              data-oid="mj7lh9v"
            >
              编辑车型
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarModelDetail;
