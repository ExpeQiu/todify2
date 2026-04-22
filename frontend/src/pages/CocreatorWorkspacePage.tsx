/**
 * 共创工作台页面
 * 提供项目管理和任务协作功能
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: string;
}

const CocreatorWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "tasks">("projects");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/cocreator/projects");
      const data = await response.json();
      if (data.success && data.data) {
        setProjects(data.data);
      }
    } catch (err) {
      setError("获取项目列表失败");
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取任务列表
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/cocreator/tasks");
      const data = await response.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      setError("获取任务列表失败");
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 创建项目
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch("/api/v1/cocreator/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateProject(false);
        setNewProjectName("");
        setNewProjectDesc("");
        fetchProjects();
      } else {
        setError(data.message || "创建项目失败");
      }
    } catch (err) {
      setError("创建项目失败");
      console.error("Failed to create project:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "projects") {
      fetchProjects();
    } else {
      fetchTasks();
    }
  }, [activeTab, fetchProjects, fetchTasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "pending":
        return "bg-gray-100 text-gray-700";
      case "archived":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <TopNavigation />

      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">共创工作台</h1>
              <p className="mt-2 text-gray-600">管理和协作项目任务</p>
            </div>
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新建项目
            </button>
          </div>

          {/* Tab 切换 */}
          <div className="mt-8 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "projects"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              项目列表
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "tasks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              任务列表
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === "projects" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                暂无项目，点击右上角按钮创建第一个项目
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/cocreator/project/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status === "active" ? "进行中" : "已归档"}
                    </span>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    更新于 {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无任务
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/cocreator/task/${task.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority === "high"
                            ? "高"
                            : task.priority === "medium"
                            ? "中"
                            : "低"}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status === "pending"
                            ? "待处理"
                            : task.status === "in_progress"
                            ? "进行中"
                            : "已完成"}
                        </span>
                      </div>
                    </div>
                    {task.assignee && (
                      <div className="mt-2 text-xs text-gray-500">
                        负责人: {task.assignee}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 创建项目弹窗 */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新建项目</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  项目名称 *
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目名称"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="projectDesc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  项目描述
                </label>
                <textarea
                  id="projectDesc"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目描述（可选）"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CocreatorWorkspacePage;
