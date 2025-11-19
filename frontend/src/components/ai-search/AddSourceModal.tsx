import React, { useState } from "react";
import { X, Upload, Link as LinkIcon, Trash2 } from "lucide-react";
import { Source } from "./SourceSidebar";
import { aiSearchService } from "../../services/aiSearchService";

interface AddSourceModalProps {
  onClose: () => void;
  onAddExternalSource: (source: Omit<Source, "id">) => void;
  pageType?: 'tech-package' | 'press-release' | 'tech-strategy' | 'tech-article';
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({
  onClose,
  onAddExternalSource,
  pageType,
}) => {
  const [sourceType, setSourceType] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceType === "url") {
      if (!url.trim()) {
        alert("请输入URL");
        return;
      }
      onAddExternalSource({
        title: title.trim() || url,
        type: "external",
        url: url.trim(),
        description: description.trim(),
      });
      setUrl("");
      setTitle("");
      setDescription("");
      onClose();
    } else {
      if (files.length === 0) {
        alert("请选择文件");
        return;
      }
      
      // 上传文件到服务器
      setIsUploading(true);
      try {
        const uploadedFiles = await aiSearchService.uploadFiles(files, pageType);
        
        // 文件已保存到数据库，不需要通过onAddExternalSource添加
        // 页面会自动通过loadFiles加载文件列表
        // 只需要关闭弹窗即可
        
        setFiles([]);
        setTitle("");
        setDescription("");
        onClose();
        
        // 触发文件列表刷新（通过自定义事件）
        window.dispatchEvent(new CustomEvent('filesUploaded'));
      } catch (error) {
        console.error('文件上传失败:', error);
        alert('文件上传失败，请重试');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      if (!title.trim() && newFiles.length === 1) {
        setTitle(newFiles[0].name);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">添加来源</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 来源类型选择 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSourceType("url");
                setFiles([]);
              }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                sourceType === "url"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <LinkIcon className="w-4 h-4 inline-block mr-2" />
              URL链接
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceType("file");
                setUrl("");
              }}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                sourceType === "file"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Upload className="w-4 h-4 inline-block mr-2" />
              上传文件
            </button>
          </div>

          {/* URL输入 */}
          {sourceType === "url" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL地址
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* 文件上传 */}
          {sourceType === "file" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择文件（可多选）
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
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

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入来源标题"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? '上传中...' : '确认添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSourceModal;

