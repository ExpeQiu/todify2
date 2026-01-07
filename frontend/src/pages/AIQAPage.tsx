/**
 * AI问答页面
 * 复用tech-package系统构建，但作为独立页面可进行定制化改造
 */
import React from "react";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { aiQaConfig } from "../configs/pageConfigs";

const AIQAPage: React.FC = () => {
  return <BaseAISearchPage key="ai-qa" config={aiQaConfig} />;
};

export default AIQAPage;

