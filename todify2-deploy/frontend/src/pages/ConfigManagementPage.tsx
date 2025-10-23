import React from "react";
import { KnowledgePointConfigManager } from "../components/management/KnowledgePointConfigManager";
import TopNavigation from "../components/TopNavigation";
import "./ConfigManagementPage.css";

const ConfigManagementPage: React.FC = () => {
  return (
    <div className="config-management-page">
      <TopNavigation currentPageTitle="配置管理" />
      <div className="page-content">
        <KnowledgePointConfigManager />
      </div>
    </div>
  );
};

export default ConfigManagementPage;
