/**
 * 来源管理页面
 * 集中管理所有来源信息
 */
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  FileCode,
  Brain,
  Package,
  Target,
  Newspaper,
  Edit,
  Trash2,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react";
import api from "../services/api";
import { SourceInformation, SourceCategory } from "../services/sourceService";
import sourceService from "../services/sourceService";

interface Project {
  id: number;
  name: string;
  description?: string;
}

// 根据类别判断来源类型（内部信息 vs 外部来源）
const getSourceTypeByCategory = (category?: SourceCategory): "内部信息" | "外部来源" => {
  // 内容信息类别：AI问答总结、技术点、公共知识库等
  const contentInfoCategories: SourceCategory[] = [
    "technical-translation",  // 技术转译
    "ai-qa-summary",          // AI问答总结
    "tech-package-qa",        // 技术包装问答
    "tech-strategy-qa",       // 技术策略问答
    "tech-article-qa",        // 技术通稿问答
  ];
  
  // 外部来源类别：上传文件、web搜索等
  const externalSourceCategories: SourceCategory[] = [
    "internet-search",        // 互联网搜索
    "web-search",            // Web搜索
    "external",              // 外部来源
  ];
  
  if (!category) {
    return "外部来源"; // 默认
  }
  
  if (contentInfoCategories.includes(category)) {
    return "内部信息";
  }
  
  if (externalSourceCategories.includes(category)) {
    return "外部来源";
  }
  
  return "外部来源"; // 默认
};

// 获取来源类别的显示信息
const getCategoryInfo = (category?: SourceCategory) => {
  switch (category) {
    case "technical-translation":
      return {
        label: "技术转译",
        icon: FileCode,
        color: "bg-blue-100 text-blue-700",
        iconColor: "text-blue-600",
      };
    case "ai-qa-summary":
      return {
        label: "AI问答总结",
        icon: Brain,
        color: "bg-purple-100 text-purple-700",
        iconColor: "text-purple-600",
      };
    case "tech-package-qa":
      return {
        label: "技术包装问答",
        icon: Package,
        color: "bg-orange-100 text-orange-700",
        iconColor: "text-orange-600",
      };
    case "tech-strategy-qa":
      return {
        label: "技术策略问答",
        icon: Target,
        color: "bg-green-100 text-green-700",
        iconColor: "text-green-600",
      };
    case "tech-article-qa":
      return {
        label: "技术通稿问答",
        icon: Newspaper,
        color: "bg-indigo-100 text-indigo-700",
        iconColor: "text-indigo-600",
      };
    case "internet-search":
      return {
        label: "互联网搜索",
        icon: Search,
        color: "bg-cyan-100 text-cyan-700",
        iconColor: "text-cyan-600",
      };
    case "web-search":
      return {
        label: "Web搜索",
        icon: Search,
        color: "bg-teal-100 text-teal-700",
        iconColor: "text-teal-600",
      };
    case "external":
    default:
      return {
        label: "外部来源",
        icon: FileText,
        color: "bg-gray-100 text-gray-700",
        iconColor: "text-gray-600",
      };
  }
};

// 添加来源弹窗（支持项目选择）
interface AddSourceModalForManagementProps {
  projects: Project[];
  onClose: () => void;
  onAdd: (source: { title: string; type: "external"; url?: string; description?: string }, projectId?: number) => Promise<void>;
}

