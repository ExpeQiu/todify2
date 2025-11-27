import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Source } from "./SourceSidebar";

interface AddTextModalProps {
  onClose: () => void;
  onAddTextSource: (source: Omit<Source, "id">) => void;
}

const AddTextModal: React.FC<AddTextModalProps> = ({
  onClose,
  onAddTextSource,
}) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <h2 className="text-xl font-semibold text-gray-900">粘贴已复制的文字</h2>
        </div>

        {/* 说明文字 */}
        <div className="px-6 pt-4">
          <p className="text-sm text-gray-600">
            将复制的文字粘贴到下方,以便在 对话中 中作为来源上传
          </p>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6">
          <div className="flex-1 flex flex-col mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此处粘贴文字*"
              className="flex-1 w-full min-h-[300px] px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              required
            />
          </div>

          {/* 按钮 - 右下角 */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              插入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTextModal;

