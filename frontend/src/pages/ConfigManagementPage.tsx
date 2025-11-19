import React, { useState } from "react";
import { KnowledgePointConfigManager } from "../components/management/KnowledgePointConfigManager";
import FieldMappingConfigManager from "../components/management/FieldMappingConfigManager";
import TopNavigation from "../components/TopNavigation";
import "./ConfigManagementPage.css";

const ConfigManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"knowledge" | "field-mapping">("knowledge");

  return (
    <div className="config-management-page">
      <TopNavigation currentPageTitle="配置管理" />
      <div className="page-content">
        {/* 标签页导航 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "knowledge"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              知识点配置管理
            </button>
            <button
              onClick={() => setActiveTab("field-mapping")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "field-mapping"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              字段映射管理
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        {activeTab === "knowledge" && <KnowledgePointConfigManager />}
        {activeTab === "field-mapping" && <FieldMappingConfigManager />}
      </div>
    </div>
  );
};

export default ConfigManagementPage;
