import React, { useState } from "react";
import {
  Edit,
  Trash2,
  Eye,
  Tag,
  Clock,
  User,
  BookOpen,
  Target,
  Lightbulb,
  FileText,
  Link,
} from "lucide-react";
import {
  KnowledgePoint,
  KnowledgeType,
  DifficultyLevel,
  KnowledgeStatus,
} from "../../types/knowledgePoint";

interface KnowledgePointListProps {
  knowledgePoints: KnowledgePoint[];
  onEdit: (knowledgePoint: KnowledgePoint) => void;
  onDelete: (id: number) => void;
  onView: (knowledgePoint: KnowledgePoint) => void;
  loading?: boolean;
}

const KnowledgePointList: React.FC<KnowledgePointListProps> = ({
  knowledgePoints,
  onEdit,
  onDelete,
  onView,
  loading = false,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // 切换展开状态
  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // 获取知识类型的显示文本和图标
  const getKnowledgeTypeInfo = (type: KnowledgeType) => {
    switch (type) {
      case KnowledgeType.CONCEPT:
        return {
          text: "概念",
          icon: BookOpen,
          color: "text-blue-600 bg-blue-100",
        };
      case KnowledgeType.PROCEDURE:
        return {
          text: "程序",
          icon: Target,
          color: "text-green-600 bg-green-100",
        };
      case KnowledgeType.PRINCIPLE:
        return {
          text: "原理",
          icon: Lightbulb,
          color: "text-yellow-600 bg-yellow-100",
        };
      case KnowledgeType.FACT:
        return {
          text: "事实",
          icon: FileText,
          color: "text-gray-600 bg-gray-100",
        };
      case KnowledgeType.EXAMPLE:
        return {
          text: "示例",
          icon: Eye,
          color: "text-purple-600 bg-purple-100",
        };
      default:
        return {
          text: "未知",
          icon: BookOpen,
          color: "text-gray-600 bg-gray-100",
        };
    }
  };

  // 获取难度级别的显示文本和颜色
  const getDifficultyInfo = (level: DifficultyLevel) => {
    switch (level) {
      case DifficultyLevel.BEGINNER:
        return { text: "初级", color: "text-green-600 bg-green-100" };
      case DifficultyLevel.INTERMEDIATE:
        return { text: "中级", color: "text-yellow-600 bg-yellow-100" };
      case DifficultyLevel.ADVANCED:
        return { text: "高级", color: "text-orange-600 bg-orange-100" };
      case DifficultyLevel.EXPERT:
        return { text: "专家", color: "text-red-600 bg-red-100" };
      default:
        return { text: "未知", color: "text-gray-600 bg-gray-100" };
    }
  };

  // 获取状态的显示文本和颜色
  const getStatusInfo = (status: KnowledgeStatus) => {
    switch (status) {
      case KnowledgeStatus.ACTIVE:
        return { text: "激活", color: "text-green-600 bg-green-100" };
      case KnowledgeStatus.INACTIVE:
        return { text: "未激活", color: "text-gray-600 bg-gray-100" };
      case KnowledgeStatus.DRAFT:
        return { text: "草稿", color: "text-yellow-600 bg-yellow-100" };
      case KnowledgeStatus.ARCHIVED:
        return { text: "已归档", color: "text-red-600 bg-red-100" };
      default:
        return { text: "未知", color: "text-gray-600 bg-gray-100" };
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  if (loading) {
    return (
      <div className="space-y-4" data-oid="b9s3_qv">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
            data-oid="q6bmqid"
          >
            <div
              className="h-6 bg-gray-200 rounded w-1/3 mb-4"
              data-oid="3e2px0r"
            ></div>
            <div
              className="h-4 bg-gray-200 rounded w-full mb-2"
              data-oid="0njiy:v"
            ></div>
            <div
              className="h-4 bg-gray-200 rounded w-2/3"
              data-oid="_-pnsuz"
            ></div>
          </div>
        ))}
      </div>
    );
  }

  if (knowledgePoints.length === 0) {
    return (
      <div className="text-center py-12" data-oid="5pwx614">
        <BookOpen
          className="w-12 h-12 text-gray-400 mx-auto mb-4"
          data-oid="fi:1h-9"
        />

        <p className="text-gray-500 text-lg" data-oid="-69qf.k">
          暂无知识点记录
        </p>
        <p className="text-gray-400 text-sm mt-2" data-oid="jacn.az">
          点击上方按钮创建第一个知识点
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-oid="bekq:n:">
      {knowledgePoints.map((knowledgePoint) => {
        const isExpanded = expandedItems.has(knowledgePoint.id);
        const typeInfo = getKnowledgeTypeInfo(knowledgePoint.knowledge_type);
        const difficultyInfo = getDifficultyInfo(
          knowledgePoint.difficulty_level,
        );
        const statusInfo = getStatusInfo(knowledgePoint.status);
        const TypeIcon = typeInfo.icon;

        return (
          <div
            key={knowledgePoint.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            data-oid="nmmwll8"
          >
            {/* 头部信息 */}
            <div className="p-6" data-oid="q1xrifq">
              <div
                className="flex items-start justify-between mb-4"
                data-oid=":bf17n:"
              >
                <div className="flex-1" data-oid="ru2jdjx">
                  <div
                    className="flex items-center gap-3 mb-2"
                    data-oid="iq_5xdc"
                  >
                    <div
                      className={`p-2 rounded-lg ${typeInfo.color}`}
                      data-oid="22h3yqc"
                    >
                      <TypeIcon className="w-4 h-4" data-oid="spaqq91" />
                    </div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      data-oid="n37u49h"
                    >
                      {knowledgePoint.title}
                    </h3>
                  </div>

                  {/* 标签和状态 */}
                  <div
                    className="flex items-center gap-2 mb-3"
                    data-oid="zrvonn3"
                  >
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}
                      data-oid="q66nbe8"
                    >
                      {typeInfo.text}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyInfo.color}`}
                      data-oid="spr5uhg"
                    >
                      {difficultyInfo.text}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}
                      data-oid="p._bl.9"
                    >
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* 内容预览 */}
                  <p
                    className="text-gray-600 text-sm line-clamp-2 mb-3"
                    data-oid="gavwog8"
                  >
                    {knowledgePoint.content}
                  </p>

                  {/* 标签 */}
                  {knowledgePoint.tags && knowledgePoint.tags.length > 0 && (
                    <div
                      className="flex items-center gap-2 mb-3"
                      data-oid=":ji.096"
                    >
                      <Tag
                        className="w-4 h-4 text-gray-400"
                        data-oid="dk4fkki"
                      />

                      <div className="flex flex-wrap gap-1" data-oid="0e:iiwn">
                        {knowledgePoint.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            data-oid=":uqg8cp"
                          >
                            {tag}
                          </span>
                        ))}
                        {knowledgePoint.tags.length > 3 && (
                          <span
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            data-oid=":n9flnf"
                          >
                            +{knowledgePoint.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 元信息 */}
                  <div
                    className="flex items-center gap-4 text-xs text-gray-500"
                    data-oid="72x8s_f"
                  >
                    {knowledgePoint.created_by && (
                      <div
                        className="flex items-center gap-1"
                        data-oid="gbh.8y-"
                      >
                        <User className="w-3 h-3" data-oid="y0n_s86" />
                        <span data-oid="6i8xvwp">
                          {knowledgePoint.created_by}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1" data-oid="v4i7bt:">
                      <Clock className="w-3 h-3" data-oid="0w9ayp5" />
                      <span data-oid="b.nok1t">
                        {formatDate(knowledgePoint.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div
                  className="flex items-center gap-2 ml-4"
                  data-oid="4lqn9kq"
                >
                  <button
                    onClick={() => onView(knowledgePoint)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看详情"
                    data-oid="casl20a"
                  >
                    <Eye className="w-4 h-4" data-oid="::e-j_4" />
                  </button>
                  <button
                    onClick={() => onEdit(knowledgePoint)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="编辑"
                    data-oid=".10mavm"
                  >
                    <Edit className="w-4 h-4" data-oid="g7s358k" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("确定要删除这个知识点吗？")) {
                        onDelete(knowledgePoint.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                    data-oid="h37lq.x"
                  >
                    <Trash2 className="w-4 h-4" data-oid="3xp3-92" />
                  </button>
                </div>
              </div>

              {/* 展开/收起按钮 */}
              <button
                onClick={() => toggleExpanded(knowledgePoint.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                data-oid="ab-2w2."
              >
                {isExpanded ? "收起详情" : "展开详情"}
              </button>
            </div>

            {/* 展开的详细信息 */}
            {isExpanded && (
              <div
                className="border-t border-gray-200 p-6 bg-gray-50"
                data-oid="i99edzh"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  data-oid="s8:56jx"
                >
                  {/* 前置条件 */}
                  {knowledgePoint.prerequisites &&
                    knowledgePoint.prerequisites.length > 0 && (
                      <div data-oid=".-24gzx">
                        <h4
                          className="font-medium text-gray-900 mb-2"
                          data-oid="e_yov44"
                        >
                          前置条件
                        </h4>
                        <ul className="space-y-1" data-oid="7xyum8k">
                          {knowledgePoint.prerequisites.map(
                            (prerequisite, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start gap-2"
                                data-oid="442h38r"
                              >
                                <span
                                  className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"
                                  data-oid="z_:_0j2"
                                ></span>
                                {prerequisite}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {/* 学习目标 */}
                  {knowledgePoint.learning_objectives &&
                    knowledgePoint.learning_objectives.length > 0 && (
                      <div data-oid="71f-w69">
                        <h4
                          className="font-medium text-gray-900 mb-2"
                          data-oid="-wmq:wb"
                        >
                          学习目标
                        </h4>
                        <ul className="space-y-1" data-oid="mw23jf5">
                          {knowledgePoint.learning_objectives.map(
                            (objective, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start gap-2"
                                data-oid="b9js8e-"
                              >
                                <span
                                  className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"
                                  data-oid="xqyapen"
                                ></span>
                                {objective}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                  {/* 示例 */}
                  {knowledgePoint.examples &&
                    knowledgePoint.examples.length > 0 && (
                      <div className="md:col-span-2" data-oid="4p5xak.">
                        <h4
                          className="font-medium text-gray-900 mb-2"
                          data-oid="eukx4s:"
                        >
                          示例
                        </h4>
                        <div className="space-y-3" data-oid="9f6yi:h">
                          {knowledgePoint.examples.map((example, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded border text-sm text-gray-600"
                              data-oid="tu5cjue"
                            >
                              <pre
                                className="whitespace-pre-wrap font-mono"
                                data-oid="b9xlgtt"
                              >
                                {example}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 参考资料 */}
                  {knowledgePoint.references &&
                    knowledgePoint.references.length > 0 && (
                      <div className="md:col-span-2" data-oid="gxues6u">
                        <h4
                          className="font-medium text-gray-900 mb-2"
                          data-oid="pe-5260"
                        >
                          参考资料
                        </h4>
                        <ul className="space-y-1" data-oid="bn65q08">
                          {knowledgePoint.references.map((reference, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-600 flex items-start gap-2"
                              data-oid="95p:6hf"
                            >
                              <Link
                                className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                                data-oid="14_pw6k"
                              />

                              {reference.startsWith("http") ? (
                                <a
                                  href={reference}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  data-oid="ng.wy-o"
                                >
                                  {reference}
                                </a>
                              ) : (
                                <span data-oid="i.5t1uy">{reference}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KnowledgePointList;
