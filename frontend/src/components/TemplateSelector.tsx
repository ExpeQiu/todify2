import React, { useState } from "react";
import { FileText, Lightbulb, Zap, Target, Settings } from "lucide-react";
import "./TemplateSelector.css";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  category: "standard" | "advanced" | "specialized";
}

interface TemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  onGenerate: (templateId: string) => void;
  isGenerating: boolean;
}

const templates: Template[] = [
  {
    id: "standard",
    name: "标准技术包装",
    description: "适用于常规技术内容的标准化包装，结构清晰，重点突出",
    icon: <FileText className="template-icon" data-oid="o6rowyn" />,
    features: ["技术概述", "核心特点", "应用场景", "技术优势"],
    category: "standard",
  },
  {
    id: "deep-analysis",
    name: "深度技术分析",
    description: "深入分析技术细节，适合复杂技术方案的详细阐述",
    icon: <Lightbulb className="template-icon" data-oid="zuztopr" />,
    features: ["技术原理", "实现细节", "性能分析", "对比评估"],
    category: "advanced",
  },
  {
    id: "simplified",
    name: "简化技术说明",
    description: "简洁明了的技术说明，适合快速理解和传播",
    icon: <Zap className="template-icon" data-oid="hlvgmy5" />,
    features: ["核心要点", "简化描述", "关键优势", "快速上手"],
    category: "standard",
  },
  {
    id: "innovation-showcase",
    name: "创新技术展示",
    description: "突出技术创新点，适合新技术和前沿方案的展示",
    icon: <Target className="template-icon" data-oid="9zv.23n" />,
    features: ["创新亮点", "技术突破", "市场价值", "发展前景"],
    category: "specialized",
  },
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onGenerate,
  isGenerating,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "standard" | "advanced" | "specialized"
  >("all");

  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((template) => template.category === activeCategory);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  const handleGenerate = () => {
    if (selectedTemplate) {
      onGenerate(selectedTemplate);
    }
  };

  return (
    <div className="template-selector" data-oid="uzz7fq0">
      <div className="template-header" data-oid="t4wd71n">
        <h3 data-oid=":ctgt02">选择技术包装模板</h3>
        <p data-oid="dxzk_5f">根据您的需求选择合适的技术包装模板</p>
      </div>

      {/* 分类筛选 */}
      <div className="template-categories" data-oid="8rupo6w">
        <button
          className={`category-btn ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
          data-oid="gpxmjn9"
        >
          全部
        </button>
        <button
          className={`category-btn ${activeCategory === "standard" ? "active" : ""}`}
          onClick={() => setActiveCategory("standard")}
          data-oid="cnu4x1v"
        >
          标准模板
        </button>
        <button
          className={`category-btn ${activeCategory === "advanced" ? "active" : ""}`}
          onClick={() => setActiveCategory("advanced")}
          data-oid="utqdr:8"
        >
          高级模板
        </button>
        <button
          className={`category-btn ${activeCategory === "specialized" ? "active" : ""}`}
          onClick={() => setActiveCategory("specialized")}
          data-oid="2u:o9xi"
        >
          专业模板
        </button>
      </div>

      {/* 模板列表 */}
      <div className="template-grid" data-oid="gpzqq0m">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? "selected" : ""}`}
            onClick={() => handleTemplateSelect(template.id)}
            data-oid="454epk_"
          >
            <div className="template-card-header" data-oid="ruxgpi1">
              {template.icon}
              <h4 data-oid="fcppx-8">{template.name}</h4>
            </div>
            <p className="template-description" data-oid="y_cegy:">
              {template.description}
            </p>
            <div className="template-features" data-oid="3_2q.o.">
              {template.features.map((feature, index) => (
                <span key={index} className="feature-tag" data-oid="j:4j2uo">
                  {feature}
                </span>
              ))}
            </div>
            <div className="template-category-badge" data-oid="d6bn4_7">
              {template.category === "standard" && "标准"}
              {template.category === "advanced" && "高级"}
              {template.category === "specialized" && "专业"}
            </div>
          </div>
        ))}
      </div>

      {/* 生成按钮 */}
      <div className="template-actions" data-oid="vfoqnv9">
        <button
          className="btn btn-primary generate-btn"
          onClick={handleGenerate}
          disabled={!selectedTemplate || isGenerating}
          data-oid=".6ypa7-"
        >
          {isGenerating ? (
            <>
              <div className="loading-spinner" data-oid="b.ez8v5"></div>
              生成中...
            </>
          ) : (
            <>
              <Settings className="btn-icon" data-oid="s42a11_" />
              生成技术包装
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
