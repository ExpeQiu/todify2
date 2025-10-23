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
import AiSearchTestPage from "./pages/AiSearchTestPage";
import AIChatPage from "./pages/AIChatPage";
import WorkflowStatsPage from "./pages/WorkflowStatsPage";
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
            path="/ai-search-test"
            element={<AiSearchTestPage data-oid="modwgxg" />}
            data-oid="9oz01ie"
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
