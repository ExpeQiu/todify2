/**
 * 嵌入式AI问答页面组件
 * 用于在项目资源页面中作为Tab内容显示
 */
import React from "react";
import BaseAISearchPage from "../ai-search/BaseAISearchPage";
import { aiQaConfig } from "../../configs/pageConfigs";

interface EmbeddedAIQAPageProps {
  projectId: string;
}

const EmbeddedAIQAPage: React.FC<EmbeddedAIQAPageProps> = ({ projectId }) => {
  return (
    <BaseAISearchPage
      key={`ai-qa-${projectId}`}
      config={aiQaConfig}
      embeddedMode={true}
      projectId={projectId}
      hideTopNavigation={true}
    />
  );
};

export default EmbeddedAIQAPage;


