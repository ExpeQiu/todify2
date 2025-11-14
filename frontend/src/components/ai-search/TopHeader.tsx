import React from "react";
import { Share2, Settings, Grid3x3, User } from "lucide-react";

interface TopHeaderProps {
  title?: string;
  onShare?: () => void;
  onSettings?: () => void;
  onMenu?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({
  title = "聚焦Agent、模型可解释性与通用人工智能",
  onShare,
  onSettings,
  onMenu,
}) => {
  return (
    <div className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* 左侧标题 */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* 右侧操作图标 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onShare}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="分享"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={onSettings}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="设置"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={onMenu}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="菜单"
        >
          <Grid3x3 className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-2">
          <span className="text-sm font-medium text-blue-600">b</span>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;

