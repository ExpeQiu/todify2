import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthInitializer } from "./components/AuthInitializer";
import AIRoleManagementPage from "./pages/AIRoleManagementPage";
import TechPackagePage from "./pages/TechPackagePage";
import TechStrategyPage from "./pages/TechStrategyPage";
import TechArticlePage from "./pages/TechArticlePage";
import AIQAPage from "./pages/AIQAPage";
import HomePage from "./pages/HomePage";
import ProjectResourcesPage from "./pages/ProjectResourcesPage";
import ProjectManagementPage from "./pages/ProjectManagementPage";
import ProjectAIQAPage from "./pages/ProjectAIQAPage";
import ProjectTechStrategyPage from "./pages/ProjectTechStrategyPage";
import ProjectTechPackagePage from "./pages/ProjectTechPackagePage";
import ProjectTechArticlePage from "./pages/ProjectTechArticlePage";
import TechPointLibraryPage from "./pages/TechPointLibraryPage";
import TechPointLibraryDetailPage from "./pages/TechPointLibraryDetailPage";
import PublicKnowledgePage from "./pages/PublicKnowledge";
import FieldMappingManagementPage from "./pages/FieldMappingManagementPage";
import BrainstormPage from "./pages/BrainstormPage";
import SourceManagementPage from "./pages/SourceManagementPage";
import ArticleTypeManagementPage from "./pages/ArticleTypeManagementPage";
import ExecutionTracePage from "./pages/ExecutionTracePage";

function App() {
  return (
    <AuthInitializer>
      <Router
        basename="/todify"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
        data-oid="9yzclqb"
      >
        <Routes data-oid="otdlif7">
          <Route
            path="/"
            element={<HomePage />}
            data-oid="rudq804"
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/projects"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/ai-config"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/settings"
            element={<Navigate to="/" replace />}
          />

          <Route
            path="/ai-roles"
            element={<AIRoleManagementPage />}
          />

          {/* 向后兼容的路由重定向 - 旧路由重定向到首页 */}
          <Route
            path="/ai-qa"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/tech-package"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/tech-strategy"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/tech-article"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/ai-search"
            element={<Navigate to="/" replace />}
          />

          <Route
            path="/project/:projectId/resources"
            element={<ProjectResourcesPage />}
          />

          <Route
            path="/project/:projectId/management"
            element={<ProjectManagementPage />}
          />

          <Route
            path="/project/:projectId/ai-qa"
            element={<ProjectAIQAPage />}
          />

          <Route
            path="/project/:projectId/tech-strategy"
            element={<ProjectTechStrategyPage />}
          />

          <Route
            path="/project/:projectId/tech-package"
            element={<ProjectTechPackagePage />}
          />

          <Route
            path="/project/:projectId/tech-article"
            element={<ProjectTechArticlePage />}
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

          <Route
            path="/source-management"
            element={<SourceManagementPage />}
          />

          <Route
            path="/article-types"
            element={<ArticleTypeManagementPage />}
          />

          <Route
            path="/execution-traces/:executionId"
            element={<ExecutionTracePage />}
          />
        </Routes>
        </Router>
      </AuthInitializer>
    );
}

export default App;
