/**
 * 嵌入式技术策略页面组件
 * 用于在项目资源页面中作为Tab内容显示
 * 使用专家头脑风暴模式页面框架
 */
import React from "react";
import EmbeddedBrainstormPage from "./EmbeddedBrainstormPage";

interface EmbeddedTechStrategyPageProps {
  projectId: string;
}

const EmbeddedTechStrategyPage: React.FC<EmbeddedTechStrategyPageProps> = ({ projectId }) => {
  return (
    <EmbeddedBrainstormPage
      key={`tech-strategy-${projectId}`}
      projectId={projectId}
    />
  );
};

export default EmbeddedTechStrategyPage;


