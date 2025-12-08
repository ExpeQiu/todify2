import React, { useState, useRef, useCallback } from "react";
import { ArrowLeft, Upload, FileText, Search, Trash2, Check, Loader2 } from "lucide-react";
import { Source } from "./SourceSidebar";
import { aiSearchService } from "../../services/aiSearchService";
import { bochaAPI } from "../../services/api";

interface AddTextModalProps {
  onClose: () => void;
  onAddTextSource: (source: Omit<Source, "id">) => void;
  pageType?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
}

type SourceMode = "upload" | "text" | "search" | "websearch";

const AddTextModal: React.FC<AddTextModalProps> = ({
  onClose,
  onAddTextSource,
  pageType,
}) => {
  const [mode, setMode] = useState<SourceMode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Web Search 相关状态
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webSearchResults, setWebSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<number>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "text") {
      if (!text.trim()) {
        alert("请输入文字内容");
        return;
      }
      
      // 创建来源，使用文本的前50个字符作为标题
      const title = text.trim().slice(0, 50) + (text.trim().length > 50 ? "..." : "");
      onAddTextSource({
        title,
        type: "external",
        description: text.trim(),
      });
      
      setText("");
      onClose();
    } else if (mode === "upload") {
      if (files.length === 0) {
        alert("请选择文件");
        return;
      }
      
      // 上传文件到服务器
      setIsUploading(true);
      try {
        const uploadedFiles = await aiSearchService.uploadFiles(files, pageType);
        
        // 将每个上传的文件转换为Source并添加到来源列表
        uploadedFiles.forEach((uploadedFile) => {
          // description字段包含完整的markdown内容，用于传递给Agent
          // 如果没有markdown内容，则使用文件大小作为描述
          const description = uploadedFile.markdownContent 
            ? uploadedFile.markdownContent
            : `文件大小: ${formatFileSize(uploadedFile.size)}`;
          
          onAddTextSource({
            title: uploadedFile.name,
            type: "external",
            url: uploadedFile.url,
            description: description,
          });
        });
        
        setFiles([]);
        onClose();
        // 触发文件列表刷新
        window.dispatchEvent(new CustomEvent('filesUploaded'));
      } catch (error) {
        console.error('文件上传失败:', error);
        alert('文件上传失败，请重试');
      } finally {
        setIsUploading(false);
      }
    } else if (mode === "search") {
      if (!searchQuery.trim()) {
        alert("请输入检索信息");
        return;
      }
      
      // 创建检索信息来源，说明需要AI检索补充信息
      onAddTextSource({
        title: `检索信息: ${searchQuery.trim().slice(0, 30)}${searchQuery.trim().length > 30 ? "..." : ""}`,
        type: "external",
        description: `[检索信息] ${searchQuery.trim()}\n\n说明：此来源需要AI检索补充相关信息。`,
      });
      
      setSearchQuery("");
      onClose();
    } else if (mode === "websearch") {
      if (selectedSearchResults.size === 0) {
        alert("请至少选择一个搜索结果");
        return;
      }
      
      // 保存选中的搜索结果
      const selectedResults = Array.from(selectedSearchResults).map(index => webSearchResults[index]);
      
      selectedResults.forEach((result) => {
        const description = `${result.snippet || ''}\n\n${result.summary ? `摘要：${result.summary}` : ''}\n\n来源：${result.siteName || ''}`.trim();
        
        onAddTextSource({
          title: result.name || '未命名网页',
          type: "external",
          url: result.url,
          description: description,
        });
      });
      
      // 清空状态
      setWebSearchQuery("");
      setWebSearchResults([]);
      setSelectedSearchResults(new Set());
      onClose();
    }
  };

  // Web Search 搜索处理
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

  // 切换搜索结果选择状态
  const toggleSearchResult = (index: number) => {
    const newSelected = new Set(selectedSearchResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSearchResults(newSelected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (mode === "upload" && e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  }, [mode, files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const supportedFileTypes = "PDF, PPT, .txt, Markdown, Word (.doc, .docx)";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">添加来源</h2>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="px-6 pt-4">
          <p className="text-sm text-gray-600">
            添加来源后，系统能够基于这些对您最重要的信息提供回答。（示例：营销方案、课程阅读材料、研究项目、会议转写内容、销售文档等）
          </p>
        </div>

        {/* 模式选择 */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("upload");
                setText("");
                setSearchQuery("");
                setWebSearchQuery("");
                setWebSearchResults([]);
                setSelectedSearchResults(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                mode === "upload"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Upload className="w-4 h-4" />
              上传文件
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("text");
                setFiles([]);
                setSearchQuery("");
                setWebSearchQuery("");
                setWebSearchResults([]);
                setSelectedSearchResults(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                mode === "text"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              粘贴文字
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("search");
                setText("");
                setFiles([]);
                setWebSearchQuery("");
                setWebSearchResults([]);
                setSelectedSearchResults(new Set());
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                mode === "search"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Search className="w-4 h-4" />
              检索信息
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("websearch");
                setText("");
                setFiles([]);
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                mode === "websearch"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Search className="w-4 h-4" />
              Web Search
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* 上传文件模式 */}
          {mode === "upload" && (
            <div className="flex-1 flex flex-col">
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 mb-4 transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">上传来源</p>
                <p className="text-sm text-gray-500 mb-4">
                  拖放或
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline mx-1"
                  >
                    选择文件
                  </button>
                  ，即可上传
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.txt,.md,.markdown,.doc,.docx"
                />
                <p className="text-xs text-gray-400 mt-4 text-center">
                  支持的文件类型：{supportedFileTypes}
                </p>
              </div>

              {/* 已选择的文件列表 */}
              {files.length > 0 && (
                <div className="space-y-2 mb-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 粘贴文字模式 */}
          {mode === "text" && (
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600 mb-3">
                将复制的文字粘贴到下方，以便在对话中作为来源上传
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在此处粘贴文字*"
                className="flex-1 w-full min-h-[300px] px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                required={mode === "text"}
              />
            </div>
          )}

          {/* 检索信息模式 */}
          {mode === "search" && (
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-gray-600 mb-3">
                输入需要检索的信息，AI将自动检索并补充相关信息作为来源
              </p>
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="请输入需要检索的信息，例如：iPhone 15 Pro Max 技术规格、最新市场趋势等*"
                className="flex-1 w-full min-h-[300px] px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                required={mode === "search"}
              />
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>说明：</strong>此功能将创建一个检索信息来源，AI会在对话时自动检索并补充相关信息。
                </p>
              </div>
            </div>
          )}

          {/* Web Search 模式 */}
          {mode === "websearch" && (
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleWebSearch();
                      }
                    }}
                    placeholder="请输入搜索关键词，例如：阿里巴巴2024年的ESG报告"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleWebSearch}
                    disabled={isSearching || !webSearchQuery.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        搜索中...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        搜索
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  使用博查AI搜索全网网页信息和链接，结果准确、摘要完整
                </p>
              </div>

              {/* 搜索结果列表 */}
              {webSearchResults.length > 0 && (
                <div className="space-y-3 flex-1 overflow-y-auto mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      找到 {webSearchResults.length} 个结果
                    </p>
                    {selectedSearchResults.size > 0 && (
                      <p className="text-sm text-blue-600">
                        已选择 {selectedSearchResults.size} 个
                      </p>
                    )}
                  </div>
                  {webSearchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => toggleSearchResult(index)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedSearchResults.has(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedSearchResults.has(index)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSearchResults.has(index) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                            {result.name}
                          </h3>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:text-blue-800 truncate block mb-2"
                          >
                            {result.displayUrl || result.url}
                          </a>
                          {result.snippet && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {result.snippet}
                            </p>
                          )}
                          {result.summary && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {result.summary}
                            </p>
                          )}
                          {result.siteName && (
                            <p className="text-xs text-gray-400 mt-1">
                              {result.siteName}
                              {result.datePublished && ` · ${new Date(result.datePublished).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && webSearchResults.length === 0 && (
                <div className="flex items-center justify-center py-12 flex-1">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">正在搜索...</span>
                </div>
              )}

              {!isSearching && webSearchResults.length === 0 && webSearchQuery && (
                <div className="text-center py-12 text-gray-500 flex-1">
                  未找到相关结果
                </div>
              )}

              {!isSearching && webSearchResults.length === 0 && !webSearchQuery && (
                <div className="text-center py-12 text-gray-400 flex-1">
                  请输入搜索关键词开始搜索
                </div>
              )}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUploading || (mode === "websearch" && selectedSearchResults.size === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "上传中..." : mode === "websearch" && selectedSearchResults.size > 0 ? `插入 (${selectedSearchResults.size})` : "插入"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTextModal;

