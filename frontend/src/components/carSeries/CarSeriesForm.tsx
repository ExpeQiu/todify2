import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import {
  CarSeries,
  CarSeriesFormData,
  CarSeriesStatus,
  UpdateCarSeriesFormData
} from '../../types/carSeries';
import { Brand } from '../../types/brand';
import { CarModel } from '../../types/carModel';
import { carSeriesService } from '../../services/carSeriesService';
import { brandService } from '../../services/brandService';
import { carModelService } from '../../services/carModelService';

interface CarSeriesFormProps {
  carSeries?: CarSeries;
  onSubmit: (data: CarSeriesFormData | UpdateCarSeriesFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

const CarSeriesForm: React.FC<CarSeriesFormProps> = ({
  carSeries,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [carModelsLoading, setCarModelsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(0);
  
  const [formData, setFormData] = useState<CarSeriesFormData>({
    name: '',
    model_id: 0,
    description: '',
    launch_year: undefined,
    end_year: undefined,
    market_segment: '',
    status: CarSeriesStatus.ACTIVE,
    metadata: {}
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CarSeriesFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // 获取品牌列表
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const response = await brandService.getAll();
        setBrands(response.data || []);
      } catch (error) {
        console.error('获取品牌列表失败:', error);
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // 根据选择的品牌获取车型列表
  useEffect(() => {
    if (selectedBrandId > 0) {
      const fetchCarModels = async () => {
        setCarModelsLoading(true);
        try {
          const response = await carModelService.getByBrand(selectedBrandId);
          setCarModels(response.data || []);
        } catch (error) {
          console.error('获取车型列表失败:', error);
          setCarModels([]);
        } finally {
          setCarModelsLoading(false);
        }
      };

      fetchCarModels();
    } else {
      setCarModels([]);
    }
  }, [selectedBrandId]);

  // 初始化表单数据
  useEffect(() => {
    if (carSeries) {
      setFormData({
        name: carSeries.name,
        model_id: carSeries.model_id,
        description: carSeries.description || '',
        launch_year: carSeries.launch_year,
        end_year: carSeries.end_year,
        market_segment: carSeries.market_segment || '',
        status: carSeries.status,
        metadata: carSeries.metadata || {}
      });

      // 如果有关联的车型信息，设置品牌ID
      if (carSeries.model?.brand_id) {
        setSelectedBrandId(carSeries.model.brand_id);
      }
    }
  }, [carSeries]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CarSeriesFormData, string>> = {};

    // 车系名称验证
    if (!formData.name.trim()) {
      newErrors.name = '车系名称不能为空';
    } else if (formData.name.trim().length < 1) {
      newErrors.name = '车系名称至少需要1个字符';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '车系名称不能超过100个字符';
    }

    // 车型验证
    if (!formData.model_id || formData.model_id === 0) {
      newErrors.model_id = '请选择车型';
    }

    // 描述验证（可选）
    if (formData.description && formData.description.trim().length > 1000) {
      newErrors.description = '描述不能超过1000个字符';
    }

    // 细分市场验证（可选）
    if (formData.market_segment && formData.market_segment.trim().length > 100) {
      newErrors.market_segment = '细分市场不能超过100个字符';
    }

    // 上市年份验证（可选）
    if (formData.launch_year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (formData.launch_year < 1900 || formData.launch_year > currentYear + 5) {
        newErrors.launch_year = `上市年份应在1900到${currentYear + 5}之间`;
      }
    }

    // 停产年份验证（可选）
    if (formData.end_year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (formData.end_year < 1900 || formData.end_year > currentYear + 5) {
        newErrors.end_year = `停产年份应在1900到${currentYear + 5}之间`;
      }
      if (formData.launch_year && formData.end_year < formData.launch_year) {
        newErrors.end_year = '停产年份不能早于上市年份';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 实时验证单个字段
  const validateField = (name: keyof CarSeriesFormData, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value || !value.trim()) {
          newErrors.name = '车系名称不能为空';
        } else if (value.trim().length < 1) {
          newErrors.name = '车系名称至少需要1个字符';
        } else if (value.trim().length > 100) {
          newErrors.name = '车系名称不能超过100个字符';
        } else {
          delete newErrors.name;
        }
        break;

      case 'model_id':
        if (!value || value === 0) {
          newErrors.model_id = '请选择车型';
        } else {
          delete newErrors.model_id;
        }
        break;

      case 'description':
        if (value && value.trim().length > 1000) {
          newErrors.description = '描述不能超过1000个字符';
        } else {
          delete newErrors.description;
        }
        break;

      case 'market_segment':
        if (value && value.trim().length > 100) {
          newErrors.market_segment = '细分市场不能超过100个字符';
        } else {
          delete newErrors.market_segment;
        }
        break;

      case 'launch_year':
        if (value !== undefined && value !== '') {
          const currentYear = new Date().getFullYear();
          if (value < 1900 || value > currentYear + 5) {
            newErrors.launch_year = `上市年份应在1900到${currentYear + 5}之间`;
          } else {
            delete newErrors.launch_year;
          }
        } else {
          delete newErrors.launch_year;
        }
        break;

      case 'end_year':
        if (value !== undefined && value !== '') {
          const currentYear = new Date().getFullYear();
          if (value < 1900 || value > currentYear + 5) {
            newErrors.end_year = `停产年份应在1900到${currentYear + 5}之间`;
          } else if (formData.launch_year && value < formData.launch_year) {
            newErrors.end_year = '停产年份不能早于上市年份';
          } else {
            delete newErrors.end_year;
          }
        } else {
          delete newErrors.end_year;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: keyof CarSeriesFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 实时验证
    validateField(name, value);
    
    // 清除提交错误
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleBrandChange = (brandId: number) => {
    setSelectedBrandId(brandId);
    // 清空车型选择
    setFormData(prev => ({
      ...prev,
      model_id: 0
    }));
    // 清除车型相关错误
    const newErrors = { ...errors };
    delete newErrors.model_id;
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const submitData = carSeries ? {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        market_segment: formData.market_segment?.trim() || undefined
      } : {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        market_segment: formData.market_segment?.trim() || undefined
      };

      const success = await onSubmit(submitData);
      
      if (success) {
        setSubmitSuccess(true);
        // 延迟关闭表单，让用户看到成功提示
        setTimeout(() => {
          onCancel();
        }, 1000);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {carSeries ? '编辑车系' : '新增车系'}
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 成功提示 */}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {carSeries ? '车系更新成功！' : '车系创建成功！'}
            </div>
          )}

          {/* 错误提示 */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
            
            {/* 车系名称 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                车系名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入车系名称"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 品牌选择 */}
            <div>
              <label htmlFor="brand_select" className="block text-sm font-medium text-gray-700 mb-1">
                所属品牌 <span className="text-red-500">*</span>
              </label>
              <select
                id="brand_select"
                value={selectedBrandId}
                onChange={(e) => handleBrandChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting || brandsLoading}
              >
                <option value={0}>请选择品牌</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {brandsLoading && (
                <p className="mt-1 text-sm text-gray-500">正在加载品牌列表...</p>
              )}
            </div>

            {/* 车型选择 */}
            <div>
              <label htmlFor="model_id" className="block text-sm font-medium text-gray-700 mb-1">
                所属车型 <span className="text-red-500">*</span>
              </label>
              <select
                id="model_id"
                value={formData.model_id}
                onChange={(e) => handleInputChange('model_id', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.model_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting || carModelsLoading || selectedBrandId === 0}
              >
                <option value={0}>
                  {selectedBrandId === 0 ? '请先选择品牌' : '请选择车型'}
                </option>
                {carModels.map((carModel) => (
                  <option key={carModel.id} value={carModel.id}>
                    {carModel.name}
                  </option>
                ))}
              </select>
              {errors.model_id && (
                <p className="mt-1 text-sm text-red-600">{errors.model_id}</p>
              )}
              {carModelsLoading && (
                <p className="mt-1 text-sm text-gray-500">正在加载车型列表...</p>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="请输入车系描述"
                rows={4}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* 细分市场 */}
            <div>
              <label htmlFor="market_segment" className="block text-sm font-medium text-gray-700 mb-1">
                细分市场
              </label>
              <input
                type="text"
                id="market_segment"
                value={formData.market_segment}
                onChange={(e) => handleInputChange('market_segment', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.market_segment ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="如：紧凑型、中型、豪华型等"
                disabled={isSubmitting}
              />
              {errors.market_segment && (
                <p className="mt-1 text-sm text-red-600">{errors.market_segment}</p>
              )}
            </div>

            {/* 年份信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 上市年份 */}
              <div>
                <label htmlFor="launch_year" className="block text-sm font-medium text-gray-700 mb-1">
                  上市年份
                </label>
                <input
                  type="number"
                  id="launch_year"
                  value={formData.launch_year || ''}
                  onChange={(e) => handleInputChange('launch_year', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.launch_year ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="如：2023"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  disabled={isSubmitting}
                />
                {errors.launch_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.launch_year}</p>
                )}
              </div>

              {/* 停产年份 */}
              <div>
                <label htmlFor="end_year" className="block text-sm font-medium text-gray-700 mb-1">
                  停产年份
                </label>
                <input
                  type="number"
                  id="end_year"
                  value={formData.end_year || ''}
                  onChange={(e) => handleInputChange('end_year', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.end_year ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="如：2025（可选）"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  disabled={isSubmitting}
                />
                {errors.end_year && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_year}</p>
                )}
              </div>
            </div>

            {/* 状态 */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as CarSeriesStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value={CarSeriesStatus.ACTIVE}>在产</option>
                <option value={CarSeriesStatus.DISCONTINUED}>停产</option>
                <option value={CarSeriesStatus.PLANNED}>计划中</option>
              </select>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {carSeries ? '更新中...' : '创建中...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {carSeries ? '更新车系' : '创建车系'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarSeriesForm;