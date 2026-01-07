import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Globe, Brain, Package, MessageSquare, Check } from 'lucide-react';
import { Project } from '../../types/project';
import { SourceInformation } from '../../services/sourceService';
import { TechPoint } from '../../types/techPoint';
import { KnowledgePoint } from '../../types/knowledgePoint';
import { ConversationRecord } from '../../services/chatHistoryService';
import sourceService from '../../services/sourceService';
import ProjectConversationService from '../../services/projectConversationService';
import api from '../../services/api';

interface ProjectSidebarProps {
  project: Project;
  onSelectTechPoint?: (techPoint: TechPoint) => void;
  onSelectResource?: (resource: SourceInformation) => void;
  onSelectConversation?: (conversation: ConversationRecord) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  onSelectTechPoint,
  onSelectResource,
  onSelectConversation
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    resources: true,
    conversations: true
  });
  const [resources, setResources] = useState<{
    files: SourceInformation[];
    internetInfo: SourceInformation[];
    techPoints: TechPoint[];
    knowledgePoints: KnowledgePoint[];
  }>({
    files: [],
    internetInfo: [],
    techPoints: [],
    knowledgePoints: []
  });
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载资源
      const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
      const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
      const files = sources.filter(s => s.type === 'file');
      const internetInfo = sources.filter(s => s.type === 'url' || s.type === 'text');

      // 加载技术点和知识点
      const detailsResponse = await api.get(`/projects/${project.id}/details`);
      const techPoints = detailsResponse.data?.success && detailsResponse.data?.data?.techPoints
        ? detailsResponse.data.data.techPoints
        : [];
      const knowledgePoints = detailsResponse.data?.success && detailsResponse.data?.data?.knowledgePoints
        ? detailsResponse.data.data.knowledgePoints
        : [];

      setResources({ files, internetInfo, techPoints, knowledgePoints });

      // 加载对话记录
      const convs = await ProjectConversationService.getProjectConversations(project.id);
      setConversations(convs);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 项目详情标题 */}
      <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-900">项目详情</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 已关联技术信息 */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('resources')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">已关联技术信息</span>
            {expandedSections.resources ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.resources && (
            <div className="px-4 pb-4 space-y-4">
              {/* 已选择技术点 */}
              {resources.techPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">已选择技术点</span>
                  </div>
                  <div className="space-y-1">
                    {resources.techPoints.map((tp) => (
                      <div
                        key={tp.id}
                        onClick={() => onSelectTechPoint?.(tp)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <Package className="w-3 h-3 text-purple-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-blue-600">
                          {tp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已上传文件 */}
              {resources.files.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">已上传文件</span>
                  </div>
                  <div className="space-y-1">
                    {resources.files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onSelectResource?.(file)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-blue-600">
                          {file.title || '未命名文件'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已选择知识点 */}
              {resources.knowledgePoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-gray-700">已选择知识点</span>
                  </div>
                  <div className="space-y-1">
                    {resources.knowledgePoints.map((kp) => (
                      <div
                        key={kp.id}
                        onClick={() => onSelectResource?.(kp as any)}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <Brain className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-blue-600">
                          {kp.title || '未命名知识点'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 互联网信息 */}
              {resources.internetInfo.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">互联网信息</span>
                  </div>
                  <div className="space-y-1">
                    {resources.internetInfo.map((info) => (
                      <div
                        key={info.id}
                        onClick={() => onSelectResource?.(info)}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <Globe className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                            {info.title || '未命名信息'}
                          </div>
                          {info.url && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {info.url}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(info.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI共创信息 */}
        <div>
          <button
            onClick={() => toggleSection('conversations')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">AI共创信息</span>
            {expandedSections.conversations ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.conversations && (
            <div className="px-4 pb-4 space-y-1">
              {conversations.length === 0 ? (
                <div className="text-xs text-gray-500 py-4 text-center">暂无对话记录</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => onSelectConversation?.(conv)}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                  >
                    <MessageSquare className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                        {conv.session_name && conv.session_name.trim() && conv.session_name.toLowerCase() !== 'unknown' 
                          ? conv.session_name 
                          : `${conv.app_type || '对话'} ${conv.created_at ? new Date(conv.created_at).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : ''}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {conv.app_type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;

