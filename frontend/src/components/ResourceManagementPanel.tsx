import React from 'react';
import { Check, FileText, Trash2, Plus, Upload, Brain, FileCode, Eye, Sparkles, Package, Target, Loader2 } from 'lucide-react';
import { TechPoint } from '../types/techPoint';
import { SourceInformation } from '../services/sourceService';

interface ResourceManagementPanelProps {
  configuredResources: {
    files: SourceInformation[];
    internetInfo: SourceInformation[];
    techPoints: TechPoint[];
    knowledgePoints: any[];
  };
  ragKnowledgeItems: Array<{ document_id: string; document_name: string; segment_id: string; content: string; score?: number }>;
  manualKnowledgeItems: Array<{ id: string; title: string; content?: string; type: 'public_kb' | 'knowledge_point' }>;
  translatedContent: string;
  isTranslating: boolean;
  projectId: string | undefined;
  selectedTechPoints: number[];
  onToggleTechPoint: (id: number) => void;
  onShowFileUploadModal: () => void;
  onShowInternetInfoModal: () => void;
  onOpenPublicKnowledgeModal: () => void;
  onTechnicalTranslation: () => void;
  onShowReviewModal: (content: string) => void;
  onDeleteSource: (id: number | undefined) => Promise<boolean>;
  onNavigateToAIPage: (pageType: 'tech-package' | 'tech-strategy') => Promise<void>;
  onNavigate: (path: string) => void;
  formatDate: (dateString?: string) => string;
  isSummarizingConversation: boolean;
  navigatingTarget: 'tech-strategy' | 'tech-package' | null;
  onToggleKnowledgePoint: (id: number) => void;
  onLoadSources: () => Promise<void>;
}

