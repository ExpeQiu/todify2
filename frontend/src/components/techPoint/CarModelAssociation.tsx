import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Car, 
  Calendar, 
  FileText, 
  Edit3, 
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { CarModel } from '../../types/carModel';
import { carModelService } from '../../services/carModelService';
import { techPointService } from '../../services/techPointService';

interface CarModelAssociationProps {
  techPointId: number;
  onUpdate?: () => void;
}

interface AssociatedCarModel extends CarModel {
  application_status?: string;
  implementation_date?: string;
  notes?: string;
}

interface AssociationFormData {
  carModelId: number;
  applicationStatus: string;
  implementationDate: string;
  notes: string;
}

const CarModelAssociation: React.FC<CarModelAssociationProps> = ({
  techPointId,
  onUpdate
}) => {
  const [associatedCarModels, setAssociatedCarModels] = useState<AssociatedCarModel[]>([]);
  const [availableCarModels, setAvailableCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<AssociatedCarModel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 表单数据
  const [formData, setFormData] = useState<AssociationFormData>({
    carModelId: 0,
    applicationStatus: 'planned',
    implementationDate: '',
    notes: ''
  });

  // 获取关联的车型
  const fetchAssociatedCarModels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.getTechPointCarModels(techPointId);
      if (response.success && response.data) {
        setAssociatedCarModels(response.data);
      } else {
        setError(response.error || '获取关联车型失败');
      }
    } catch (err) {
      setError('获取关联车型失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取可用的车型列表
  const fetchAvailableCarModels = async () => {
    try {
      const response = await carModelService.getAll({ page: 1, pageSize: 1000 });
      if (response.data) {
        setAvailableCarModels(response.data);
      }
    } catch (err) {
      console.error('获取车型列表失败:', err);
    }
  };

  useEffect(() => {
    fetchAssociatedCarModels();
    fetchAvailableCarModels();
  }, [techPointId]);

  // 处理添加关联
  const handleAddAssociation = async () => {
    if (!formData.carModelId) {
      setError('请选择车型');
      return;
    }

    setLoading(true);
    try {
      const response = await techPointService.associateCarModelToTechPoint(techPointId, {
        carModelId: formData.carModelId,
        applicationStatus: formData.applicationStatus,
        implementationDate: formData.implementationDate || undefined,
        notes: formData.notes || undefined
      });

      if (response.success) {
        setShowAddModal(false);
        setFormData({
          carModelId: 0,
          applicationStatus: 'planned',
          implementationDate: '',
          notes: ''
        });
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || '关联车型失败');
      }
    } catch (err) {
      setError('关联车型失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑关联
  const handleEditAssociation = async () => {
    if (!editingAssociation) return;

    setLoading(true);
    try {
      const response = await techPointService.updateCarModelAssociation(
        techPointId,
        editingAssociation.id,
        {
          applicationStatus: formData.applicationStatus,
          implementationDate: formData.implementationDate || undefined,
          notes: formData.notes || undefined
        }
      );

      if (response.success) {
        setShowEditModal(false);
        setEditingAssociation(null);
        setFormData({
          carModelId: 0,
          applicationStatus: 'planned',
          implementationDate: '',
          notes: ''
        });
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || '更新关联失败');
      }
    } catch (err) {
      setError('更新关联失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理删除关联
  const handleDeleteAssociation = async (carModelId: number) => {
    if (!confirm('确定要删除这个关联吗？')) return;

    setLoading(true);
    try {
      const response = await techPointService.disassociateCarModelFromTechPoint(techPointId, carModelId);
      
      if (response.success) {
        await fetchAssociatedCarModels();
        onUpdate?.();
      } else {
        setError(response.error || '删除关联失败');
      }
    } catch (err) {
      setError('删除关联失败');
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const openEditModal = (association: AssociatedCarModel) => {
    setEditingAssociation(association);
    setFormData({
      carModelId: association.id,
      applicationStatus: association.application_status || 'planned',
      implementationDate: association.implementation_date || '',
      notes: association.notes || ''
    });
    setShowEditModal(true);
  };

  // 过滤关联车型
  const filteredAssociations = associatedCarModels.filter(association => {
    const matchesSearch = searchTerm === '' || 
      association.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (association.brand?.name && association.brand.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || association.application_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 获取状态颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'planned': return <Calendar className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // 获取状态标签
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'implemented': return '已实施';
      case 'in_progress': return '进行中';
      case 'planned': return '计划中';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  if (loading && associatedCarModels.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">关联车型</h4>
          <p className="text-sm text-gray-500">管理技术点与车型的关联关系</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加关联
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索车型名称或品牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">所有状态</option>
            <option value="planned">计划中</option>
            <option value="in_progress">进行中</option>
            <option value="implemented">已实施</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 关联列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {filteredAssociations.length === 0 ? (
          <div className="text-center py-8">
            <Car className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无关联车型</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? '没有符合条件的关联车型' : '开始添加技术点与车型的关联'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssociations.map((association) => (
              <div key={association.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="text-lg font-medium text-gray-900">
                        {association.name}
                      </h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(association.application_status)}`}>
                        {getStatusIcon(association.application_status)}
                        <span className="ml-1">{getStatusLabel(association.application_status)}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        <span>品牌: {association.brand?.name || '未知'}</span>
                      </div>
                      
                      {association.launch_year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>上市年份: {association.launch_year}</span>
                        </div>
                      )}
                      
                      {association.implementation_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>实施日期: {association.implementation_date}</span>
                        </div>
                      )}
                      
                      {association.notes && (
                        <div className="flex items-start gap-2 md:col-span-2">
                          <FileText className="w-4 h-4 mt-0.5" />
                          <span>备注: {association.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(association)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="编辑关联"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssociation(association.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="删除关联"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加关联模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">添加车型关联</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择车型 *
                </label>
                <select
                  value={formData.carModelId}
                  onChange={(e) => setFormData({ ...formData, carModelId: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={0}>请选择车型</option>
                  {availableCarModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brand?.name} - {model.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  应用状态
                </label>
                <select
                  value={formData.applicationStatus}
                  onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planned">计划中</option>
                  <option value="in_progress">进行中</option>
                  <option value="implemented">已实施</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实施日期
                </label>
                <input
                  type="date"
                  value={formData.implementationDate}
                  onChange={(e) => setFormData({ ...formData, implementationDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleAddAssociation}
                disabled={loading || !formData.carModelId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '添加中...' : '添加关联'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑关联模态框 */}
      {showEditModal && editingAssociation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">编辑车型关联</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  车型
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600">
                  {editingAssociation.brand?.name} - {editingAssociation.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  应用状态
                </label>
                <select
                  value={formData.applicationStatus}
                  onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planned">计划中</option>
                  <option value="in_progress">进行中</option>
                  <option value="implemented">已实施</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实施日期
                </label>
                <input
                  type="date"
                  value={formData.implementationDate}
                  onChange={(e) => setFormData({ ...formData, implementationDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="添加备注信息..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleEditAssociation}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '更新关联'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarModelAssociation;