import React, { useState, useEffect } from "react";
import { X, ArrowLeft } from "lucide-react";
import { Source } from "./SourceSidebar";

interface EditSourceModalProps {
  source: Source;
  onClose: () => void;
  onUpdate: (updatedSource: Source) => void;
}

const EditSourceModal: React.FC<EditSourceModalProps> = ({
  source,
  onClose,
  onUpdate,
}) => {
  const [title, setTitle] = useState(source.title);
  const [description, setDescription] = useState(source.description || "");
  const [url, setUrl] = useState(source.url || "");

  useEffect(() => {
    setTitle(source.title);
    setDescription(source.description || "");
    setUrl(source.url || "");
  }, [source]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    const updatedSource: Source = {
      ...source,
      title: title.trim(),
      description: description.trim(),
      url: url.trim() || undefined,
    };

    onUpdate(updatedSource);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">查看/编辑来源</h2>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* 来源类型 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              来源类型
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              {source.type === "knowledge_base" ? "知识库" : "外部来源"}
            </div>
          </div>

          {/* URL（仅外部来源显示） */}
          {source.type === "external" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL地址
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* 标题 */}
          <div className="mb-4">
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
          <div className="mb-4 flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入来源描述"
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSourceModal;

