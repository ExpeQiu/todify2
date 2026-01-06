// import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AIRoleManagementPage from "./pages/AIRoleManagementPage";
import TechPackagePage from "./pages/TechPackagePage";
import TechArticlePage from "./pages/TechArticlePage";
import AIQAPage from "./pages/AIQAPage";
import HomePage from "./pages/HomePage";
import ProjectResourcesPage from "./pages/ProjectResourcesPage";
import TechPointLibraryPage from "./pages/TechPointLibraryPage";
import TechPointLibraryDetailPage from "./pages/TechPointLibraryDetailPage";
import PublicKnowledgePage from "./pages/PublicKnowledge";
import FieldMappingManagementPage from "./pages/FieldMappingManagementPage";
import BrainstormPage from "./pages/BrainstormPage";

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
            element={<HomePage />}
            data-oid="rudq804"
          />

          <Route
            path="/ai-qa"
            element={<AIQAPage />}
          />

          <Route
            path="/ai-roles"
            element={<AIRoleManagementPage />}
          />

          {/* 标准独立页面路由 */}
          <Route
            path="/tech-package"
            element={<TechPackagePage />}
          />

          <Route
            path="/tech-strategy"
            element={<BrainstormPage />}
          />

          <Route
            path="/tech-article"
            element={<TechArticlePage />}
          />

          {/* 向后兼容的路由重定向 */}
          <Route
            path="/ai-search"
            element={<Navigate to="/tech-package" replace />}
          />

          <Route
            path="/project/:projectId/resources"
            element={<ProjectResourcesPage />}
          />

          <Route
            path="/tech-point-library"
            element={<TechPointLibraryPage />}
          />

          <Route
            path="/tech-point-library/:id"
            element={<TechPointLibraryDetailPage />}
          />

          <Route
            path="/public-knowledge"
            element={<PublicKnowledgePage />}
          />

          <Route
            path="/field-mapping-management"
            element={<FieldMappingManagementPage />}
          />

          <Route
            path="/brainstorm"
            element={<BrainstormPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
