import React, { useState, useEffect } from 'react';
import { FileText, Globe, Brain, Package, Check, X, Trash2, Eye } from 'lucide-react';
import { SourceInformation } from '../../services/sourceService';
import { TechPoint } from '../../types/techPoint';
import { KnowledgePoint } from '../../types/knowledgePoint';
import sourceService from '../../services/sourceService';
import { techPointService } from '../../services/techPointService';
import { knowledgePointService } from '../../services/knowledgePointService';
import api from '../../services/api';

interface ProjectResourcesListProps {
  projectId: number;
}

interface ProjectResources {
  files: SourceInformation[];
  internetInfo: SourceInformation[];
  techPoints: TechPoint[];
  knowledgePoints: KnowledgePoint[];
}

const ProjectResourcesList: React.FC<ProjectResourcesListProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ProjectResources>({
    files: [],
    internetInfo: [],
    techPoints: [],
    knowledgePoints: []
  });

  useEffect(() => {
    loadResources();
  }, [projectId]);

  const loadResources = async () => {
    if (!projectId) return;

    try {
      setLoading(true);

      // 加载来源信息
      const sourcesResult = await sourceService.loadSourceInformationByProjectId(projectId);
      const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];

      // 分类来源信息
      const files = sources.filter(s => s.type === 'file');
      const internetInfo = sources.filter(s => s.type === 'url' || s.type === 'text');

      // 加载技术点
      const techPointsResponse = await api.get(`/projects/${projectId}/details`);
      const techPoints = techPointsResponse.data?.success && techPointsResponse.data?.data?.techPoints
        ? techPointsResponse.data.data.techPoints
        : [];

      // 加载知识点
      const knowledgePoints = techPointsResponse.data?.success && techPointsResponse.data?.data?.knowledgePoints
        ? techPointsResponse.data.data.knowledgePoints
        : [];

      setResources({
        files,
        internetInfo,
        techPoints,
        knowledgePoints
      });
    } catch (error) {
      console.error('加载项目资源失败:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const totalCount = resources.files.length + resources.internetInfo.length + 
                     resources.techPoints.length + resources.knowledgePoints.length;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">项目资源</h2>
        <p className="text-sm text-gray-500 mt-1">共 {totalCount} 项资源</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* 文件卡片组 */}
        {resources.files.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">文件</h3>
              <span className="text-sm text-gray-500">({resources.files.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate mb-1">
                        {file.title || '未命名文件'}
                      </div>
                      {file.description && (
                        <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {file.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {formatDate(file.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 网络信息卡片组 */}
        {resources.internetInfo.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">网络信息</h3>
              <span className="text-sm text-gray-500">({resources.internetInfo.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.internetInfo.map((info) => (
                <div
                  key={info.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all p-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate mb-1">
                        {info.title || '未命名信息'}
                      </div>
                      {info.url && (
                        <a
                          href={info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline block truncate mb-2"
                        >
                          {info.url}
                        </a>
                      )}
                      {info.description && (
                        <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {info.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {formatDate(info.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 技术点卡片组 */}
        {resources.techPoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">技术点</h3>
              <span className="text-sm text-gray-500">({resources.techPoints.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.techPoints.map((tp) => (
                <div
                  key={tp.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all p-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate mb-1">
                        {tp.name}
                      </div>
                      {tp.description && (
                        <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {tp.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {tp.tech_type && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                            {tp.tech_type}
                          </span>
                        )}
                        {tp.priority && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {tp.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 知识点卡片组 */}
        {resources.knowledgePoints.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">知识点</h3>
              <span className="text-sm text-gray-500">({resources.knowledgePoints.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.knowledgePoints.map((kp) => (
                <div
                  key={kp.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all p-4 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                      <Brain className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate mb-1">
                        {kp.title || '未命名知识点'}
                      </div>
                      {kp.content && (
                        <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {kp.content}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {formatDate(kp.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">暂无资源</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectResourcesList;

