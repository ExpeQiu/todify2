import React from "react";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { techStrategyConfig } from "../configs/pageConfigs";

const TechStrategyPage: React.FC = () => {
  return <BaseAISearchPage key="tech-strategy" config={techStrategyConfig} />;
};

export default TechStrategyPage;