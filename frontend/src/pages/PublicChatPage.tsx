import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Bot, Loader, X } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import aiRoleService from '../services/aiRoleService';
import publicPageConfigService from '../services/publicPageConfigService';
import { AIRoleConfig } from '../types/aiRole';
import { PublicPageConfigPreview } from '../types/publicPageConfig';
import { useParams } from 'react-router-dom';

interface OpenChatWindow {
  id: string;
  role: AIRoleConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * 公开访问聊天页面（只读模式）
 * 通过token从配置中加载角色，隐藏配置和管理功能
 */
const PublicChatPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [roles, setRoles] = useState<AIRoleConfig[]>([]);
  const [openWindows, setOpenWindows] = useState<OpenChatWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState(true);
  const [config, setConfig] = useState<PublicPageConfigPreview | null>(null);

  useEffect(() => {
    if (token) {
      loadPublicConfig(token);
    } else {
      setError('无效的访问令牌或配置ID');
      setLoading(false);
    }
  }, [token]);

  // 加载公开配置（支持token和configId两种方式）
  const loadPublicConfig = async (identifier: string) => {
    try {
      setLoading(true);
      // 先尝试作为token加载，如果失败则作为configId加载
      let data;
      try {
        data = await publicPageConfigService.getPublicConfig(identifier);
      } catch (err) {
        // 如果token方式失败，尝试作为configId
        data = await publicPageConfigService.getPublicConfigById(identifier);
      }
      
      setConfig(data);
      
      // 将角色列表转换为AIRoleConfig格式
      const formattedRoles = data.roles.map((role: any) => ({
        ...role,
        createdAt: new Date(role.createdAt),
        updatedAt: new Date(role.updatedAt),
      }));
      setRoles(formattedRoles);
      setError(null);
    } catch (err: any) {
      console.error('加载配置失败:', err);
      setError(err.message || '加载配置失败，请检查访问链接');
    } finally {
      setLoading(false);
    }
  };

  // 打开聊天窗口
  const handleOpenChat = (role: AIRoleConfig) => {
    const newWindow: OpenChatWindow = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      role,
      position: {
        x: Math.min(100 + openWindows.length * 30, window.innerWidth - 550),
        y: Math.min(100 + openWindows.length * 30, window.innerHeight - 600),
      },
      size: { width: 500, height: 600 },
    };
    setOpenWindows([...openWindows, newWindow]);
  };

  // 关闭聊天窗口
  const handleCloseChat = (id: string) => {
    setOpenWindows(openWindows.filter(w => w.id !== id));
  };

  // 关闭所有窗口
  const handleCloseAll = () => {
    setOpenWindows([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">访问失败</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 侧边栏 */}
      {activeSidebar && (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg z-40 fixed h-full">
          {/* 侧边栏标题 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <MessageSquare size={20} />
                AI助手
              </h2>
              <button
                onClick={() => setActiveSidebar(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI角色列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bot size={48} className="mx-auto mb-4 text-gray-400" />
                <p>暂无可用角色</p>
              </div>
            ) : (
              roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleOpenChat(role)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all hover:border-blue-300 group"
                >
                  <div className="flex items-center gap-3">
                    {role.avatar ? (
                      <img
                        src={role.avatar}
                        alt={role.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {role.name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* 底部操作 */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            {openWindows.length > 0 && (
              <button
                onClick={handleCloseAll}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                关闭所有窗口
              </button>
            )}
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className={`transition-all ${activeSidebar ? 'ml-72' : 'ml-0'}`}>
        {!activeSidebar && (
          <button
            onClick={() => setActiveSidebar(true)}
            className="fixed top-4 left-4 z-50 w-10 h-10 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <MessageSquare size={20} />
          </button>
        )}

        {openWindows.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Bot size={64} className="mx-auto mb-4 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                欢迎使用AI助手
              </h2>
              <p className="text-gray-600 mb-6">请从左侧选择一个AI助手开始对话</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* 聊天窗口 */}
      {openWindows.map(window => (
        <ChatWindow
          key={window.id}
          role={window.role}
          onClose={() => handleCloseChat(window.id)}
          initialPosition={window.position}
          initialSize={window.size}
        />
      ))}
    </div>
  );
};

export default PublicChatPage;

