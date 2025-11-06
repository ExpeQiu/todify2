// import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WorkflowPage from "./pages/WorkflowPage";
import NodePage from "./pages/NodePage";
import ConfigManagementPage from "./pages/ConfigManagementPage";
import ConfigPage from "./pages/ConfigPage";
import TechPointManagement from "./pages/TechPointManagement";
import CarSeriesManagement from "./pages/CarSeriesManagement";
import CarSeriesDetailPage from "./components/carSeries/CarSeriesDetailPage";
import CarSeriesEditPage from "./pages/CarSeriesEditPage";
import AIChatPage from "./pages/AIChatPage";
import WorkflowStatsPage from "./pages/WorkflowStatsPage";
import EnhancedWorkflowStatsPage from "./pages/EnhancedWorkflowStatsPage";
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
import AISearchPage from "./pages/AISearchPage";
import "./App.css";

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
            path="/tech-points"
            element={<TechPointManagement data-oid="m:0gwfg" />}
            data-oid="g8262:b"
          />

          <Route
            path="/car-series"
            element={<CarSeriesManagement data-oid="gt6ik1i" />}
            data-oid="0oxdg_2"
          />

          <Route
            path="/car-series/:id"
            element={<CarSeriesDetailPage data-oid="w0rd_p4" />}
            data-oid="h-y4qhs"
          />

          <Route
            path="/car-series/:id/edit"
            element={<CarSeriesEditPage data-oid="78nbk2x" />}
            data-oid="c59v1ao"
          />

          <Route
            path="/ai-chat"
            element={<AIChatPage data-oid="aichat001" />}
            data-oid="aichat002"
          />

          <Route
            path="/workflow-stats"
            element={<WorkflowStatsPage />}
            data-oid="workflow-stats"
          />

          <Route
            path="/enhanced-workflow-stats"
            element={<EnhancedWorkflowStatsPage />}
            data-oid="enhanced-workflow-stats"
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

          <Route
            path="/ai-search"
            element={<AISearchPage />}
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
