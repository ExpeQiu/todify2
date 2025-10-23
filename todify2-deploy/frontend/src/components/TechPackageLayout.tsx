import React, { useState } from "react";
import { Package, RefreshCw, ChevronRight } from "lucide-react";
import { LoadingButton } from "./LoadingAnimation";
import "./TechPackageLayout.css";

interface TechPackageLayoutProps {
  inputData?: any;
  generatedContent?: any;
  editedContent?: string;
  selectedTemplate?: string;
  isGenerating?: boolean;
  onGenerate?: (template: string) => void;
  onRegenerate?: () => void;
  onContentChange?: (content: string) => void;
  onNext?: () => void;
}

const TechPackageLayout: React.FC<TechPackageLayoutProps> = ({
  inputData,
  generatedContent,
  editedContent,
  selectedTemplate = "standard",
  isGenerating = false,
  onGenerate,
  onRegenerate,
  onContentChange,
  onNext,
}) => {
  const [activeTemplate, setActiveTemplate] = useState(selectedTemplate);

  const templates = [
    { id: "standard", name: "标准模板", description: "适用于一般技术包装" },
    { id: "detailed", name: "详细模板", description: "包含更多技术细节" },
    { id: "marketing", name: "营销模板", description: "侧重市场推广" },
  ];

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(activeTemplate);
    }
  };

  return (
    <div className="tech-package-layout" data-oid="updk_2n">
      <div className="tech-package-header" data-oid="gbo47u0">
        <Package className="w-8 h-8 text-blue-600 mb-4" data-oid="y80iy:q" />
        <h2 className="tech-package-title" data-oid=":7v7p3t">
          技术包装
        </h2>
        <p className="tech-package-description" data-oid="ojk9fm3">
          基于搜索结果生成专业的技术包装内容
        </p>
      </div>

      <div className="tech-package-content" data-oid="i2vhq3_">
        {/* 输入数据展示 */}
        {inputData && (
          <div className="input-data-section" data-oid="w1f1rk_">
            <h3 className="section-title" data-oid=":9c4_.v">
              搜索结果
            </h3>
            <div className="input-data-preview" data-oid="sn2lgn:">
              <p className="text-sm text-gray-600" data-oid="9yr5rpu">
                已收集到 {inputData.results?.length || 0} 条相关信息
              </p>
            </div>
          </div>
        )}

        {/* 模板选择 */}
        <div className="template-selection" data-oid="-cemxra">
          <h3 className="section-title" data-oid="q0o717b">
            选择模板
          </h3>
          <div className="template-grid" data-oid="f3sq4n3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${activeTemplate === template.id ? "active" : ""}`}
                onClick={() => setActiveTemplate(template.id)}
                data-oid="t531al5"
              >
                <h4 className="template-name" data-oid="-1cps9_">
                  {template.name}
                </h4>
                <p className="template-description" data-oid="m06r4xm">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 生成按钮 */}
        <div className="generate-section" data-oid="7bqddvi">
          <LoadingButton
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText="正在生成技术包装..."
            className="generate-button"
            data-oid="08e.k:8"
          >
            <Package className="w-5 h-5 mr-2" data-oid="rnluf-1" />
            生成技术包装
          </LoadingButton>
        </div>

        {/* 生成的内容 */}
        {generatedContent && (
          <div className="generated-content" data-oid="_:k-g0y">
            <div className="content-header" data-oid="g6l1fb.">
              <h3 className="section-title" data-oid="bfdc_07">
                生成的内容
              </h3>
              <button
                onClick={onRegenerate}
                className="regenerate-button"
                disabled={isGenerating}
                data-oid="g7nm1nj"
              >
                <RefreshCw className="w-4 h-4 mr-1" data-oid="rqu44fn" />
                重新生成
              </button>
            </div>

            <div className="content-editor" data-oid=":sjkopc">
              <textarea
                value={editedContent || generatedContent.content || ""}
                onChange={(e) => onContentChange?.(e.target.value)}
                className="content-textarea"
                placeholder="生成的技术包装内容将显示在这里..."
                rows={12}
                data-oid="rtguwrg"
              />
            </div>

            {/* 下一步按钮 */}
            <div className="next-section" data-oid="no6uka1">
              <button
                onClick={onNext}
                className="next-button"
                disabled={!generatedContent}
                data-oid="tbdtgum"
              >
                下一步
                <ChevronRight className="w-5 h-5 ml-2" data-oid="islixmo" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechPackageLayout;
