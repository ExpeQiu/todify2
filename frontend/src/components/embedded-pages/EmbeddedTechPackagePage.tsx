/**
 * 嵌入式技术包装页面组件
 * 用于在项目资源页面中作为Tab内容显示
 */
import React from "react";
import BaseAISearchPage from "../ai-search/BaseAISearchPage";
import { techPackageConfig } from "../../configs/pageConfigs";

interface EmbeddedTechPackagePageProps {
  projectId: string;
}

const EmbeddedTechPackagePage: React.FC<EmbeddedTechPackagePageProps> = ({ projectId }) => {
  return (
    <BaseAISearchPage
      key={`tech-package-${projectId}`}
      config={techPackageConfig}
      embeddedMode={true}
      projectId={projectId}
      hideTopNavigation={true}
    />
  );
};

export default EmbeddedTechPackagePage;


