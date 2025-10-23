import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Target,
  Lightbulb,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import {
  KnowledgePoint,
  KnowledgeType,
  DifficultyLevel,
  KnowledgeStatus,
  CreateKnowledgePointFormData,
  UpdateKnowledgePointFormData,
} from "../../types/knowledgePoint";
import { knowledgePointService } from "../../services/knowledgePointService";

interface KnowledgePointManagerProps {
  techPointId: number;
  techPointName: string;
}

interface FormData extends CreateKnowledgePointFormData {
  id?: number;
}

const KnowledgePointManager: React.FC<KnowledgePointManagerProps> = ({
  techPointId,
  techPointName,
}) => {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPoint, setEditingPoint] = useState<KnowledgePoint | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<KnowledgeType | "">("");
  const [filterDifficulty, setFilterDifficulty] = useState<
    DifficultyLevel | ""
  >("");
  const [expandedPoints, setExpandedPoints] = useState<Set<number>>(new Set());

  const [formData, setFormData] = useState<FormData>({
    tech_point_id: techPointId,
    title: "",
    content: "",
    knowledge_type: KnowledgeType.CONCEPT,
    difficulty_level: DifficultyLevel.BEGINNER,
    tags: [],
    prerequisites: [],
    learning_objectives: [],
    examples: [],
    references: [],
    status: KnowledgeStatus.ACTIVE,
  });

  useEffect(() => {
    fetchKnowledgePoints();
  }, [techPointId]);

  const fetchKnowledgePoints = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await knowledgePointService.getByTechPointId(
        techPointId,
        {
          page: 1,
          pageSize: 100,
        },
      );

      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (err) {
      setError("获取知识点列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPoint) {
        // 更新知识点
        const { tech_point_id, id, ...updateData } = formData;

        const response = await knowledgePointService.update(
          editingPoint.id,
          updateData as UpdateKnowledgePointFormData,
        );
        if (response.success) {
          await fetchKnowledgePoints();
          resetForm();
        }
      } else {
        // 创建新知识点
        const { id, ...createData } = formData;
        const response = await knowledgePointService.create(
          createData as CreateKnowledgePointFormData,
        );
        if (response.success) {
          await fetchKnowledgePoints();
          resetForm();
        }
      }
    } catch (err) {
      setError(editingPoint ? "更新知识点失败" : "创建知识点失败");
    }
  };

  const handleEdit = (point: KnowledgePoint) => {
    setEditingPoint(point);
    setFormData({
      id: point.id,
      tech_point_id: point.tech_point_id,
      title: point.title,
      content: point.content,
      knowledge_type: point.knowledge_type,
      difficulty_level: point.difficulty_level,
      tags: point.tags || [],
      prerequisites: point.prerequisites || [],
      learning_objectives: point.learning_objectives || [],
      examples: point.examples || [],
      references: point.references || [],
      status: point.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个知识点吗？")) return;

    try {
      const response = await knowledgePointService.delete(id);
      if (response.success) {
        await fetchKnowledgePoints();
      }
    } catch (err) {
      setError("删除知识点失败");
    }
  };

  const resetForm = () => {
    setFormData({
      tech_point_id: techPointId,
      title: "",
      content: "",
      knowledge_type: KnowledgeType.CONCEPT,
      difficulty_level: DifficultyLevel.BEGINNER,
      tags: [],
      prerequisites: [],
      learning_objectives: [],
      examples: [],
      references: [],
      status: KnowledgeStatus.ACTIVE,
    });
    setEditingPoint(null);
    setShowForm(false);
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedPoints);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPoints(newExpanded);
  };

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

  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case DifficultyLevel.BEGINNER:
        return "text-green-600 bg-green-100";
      case DifficultyLevel.INTERMEDIATE:
        return "text-yellow-600 bg-yellow-100";
      case DifficultyLevel.ADVANCED:
        return "text-orange-600 bg-orange-100";
      case DifficultyLevel.EXPERT:
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredPoints = knowledgePoints.filter((point) => {
    const matchesSearch =
      point.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || point.knowledge_type === filterType;
    const matchesDifficulty =
      !filterDifficulty || point.difficulty_level === filterDifficulty;

    return matchesSearch && matchesType && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" data-oid="t6pha1e">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          data-oid="1.ec1:l"
        ></div>
        <span className="ml-3 text-gray-600" data-oid="j:e74v4">
          加载知识点...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-oid="_rt4rb.">
      {/* Header */}
      <div className="flex items-center justify-between" data-oid="sc:n5up">
        <div data-oid="c4bgmmh">
          <h3
            className="text-lg font-semibold text-gray-900"
            data-oid=":41q6q5"
          >
            知识点记录
          </h3>
          <p className="text-sm text-gray-500" data-oid="x5yylz1">
            管理 "{techPointName}" 的相关知识点
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-oid="u9r6nt6"
        >
          <Plus className="w-4 h-4" data-oid="iaujraf" />
          添加知识点
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4" data-oid="2cq5:vf">
        <div className="flex-1 relative" data-oid=":1urald">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            data-oid="vwxzl7c"
          />

          <input
            type="text"
            placeholder="搜索知识点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-oid="kr6xsvy"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as KnowledgeType | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-oid="o_um21d"
        >
          <option value="" data-oid=".1trtac">
            所有类型
          </option>
          <option value={KnowledgeType.CONCEPT} data-oid="p-ik2ye">
            概念
          </option>
          <option value={KnowledgeType.PROCEDURE} data-oid="3-lx.rj">
            程序
          </option>
          <option value={KnowledgeType.PRINCIPLE} data-oid="1voo74v">
            原理
          </option>
          <option value={KnowledgeType.FACT} data-oid="u6c1s.0">
            事实
          </option>
          <option value={KnowledgeType.EXAMPLE} data-oid="lis_w:0">
            示例
          </option>
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) =>
            setFilterDifficulty(e.target.value as DifficultyLevel | "")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          data-oid="59xpfpy"
        >
          <option value="" data-oid="y653.j6">
            所有难度
          </option>
          <option value={DifficultyLevel.BEGINNER} data-oid="mhaducc">
            初级
          </option>
          <option value={DifficultyLevel.INTERMEDIATE} data-oid="tlfe5kg">
            中级
          </option>
          <option value={DifficultyLevel.ADVANCED} data-oid="y5jrkzn">
            高级
          </option>
          <option value={DifficultyLevel.EXPERT} data-oid="3rowqh6">
            专家
          </option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          data-oid="2u51hf3"
        >
          <p className="text-red-600" data-oid="gb14s_e">
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
            data-oid="08k4pwu"
          >
            关闭
          </button>
        </div>
      )}

      {/* Knowledge Points List */}
      <div className="space-y-4" data-oid="85na3v6">
        {filteredPoints.length === 0 ? (
          <div className="text-center py-8 text-gray-500" data-oid="b:qhm5.">
            <BookOpen
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              data-oid="t_gy6zw"
            />

            <p className="text-lg font-medium mb-2" data-oid="7-5x1bc">
              暂无知识点
            </p>
            <p className="text-sm" data-oid="90rmpy:">
              点击上方按钮添加第一个知识点
            </p>
          </div>
        ) : (
          filteredPoints.map((point) => {
            const typeInfo = getKnowledgeTypeInfo(point.knowledge_type);
            const TypeIcon = typeInfo.icon;
            const isExpanded = expandedPoints.has(point.id);

            return (
              <div
                key={point.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                data-oid="6pbcxi0"
              >
                <div className="p-4" data-oid="dh861k9">
                  <div
                    className="flex items-start justify-between"
                    data-oid="4jm9yue"
                  >
                    <div className="flex-1" data-oid="tewhwbt">
                      <div
                        className="flex items-center gap-3 mb-2"
                        data-oid="_tq5yvc"
                      >
                        <div
                          className={`p-1.5 rounded-lg ${typeInfo.color}`}
                          data-oid="e4emem-"
                        >
                          <TypeIcon className="w-4 h-4" data-oid="g9m0vgp" />
                        </div>
                        <h4
                          className="font-medium text-gray-900"
                          data-oid="o-pu3n8"
                        >
                          {point.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(point.difficulty_level)}`}
                          data-oid="e5.t0_a"
                        >
                          {point.difficulty_level}
                        </span>
                      </div>

                      <p
                        className="text-gray-600 text-sm mb-3 line-clamp-2"
                        data-oid="brszr4s"
                      >
                        {point.content}
                      </p>

                      {point.tags && point.tags.length > 0 && (
                        <div
                          className="flex flex-wrap gap-1 mb-3"
                          data-oid="6ah8ict"
                        >
                          {point.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              data-oid="tiq5kjl"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 ml-4"
                      data-oid="op1drey"
                    >
                      <button
                        onClick={() => toggleExpanded(point.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        data-oid="0e7:_jn"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" data-oid="7l5qafe" />
                        ) : (
                          <ChevronDown className="w-4 h-4" data-oid="v3eal24" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(point)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        data-oid="4nfd3a6"
                      >
                        <Edit className="w-4 h-4" data-oid="ezd7f5j" />
                      </button>
                      <button
                        onClick={() => handleDelete(point.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        data-oid="kb2.8hi"
                      >
                        <Trash2 className="w-4 h-4" data-oid=".vxhco5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="border-t border-gray-200 p-4 bg-gray-50"
                    data-oid="dp6c5wj"
                  >
                    <div className="space-y-4" data-oid="fsi3h5z">
                      <div data-oid="-fgm5:x">
                        <h5
                          className="font-medium text-gray-900 mb-2"
                          data-oid="ynjqg96"
                        >
                          详细内容
                        </h5>
                        <p
                          className="text-gray-700 whitespace-pre-wrap"
                          data-oid="l2ed2u2"
                        >
                          {point.content}
                        </p>
                      </div>

                      {point.learning_objectives &&
                        point.learning_objectives.length > 0 && (
                          <div data-oid="ubag33o">
                            <h5
                              className="font-medium text-gray-900 mb-2"
                              data-oid="ntxs12k"
                            >
                              学习目标
                            </h5>
                            <ul
                              className="list-disc list-inside space-y-1"
                              data-oid="6whkj7:"
                            >
                              {point.learning_objectives.map(
                                (objective, index) => (
                                  <li
                                    key={index}
                                    className="text-gray-700"
                                    data-oid="osxwvm-"
                                  >
                                    {objective}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {point.prerequisites &&
                        point.prerequisites.length > 0 && (
                          <div data-oid="znih.o0">
                            <h5
                              className="font-medium text-gray-900 mb-2"
                              data-oid="f_ia724"
                            >
                              前置条件
                            </h5>
                            <ul
                              className="list-disc list-inside space-y-1"
                              data-oid="tq9jc22"
                            >
                              {point.prerequisites.map((prereq, index) => (
                                <li
                                  key={index}
                                  className="text-gray-700"
                                  data-oid="k3thz9q"
                                >
                                  {prereq}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {point.examples && point.examples.length > 0 && (
                        <div data-oid="yb1j6:7">
                          <h5
                            className="font-medium text-gray-900 mb-2"
                            data-oid="q4yt:2j"
                          >
                            示例
                          </h5>
                          <ul
                            className="list-disc list-inside space-y-1"
                            data-oid=".3rzgw5"
                          >
                            {point.examples.map((example, index) => (
                              <li
                                key={index}
                                className="text-gray-700"
                                data-oid="y0oksh-"
                              >
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {point.references && point.references.length > 0 && (
                        <div data-oid="ge3qlfn">
                          <h5
                            className="font-medium text-gray-900 mb-2"
                            data-oid=":mic4f."
                          >
                            参考资料
                          </h5>
                          <ul
                            className="list-disc list-inside space-y-1"
                            data-oid="eiu9.0n"
                          >
                            {point.references.map((ref, index) => (
                              <li
                                key={index}
                                className="text-gray-700"
                                data-oid="nofrlfb"
                              >
                                {ref}
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
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          data-oid="aozp:kq"
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            data-oid=":9_q33o"
          >
            <div
              className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
              data-oid="p:8bj9r"
            >
              <h3
                className="text-lg font-semibold text-gray-900"
                data-oid="fywlk9:"
              >
                {editingPoint ? "编辑知识点" : "添加知识点"}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                data-oid="5mz5i:t"
              >
                <X className="w-5 h-5" data-oid="pbedb1c" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6"
              data-oid="7znr628"
            >
              <div className="space-y-4" data-oid="5497l0n">
                <div data-oid="_y1_ate">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="ex_imdo"
                  >
                    标题 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入知识点标题"
                    data-oid="7t89c_6"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4" data-oid="rlrz1oa">
                  <div data-oid="jawoq9s">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      data-oid="u0j1cfk"
                    >
                      知识类型 *
                    </label>
                    <select
                      required
                      value={formData.knowledge_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          knowledge_type: e.target.value as KnowledgeType,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-oid="0cofamw"
                    >
                      <option value={KnowledgeType.CONCEPT} data-oid="y9gk6v-">
                        概念
                      </option>
                      <option
                        value={KnowledgeType.PROCEDURE}
                        data-oid="0njfoxh"
                      >
                        程序
                      </option>
                      <option
                        value={KnowledgeType.PRINCIPLE}
                        data-oid="1h7fy_o"
                      >
                        原理
                      </option>
                      <option value={KnowledgeType.FACT} data-oid="4fmog-0">
                        事实
                      </option>
                      <option value={KnowledgeType.EXAMPLE} data-oid="ssl-0fh">
                        示例
                      </option>
                    </select>
                  </div>

                  <div data-oid="fa9y9hk">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      data-oid="_mz0h1_"
                    >
                      难度级别 *
                    </label>
                    <select
                      required
                      value={formData.difficulty_level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty_level: e.target.value as DifficultyLevel,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-oid="go418ng"
                    >
                      <option
                        value={DifficultyLevel.BEGINNER}
                        data-oid="unetqu6"
                      >
                        初级
                      </option>
                      <option
                        value={DifficultyLevel.INTERMEDIATE}
                        data-oid="iqul3.b"
                      >
                        中级
                      </option>
                      <option
                        value={DifficultyLevel.ADVANCED}
                        data-oid="4xyqoz1"
                      >
                        高级
                      </option>
                      <option value={DifficultyLevel.EXPERT} data-oid="fc3p6ur">
                        专家
                      </option>
                    </select>
                  </div>
                </div>

                <div data-oid="z-4w2ws">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="6rt32.x"
                  >
                    内容 *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入知识点详细内容"
                    data-oid="mn9rw5g"
                  />
                </div>

                <div data-oid="ak._b5j">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="mz.zao7"
                  >
                    标签 (用逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="标签1, 标签2, 标签3"
                    data-oid="oi5isut"
                  />
                </div>

                <div data-oid="1rw:da9">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="o3fspm6"
                  >
                    学习目标 (每行一个)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.learning_objectives?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        learning_objectives: e.target.value
                          .split("\n")
                          .map((obj) => obj.trim())
                          .filter((obj) => obj),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="目标1&#10;目标2&#10;目标3"
                    data-oid="18lvml8"
                  />
                </div>

                <div data-oid=".8i2nny">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="qsmm1qs"
                  >
                    前置条件 (每行一个)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.prerequisites?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prerequisites: e.target.value
                          .split("\n")
                          .map((prereq) => prereq.trim())
                          .filter((prereq) => prereq),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="前置条件1&#10;前置条件2&#10;前置条件3"
                    data-oid=".j34dup"
                  />
                </div>

                <div data-oid="ik_gyjq">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="p5fd6ha"
                  >
                    示例 (每行一个)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.examples?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        examples: e.target.value
                          .split("\n")
                          .map((example) => example.trim())
                          .filter((example) => example),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="示例1&#10;示例2&#10;示例3"
                    data-oid="trqxn7."
                  />
                </div>

                <div data-oid="yaltiic">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    data-oid="_-7go5n"
                  >
                    参考资料 (每行一个)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.references?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        references: e.target.value
                          .split("\n")
                          .map((ref) => ref.trim())
                          .filter((ref) => ref),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="参考资料1&#10;参考资料2&#10;参考资料3"
                    data-oid="ycz3vt6"
                  />
                </div>
              </div>

              <div
                className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200"
                data-oid="b809pej"
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  data-oid="7cq0xpu"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  data-oid="i5lwc45"
                >
                  <Save className="w-4 h-4" data-oid="n07u:dl" />
                  {editingPoint ? "更新" : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointManager;
