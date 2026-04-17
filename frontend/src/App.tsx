// import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WorkflowPage from "./pages/WorkflowPage";
import NodePage from "./pages/NodePage";
import ConfigPage from "./pages/ConfigPage";
import AIChatPage from "./pages/AIChatPage";
import SearchHistoryPage from "./pages/SearchHistoryPage";
import SearchHistoryDetailPage from "./pages/SearchHistoryDetailPage";
import AIRoleManagementPage from "./pages/AIRoleManagementPage";
import MultiChatContainer from "./components/MultiChatContainer";
import AgentWorkflowPage from "./pages/AgentWorkflowPage";
import PublicPageConfigManagementPage from "./pages/PublicPageConfigManagementPage";
import PublicChatPage from "./pages/PublicChatPage";
import AIUnifiedManagementPage from "./pages/AIUnifiedManagementPage";
import AddressPage from "./pages/AddressPage";
import TemplateManagementPage from "./pages/TemplateManagementPage";
import FieldMappingManagementPage from "./pages/FieldMappingManagementPage";

import ContentOutputPage from "./pages/ContentOutputPage";
import CocreatorWorkspacePage from "./pages/CocreatorWorkspacePage";

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
      data-oid="9yzclqb"
    >
      <div className="App" data-oid="ycxpxt5">
        <Routes data-oid="otdlif7">
          <Route
            path="/"
            element={<WorkflowPage data-oid="afw3qx7" />}
            data-oid="rudq804"
          />

          <Route
            path="/workflow"
            element={<WorkflowPage data-oid="ojq0g3o" />}
            data-oid="b5mu_kh"
          />

          <Route
            path="/node/:nodeType"
            element={<NodePage data-oid="wbb7dct" />}
            data-oid="-nr0paf"
          />

          <Route
            path="/config"
            element={<ConfigPage data-oid="t8gx4lq" />}
            data-oid=".72ul5z"
          />

          <Route
            path="/ai-chat"
            element={<AIChatPage data-oid="aichat001" />}
            data-oid="aichat002"
          />

          <Route
            path="/history"
            element={<SearchHistoryPage />}
          />

          <Route
            path="/history/:id"
            element={<SearchHistoryDetailPage />}
          />

          <Route
            path="/ai-roles"
            element={<AIRoleManagementPage />}
          />

          <Route
            path="/ai-chat-multi"
            element={<MultiChatContainer />}
          />

          <Route
            path="/agent-workflow"
            element={<AgentWorkflowPage />}
          />

          <Route
            path="/public-page-configs"
            element={<PublicPageConfigManagementPage />}
          />

          <Route
            path="/template-management"
            element={<TemplateManagementPage />}
          />

          <Route
            path="/ai-management"
            element={<AIUnifiedManagementPage />}
          />

          <Route
            path="/public-chat/:token"
            element={<PublicChatPage />}
          />

          {/* 标准独立页面路由（保留兼容，旧路由重定向到统一页面） */}
          <Route
            path="/tech-package"
            element={<ContentOutputPage />}
          />

          <Route
            path="/tech-strategy"
            element={<ContentOutputPage />}
          />

          <Route
            path="/tech-article"
            element={<ContentOutputPage />}
          />

          <Route
            path="/press-release"
            element={<ContentOutputPage />}
          />

          {/* 内容输出统一路由 */}
          <Route
            path="/content/:type"
            element={<ContentOutputPage />}
          />

          {/* 向后兼容的路由重定向 */}
          <Route
            path="/ai-search"
            element={<Navigate to="/tech-package" replace />}
          />

          <Route
            path="/tech-publish"
            element={<Navigate to="/press-release" replace />}
          />

          <Route
            path="/field-mapping-management"
            element={<FieldMappingManagementPage />}
          />

          {/* 共创工作台 */}
          <Route
            path="/cocreator"
            element={<CocreatorWorkspacePage />}
          />

          {/* 根据地址配置的动态路由（需要放在具体路由之后） */}
          <Route
            path="/:address"
            element={<AddressPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
