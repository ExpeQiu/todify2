/**
 * 发布会稿页面
 * 使用发布会稿配置的独立页面组件
 */
import React from "react";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { pressReleaseConfig } from "../configs/pageConfigs";

const PressReleasePage: React.FC = () => {
  return <BaseAISearchPage config={pressReleaseConfig} />;
};

export default PressReleasePage;