const ResourceManagementPanel: React.FC<ResourceManagementPanelProps> = ({
  configuredResources,
  ragKnowledgeItems,
  manualKnowledgeItems,
  translatedContent,
  isTranslating,
  projectId,
  selectedTechPoints,
  onToggleTechPoint,
  onShowFileUploadModal,
  onShowInternetInfoModal,
  onOpenPublicKnowledgeModal,
  onTechnicalTranslation,
  onShowReviewModal,
  onDeleteSource,
  onNavigateToAIPage,
  onNavigate,
  formatDate,
  isSummarizingConversation,
  navigatingTarget,
  onToggleKnowledgePoint,
  onLoadSources,
}) => {
  return (
    <div className="lg:col-span-4 space-y-5 flex flex-col">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-purple-50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">已关联技术信息</h2>
            <p className="text-xs text-gray-500 mt-0.5">技术资料</p>
          </div>
        </div>
        
        {/* 已选择的技术点 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3 ring-2 ring-blue-50">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
              <span>已选择技术点</span>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {configuredResources.techPoints.length}
              </span>
            </h3>
            <button
              onClick={() => {
                const returnUrl = `/project/${projectId}/resources`;
                const selectedIds = selectedTechPoints.join(',');
                onNavigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${selectedIds}`);
              }}
              className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
              title="追加技术点"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {configuredResources.techPoints.length === 0 ? (
              <div 
                onClick={() => {
                  const returnUrl = `/project/${projectId}/resources`;
                  const selectedIds = selectedTechPoints.join(',');
                  onNavigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${selectedIds}`);
                }}
                className="text-center text-gray-400 py-10 px-4 text-sm cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md group"
              >
                <Plus className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
                <p className="font-semibold text-gray-600">暂无已选择的技术点</p>
                <p className="text-xs mt-1.5 text-gray-500">点击添加技术点</p>
              </div>
            ) : (
              configuredResources.techPoints.map((techPoint) => (
                <div
                  key={techPoint.id}
                  className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-all border border-blue-200 shadow-sm hover:shadow-md group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {techPoint.name}
                    </h4>
                    {techPoint.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {techPoint.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <button
                      onClick={() => {
                        if (confirm(`确定要移除技术点"${techPoint.name}"吗？`)) {
                          onToggleTechPoint(techPoint.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 已上传的文件 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-3 ring-2 ring-green-50">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <span>已上传文件</span>
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {configuredResources.files.length}
              </span>
            </h3>
            <button
              onClick={onShowFileUploadModal}
              className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
              title="追加文件"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {configuredResources.files.length === 0 ? (
              <div 
                onClick={onShowFileUploadModal}
                className="text-center text-gray-400 py-10 px-4 text-sm cursor-pointer bg-gradient-to-br from-gray-50 to-green-50 hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all border-2 border-dashed border-gray-300 hover:border-green-400 hover:shadow-md group"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-green-400 transition-colors" />
                <p className="font-semibold text-gray-600">暂无已上传的文件</p>
                <p className="text-xs mt-1.5 text-gray-500">点击上传文件</p>
              </div>
            ) : (
              configuredResources.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl hover:from-green-100 hover:via-emerald-100 hover:to-teal-100 transition-all border border-green-200 shadow-sm hover:shadow-md group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {file.title}
                      </h4>
                    </div>
                    {file.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {file.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDate(file.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <button
                      onClick={async () => {
                        if (confirm(`确定要删除文件"${file.title}"吗？`)) {
                          await onDeleteSource(file.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 已选择的知识点 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-3 ring-2 ring-purple-50">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
              <span>已选择知识点</span>
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                {ragKnowledgeItems.length + manualKnowledgeItems.length}
              </span>
            </h3>
            <button
              onClick={onOpenPublicKnowledgeModal}
              className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
              title="添加知识库"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {ragKnowledgeItems.length === 0 && manualKnowledgeItems.length === 0 ? (
              <div
                onClick={onOpenPublicKnowledgeModal}
                className="text-center text-gray-400 py-10 px-4 text-sm cursor-pointer bg-gradient-to-br from-gray-50 to-purple-50 hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all border-2 border-dashed border-gray-300 hover:border-purple-400 hover:shadow-md group"
              >
                <Brain className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-purple-400 transition-colors" />
                <p className="font-semibold text-gray-600">暂无知识库</p>
                <p className="text-xs mt-1.5 text-gray-500">点击添加知识库</p>
              </div>
            ) : (
              <>
                {/* RAG知识库知识（自动提取） */}
                {ragKnowledgeItems.map((item) => (
                  <div
                    key={`rag_${item.document_id}_${item.segment_id}`}
                    className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-all border border-blue-200 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-2.5 py-1 bg-blue-200 text-blue-800 rounded-full font-semibold">RAG</span>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {item.document_name}
                        </h4>
                      </div>
                      {item.content && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                      {item.score !== undefined && (
                        <p className="text-xs text-blue-600 font-medium mt-1.5">
                          匹配度: {(item.score * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
                {/* 手动选择的知识库 */}
                {manualKnowledgeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:from-gray-100 hover:to-purple-100 transition-all border border-gray-200 shadow-sm hover:shadow-md group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full font-semibold">
                          {item.type === 'public_kb' ? '公共知识库' : '知识点'}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </h4>
                      </div>
                      {item.content && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* 互联网信息点 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center mr-3 ring-2 ring-orange-50">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
              <span>互联网信息点</span>
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                {configuredResources.internetInfo.length}
              </span>
            </h3>
            <button
              onClick={onShowInternetInfoModal}
              className="p-2.5 text-orange-600 hover:bg-orange-50 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
              title="追加互联网信息"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {configuredResources.internetInfo.length === 0 ? (
              <div 
                onClick={onShowInternetInfoModal}
                className="text-center text-gray-400 py-10 px-4 text-sm cursor-pointer bg-gradient-to-br from-gray-50 to-orange-50 hover:from-orange-50 hover:to-amber-50 rounded-xl transition-all border-2 border-dashed border-gray-300 hover:border-orange-400 hover:shadow-md group"
              >
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300 group-hover:text-orange-400 transition-colors" />
                <p className="font-semibold text-gray-600">暂无互联网信息点</p>
                <p className="text-xs mt-1.5 text-gray-500">点击添加互联网信息</p>
              </div>
            ) : (
              configuredResources.internetInfo.map((info) => (
                <div
                  key={info.id}
                  className="flex items-start justify-between p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 rounded-xl hover:from-orange-100 hover:via-amber-100 hover:to-yellow-100 transition-all border border-orange-200 shadow-sm hover:shadow-md group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {info.title}
                      </h4>
                    </div>
                    {info.url && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 truncate block mt-1.5 font-medium hover:underline"
                      >
                        {info.url}
                      </a>
                    )}
                    {info.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {info.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDate(info.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <button
                      onClick={async () => {
                        if (confirm(`确定要删除互联网信息"${info.title}"吗？`)) {
                          await onDeleteSource(info.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 分割线和技术转译按钮 */}
        <div className="pt-6 border-t-2 border-gray-200">
          <div className="flex gap-3 mb-5">
            <button
              onClick={onTechnicalTranslation}
              disabled={isTranslating}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-xl disabled:shadow-sm flex items-center justify-center space-x-2 transform hover:scale-105 disabled:transform-none"
            >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>转译中...</span>
                      </>
                    ) : (
                      <>
                        <FileCode className="w-5 h-5" />
                        <span>技术转译</span>
                      </>
                    )}
            </button>
            <button
              onClick={() => {
                onShowReviewModal(translatedContent);
              }}
              disabled={!translatedContent || isTranslating}
              className="px-5 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-xl disabled:shadow-sm flex items-center justify-center space-x-2 transform hover:scale-105 disabled:transform-none"
            >
              <Eye className="w-5 h-5" />
              <span>审查</span>
            </button>
          </div>
          {translatedContent && (
            <div className="mt-5 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-inner">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <FileCode className="w-5 h-5 mr-2 text-blue-600" />
                转译结果
              </h4>
              <div className="max-h-96 overflow-y-auto custom-scrollbar bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {translatedContent}
                </pre>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(translatedContent);
                  alert('内容已复制到剪贴板');
                }}
                className="mt-4 px-5 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold transform hover:scale-105"
              >
                复制内容
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 进入AI辅助共创功能框 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-green-50">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">进入 AI 辅助共创</h2>
            <p className="text-xs text-gray-500 mt-0.5">开始AI辅助创作</p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => onNavigateToAIPage('tech-package')}
            disabled={isSummarizingConversation || navigatingTarget !== null}
            className="w-full px-5 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 text-blue-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-lg border-2 border-blue-200 hover:border-blue-300 flex items-center justify-between transform hover:scale-[1.02] disabled:transform-none"
          >
            <span className="flex items-center gap-3">
              <Package className="w-5 h-5" />
              <span>技术包装</span>
            </span>
            {navigatingTarget === 'tech-package' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
          </button>
          <button
            onClick={() => onNavigateToAIPage('tech-strategy')}
            disabled={isSummarizingConversation || navigatingTarget !== null}
            className="w-full px-5 py-4 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 hover:from-purple-100 hover:via-pink-100 hover:to-rose-100 disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 text-purple-700 rounded-xl font-semibold transition-all shadow-sm hover:shadow-lg border-2 border-purple-200 hover:border-purple-300 flex items-center justify-between transform hover:scale-[1.02] disabled:transform-none"
          >
            <span className="flex items-center gap-3">
              <Target className="w-5 h-5" />
              <span>技术策略</span>
            </span>
            {navigatingTarget === 'tech-strategy' && <Loader2 className="w-5 h-5 animate-spin text-purple-600" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagementPanel;

