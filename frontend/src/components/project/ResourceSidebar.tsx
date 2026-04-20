import React, { useState, useEffect, useRef } from 'react';
import { FileText, Globe, Brain, MessageSquare, Upload, Loader2, X, Search, Check, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types/project';
import { SourceInformation } from '../../services/sourceService';
import { KnowledgePoint } from '../../types/knowledgePoint';
import { ConversationRecord } from '../../services/chatHistoryService';
import { PublicKnowledgeFile } from '../../types/publicKnowledge';
import sourceService from '../../services/sourceService';
import ProjectConversationService from '../../services/projectConversationService';
import { aiSearchService } from '../../services/aiSearchService';
import { publicKnowledgeService } from '../../services/publicKnowledgeService';
import { bochaAPI } from '../../services/api';
import api from '../../services/api';
import { groupSourcesByCategory } from '../../services/resourceClassifier';
import { useProjectResourceStore } from '../../stores/projectResourceStore';

interface ResourceSidebarProps {
  project: Project;
  onSelectResource?: (resource: SourceInformation | KnowledgePoint) => void;
  onSelectConversation?: (conversation: ConversationRecord) => void;
  showResourceSections?: boolean;
}

const ResourceSidebar: React.FC<ResourceSidebarProps> = ({
  project,
  onSelectResource,
  onSelectConversation,
  showResourceSections = true
}) => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<{
    files: SourceInformation[];
    internetInfo: SourceInformation[];
    knowledgePoints: KnowledgePoint[];
  }>({
    files: [],
    internetInfo: [],
    knowledgePoints: []
  });
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  // 使用项目资源Store
  const { getResources, invalidate } = useProjectResourceStore();

  useEffect(() => {
    loadData();
  }, [project.id]);

  useEffect(() => {
    if (showPublicKnowledgeModal) {
      loadPublicKnowledgeFiles();
    }
  }, [showPublicKnowledgeModal]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 使用Store获取资源（带缓存）
      const projectResources = await getResources(project.id);
      
      // 使用统一的分类服务进行分类
      const grouped = groupSourcesByCategory(projectResources.sources);
      
      // 文件来源
      const files = grouped['file'];
      
      // 互联网信息：包括 web-search 分组
      const internetInfo = grouped['web-search'];

      // 设置资源
      setResources({
        files,
        internetInfo,
        knowledgePoints: projectResources.knowledgePoints || [],
      });

      // 设置对话记录（从分组中提取）
      const allConversations = projectResources.conversationsList || [];
      setConversations(allConversations);
    } catch (error) {
      console.error('加载数据失败:', error);
      // 降级到旧方法
      try {
        const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
        const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
        const grouped = groupSourcesByCategory(sources);
        setResources({
          files: grouped['file'],
          internetInfo: grouped['web-search'],
          knowledgePoints: [],
        });
        const convs = await ProjectConversationService.getProjectConversations(project.id);
        setConversations(convs);
      } catch (fallbackError) {
        console.error('降级加载也失败:', fallbackError);
      }
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

  // 生成对话标题
  const getConversationTitle = (conversation: ConversationRecord): string => {
    // 如果 session_name 存在且不是 "unknown"，直接使用
    if (conversation.session_name && conversation.session_name.trim() && conversation.session_name.toLowerCase() !== 'unknown') {
      return conversation.session_name;
    }
    
    // 否则根据 app_type 生成标题
    const appTypeLabels: Record<string, string> = {
      'ai-search': 'AI问答',
      'ai-qa': 'AI问答',
      'tech-package': '技术包装',
      'tech-strategy': '技术策略',
      'tech-article': '技术通稿',
      'brainstorm': '头脑风暴'
    };
    
    const appTypeLabel = appTypeLabels[conversation.app_type] || conversation.app_type || '对话';
    const dateStr = conversation.created_at ? formatDate(conversation.created_at) : '';
    
    return dateStr ? `${appTypeLabel} ${dateStr}` : `${appTypeLabel} 对话`;
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
      
      // 上传文件
      const uploadedFiles = await aiSearchService.uploadFiles(fileArray, undefined);
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        alert('文件上传失败，请重试');
        return;
      }

      // 创建来源信息记录
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
          page_type: undefined, // 不再使用 page_type，改用 project_id
          conversation_id: null,
          project_id: project.id, // 明确关联到当前项目
          metadata: {
            category: 'external' // 标记为外部文件
          }
        };
        
        try {
          await api.post('/source-information', sourceData);
        } catch (error) {
          console.error('创建来源信息失败:', error);
        }
      }

      // 使缓存失效并刷新
      invalidate(project.id);
      await loadData();
      
      // 清空文件输入
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
        // 初始化临时选择状态为已关联的知识点
        // 从 source_information 中查找 type 为 'knowledge_base' 且 source_id 以 'public_kb_' 开头的记录
        const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
        const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
        const publicKbSources = sources.filter(s => 
          s.type === 'knowledge_base' && s.source_id?.startsWith('public_kb_')
        );
        const associatedFileIds = publicKbSources
          .map(s => {
            const match = s.source_id?.match(/public_kb_(\d+)/);
            return match ? parseInt(match[1]) : null;
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
      // 获取当前已关联的文件ID（从 source_information 中查找）
      const sourcesResult = await sourceService.loadSourceInformationByProjectId(project.id);
      const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];
      const publicKbSources = sources.filter(s => 
        s.type === 'knowledge_base' && s.source_id?.startsWith('public_kb_')
      );
      const currentFileIds = publicKbSources
        .map(s => {
          const match = s.source_id?.match(/public_kb_(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((id): id is number => id !== null);

      // 需要添加的文件
      const filesToAdd = tempSelectedPublicFiles.filter(id => !currentFileIds.includes(id));
      // 需要删除的文件
      const filesToRemove = currentFileIds.filter(id => !tempSelectedPublicFiles.includes(id));

      // 删除取消选择的文件
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

      // 添加新选择的文件
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
              page_type: undefined, // 不再使用 page_type，改用 project_id
              conversation_id: null,
              project_id: project.id, // 明确关联到当前项目
              metadata: {
                category: 'knowledge_base' // 标记为知识库来源
              }
            });
          } catch (error) {
            console.error('添加公共知识库文件关联失败:', error);
          }
        }
      }

      // 刷新数据
      await loadData();
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
      const savedSources: SourceInformation[] = [];

      for (const result of selectedResults) {
        const sourceId = `web_search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const description = `${result.snippet || ''}\n\n${result.summary ? `摘要：${result.summary}` : ''}\n\n来源：${result.siteName || ''}`.trim();
        
        const sourceData = {
          source_id: sourceId,
          title: result.name || '未命名网页',
          type: 'external' as const,
          url: result.url,
          description: description,
          page_type: undefined, // 不再使用 page_type，改用 project_id
          conversation_id: null,
          project_id: project.id, // 明确关联到当前项目
          metadata: {
            category: 'web-search' // 标记为 web 搜索来源
          }
        };

        try {
          const response = await api.post('/source-information', sourceData);
          if (response.data?.success && response.data?.data) {
            savedSources.push(response.data.data);
          }
        } catch (error) {
          console.error('保存搜索结果失败:', error);
        }
      }

      // 刷新数据
      await loadData();
      
      // 清空状态并关闭弹窗
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

  const handleOpenWebSearchModal = () => {
    setShowWebSearchModal(true);
  };

  const handleCloseWebSearchModal = () => {
    setShowWebSearchModal(false);
    setWebSearchQuery('');
    setWebSearchResults([]);
    setSelectedSearchResults(new Set());
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
      <div className="flex-1 overflow-y-auto">
        {showResourceSections && (
          <>
            {/* 标题 */}
            <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
              <h2 className="text-sm font-semibold text-gray-900">技术资源</h2>
            </div>

            {/* 上传文件分组 */}
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

            {/* 关联知识点分组 */}
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
                      onClick={() => onSelectResource?.(kp as any)}
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

            {/* 互联网信息点分组 */}
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
                    onClick={handleOpenWebSearchModal}
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
                        {info.created_at && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(info.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 pb-3">
                  <button
                    onClick={handleOpenWebSearchModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span>Web 检索信息</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI共创信息 */}
        <div>
          <div className="bg-gray-200 px-4 py-3 border-b border-gray-300">
            <h2 className="text-sm font-semibold text-gray-900">AI共创信息</h2>
          </div>

          {/* 技术问答分组 */}
          {(() => {
            const techQaConvs = conversations.filter(c => c.app_type === 'ai-search' || c.app_type === 'ai-qa');
            return (
              <div className="border-b border-gray-200">
                <div className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        技术问答 {techQaConvs.length > 0 && <span className="text-gray-500 font-normal">({techQaConvs.length})</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/project/${project.id}/ai-qa`)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="跳转到技术问答页面"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {techQaConvs.length > 0 ? (
                  <div className="px-4 pb-3 space-y-1">
                    {techQaConvs.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        onClick={() => onSelectConversation?.(conv)}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <MessageSquare className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                            {getConversationTitle(conv)}
                          </div>
                          {conv.created_at && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(conv.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-gray-500 py-2 text-center">暂无技术问答记录</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 技术策略分组 */}
          {(() => {
            const techStrategyConvs = conversations.filter(c => c.app_type === 'tech-strategy');
            return (
              <div className="border-b border-gray-200">
                <div className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        技术策略 {techStrategyConvs.length > 0 && <span className="text-gray-500 font-normal">({techStrategyConvs.length})</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/project/${project.id}/tech-strategy`)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="跳转到技术策略页面"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {techStrategyConvs.length > 0 ? (
                  <div className="px-4 pb-3 space-y-1">
                    {techStrategyConvs.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        onClick={() => onSelectConversation?.(conv)}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <MessageSquare className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                            {getConversationTitle(conv)}
                          </div>
                          {conv.created_at && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(conv.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-gray-500 py-2 text-center">暂无技术策略记录</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 技术包装分组 */}
          {(() => {
            const techPackageConvs = conversations.filter(c => c.app_type === 'tech-package');
            return (
              <div className="border-b border-gray-200">
                <div className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900">
                        技术包装 {techPackageConvs.length > 0 && <span className="text-gray-500 font-normal">({techPackageConvs.length})</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/project/${project.id}/tech-package`)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="跳转到技术包装页面"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {techPackageConvs.length > 0 ? (
                  <div className="px-4 pb-3 space-y-1">
                    {techPackageConvs.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        onClick={() => onSelectConversation?.(conv)}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <MessageSquare className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                            {getConversationTitle(conv)}
                          </div>
                          {conv.created_at && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(conv.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-gray-500 py-2 text-center">暂无技术包装记录</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 技术通稿分组 */}
          {(() => {
            const techArticleConvs = conversations.filter(c => c.app_type === 'tech-article');
            return (
              <div>
                <div className="px-4 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-900">
                        技术通稿 {techArticleConvs.length > 0 && <span className="text-gray-500 font-normal">({techArticleConvs.length})</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/project/${project.id}/tech-article`)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="跳转到技术通稿页面"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                {techArticleConvs.length > 0 ? (
                  <div className="px-4 pb-3 space-y-1">
                    {techArticleConvs.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        onClick={() => onSelectConversation?.(conv)}
                        className="flex items-start gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      >
                        <MessageSquare className="w-3 h-3 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate group-hover:text-blue-600">
                            {getConversationTitle(conv)}
                          </div>
                          {conv.created_at && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(conv.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="text-xs text-gray-500 py-2 text-center">暂无技术通稿记录</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 公共知识库选择弹窗 */}
      {showPublicKnowledgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">选择公共知识库</h2>
              <button
                onClick={handleClosePublicKnowledgeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
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
                      className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        tempSelectedPublicFiles.includes(file.id)
                          ? 'bg-purple-50 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Brain className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </h3>
                          {tempSelectedPublicFiles.includes(file.id) && (
                            <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          )}
                        </div>
                        {file.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {file.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {tempSelectedPublicFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    已选择 {tempSelectedPublicFiles.length} 个文件
                  </p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
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

      {/* Web 检索弹窗 */}
      {showWebSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Web 检索信息</h2>
              <button
                onClick={handleCloseWebSearchModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 搜索输入框 */}
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
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>搜索中...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>搜索</span>
                    </>
                  )}
                </button>
              </div>

              {/* 搜索结果 */}
              {webSearchResults.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">
                      找到 {webSearchResults.length} 个结果
                    </p>
                    {selectedSearchResults.size > 0 && (
                      <p className="text-sm text-orange-600 font-medium">
                        已选择 {selectedSearchResults.size} 个
                      </p>
                    )}
                  </div>
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="w-4 h-4 text-orange-600 flex-shrink-0" />
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {result.name || '未命名网页'}
                              </h3>
                              {selectedSearchResults.has(index) && (
                                <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                              )}
                            </div>
                            {result.url && (
                              <p className="text-xs text-gray-500 truncate mb-1">
                                {result.url}
                              </p>
                            )}
                            {result.snippet && (
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {result.snippet}
                              </p>
                            )}
                            {result.summary && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                摘要：{result.summary}
                              </p>
                            )}
                            {result.siteName && (
                              <p className="text-xs text-gray-400 mt-1">
                                来源：{result.siteName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 搜索中状态 */}
              {isSearching && webSearchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">搜索中...</p>
                </div>
              )}

              {/* 空状态 */}
              {!isSearching && webSearchResults.length === 0 && webSearchQuery && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">未找到相关结果</p>
                </div>
              )}

              {!isSearching && webSearchResults.length === 0 && !webSearchQuery && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">请输入关键词进行搜索</p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseWebSearchModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveWebSearchResults}
                disabled={isSavingResults || selectedSearchResults.size === 0}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingResults ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <span>保存选中结果 ({selectedSearchResults.size})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceSidebar;

