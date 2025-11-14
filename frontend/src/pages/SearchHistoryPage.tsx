import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatHistoryService, { ConversationRecord } from '../services/chatHistoryService';

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

const SearchHistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取用户的对话列表
        const response = await ChatHistoryService.getUserConversations(
          undefined, // userId - 可以根据需要传入用户ID
          undefined, // appType - 可以根据需要过滤应用类型
          50, // limit
          0   // offset
        );

        if (response.success && response.data) {
          // 格式化数据为搜索历史格式
          const formattedHistory = ChatHistoryService.formatConversationsForHistory(response.data);
          setHistoryItems(formattedHistory);
        } else {
          setError(response.error || '获取搜索历史失败');
        }
      } catch (err) {
        console.error('获取搜索历史失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">搜索历史</h1>
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">搜索历史</h1>
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold mb-2">加载失败</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">搜索历史</h1>
      <div className="bg-white shadow-md rounded-lg">
        {historyItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>暂无搜索历史</p>
            <p className="text-sm mt-2">开始使用AI搜索功能，历史记录将显示在这里</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {historyItems.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <Link to={`/history/${item.id}`} className="block">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-blue-600 hover:text-blue-800 mb-1">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{item.type}</span>
                        <span className={`px-2 py-1 rounded ${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 
                          item.status === 'archived' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'active' ? '活跃' : 
                           item.status === 'archived' ? '已归档' : '已删除'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <p>{item.date}</p>
                      <p>{item.time}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchHistoryPage;