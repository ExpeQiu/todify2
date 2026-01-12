import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText, Bot } from 'lucide-react';
import articleTypeService, { ArticleType, CreateArticleTypeDTO, UpdateArticleTypeDTO } from '../services/articleTypeService';
import aiRoleService, { AIRoleConfig } from '../services/aiRoleService';

const ArticleTypeManagementPage: React.FC = () => {
  const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [aiRoles, setAiRoles] = useState<AIRoleConfig[]>([]);
  const [articleTypeRoleMap, setArticleTypeRoleMap] = useState<Map<string, string[]>>(new Map());
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingArticleType, setEditingArticleType] = useState<ArticleType | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

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
    loadAiRoles();
  }, []);

  // 加载AI角色列表
  const loadAiRoles = async () => {
    try {
      const roles = await aiRoleService.getAIRoles();
      setAiRoles(roles.filter(role => role.enabled));
    } catch (error) {
      console.error('加载AI角色失败:', error);
    }
  };

  // 加载文章类型关联的AI角色
  const loadArticleTypeRoles = async (articleTypeId: string) => {
    try {
      const response = await articleTypeService.getAssociatedAIRoleIds(articleTypeId);
      if (response.success && response.data) {
        setArticleTypeRoleMap(prev => new Map(prev).set(articleTypeId, response.data || []));
      }
    } catch (error) {
      console.error('加载关联AI角色失败:', error);
    }
  };

  // 当文章类型列表加载完成后，加载每个类型的关联角色
  useEffect(() => {
    if (articleTypes.length > 0) {
      articleTypes.forEach(type => {
        loadArticleTypeRoles(type.id);
      });
    }
  }, [articleTypes]);

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

  // 开始编辑关联角色
  const startEditRoles = (type: ArticleType) => {
    const currentRoleIds = articleTypeRoleMap.get(type.id) || [];
    setEditingArticleType(type);
    setSelectedRoleIds([...currentRoleIds]);
    setShowRoleModal(true);
  };

  // 保存关联角色
  const saveRoles = async () => {
    if (!editingArticleType) return;

    try {
      const response = await articleTypeService.setAssociatedAIRoles(editingArticleType.id, selectedRoleIds);
      if (response.success) {
        showMessage('success', '关联角色更新成功');
        loadArticleTypeRoles(editingArticleType.id);
        setShowRoleModal(false);
        setEditingArticleType(null);
        setSelectedRoleIds([]);
      } else {
        showMessage('error', response.error || '更新失败');
      }
    } catch (error) {
      console.error('更新关联角色失败:', error);
      showMessage('error', '更新失败');
    }
  };

  // 取消编辑关联角色
  const cancelEditRoles = () => {
    setShowRoleModal(false);
    setEditingArticleType(null);
    setSelectedRoleIds([]);
  };

  // 切换角色选择
  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    关联AI角色
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex flex-wrap gap-1 flex-1">
                          {(articleTypeRoleMap.get(type.id) || []).length > 0 ? (
                            (articleTypeRoleMap.get(type.id) || []).map(roleId => {
                              const role = aiRoles.find(r => r.id === roleId);
                              return role ? (
                                <span
                                  key={roleId}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                                >
                                  <Bot className="w-3 h-3" />
                                  {role.name}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-gray-400 text-xs">未关联</span>
                          )}
                        </div>
                        <button
                          onClick={() => startEditRoles(type)}
                          className="text-blue-600 hover:text-blue-800 text-xs whitespace-nowrap"
                          disabled={editingId === type.id}
                        >
                          编辑
                        </button>
                      </div>
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

      {/* 关联AI角色配置弹窗 */}
      {showRoleModal && editingArticleType && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">配置关联AI角色</h3>
              <button 
                onClick={cancelEditRoles}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">文章类型</div>
                <div className="text-sm text-gray-900 font-medium">{editingArticleType.name}</div>
                <div className="text-xs text-gray-500 mt-1">{editingArticleType.code}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择AI角色（可多选）
                </label>
                {aiRoles.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 border border-gray-200 rounded-lg text-center">
                    暂无可用的AI角色，请先到{' '}
                    <a href="/ai-roles" className="text-blue-600 hover:underline">
                      AI角色管理
                    </a>{' '}
                    创建角色
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {aiRoles.map(role => (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoleIds.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <Bot className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{role.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedRoleIds.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    已选择 <span className="font-medium text-blue-600">{selectedRoleIds.length}</span> 个角色
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button 
                onClick={cancelEditRoles}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={saveRoles}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleTypeManagementPage;

