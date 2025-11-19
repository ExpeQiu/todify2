import React from "react";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { techArticleConfig } from "../configs/pageConfigs";

const TechArticlePage: React.FC = () => {
  return <BaseAISearchPage config={techArticleConfig} />;
};

export default TechArticlePage;