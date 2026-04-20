import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Check, Plus, FileText, Brain, Globe, Upload, Loader2, Search, X } from 'lucide-react';
import { Project } from '../../types/project';
import { TechPoint } from '../../types/techPoint';
import { SourceInformation } from '../../services/sourceService';
import { KnowledgePoint } from '../../types/knowledgePoint';
import api from '../../services/api';
import sourceService from '../../services/sourceService';
import { publicKnowledgeService } from '../../services/publicKnowledgeService';
import { aiSearchService } from '../../services/aiSearchService';
import { bochaAPI } from '../../services/api';
import { PublicKnowledgeFile } from '../../types/publicKnowledge';
import { groupSourcesByCategory } from '../../services/resourceClassifier';
import { useProjectResourceStore } from '../../stores/projectResourceStore';

interface TechPointListSidebarProps {
  project: Project;
  selectedTechPointId?: number;
  onSelectTechPoint: (techPoint: TechPoint) => void;
  onSelectResource?: (resource: SourceInformation | KnowledgePoint) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

const TechPointListSidebar: React.FC<TechPointListSidebarProps> = ({
  project,
  selectedTechPointId,
  onSelectTechPoint,
  onSelectResource,
  onRefresh,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<{
    files: SourceInformation[];
    internetInfo: SourceInformation[];
    knowledgePoints: KnowledgePoint[];
  }>({
    files: [],
    internetInfo: [],
    knowledgePoints: []
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPublicKnowledgeModal, setShowPublicKnowledgeModal] = useState(false);
  const [publicKnowledgeFiles, setPublicKnowledgeFiles] = useState<PublicKnowledgeFile[]>([]);
  const [publicFileSearch, setPublicFileSearch] = useState('');
  const [tempSelectedPublicFiles, setTempSelectedPublicFiles] = useState<number[]>([]);
  const [showWebSearchModal, setShowWebSearchModal] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<number>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);

  const { getResources, invalidate } = useProjectResourceStore();

  useEffect(() => {
    loadTechPoints();
  }, [project.id, refreshTrigger]);

  useEffect(() => {
    loadResources();
  }, [project.id, refreshTrigger]);

  useEffect(() => {
    if (showPublicKnowledgeModal) {
      loadPublicKnowledgeFiles();
    }
  }, [showPublicKnowledgeModal]);

  const loadTechPoints = async () => {
    try {
      setLoading(true);
      const detailsResponse = await api.get(`/projects/${project.id}/details`);
      const techPoints = detailsResponse.data?.success && detailsResponse.data?.data?.techPoints
        ? detailsResponse.data.data.techPoints
        : [];
      setTechPoints(techPoints);
      onRefresh?.();
    } catch (error) {
      console.error('加载技术点失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const projectResources = await getResources(project.id);
      const grouped = groupSourcesByCategory(projectResources.sources);
      setResources({
        files: grouped['file'],
        internetInfo: grouped['web-search'],
        knowledgePoints: projectResources.knowledgePoints || [],
      });
    } catch (error) {
      console.error('加载技术资源失败:', error);
      try {
        const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
        const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
        const grouped = groupSourcesByCategory(sources);
        setResources({
          files: grouped['file'],
          internetInfo: grouped['web-search'],
          knowledgePoints: [],
        });
      } catch (fallbackError) {
        console.error('降级加载技术资源失败:', fallbackError);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const uploadedFiles = await aiSearchService.uploadFiles(fileArray, undefined);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        alert('文件上传失败，请重试');
        return;
      }

      for (const uploadedFile of uploadedFiles) {
        let description = `文件大小: ${formatFileSize(uploadedFile.size)}`;
        if (uploadedFile.markdownContent) {
          const contentPreview = uploadedFile.markdownContent.length > 500
            ? uploadedFile.markdownContent.substring(0, 500) + '...'
            : uploadedFile.markdownContent;
          description = contentPreview;
        }

        const sourceData = {
          source_id: uploadedFile.id || uploadedFile.fileId || `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: uploadedFile.name,
          type: 'external' as const,
          url: uploadedFile.url,
          description: description,
          page_type: undefined,
          conversation_id: null,
          project_id: project.id,
          metadata: {
            category: 'external'
          }
        };

        try {
          await api.post('/source-information', sourceData);
        } catch (error) {
          console.error('创建来源信息失败:', error);
        }
      }

      invalidate(project.id);
      await loadResources();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const loadPublicKnowledgeFiles = async () => {
    try {
      const response = await publicKnowledgeService.getFiles();
      if (response.success && response.data) {
        setPublicKnowledgeFiles(response.data);
        const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
        const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
        const publicKbSources = sources.filter(s =>
          s.type === 'knowledge_base' && s.source_id?.startsWith('public_kb_')
        );
        const associatedFileIds = publicKbSources
          .map(s => {
            const match = s.source_id?.match(/public_kb_(\d+)/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((id): id is number => id !== null);
        setTempSelectedPublicFiles(associatedFileIds);
      }
    } catch (error) {
      console.error('加载公共知识库文件失败:', error);
    }
  };

  const handleOpenPublicKnowledgeModal = () => {
    setShowPublicKnowledgeModal(true);
  };

  const handleClosePublicKnowledgeModal = () => {
    setShowPublicKnowledgeModal(false);
    setPublicFileSearch('');
    setTempSelectedPublicFiles([]);
  };

  const togglePublicFileInModal = (fileId: number) => {
    setTempSelectedPublicFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleConfirmPublicFiles = async () => {
    try {
      const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
      const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
      const publicKbSources = sources.filter(s =>
        s.type === 'knowledge_base' && s.source_id?.startsWith('public_kb_')
      );
      const currentFileIds = publicKbSources
        .map(s => {
          const match = s.source_id?.match(/public_kb_(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((id): id is number => id !== null);

      const filesToAdd = tempSelectedPublicFiles.filter(id => !currentFileIds.includes(id));
      const filesToRemove = currentFileIds.filter(id => !tempSelectedPublicFiles.includes(id));

      for (const fileId of filesToRemove) {
        const sourceToDelete = publicKbSources.find(s =>
          s.source_id === `public_kb_${fileId}`
        );
        if (sourceToDelete?.id) {
          try {
            await api.delete(`/source-information/source-id/${sourceToDelete.source_id}`);
          } catch (error) {
            console.error('删除公共知识库文件关联失败:', error);
          }
        }
      }

      for (const fileId of filesToAdd) {
        const file = publicKnowledgeFiles.find(f => f.id === fileId);
        if (file) {
          try {
            await api.post('/source-information', {
              source_id: `public_kb_${file.id}`,
              title: file.description || file.name,
              type: 'knowledge_base',
              url: file.file_url || file.file_path,
              description: file.name,
              page_type: undefined,
              conversation_id: null,
              project_id: project.id,
              metadata: {
                category: 'knowledge_base'
              }
            });
          } catch (error) {
            console.error('添加公共知识库文件关联失败:', error);
          }
        }
      }

      invalidate(project.id);
      await loadResources();
      handleClosePublicKnowledgeModal();
    } catch (error) {
      console.error('确认公共知识库文件选择失败:', error);
      alert('操作失败，请重试');
    }
  };

  const filteredPublicFiles = publicKnowledgeFiles.filter(file =>
    file.name.toLowerCase().includes(publicFileSearch.toLowerCase()) ||
    (file.description && file.description.toLowerCase().includes(publicFileSearch.toLowerCase()))
  );

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      alert('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    setWebSearchResults([]);
    setSelectedSearchResults(new Set());

    try {
      const result = await bochaAPI.webSearch({
        query: webSearchQuery.trim(),
        summary: true,
        count: 10,
      });

      if (result.success && result.data?.webPages?.value) {
        setWebSearchResults(result.data.webPages.value);
      } else {
        alert(result.error?.message || '搜索失败，请重试');
      }
    } catch (error) {
      console.error('Web Search 失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSearchResult = (index: number) => {
    const newSelected = new Set(selectedSearchResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSearchResults(newSelected);
  };

  const handleSaveWebSearchResults = async () => {
    if (selectedSearchResults.size === 0) {
      alert('请至少选择一个搜索结果');
      return;
    }

    setIsSavingResults(true);
    try {
      const selectedResults = Array.from(selectedSearchResults).map(index => webSearchResults[index]);

      for (const result of selectedResults) {
        const sourceData = {
          source_id: `web_search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          title: result.name || '未命名网页',
          type: 'external' as const,
          url: result.url,
          description: `${result.snippet || ''}\n\n${result.summary ? `摘要：${result.summary}` : ''}\n\n来源：${result.siteName || ''}`.trim(),
          page_type: undefined,
          conversation_id: null,
          project_id: project.id,
          metadata: {
            category: 'web-search'
          }
        };

        try {
          await api.post('/source-information', sourceData);
        } catch (error) {
          console.error('保存搜索结果失败:', error);
        }
      }

      invalidate(project.id);
      await loadResources();
      setWebSearchQuery('');
      setWebSearchResults([]);
      setSelectedSearchResults(new Set());
      setShowWebSearchModal(false);
    } catch (error) {
      console.error('保存搜索结果失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSavingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const handleAddTechPoint = () => {
    const returnUrl = `/project/${project.id}/management`;
    const currentTechPointIds = techPoints.map(tp => tp.id).join(',');
    navigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${currentTechPointIds}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 标题 */}
      <div className="bg-gray-200 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">技术点列表</h2>
        <button
          onClick={handleAddTechPoint}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          title="添加技术点"
        >
          <Plus className="w-3 h-3" />
          <span>添加</span>
        </button>
      </div>

      {/* 技术点列表 */}
      <div className="flex-1 overflow-y-auto">
        {techPoints.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            <div className="mb-4">暂无技术点</div>
            <button
              onClick={handleAddTechPoint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加技术点</span>
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1 border-b border-gray-200">
            {techPoints.map((tp) => (
              <div
                key={tp.id}
                onClick={() => onSelectTechPoint(tp)}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTechPointId === tp.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Package className={`w-4 h-4 flex-shrink-0 ${
                  selectedTechPointId === tp.id ? 'text-blue-600' : 'text-purple-600'
                }`} />
                <span className={`text-sm truncate flex-1 ${
                  selectedTechPointId === tp.id
                    ? 'text-blue-900 font-medium'
                    : 'text-gray-700'
                }`}>
                  {tp.name}
                </span>
                {selectedTechPointId === tp.id && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-900">技术资源</h2>
        </div>

        <div className="border-b border-gray-200">
          <div className="px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  已上传文件 {resources.files.length > 0 && <span className="text-gray-500 font-normal">({resources.files.length})</span>}
                </span>
              </div>
              <button
                onClick={handleUploadClick}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="上传文件"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {resources.files.length > 0 ? (
            <div className="px-4 pb-3 space-y-1">
              {resources.files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelectResource?.(file)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                >
                  <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-blue-600">
                    {file.title || '未命名文件'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
              />
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>上传文件</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200">
          <div className="px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">
                  关联知识点 {resources.knowledgePoints.length > 0 && <span className="text-gray-500 font-normal">({resources.knowledgePoints.length})</span>}
                </span>
              </div>
              <button
                onClick={handleOpenPublicKnowledgeModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="添加知识点"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {resources.knowledgePoints.length > 0 ? (
            <div className="px-4 pb-3 space-y-1">
              {resources.knowledgePoints.map((kp) => (
                <div
                  key={kp.id}
                  onClick={() => onSelectResource?.(kp)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                >
                  <Brain className="w-3 h-3 text-purple-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate flex-1 group-hover:text-blue-600">
                    {kp.title || '未命名知识点'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-3">
              <button
                onClick={handleOpenPublicKnowledgeModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>选择公共知识库</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200">
          <div className="px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">
                  互联网信息点 {resources.internetInfo.length > 0 && <span className="text-gray-500 font-normal">({resources.internetInfo.length})</span>}
                </span>
              </div>
              <button
                onClick={() => setShowWebSearchModal(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="添加互联网信息"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {resources.internetInfo.length > 0 ? (
            <div className="px-4 pb-3 space-y-1">
              {resources.internetInfo.map((info) => (
                <div
                  key={info.id}
                  onClick={() => onSelectResource?.(info)}
                  className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                >
                  <Globe className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                      {info.title || '未命名信息'}
                    </div>
                    {info.url && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {info.url}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 pb-3">
              <button
                onClick={() => setShowWebSearchModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Web 检索信息</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showPublicKnowledgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">选择公共知识库</h2>
              <button
                onClick={handleClosePublicKnowledgeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文件..."
                  value={publicFileSearch}
                  onChange={(e) => setPublicFileSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPublicFiles.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    {publicFileSearch ? '未找到匹配的文件' : '暂无文件'}
                  </div>
                ) : (
                  filteredPublicFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => togglePublicFileInModal(file.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                        tempSelectedPublicFiles.includes(file.id)
                          ? 'bg-purple-50 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <h3 className="text-sm font-medium text-gray-900 truncate">{file.name}</h3>
                      </div>
                      {file.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{file.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClosePublicKnowledgeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmPublicFiles}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showWebSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Web 检索信息</h2>
              <button
                onClick={() => {
                  setShowWebSearchModal(false);
                  setWebSearchQuery('');
                  setWebSearchResults([]);
                  setSelectedSearchResults(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="输入搜索关键词..."
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSearching && webSearchQuery.trim()) {
                        handleWebSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleWebSearch}
                  disabled={isSearching || !webSearchQuery.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSearching ? <span>搜索中...</span> : <span>搜索</span>}
                </button>
              </div>

              {webSearchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {webSearchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => toggleSearchResult(index)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                        selectedSearchResults.has(index)
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {result.name || '未命名网页'}
                      </h3>
                      {result.url && (
                        <p className="text-xs text-gray-500 truncate mt-1">{result.url}</p>
                      )}
                      {result.snippet && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{result.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowWebSearchModal(false);
                  setWebSearchQuery('');
                  setWebSearchResults([]);
                  setSelectedSearchResults(new Set());
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveWebSearchResults}
                disabled={isSavingResults || selectedSearchResults.size === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingResults ? '保存中...' : `保存选中结果 (${selectedSearchResults.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechPointListSidebar;

