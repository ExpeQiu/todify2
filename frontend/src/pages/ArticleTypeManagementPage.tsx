import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText } from 'lucide-react';
import articleTypeService, { ArticleType, CreateArticleTypeDTO, UpdateArticleTypeDTO } from '../services/articleTypeService';

const ArticleTypeManagementPage: React.FC = () => {
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<CreateArticleTypeDTO>({
    code: '',
    name: '',
    description: '',
    enabled: 1,
    sort_order: 0,
  });

  // 加载文章类型列表
  const loadArticleTypes = async () => {
    setLoading(true);
    try {
      const response = await articleTypeService.getAll();
      if (response.success && response.data) {
        setArticleTypes(response.data);
      } else {
        setMessage({ type: 'error', text: response.error || '加载失败' });
      }
    } catch (error) {
      console.error('加载文章类型失败:', error);
      setMessage({ type: 'error', text: '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticleTypes();
  }, []);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 开始编辑
  const startEdit = (type: ArticleType) => {
    setEditingId(type.id);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      enabled: type.enabled,
      sort_order: type.sort_order,
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      enabled: 1,
      sort_order: 0,
    });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingId) return;

    if (!formData.code || !formData.name) {
      showMessage('error', '请填写code和name');
      return;
    }

    try {
      const response = await articleTypeService.update(editingId, formData);
      if (response.success) {
        showMessage('success', '更新成功');
        cancelEdit();
        loadArticleTypes();
      } else {
        showMessage('error', response.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      showMessage('error', '更新失败');
    }
  };

  // 添加新类型
  const handleAdd = async () => {
    if (!formData.code || !formData.name) {
      showMessage('error', '请填写code和name');
      return;
    }

    try {
      const response = await articleTypeService.create(formData);
      if (response.success) {
        showMessage('success', '创建成功');
        setShowAddModal(false);
        setFormData({
          code: '',
          name: '',
          description: '',
          enabled: 1,
          sort_order: 0,
        });
        loadArticleTypes();
      } else {
        showMessage('error', response.error || '创建失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      showMessage('error', '创建失败');
    }
  };

  // 删除类型
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除文章类型"${name}"吗？`)) {
      return;
    }

    try {
      const response = await articleTypeService.delete(id);
      if (response.success) {
        showMessage('success', '删除成功');
        loadArticleTypes();
      } else {
        showMessage('error', response.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      showMessage('error', '删除失败');
    }
  };

  // 切换启用状态
  const toggleEnabled = async (type: ArticleType) => {
    try {
      const response = await articleTypeService.update(type.id, {
        enabled: type.enabled === 1 ? 0 : 1,
      });
      if (response.success) {
        showMessage('success', '更新成功');
        loadArticleTypes();
      } else {
        showMessage('error', response.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      showMessage('error', '更新失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">文章类型配置</h1>
            <p className="text-sm text-gray-500 mt-1">
              管理技术通稿生成时可选择的文章类型
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加类型
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : articleTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">暂无文章类型</p>
            <p className="text-sm mt-2">点击右上角"添加类型"按钮创建新类型</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排序
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articleTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === type.id ? (
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        type.sort_order
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {editingId === type.id ? (
                        <input
                          type="text"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        type.code
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === type.id ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        type.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {editingId === type.id ? (
                        <input
                          type="text"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="描述（可选）"
                        />
                      ) : (
                        type.description || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === type.id ? (
                        <select
                          value={formData.enabled}
                          onChange={(e) => setFormData({ ...formData, enabled: parseInt(e.target.value) })}
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>启用</option>
                          <option value={0}>禁用</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => toggleEnabled(type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            type.enabled === 1
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {type.enabled === 1 ? '启用' : '禁用'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === type.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(type)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(type.id, type.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 添加弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">添加文章类型</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    code: '',
                    name: '',
                    description: '',
                    enabled: 1,
                    sort_order: 0,
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如: media_release"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">唯一标识码，用于代码中引用</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如: 媒体通稿"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述（可选）"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    value={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      code: '',
                      name: '',
                      description: '',
                      enabled: 1,
                      sort_order: 0,
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleTypeManagementPage;

