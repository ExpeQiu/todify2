import React, { useState, useEffect } from "react";
import {
  Package,
  Target,
  FileText,
  Mic,
  Car,
  Calendar,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  BookOpen,
  Plus,
} from "lucide-react";
import { TechPoint } from "../../types/techPoint";
import { CarModel } from "../../types/carModel";
import { KnowledgePoint } from "../../types/knowledgePoint";
import { techPointService } from "../../services/techPointService";
import { knowledgePointService } from "../../services/knowledgePointService";
import CarModelAssociation from "./CarModelAssociation";
import KnowledgePointManager from "../knowledgePoint/KnowledgePointManager";

interface TechPointDetailProps {
  techPoint: TechPoint;
  onClose: () => void;
}

interface AssociatedContent {
  packagingMaterials: any[];
  promotionStrategies: any[];
  pressReleases: any[];
  speeches: any[];
}

const TechPointDetail: React.FC<TechPointDetailProps> = ({
  techPoint,
  onClose,
}) => {
  const [associatedContent, setAssociatedContent] =
    useState<AssociatedContent | null>(null);
  const [associatedCarModels, setAssociatedCarModels] = useState<CarModel[]>(
    [],
  );
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    knowledgePoints: true,
    packaging: false,
    promotion: false,
    press: false,
    speeches: false,
    carModels: false,
  });

  useEffect(() => {
    fetchAssociatedData();
    fetchKnowledgePoints();
  }, [techPoint.id]);

  const fetchKnowledgePoints = async () => {
    try {
      const response = await knowledgePointService.getByTechPointId(
        techPoint.id,
        {
          page: 1,
          pageSize: 100,
        },
      );

      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (err) {
      console.error("获取知识点失败:", err);
    }
  };

  const fetchAssociatedData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [contentResponse, carModelsResponse] = await Promise.all([
        techPointService.getTechPointAssociatedContent(techPoint.id),
        techPointService.getTechPointAssociatedCarModels(techPoint.id),
      ]);

      if (contentResponse.success && contentResponse.data) {
        setAssociatedContent(contentResponse.data);
      }

      if (carModelsResponse.success && carModelsResponse.data) {
        setAssociatedCarModels(carModelsResponse.data);
      }
    } catch (err) {
      setError("获取关联数据失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "bg-blue-100 text-blue-800";
      case "performance":
        return "bg-purple-100 text-purple-800";
      case "safety":
        return "bg-orange-100 text-orange-800";
      case "comfort":
        return "bg-teal-100 text-teal-800";
      case "technology":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderContentSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    sectionKey: string,
    renderItem: (item: any, index: number) => React.ReactNode,
  ) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        data-oid="o38by0u"
      >
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          data-oid="5wsvzuh"
        >
          <div className="flex items-center gap-3" data-oid="0xs8a8x">
            <div className="p-2 bg-blue-50 rounded-lg" data-oid="z_5ac:j">
              {icon}
            </div>
            <div className="text-left" data-oid="v5203t1">
              <h3
                className="text-lg font-semibold text-gray-900"
                data-oid="yn7wqdw"
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500" data-oid="h1gdq-e">
                {items.length} 项内容
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" data-oid="fu3e_f4" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" data-oid="x77wk7y" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 p-6" data-oid="39rigqw">
            {items.length > 0 ? (
              <div className="space-y-4" data-oid="5dsa_n0">
                {items.map((item, index) => renderItem(item, index))}
              </div>
            ) : (
              <div
                className="text-center py-8 text-gray-500"
                data-oid="k9q:h8m"
              >
                <Info
                  className="w-8 h-8 mx-auto mb-2 text-gray-300"
                  data-oid="ujie16q"
                />

                <p data-oid="c_sd-05">暂无相关内容</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        data-oid="-7mqrti"
      >
        <div
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
          data-oid="1xo6m.e"
        >
          <div className="flex items-center justify-center" data-oid=".rky_l7">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
              data-oid="-liw7.c"
            ></div>
            <span className="ml-3 text-gray-600" data-oid="64ht1ny">
              加载中...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        data-oid="_qztjri"
      >
        <div
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
          data-oid="8hyuu8v"
        >
          <div className="text-center" data-oid=":9jz4x3">
            <div className="text-red-600 mb-4" data-oid="-ofqeex">
              <Info className="w-12 h-12 mx-auto" data-oid="wg72c9o" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-2"
              data-oid=":x1gd1a"
            >
              加载失败
            </h3>
            <p className="text-gray-600 mb-4" data-oid="jg07-:2">
              {error}
            </p>
            <div className="flex gap-3 justify-center" data-oid="rgozhe2">
              <button
                onClick={fetchAssociatedData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                data-oid="odxp-4c"
              >
                重试
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                data-oid="jnk152l"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-oid=":v:fg5b"
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        data-oid="ioco9-o"
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
          data-oid="1uwpidw"
        >
          <div className="flex items-center gap-4" data-oid="3rqh_nn">
            <div className="p-2 bg-blue-50 rounded-lg" data-oid="kt9iz6_">
              <Target className="w-6 h-6 text-blue-600" data-oid="7k7n.s:" />
            </div>
            <div data-oid="xix:_nc">
              <h2
                className="text-xl font-semibold text-gray-900"
                data-oid="maz110a"
              >
                {techPoint.name}
              </h2>
              <div className="flex items-center gap-2 mt-1" data-oid="lpku:xs">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(techPoint.type)}`}
                  data-oid="w33wy1o"
                >
                  {techPoint.type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(techPoint.priority)}`}
                  data-oid=".lc2yb."
                >
                  {techPoint.priority}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(techPoint.status)}`}
                  data-oid="t2aga:2"
                >
                  {techPoint.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            data-oid="6q5x8:m"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-oid="4bm9.uv"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
                data-oid="8yj-5-n"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" data-oid="kuf.2nw">
          <div className="space-y-6" data-oid=".4djx4m">
            {/* Basic Info */}
            <div
              className="bg-white rounded-lg border border-gray-200 p-6"
              data-oid="tbl4jy6"
            >
              <h3
                className="text-lg font-semibold text-gray-900 mb-4"
                data-oid="2crrfz4"
              >
                基本信息
              </h3>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-oid=":7yt57s"
              >
                <div data-oid="ja6nkjm">
                  <label
                    className="text-sm font-medium text-gray-500"
                    data-oid="txpv_9g"
                  >
                    技术点名称
                  </label>
                  <p className="text-gray-900 mt-1" data-oid="ql:v4mf">
                    {techPoint.name}
                  </p>
                </div>
                <div data-oid=":9sb_42">
                  <label
                    className="text-sm font-medium text-gray-500"
                    data-oid="0d-8bqw"
                  >
                    分类
                  </label>
                  <p className="text-gray-900 mt-1" data-oid="zhm:iy4">
                    {techPoint.category?.name || "未分类"}
                  </p>
                </div>
                <div data-oid="t6sbd.6">
                  <label
                    className="text-sm font-medium text-gray-500"
                    data-oid="d9brqp:"
                  >
                    创建时间
                  </label>
                  <p
                    className="text-gray-900 mt-1 flex items-center gap-2"
                    data-oid="afik328"
                  >
                    <Clock
                      className="w-4 h-4 text-gray-400"
                      data-oid="r-yp_ix"
                    />

                    {formatDate(techPoint.created_at)}
                  </p>
                </div>
                <div data-oid="z0eelnq">
                  <label
                    className="text-sm font-medium text-gray-500"
                    data-oid="qat_iv-"
                  >
                    更新时间
                  </label>
                  <p
                    className="text-gray-900 mt-1 flex items-center gap-2"
                    data-oid="h12p8bn"
                  >
                    <Clock
                      className="w-4 h-4 text-gray-400"
                      data-oid="q:w4gl8"
                    />

                    {formatDate(techPoint.updated_at)}
                  </p>
                </div>
              </div>
              {techPoint.description && (
                <div className="mt-4" data-oid="wpnb_ik">
                  <label
                    className="text-sm font-medium text-gray-500"
                    data-oid="89nx1yq"
                  >
                    描述
                  </label>
                  <p className="text-gray-900 mt-1" data-oid="cq7n2n:">
                    {techPoint.description}
                  </p>
                </div>
              )}
            </div>

            {/* Knowledge Points Section */}
            <div
              className="bg-white rounded-lg border border-gray-200"
              data-oid="qe.90qs"
            >
              <button
                onClick={() => toggleSection("knowledgePoints")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                data-oid="aukldh."
              >
                <div className="flex items-center gap-3" data-oid="q_g91hh">
                  <div
                    className="p-2 bg-purple-50 rounded-lg"
                    data-oid="3-.m23h"
                  >
                    <BookOpen
                      className="w-5 h-5 text-purple-600"
                      data-oid="9l_vfls"
                    />
                  </div>
                  <div className="text-left" data-oid="4h1:.f4">
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      data-oid="41iso9h"
                    >
                      知识点记录
                    </h3>
                    <p className="text-sm text-gray-500" data-oid="08_2tqd">
                      管理技术点相关的知识点内容
                    </p>
                  </div>
                </div>
                {expandedSections.knowledgePoints ? (
                  <ChevronUp
                    className="w-5 h-5 text-gray-400"
                    data-oid="ye7enfi"
                  />
                ) : (
                  <ChevronDown
                    className="w-5 h-5 text-gray-400"
                    data-oid="cgy-wec"
                  />
                )}
              </button>

              {expandedSections.knowledgePoints && (
                <div
                  className="border-t border-gray-200 p-6"
                  data-oid="ys1hzj-"
                >
                  <KnowledgePointManager
                    techPointId={techPoint.id}
                    techPointName={techPoint.name}
                    data-oid="8bjk9qb"
                  />
                </div>
              )}
            </div>

            {/* Associated Content Sections */}
            {associatedContent && (
              <>
                {renderContentSection(
                  "包装材料",
                  <Package
                    className="w-5 h-5 text-blue-600"
                    data-oid="ixuuwv4"
                  />,

                  associatedContent.packagingMaterials,
                  "packaging",
                  (item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                      data-oid="4fo:cik"
                    >
                      <div
                        className="flex items-start justify-between"
                        data-oid="ux2v-.:"
                      >
                        <div className="flex-1" data-oid="fb-y9qo">
                          <h4
                            className="font-medium text-gray-900"
                            data-oid="m53jt_t"
                          >
                            {item.title}
                          </h4>
                          <p
                            className="text-sm text-gray-600 mt-1"
                            data-oid="6187i7q"
                          >
                            {item.description}
                          </p>
                          <div
                            className="flex items-center gap-4 mt-2 text-xs text-gray-500"
                            data-oid="ovqn2js"
                          >
                            <span data-oid="09kqofn">类型: {item.type}</span>
                            <span data-oid="yqu9:65">状态: {item.status}</span>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            data-oid="xu_8pgg"
                          >
                            <ExternalLink
                              className="w-4 h-4"
                              data-oid="r2d:dq7"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  ),
                )}

                {renderContentSection(
                  "推广策略",
                  <Target
                    className="w-5 h-5 text-blue-600"
                    data-oid="oo2wie8"
                  />,

                  associatedContent.promotionStrategies,
                  "promotion",
                  (item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                      data-oid="4c5w-n2"
                    >
                      <div
                        className="flex items-start justify-between"
                        data-oid="3ha-67n"
                      >
                        <div className="flex-1" data-oid="wtqfwk-">
                          <h4
                            className="font-medium text-gray-900"
                            data-oid="7_lyzpl"
                          >
                            {item.title}
                          </h4>
                          <p
                            className="text-sm text-gray-600 mt-1"
                            data-oid="12ep:t4"
                          >
                            {item.description}
                          </p>
                          <div
                            className="flex items-center gap-4 mt-2 text-xs text-gray-500"
                            data-oid="yfxzw._"
                          >
                            <span data-oid="dq7h1cp">目标: {item.target}</span>
                            <span data-oid="d736gxz">预算: {item.budget}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {renderContentSection(
                  "新闻稿",
                  <FileText
                    className="w-5 h-5 text-blue-600"
                    data-oid="ijbgv_:"
                  />,

                  associatedContent.pressReleases,
                  "press",
                  (item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                      data-oid="togtpl8"
                    >
                      <div
                        className="flex items-start justify-between"
                        data-oid="0hq42g0"
                      >
                        <div className="flex-1" data-oid="y9daqt.">
                          <h4
                            className="font-medium text-gray-900"
                            data-oid="6_c_yd."
                          >
                            {item.title}
                          </h4>
                          <p
                            className="text-sm text-gray-600 mt-1"
                            data-oid="s4lob91"
                          >
                            {item.summary}
                          </p>
                          <div
                            className="flex items-center gap-4 mt-2 text-xs text-gray-500"
                            data-oid="0i9mobe"
                          >
                            <span data-oid="i9otsf0">
                              发布日期: {formatDate(item.publishDate)}
                            </span>
                            <span data-oid="73ssp8_">媒体: {item.media}</span>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            data-oid="rvwh4cc"
                          >
                            <ExternalLink
                              className="w-4 h-4"
                              data-oid="av7kp6w"
                            />
                          </a>
                        )}
                      </div>
                    </div>
                  ),
                )}

                {renderContentSection(
                  "演讲内容",
                  <Mic className="w-5 h-5 text-blue-600" data-oid="6yp1c.u" />,
                  associatedContent.speeches,
                  "speeches",
                  (item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                      data-oid="md8qeby"
                    >
                      <div
                        className="flex items-start justify-between"
                        data-oid="ya4hpmm"
                      >
                        <div className="flex-1" data-oid="s8-p2c7">
                          <h4
                            className="font-medium text-gray-900"
                            data-oid="wv-883y"
                          >
                            {item.title}
                          </h4>
                          <p
                            className="text-sm text-gray-600 mt-1"
                            data-oid="vci8zjf"
                          >
                            {item.summary}
                          </p>
                          <div
                            className="flex items-center gap-4 mt-2 text-xs text-gray-500"
                            data-oid=".vos752"
                          >
                            <span data-oid=".x6lfws">
                              演讲者: {item.speaker}
                            </span>
                            <span data-oid="_jmwoue">
                              日期: {formatDate(item.date)}
                            </span>
                            <span data-oid="zwduamf">地点: {item.venue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </>
            )}

            {/* Car Model Association */}
            <div
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              data-oid="53t_tfl"
            >
              <button
                onClick={() => toggleSection("carModels")}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                data-oid="1xxbip6"
              >
                <div className="flex items-center gap-3" data-oid="6w8miih">
                  <div className="p-2 bg-blue-50 rounded-lg" data-oid="so41.28">
                    <Car className="w-5 h-5 text-blue-600" data-oid="ossf.1v" />
                  </div>
                  <div className="text-left" data-oid="i906lhy">
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      data-oid="ttee6y6"
                    >
                      关联车型管理
                    </h3>
                    <p className="text-sm text-gray-500" data-oid="2__.5jd">
                      管理技术点与车型的关联关系
                    </p>
                  </div>
                </div>
                {expandedSections.carModels ? (
                  <ChevronUp
                    className="w-5 h-5 text-gray-400"
                    data-oid="hwq8kg-"
                  />
                ) : (
                  <ChevronDown
                    className="w-5 h-5 text-gray-400"
                    data-oid="0qjwi6r"
                  />
                )}
              </button>

              {expandedSections.carModels && (
                <div
                  className="border-t border-gray-200 p-6"
                  data-oid="3aq0e6t"
                >
                  <CarModelAssociation
                    techPointId={techPoint.id}
                    onUpdate={fetchAssociatedData}
                    data-oid="1-c1gy5"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechPointDetail;