const AddSourceModalForManagement: React.FC<AddSourceModalForManagementProps> = ({
  projects,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    await onAdd(
      {
        title: title.trim(),
        type: "external",
        url: url.trim() || undefined,
        description: description.trim() || undefined,
      },
      selectedProjectId ? Number(selectedProjectId) : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">添加来源</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 项目选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关联项目（可选）
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">未关联项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              选择项目后，来源将记录在该项目分组下
            </p>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL地址（可选）
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入来源标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入来源描述"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 编辑来源弹窗（支持项目选择）
interface EditSourceModalForManagementProps {
  source: SourceInformation;
  projects: Project[];
  onClose: () => void;
  onSave: (source: { title: string; description?: string; url?: string }, projectId?: number) => Promise<void>;
}

const EditSourceModalForManagement: React.FC<EditSourceModalForManagementProps> = ({
  source,
  projects,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(source.title);
  const [description, setDescription] = useState(source.description || "");
  const [url, setUrl] = useState(source.url || "");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">(
    source.project_id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  useEffect(() => {
    setTitle(source.title);
    setDescription(source.description || "");
    setUrl(source.url || "");
    setSelectedProjectId(source.project_id || "");
    setErrors({});
  }, [source]);

  const validateUrl = (urlValue: string): boolean => {
    if (!urlValue.trim()) return true; // URL是可选的
    try {
      new URL(urlValue);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; url?: string } = {};

    // 验证标题
    if (!title.trim()) {
      newErrors.title = "标题不能为空";
    }

    // 验证URL
    if (source.type === "external" && url.trim() && !validateUrl(url.trim())) {
      newErrors.url = "请输入有效的URL地址（如：https://example.com）";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          url: url.trim() || undefined,
        },
        selectedProjectId ? Number(selectedProjectId) : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryInfo = getCategoryInfo(source.category);
  const CategoryIcon = categoryInfo.icon;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${categoryInfo.color}`}>
              <CategoryIcon className={`w-5 h-5 ${categoryInfo.iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">编辑来源</h2>
              <p className="text-xs text-gray-500 mt-0.5">{categoryInfo.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* 来源类型和类别信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  来源类型
                </label>
                {(() => {
                  const sourceType = getSourceTypeByCategory(source.category);
                  const isContentInfo = sourceType === "内部信息";
                  return (
                    <div className={`px-4 py-2.5 border rounded-lg text-sm flex items-center gap-2 ${
                      isContentInfo 
                        ? "bg-blue-50 border-blue-200 text-blue-700" 
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}>
                      {isContentInfo ? (
                        <>
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">内部信息</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">外部来源</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  来源类别
                </label>
                <div className={`px-4 py-2.5 border rounded-lg text-sm flex items-center gap-2 ${categoryInfo.color} border-transparent`}>
                  <CategoryIcon className={`w-4 h-4 ${categoryInfo.iconColor}`} />
                  <span className="font-medium">{categoryInfo.label}</span>
                </div>
              </div>
            </div>

            {/* 项目选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关联项目
                <span className="text-gray-400 font-normal ml-1">（可选）</span>
              </label>
              {projects.length === 0 ? (
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  暂无可用项目
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  disabled={isSubmitting}
                >
                  <option value="">未关联项目</option>
                  {projects
                    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"))
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {project.description ? ` - ${project.description.substring(0, 30)}${project.description.length > 30 ? "..." : ""}` : ""}
                      </option>
                    ))}
                </select>
              )}
              {selectedProject && selectedProject.description && (
                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                  {selectedProject.description}
                </p>
              )}
              {projects.length > 0 && (
                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                  修改项目关联后，来源将移动到对应项目分组
                </p>
              )}
            </div>

            {/* URL */}
            {source.type === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL地址
                  <span className="text-gray-400 font-normal ml-1">（可选）</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (errors.url) setErrors({ ...errors, url: undefined });
                  }}
                  placeholder="https://example.com/document.pdf"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.url
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.url && (
                  <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.url}</p>
                )}
                {!errors.url && url && (
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    点击链接在新标签页中打开
                  </p>
                )}
              </div>
            )}

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                placeholder="输入来源标题"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.title
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1.5 ml-1">{errors.title}</p>
              )}
              {!errors.title && (
                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                  标题用于标识和搜索来源
                </p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
                <span className="text-gray-400 font-normal ml-1">（可选）</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入来源描述，支持多行文本..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">
                详细描述有助于更好地理解和使用该来源
              </p>
            </div>

            {/* 元信息 */}
            {(source.created_at || source.created_by) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">元信息</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {source.created_at && (
                    <div>
                      <span className="text-gray-500">创建时间：</span>
                      <span className="text-gray-700">
                        {new Date(source.created_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {source.created_by && (
                    <div>
                      <span className="text-gray-500">创建人：</span>
                      <span className="text-gray-700">{source.created_by}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SourceManagementPage: React.FC = () => {
  const [sources, setSources] = useState<SourceInformation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceInformation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<number | "unassigned">>(new Set());

  // 加载项目列表
  const loadProjects = async () => {
    try {
      const response = await api.get("/projects", {
        params: {
          page: 1,
          pageSize: 1000,
          status: "active",
        },
      });
      if (response.data.success) {
        // 处理分页响应格式：{ data: { data: [...], total: ... } }
        const responseData = response.data.data as any;
        const projectList = responseData?.data || responseData || [];
        setProjects(Array.isArray(projectList) ? projectList : []);
      }
    } catch (error) {
      console.error("加载项目列表失败:", error);
      setProjects([]);
    }
  };

  // 加载来源列表
  const loadSources = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: "active",
        page: 1,
        pageSize: 1000,
      };

      if (selectedProject) {
        params.projectId = selectedProject;
      }

      if (selectedType !== "all") {
        params.type = selectedType;
      }

      const response = await api.get("/source-information", { params });
      if (response.data.success) {
        const sourceList = response.data.data || [];
        // 解析metadata中的category
        const sourcesWithCategory = (Array.isArray(sourceList) ? sourceList : []).map((s: any) => {
          const metadata = typeof s.metadata === "string" ? JSON.parse(s.metadata) : s.metadata;
          return {
            ...s,
            category: metadata?.category || "external",
          };
        });
        setSources(sourcesWithCategory);
      }
    } catch (error) {
      console.error("加载来源列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    loadSources();
  }, [selectedProject, selectedType]);

  // 筛选来源
  const filteredSources = sources.filter((source) => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = source.title.toLowerCase().includes(query);
      const matchDesc = source.description?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }

    // 类别过滤
    if (selectedCategory !== "all" && source.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  // 获取项目名称
  const getProjectName = (projectId?: number) => {
    if (!projectId) return "-";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || `项目 #${projectId}`;
  };

  // 按项目分组来源
  const groupedSources = filteredSources.reduce((acc, source) => {
    const projectId = source.project_id || "unassigned";
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(source);
    return acc;
  }, {} as Record<number | "unassigned", SourceInformation[]>);

  // 获取项目分组列表（按项目名称排序）
  const projectGroups = Object.keys(groupedSources)
    .map((key) => {
      const projectId = key === "unassigned" ? "unassigned" : Number(key);
      return {
        projectId,
        projectName: projectId === "unassigned" ? "未关联项目" : getProjectName(projectId as number),
        sources: groupedSources[projectId],
      };
    })
    .sort((a, b) => {
      if (a.projectId === "unassigned") return 1;
      if (b.projectId === "unassigned") return -1;
      return a.projectName.localeCompare(b.projectName, "zh-CN");
    });

  // 切换项目分组展开/折叠
  const toggleProject = (projectId: number | "unassigned") => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // 初始化时展开所有分组
  useEffect(() => {
    if (filteredSources.length > 0 && expandedProjects.size === 0 && !loading) {
      const projectIds = new Set<number | "unassigned">();
      filteredSources.forEach((source) => {
        projectIds.add(source.project_id || "unassigned");
      });
      setExpandedProjects(projectIds);
    }
  }, [filteredSources.length, loading]);

  // 删除来源
  const handleDelete = async (source: SourceInformation) => {
    if (!window.confirm(`确定要删除来源"${source.title}"吗？`)) {
      return;
    }

    try {
      const result = await sourceService.deleteSourceInformation(source.source_id);
      if (result.success) {
        loadSources();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除来源失败:", error);
      alert("删除来源失败");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">来源管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              集中管理所有来源信息，按项目分组展示，支持搜索和筛选
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加来源
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索来源标题或描述..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {(selectedProject || selectedType !== "all" || selectedCategory !== "all") && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[selectedProject, selectedType !== "all", selectedCategory !== "all"].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              {/* 项目筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">项目</label>
                <select
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部项目</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 类型筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部类型</option>
                  <option value="knowledge_base">知识库</option>
                  <option value="external">外部来源</option>
                </select>
              </div>

              {/* 类别筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部类别</option>
                  <option value="technical-translation">技术转译</option>
                  <option value="ai-qa-summary">AI问答总结</option>
                  <option value="tech-package-qa">技术包装问答</option>
                  <option value="tech-strategy-qa">技术策略问答</option>
                  <option value="tech-article-qa">技术通稿问答</option>
                  <option value="internet-search">互联网搜索</option>
                  <option value="web-search">Web搜索</option>
                  <option value="external">外部来源</option>
                </select>
              </div>
            </div>

            {/* 清除筛选 */}
            {(selectedProject || selectedType !== "all" || selectedCategory !== "all") && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setSelectedType("all");
                    setSelectedCategory("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  清除所有筛选
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>
            总计: <span className="font-semibold text-gray-900">{sources.length}</span> 条
          </span>
          <span>
            筛选结果: <span className="font-semibold text-gray-900">{filteredSources.length}</span> 条
          </span>
          <span>
            项目分组: <span className="font-semibold text-gray-900">{projectGroups.length}</span> 个
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                const allProjectIds = new Set<number | "unassigned">(
                  projectGroups.map((g) => g.projectId as number | "unassigned")
                );
                setExpandedProjects(allProjectIds);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              展开全部
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setExpandedProjects(new Set())}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              折叠全部
            </button>
          </div>
        </div>
      </div>

      {/* 来源列表 - 按项目分组 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : projectGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">暂无来源</p>
            <p className="text-sm mt-2">点击右上角"添加来源"按钮创建新来源</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectGroups.map((group) => {
              const projectId = group.projectId as number | "unassigned";
              const isExpanded = expandedProjects.has(projectId);
              const isUnassigned = projectId === "unassigned";

              return (
                <div key={String(projectId)} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* 项目分组标题 */}
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Folder className={`w-5 h-5 ${isUnassigned ? "text-gray-400" : "text-blue-500"}`} />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{group.projectName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.sources.length} 个来源
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* 项目来源列表 */}
                  {isExpanded && (
                    <div className="p-4">
                      {group.sources.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          该项目下暂无来源
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.sources.map((source) => {
                            const categoryInfo = getCategoryInfo(source.category);
                            const CategoryIcon = categoryInfo.icon;

                            return (
                              <div
                                key={source.id}
                                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                              >
                                {/* 标题和操作 */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0 mr-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{source.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}
                                      >
                                        <CategoryIcon className="w-3 h-3" />
                                        {categoryInfo.label}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {source.type === "knowledge_base" ? "知识库" : "外部"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setEditingSource(source)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="编辑"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(source)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="删除"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* 描述 */}
                                {source.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{source.description}</p>
                                )}

                                {/* URL */}
                                {source.url && (
                                  <div className="mb-3">
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline truncate block"
                                    >
                                      {source.url}
                                    </a>
                                  </div>
                                )}

                                {/* 元信息 */}
                                <div className="pt-3 border-t border-gray-200 space-y-1 text-xs text-gray-500">
                                  {source.conversation_id && (
                                    <div className="flex items-center justify-between">
                                      <span>对话ID:</span>
                                      <span className="font-mono text-gray-700 truncate max-w-[150px]">
                                        {source.conversation_id.substring(0, 16)}...
                                      </span>
                                    </div>
                                  )}
                                  {source.created_at && (
                                    <div className="flex items-center justify-between">
                                      <span>创建时间:</span>
                                      <span className="text-gray-700">
                                        {new Date(source.created_at).toLocaleDateString("zh-CN")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加来源弹窗 */}
      {showAddModal && (
        <AddSourceModalForManagement
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onAdd={async (source, projectId) => {
            // 保存来源到数据库
            const sourceWithId = {
              id: `external_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              ...source,
            };
            const result = await sourceService.saveSourceInformation(
              sourceWithId,
              undefined,
              undefined,
              projectId || undefined
            );
            if (result.success) {
              setShowAddModal(false);
              loadSources();
            } else {
              alert(result.error || "添加来源失败");
            }
          }}
        />
      )}

      {/* 编辑来源弹窗 */}
      {editingSource && (
        <EditSourceModalForManagement
          source={editingSource}
          projects={projects}
          onClose={() => setEditingSource(null)}
          onSave={async (updatedSource, projectId) => {
            // 更新来源信息
            try {
              // 优先使用 id，如果没有则使用 source_id
              const updateUrl = editingSource.id 
                ? `/source-information/${editingSource.id}`
                : `/source-information/source-id/${editingSource.source_id}`;
              
              // 构建更新数据，确保 project_id 正确处理 null 值
              const updateData: any = {
                title: updatedSource.title,
              };
              
              // 可选字段只在有值或明确为 null 时添加
              if (updatedSource.description !== undefined) {
                updateData.description = updatedSource.description || null;
              }
              if (updatedSource.url !== undefined) {
                updateData.url = updatedSource.url || null;
              }
              // project_id 处理：如果传入了 projectId（包括 0），则使用；如果为 undefined，则不更新
              if (projectId !== undefined) {
                updateData.project_id = projectId || null;
              }
              
              console.log("更新来源数据:", { updateUrl, updateData });
              
              const response = await api.put(updateUrl, updateData);
              
              if (response.data.success) {
                setEditingSource(null);
                loadSources();
              } else {
                alert(response.data.message || "更新失败");
              }
            } catch (error: any) {
              console.error("更新来源失败:", error);
              console.error("错误详情:", {
                code: error?.code,
                message: error?.message,
                details: error?.details,
                response: error?.response,
              });
              
              // 提取错误信息（apiClient 会将错误转换为 ApiErrorPayload 格式）
              let errorMessage = "更新来源失败";
              let errorDetails = "";
              
              // apiClient 错误格式：{ code, message, details }
              if (error?.message) {
                errorMessage = error.message;
              }
              
              // details 可能包含后端返回的完整错误信息
              if (error?.details) {
                if (typeof error.details === 'string') {
                  errorDetails = `\n\n错误详情: ${error.details}`;
                } else if (typeof error.details === 'object') {
                  // 如果 details 是对象，尝试提取 message 和 error
                  const detailsMsg = error.details.message || error.details.error || '';
                  if (detailsMsg) {
                    errorMessage = detailsMsg;
                  }
                  // 显示完整的 details（开发环境）
                  if (process.env.NODE_ENV === 'development') {
                    errorDetails = `\n\n错误详情:\n${JSON.stringify(error.details, null, 2)}`;
                  }
                }
              }
              
              // 显示详细的错误信息
              const fullErrorMessage = `更新来源失败\n\n${errorMessage}${errorDetails}`;
              console.error("完整错误信息:", fullErrorMessage);
              alert(fullErrorMessage);
            }
          }}
        />
      )}
    </div>
  );
};

export default SourceManagementPage;

