import React, { useState, useEffect } from "react";
import { X, Save, Plus, Minus } from "lucide-react";
import {
  KnowledgePoint,
  CreateKnowledgePointFormData,
  UpdateKnowledgePointFormData,
  KnowledgeType,
  DifficultyLevel,
  KnowledgeStatus,
} from "../../types/knowledgePoint";

interface KnowledgePointFormProps {
  techPointId: number;
  knowledgePoint?: KnowledgePoint;
  onSubmit: (
    data: CreateKnowledgePointFormData | UpdateKnowledgePointFormData,
  ) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const KnowledgePointForm: React.FC<KnowledgePointFormProps> = ({
  techPointId,
  knowledgePoint,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    knowledge_type: KnowledgeType.CONCEPT,
    difficulty_level: DifficultyLevel.BEGINNER,
    status: KnowledgeStatus.ACTIVE,
    tags: [] as string[],
    prerequisites: [] as string[],
    learning_objectives: [] as string[],
    examples: [] as string[],
    references: [] as string[],
    created_by: "",
  });

  const [newTag, setNewTag] = useState("");
  const [newPrerequisite, setNewPrerequisite] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newReference, setNewReference] = useState("");

  // 初始化表单数据
  useEffect(() => {
    if (knowledgePoint) {
      setFormData({
        title: knowledgePoint.title,
        content: knowledgePoint.content,
        knowledge_type: knowledgePoint.knowledge_type,
        difficulty_level: knowledgePoint.difficulty_level,
        status: knowledgePoint.status,
        tags: knowledgePoint.tags || [],
        prerequisites: knowledgePoint.prerequisites || [],
        learning_objectives: knowledgePoint.learning_objectives || [],
        examples: knowledgePoint.examples || [],
        references: knowledgePoint.references || [],
        created_by: knowledgePoint.created_by || "",
      });
    }
  }, [knowledgePoint]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("请填写标题和内容");
      return;
    }

    const submitData = knowledgePoint
      ? (formData as UpdateKnowledgePointFormData)
      : ({
          ...formData,
          tech_point_id: techPointId,
        } as CreateKnowledgePointFormData);

    await onSubmit(submitData);
  };

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  // 删除标签
  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // 添加前置条件
  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData((prev) => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()],
      }));
      setNewPrerequisite("");
    }
  };

  // 删除前置条件
  const removePrerequisite = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index),
    }));
  };

  // 添加学习目标
  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData((prev) => ({
        ...prev,
        learning_objectives: [...prev.learning_objectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  };

  // 删除学习目标
  const removeObjective = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  // 添加示例
  const addExample = () => {
    if (newExample.trim()) {
      setFormData((prev) => ({
        ...prev,
        examples: [...prev.examples, newExample.trim()],
      }));
      setNewExample("");
    }
  };

  // 删除示例
  const removeExample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  // 添加参考资料
  const addReference = () => {
    if (newReference.trim()) {
      setFormData((prev) => ({
        ...prev,
        references: [...prev.references, newReference.trim()],
      }));
      setNewReference("");
    }
  };

  // 删除参考资料
  const removeReference = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-oid="pyux67o"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        data-oid="b6mj4qo"
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200"
          data-oid="dov1.f1"
        >
          <h2
            className="text-xl font-semibold text-gray-900"
            data-oid=".0_cc-6"
          >
            {knowledgePoint ? "编辑知识点" : "创建知识点"}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            data-oid="o:fyybf"
          >
            <X className="w-5 h-5" data-oid="adwxj9o" />
          </button>
        </div>

        {/* 表单内容 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full"
          data-oid="mgjl0ra"
        >
          <div
            className="flex-1 overflow-y-auto p-6 space-y-6"
            data-oid="_735113"
          >
            {/* 基本信息 */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              data-oid="ykptwg8"
            >
              <div className="md:col-span-2" data-oid="tckdz17">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  data-oid="c0th5ip"
                >
                  标题{" "}
                  <span className="text-red-500" data-oid=":gylo14">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入知识点标题"
                  required
                  data-oid="5yzicf0"
                />
              </div>

              <div data-oid="sxj83cm">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  data-oid="7-qr-:a"
                >
                  知识类型
                </label>
                <select
                  value={formData.knowledge_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      knowledge_type: e.target.value as KnowledgeType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-oid="0-xsc54"
                >
                  <option value={KnowledgeType.CONCEPT} data-oid="046z5o6">
                    概念
                  </option>
                  <option value={KnowledgeType.PROCEDURE} data-oid="lj3qpn2">
                    程序
                  </option>
                  <option value={KnowledgeType.PRINCIPLE} data-oid="6f-yu2b">
                    原理
                  </option>
                  <option value={KnowledgeType.FACT} data-oid="zi.:3y2">
                    事实
                  </option>
                  <option value={KnowledgeType.EXAMPLE} data-oid="9uw.qfq">
                    示例
                  </option>
                </select>
              </div>

              <div data-oid="_36b4za">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  data-oid="3k8cvpv"
                >
                  难度级别
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty_level: e.target.value as DifficultyLevel,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-oid="es98e4c"
                >
                  <option value={DifficultyLevel.BEGINNER} data-oid="um9y_27">
                    初级
                  </option>
                  <option
                    value={DifficultyLevel.INTERMEDIATE}
                    data-oid="e0ud35-"
                  >
                    中级
                  </option>
                  <option value={DifficultyLevel.ADVANCED} data-oid="fo6-59j">
                    高级
                  </option>
                  <option value={DifficultyLevel.EXPERT} data-oid="abs9chc">
                    专家
                  </option>
                </select>
              </div>

              <div data-oid="2kppk72">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  data-oid=".ad0mnv"
                >
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as KnowledgeStatus,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-oid="cjukp23"
                >
                  <option value={KnowledgeStatus.ACTIVE} data-oid="60q.s9.">
                    激活
                  </option>
                  <option value={KnowledgeStatus.INACTIVE} data-oid="eq2m7:j">
                    未激活
                  </option>
                  <option value={KnowledgeStatus.DRAFT} data-oid="jh6hldv">
                    草稿
                  </option>
                  <option value={KnowledgeStatus.ARCHIVED} data-oid="ofpt1gv">
                    已归档
                  </option>
                </select>
              </div>

              <div data-oid="x267.8p">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  data-oid="cy1ng-s"
                >
                  创建者
                </label>
                <input
                  type="text"
                  value={formData.created_by}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      created_by: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入创建者"
                  data-oid="l.6:.a1"
                />
              </div>
            </div>

            {/* 内容 */}
            <div data-oid="5hxxqgd">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="0o6m-x9"
              >
                内容{" "}
                <span className="text-red-500" data-oid="todtc0r">
                  *
                </span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入知识点详细内容"
                required
                data-oid="tx-.kpd"
              />
            </div>

            {/* 标签 */}
            <div data-oid="ux_8hqu">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="2bpjiz7"
              >
                标签
              </label>
              <div className="flex gap-2 mb-2" data-oid="p74vtpz">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入标签后按回车添加"
                  data-oid="isy0zml"
                />

                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-oid="xckglnb"
                >
                  <Plus className="w-4 h-4" data-oid="c49:dv1" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2" data-oid="fd3lcvr">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    data-oid="0:9b62f"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-blue-600 hover:text-blue-800"
                      data-oid="0zx7kp0"
                    >
                      <Minus className="w-3 h-3" data-oid="hsp-2z9" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 前置条件 */}
            <div data-oid="3ms-bld">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="9hd4sgg"
              >
                前置条件
              </label>
              <div className="flex gap-2 mb-2" data-oid="rxll_zo">
                <input
                  type="text"
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addPrerequisite())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入前置条件后按回车添加"
                  data-oid=":12egwx"
                />

                <button
                  type="button"
                  onClick={addPrerequisite}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-oid="3mx.emh"
                >
                  <Plus className="w-4 h-4" data-oid="q50fpwr" />
                </button>
              </div>
              <div className="space-y-2" data-oid="hjps4ft">
                {formData.prerequisites.map((prerequisite, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    data-oid="zvrb.2g"
                  >
                    <span className="flex-1 text-sm" data-oid="k_4s:wp">
                      {prerequisite}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePrerequisite(index)}
                      className="text-red-600 hover:text-red-800"
                      data-oid="wzvahek"
                    >
                      <Minus className="w-4 h-4" data-oid="qmgnp2f" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 学习目标 */}
            <div data-oid="r51rxsc">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="4-97u1y"
              >
                学习目标
              </label>
              <div className="flex gap-2 mb-2" data-oid="m1iodcl">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addObjective())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入学习目标后按回车添加"
                  data-oid="eo:xy5q"
                />

                <button
                  type="button"
                  onClick={addObjective}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-oid="etmo5y4"
                >
                  <Plus className="w-4 h-4" data-oid="pu:po.8" />
                </button>
              </div>
              <div className="space-y-2" data-oid="b.dkj8x">
                {formData.learning_objectives.map((objective, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    data-oid="ykt8v1i"
                  >
                    <span className="flex-1 text-sm" data-oid="sdzrvr6">
                      {objective}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="text-red-600 hover:text-red-800"
                      data-oid="zupfwt4"
                    >
                      <Minus className="w-4 h-4" data-oid="5knhg:c" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 示例 */}
            <div data-oid="m48:dz:">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="giktc7y"
              >
                示例
              </label>
              <div className="flex gap-2 mb-2" data-oid="q7-ejcu">
                <textarea
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入示例内容"
                  data-oid="nwssnq0"
                />

                <button
                  type="button"
                  onClick={addExample}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-start"
                  data-oid="l7fbv3p"
                >
                  <Plus className="w-4 h-4" data-oid="uy8oa3n" />
                </button>
              </div>
              <div className="space-y-2" data-oid="3:n31n0">
                {formData.examples.map((example, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                    data-oid="0ptdq:q"
                  >
                    <span
                      className="flex-1 text-sm whitespace-pre-wrap"
                      data-oid="h.49bjo"
                    >
                      {example}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="text-red-600 hover:text-red-800 mt-1"
                      data-oid=":l.vt6q"
                    >
                      <Minus className="w-4 h-4" data-oid="ww3k4a9" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 参考资料 */}
            <div data-oid="70z1mvw">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                data-oid="dlbda-m"
              >
                参考资料
              </label>
              <div className="flex gap-2 mb-2" data-oid="ew8:2by">
                <input
                  type="text"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addReference())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入参考资料后按回车添加"
                  data-oid="_pbghdt"
                />

                <button
                  type="button"
                  onClick={addReference}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  data-oid="rz4cb3a"
                >
                  <Plus className="w-4 h-4" data-oid="xm0efio" />
                </button>
              </div>
              <div className="space-y-2" data-oid="fkorsqa">
                {formData.references.map((reference, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    data-oid="qww2fph"
                  >
                    <span className="flex-1 text-sm" data-oid="2.8jo-.">
                      {reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      className="text-red-600 hover:text-red-800"
                      data-oid="_y8su5:"
                    >
                      <Minus className="w-4 h-4" data-oid="i:bicyg" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t border-gray-200"
            data-oid="fuux9sg"
          >
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              data-oid="ccaziby"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              data-oid="j9lrex1"
            >
              {loading ? (
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                  data-oid="pngwwxp"
                ></div>
              ) : (
                <Save className="w-4 h-4" data-oid="-c:6vqc" />
              )}
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KnowledgePointForm;
