/**
 * 技术包装页面
 * 使用技术包装配置的独立页面组件
 */
import React from "react";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { techPackageConfig } from "../configs/pageConfigs";

const TechPackagePage: React.FC = () => {
  return <BaseAISearchPage config={techPackageConfig} />;
};

export default TechPackagePage;

