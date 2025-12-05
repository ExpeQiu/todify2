import React, { useState } from 'react';
import { PublicKnowledgeFile } from '../../types/publicKnowledge';
import { File, Download, Trash2, Eye, Grid, List } from 'lucide-react';
import { publicKnowledgeService } from '../../services/publicKnowledgeService';

interface FileListProps {
  files: PublicKnowledgeFile[];
  selectedCategoryId: number | null;
  onDeleteFile: (id: number) => void;
  loading: boolean;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedCategoryId,
  onDeleteFile,
  loading,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<PublicKnowledgeFile | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return '📝';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return '📽️';
    } else if (fileType.includes('zip') || fileType.includes('rar')) {
      return '📦';
    } else {
      return '📎';
    }
  };

  const handleDownload = async (file: PublicKnowledgeFile) => {
    try {
      const blob = await publicKnowledgeService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载文件失败:', error);
      alert('下载文件失败');
    }
  };

  const handlePreview = (file: PublicKnowledgeFile) => {
    const fileUrl = publicKnowledgeService.getFileUrl(file);
    if (file.file_type.startsWith('image/')) {
      setPreviewFile(file);
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedCategoryId === null ? '全部文件' : '文件列表'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {files.length} 个文件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="网格视图"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="列表视图"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 文件列表 */}
      {files.length === 0 ? (
        <div className="p-12 text-center">
          <File className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无文件</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-center mb-3 h-24 bg-gray-50 rounded">
                <span className="text-4xl">{getFileIcon(file.file_type)}</span>
              </div>
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                  {file.name}
                </h3>
                {file.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {file.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{formatFileSize(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(file)}
                  className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  查看
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载
                </button>
                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 hover:bg-gray-50 group flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                <span className="text-2xl">{getFileIcon(file.file_type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </h3>
                {file.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {file.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>{file.file_type}</span>
                  <span>{new Date(file.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(file)}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                  title="查看"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  title="下载"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 图片预览弹窗 */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewFile(null)}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img
              src={publicKnowledgeService.getFileUrl(previewFile)}
              alt={previewFile.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
