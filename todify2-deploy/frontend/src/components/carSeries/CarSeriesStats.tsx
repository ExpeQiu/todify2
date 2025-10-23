import React from "react";
import { CarSeriesStats as StatsType } from "../../types/carSeries";
import { useCarSeriesStats } from "../../hooks/useCarSeries";

interface CarSeriesStatsProps {
  className?: string;
}

const CarSeriesStats: React.FC<CarSeriesStatsProps> = ({ className = "" }) => {
  const { stats, loading, error } = useCarSeriesStats();

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow p-6 ${className}`}
        data-oid="ek9s5-:"
      >
        <div className="animate-pulse" data-oid="is0qfan">
          <div
            className="h-4 bg-gray-200 rounded w-1/4 mb-4"
            data-oid="dh2ximu"
          ></div>
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            data-oid="0er7pz0"
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 rounded"
                data-oid="4ehpqgx"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className={`bg-white rounded-lg shadow p-6 ${className}`}
        data-oid=".bn63d_"
      >
        <div className="text-red-500 text-center" data-oid="8kwdojm">
          {error || "无法加载统计数据"}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "discontinued":
        return "bg-red-500";
      case "planned":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "在产";
      case "discontinued":
        return "停产";
      case "planned":
        return "计划中";
      default:
        return status;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 ${className}`}
      data-oid=":-d8k_1"
    >
      <h3
        className="text-lg font-semibold text-gray-900 mb-4"
        data-oid="k_.prfc"
      >
        车系统计
      </h3>

      {/* 总览 */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        data-oid="_w0.5ot"
      >
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
          data-oid="dw8r:sr"
        >
          <div className="text-2xl font-bold" data-oid="c69f4.j">
            {stats.total}
          </div>
          <div className="text-blue-100" data-oid="vy6hen5">
            车系总数
          </div>
        </div>

        <div
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
          data-oid="t_sn6jz"
        >
          <div className="text-2xl font-bold" data-oid="_rhq0qc">
            {stats.byStatus.active || 0}
          </div>
          <div className="text-green-100" data-oid="l2hqz35">
            在产车系
          </div>
        </div>

        <div
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
          data-oid="te750a9"
        >
          <div className="text-2xl font-bold" data-oid="ylpco8y">
            {Object.keys(stats.byBrand).length}
          </div>
          <div className="text-purple-100" data-oid="3f:m6h.">
            品牌数量
          </div>
        </div>

        <div
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
          data-oid="-tai4_b"
        >
          <div className="text-2xl font-bold" data-oid="xw3f2po">
            {Object.keys(stats.bySegment).length}
          </div>
          <div className="text-orange-100" data-oid="01oab9.">
            细分市场
          </div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-oid="f-56h16">
        {/* 按状态统计 */}
        <div data-oid="z_cx7uw">
          <h4
            className="text-sm font-medium text-gray-700 mb-3"
            data-oid="1d8wefn"
          >
            按状态分布
          </h4>
          <div className="space-y-2" data-oid="kvl5_ob">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between"
                data-oid="pvthil7"
              >
                <div className="flex items-center" data-oid="5bod93l">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(status)} mr-2`}
                    data-oid="p8be0-6"
                  ></div>
                  <span className="text-sm text-gray-600" data-oid="nfg1-s1">
                    {getStatusLabel(status)}
                  </span>
                </div>
                <span
                  className="text-sm font-medium text-gray-900"
                  data-oid="zv29v2h"
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 按品牌统计 */}
        <div data-oid="cwj-p92">
          <h4
            className="text-sm font-medium text-gray-700 mb-3"
            data-oid="84dg8kr"
          >
            按品牌分布
          </h4>
          <div
            className="space-y-2 max-h-32 overflow-y-auto"
            data-oid="bs0b2jd"
          >
            {Object.entries(stats.byBrand)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([brand, count]) => (
                <div
                  key={brand}
                  className="flex items-center justify-between"
                  data-oid="cy_uja3"
                >
                  <div className="flex items-center" data-oid="00.2dr6">
                    <div
                      className="w-3 h-3 rounded-full bg-blue-500 mr-2"
                      data-oid="nzxqab6"
                    ></div>
                    <span
                      className="text-sm text-gray-600 truncate"
                      title={brand}
                      data-oid="mi.bv4d"
                    >
                      {brand}
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium text-gray-900"
                    data-oid="s575b3g"
                  >
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* 按细分市场统计 */}
        <div data-oid="i2...1h">
          <h4
            className="text-sm font-medium text-gray-700 mb-3"
            data-oid="y6nfdmf"
          >
            按细分市场分布
          </h4>
          <div
            className="space-y-2 max-h-32 overflow-y-auto"
            data-oid="ug7dyor"
          >
            {Object.entries(stats.bySegment)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([segment, count]) => (
                <div
                  key={segment}
                  className="flex items-center justify-between"
                  data-oid="87ldlh:"
                >
                  <div className="flex items-center" data-oid="oyec1gh">
                    <div
                      className="w-3 h-3 rounded-full bg-purple-500 mr-2"
                      data-oid="f19dh2_"
                    ></div>
                    <span
                      className="text-sm text-gray-600 truncate"
                      title={segment}
                      data-oid="vhqfdzz"
                    >
                      {segment}
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium text-gray-900"
                    data-oid="x74t_.a"
                  >
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarSeriesStats;
