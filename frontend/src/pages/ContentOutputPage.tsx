/**
 * 内容输出统一页面
 * 通过 URL 参数区分不同类型的内容输出
 * 合并了 TechPackagePage, TechArticlePage, TechStrategyPage, PressReleasePage
 */
import React from "react";
import { useParams, Navigate } from "react-router-dom";
import BaseAISearchPage from "../components/ai-search/BaseAISearchPage";
import { getPageConfig, PageType } from "../configs/pageConfigs";

const VALID_PAGE_TYPES: PageType[] = ['tech-package', 'press-release', 'tech-strategy', 'tech-article'];

const ContentOutputPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();

  // 验证 pageType 是否有效
  if (!type || !VALID_PAGE_TYPES.includes(type as PageType)) {
    // 无效的 pageType，重定向到默认的 tech-package
    return <Navigate to="/tech-package" replace />;
  }

  const config = getPageConfig(type as PageType);

  return <BaseAISearchPage config={config} />;
};

export default ContentOutputPage;
