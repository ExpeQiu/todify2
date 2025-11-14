import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Tag,
  Info,
  Car,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CarSeries, CarSeriesStatus } from "../../types/carSeries";
import { TechPoint } from "../../types/techPoint";
import { carSeriesService } from "../../services/carSeriesService";

interface CarSeriesDetailProps {
  carSeries: CarSeries;
  onClose: () => void;
}

const CarSeriesDetail: React.FC<CarSeriesDetailProps> = ({
  carSeries,
  onClose,
}) => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    specs: false,
    techPoints: false,
  });

  useEffect(() => {
    fetchTechPoints();
  }, [carSeries.id]);

  const fetchTechPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      // 暂时使用空数组，等待后端API实现
      setTechPoints([]);
    } catch (error) {
      console.error("获取技术点失败:", error);
      setError("获取技术点失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  const getTechPointTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      engine: "bg-red-100 text-red-800",
      transmission: "bg-blue-100 text-blue-800",
      chassis: "bg-green-100 text-green-800",
      body: "bg-yellow-100 text-yellow-800",
      interior: "bg-purple-100 text-purple-800",
      safety: "bg-orange-100 text-orange-800",
      technology: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };

    return typeColors[type] || typeColors["other"];
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-oid="h2xgpvu"
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        data-oid="mdwqzb."
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          data-oid="x2k_9x7"
        >
          <div data-oid="yv8k5.a">
            <h2
              className="text-xl font-semibold text-gray-900"
              data-oid=":ifdulw"
            >
              {carSeries.model?.brand?.name || "未知品牌"} -{" "}
              {carSeries.model?.name || "未知车型"} - {carSeries.name}
            </h2>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getStatusColor(carSeries.status)}`}
              data-oid="3._7k8f"
            >
              {getStatusLabel(carSeries.status)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-oid="h0_hvgu"
          >
            <X className="w-5 h-5" data-oid="nnb9b59" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6" data-oid="88d_5ml">
          {/* 基本信息 */}
          <div className="border border-gray-200 rounded-lg" data-oid="895kmge">
            <button
              onClick={() => toggleSection("basicInfo")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              data-oid="6xx-oi_"
            >
              <h3
                className="text-lg font-medium text-gray-900 flex items-center gap-2"
                data-oid="-.tikqu"
              >
                <Info className="w-5 h-5" data-oid="v.x1oqf" />
                基本信息
              </h3>
              {expandedSections.basicInfo ? (
                <ChevronDown
                  className="w-5 h-5 text-gray-500"
                  data-oid="pxe31u2"
                />
              ) : (
                <ChevronRight
                  className="w-5 h-5 text-gray-500"
                  data-oid="nldumkv"
                />
              )}
            </button>

            {expandedSections.basicInfo && (
              <div
                className="px-4 pb-4 border-t border-gray-200"
                data-oid="m3-fgsn"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                  data-oid="8k:ehct"
                >
                  <div data-oid="7rj:f.p">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="k8q6.ma"
                    >
                      品牌
                    </label>
                    <p className="text-sm text-gray-900" data-oid="97:mh.g">
                      {carSeries.model?.brand?.name || "未知品牌"}
                    </p>
                  </div>
                  <div data-oid="f.q4rmj">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="o0db1-9"
                    >
                      车型
                    </label>
                    <p className="text-sm text-gray-900" data-oid="m-eonx7">
                      {carSeries.model?.name || "未知车型"}
                    </p>
                  </div>
                  <div data-oid="kx3vnlu">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="oetdhgy"
                    >
                      车系名称
                    </label>
                    <p className="text-sm text-gray-900" data-oid="gcdzet2">
                      {carSeries.name}
                    </p>
                  </div>
                  <div data-oid="vd2.7bi">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="ovmh7_y"
                    >
                      细分市场
                    </label>
                    <p className="text-sm text-gray-900" data-oid="gflv.zh">
                      {carSeries.market_segment || "-"}
                    </p>
                  </div>
                  <div data-oid="d55-pzv">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="l7au:mj"
                    >
                      上市年份
                    </label>
                    <p className="text-sm text-gray-900" data-oid="ktw_kdw">
                      {carSeries.launch_year || "-"}
                    </p>
                  </div>
                  <div data-oid="8mxin5_">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="szygn77"
                    >
                      停产年份
                    </label>
                    <p className="text-sm text-gray-900" data-oid="b.-q_59">
                      {carSeries.end_year || "-"}
                    </p>
                  </div>
                  <div data-oid="pjg_lg7">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="imv0d6t"
                    >
                      状态
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(carSeries.status)}`}
                      data-oid="fg598sm"
                    >
                      {getStatusLabel(carSeries.status)}
                    </span>
                  </div>
                </div>

                {/* 描述信息 */}
                {carSeries.description && (
                  <div className="mt-4" data-oid="lthac0t">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-1"
                      data-oid="0hdlfs9"
                    >
                      描述
                    </label>
                    <div
                      className="bg-gray-50 rounded-lg p-3"
                      data-oid="rxl-str"
                    >
                      <p
                        className="text-sm text-gray-700 whitespace-pre-wrap"
                        data-oid="qyr3ydx"
                      >
                        {carSeries.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 规格参数 (metadata) */}
          {carSeries.metadata && Object.keys(carSeries.metadata).length > 0 && (
            <div
              className="border border-gray-200 rounded-lg"
              data-oid="bvl_r4f"
            >
              <button
                onClick={() => toggleSection("specs")}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                data-oid="hj7tsc-"
              >
                <h3
                  className="text-lg font-medium text-gray-900 flex items-center gap-2"
                  data-oid="9th7ie1"
                >
                  <Tag className="w-5 h-5" data-oid="5t-mrxr" />
                  规格参数
                </h3>
                {expandedSections.specs ? (
                  <ChevronDown
                    className="w-5 h-5 text-gray-500"
                    data-oid="pw633n6"
                  />
                ) : (
                  <ChevronRight
                    className="w-5 h-5 text-gray-500"
                    data-oid="wm1cte0"
                  />
                )}
              </button>

              {expandedSections.specs && (
                <div
                  className="px-4 pb-4 border-t border-gray-200"
                  data-oid="9yrau4f"
                >
                  <div
                    className="bg-gray-50 rounded-lg p-4 mt-4"
                    data-oid="xbu9yx3"
                  >
                    <pre
                      className="text-sm text-gray-700 whitespace-pre-wrap"
                      data-oid="uu2dkwh"
                    >
                      {JSON.stringify(carSeries.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 技术点 */}
          <div className="border border-gray-200 rounded-lg" data-oid="9c24r3p">
            <button
              onClick={() => toggleSection("techPoints")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              data-oid="ukihbe8"
            >
              <h3
                className="text-lg font-medium text-gray-900 flex items-center gap-2"
                data-oid="1dd.n1n"
              >
                <Car className="w-5 h-5" data-oid="m_5svna" />
                技术点 ({techPoints.length})
              </h3>
              {expandedSections.techPoints ? (
                <ChevronDown
                  className="w-5 h-5 text-gray-500"
                  data-oid="5i-7obw"
                />
              ) : (
                <ChevronRight
                  className="w-5 h-5 text-gray-500"
                  data-oid="fel--0n"
                />
              )}
            </button>

            {expandedSections.techPoints && (
              <div
                className="px-4 pb-4 border-t border-gray-200"
                data-oid="hpe-irs"
              >
                {loading ? (
                  <div
                    className="flex items-center justify-center py-8"
                    data-oid=".x5mu3."
                  >
                    <div
                      className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
                      data-oid="ex0hzxs"
                    ></div>
                    <span className="ml-2 text-gray-600" data-oid=".bnqnam">
                      加载技术点...
                    </span>
                  </div>
                ) : error ? (
                  <div
                    className="text-center py-8 text-red-600"
                    data-oid="hxto12_"
                  >
                    {error}
                  </div>
                ) : techPoints.length === 0 ? (
                  <div
                    className="text-center py-8 text-gray-500"
                    data-oid="ppq8.oy"
                  >
                    暂无技术点数据
                  </div>
                ) : (
                  <div className="space-y-3 mt-4" data-oid="kme_aze">
                    {techPoints.map((techPoint) => (
                      <div
                        key={techPoint.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                        data-oid="6nn0k76"
                      >
                        <div
                          className="flex items-start justify-between mb-2"
                          data-oid=".cuyyrv"
                        >
                          <h4
                            className="font-medium text-gray-900"
                            data-oid="6ktg-.-"
                          >
                            {techPoint.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTechPointTypeBadge(techPoint.type)}`}
                            data-oid="c-od0.9"
                          >
                            {techPoint.type}
                          </span>
                        </div>
                        {techPoint.description && (
                          <p
                            className="text-sm text-gray-600 mb-2"
                            data-oid="i-8_1l9"
                          >
                            {techPoint.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 时间信息 */}
          <div data-oid="38rt.p5">
            <h3
              className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2"
              data-oid="4x-78-f"
            >
              <Calendar className="w-5 h-5" data-oid="l9:gw8r" />
              时间信息
            </h3>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-oid="-oqeab."
            >
              <div data-oid="vom4_6z">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="to9txr7"
                >
                  创建时间
                </label>
                <p className="text-sm text-gray-900" data-oid="oj_zv0f">
                  {carSeries.created_at
                    ? new Date(carSeries.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div data-oid=":62xakz">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  data-oid="601odpa"
                >
                  更新时间
                </label>
                <p className="text-sm text-gray-900" data-oid="6s76dvr">
                  {carSeries.updated_at
                    ? new Date(carSeries.updated_at).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesDetail;
