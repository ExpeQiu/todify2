import React, { useState, useEffect } from 'react';
import {
  TechPoint,
  TechPointFormData,
  TechType,
  TechPriority,
  TechStatus,
  TechCategory
} from '../../types/techPoint';
import { Brand } from '../../types/brand';
import { CarModel } from '../../types/carModel';
import { CarSeries } from '../../types/carSeries';
import { techPointService } from '../../services/techPointService';
import { brandService } from '../../services/brandService';
import { carModelService } from '../../services/carModelService';
import { carSeriesService } from '../../services/carSeriesService';

interface TechPointFormProps {
  techPoint?: TechPoint;
  onSubmit: (data: TechPointFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

const TechPointForm: React.FC<TechPointFormProps> = ({
  techPoint,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [categories, setCategories] = useState<TechCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);

  const [formData, setFormData] = useState<TechPointFormData>({
    name: '',
    description: '',
    category_id: 0,
    type: TechType.FEATURE,
    priority: TechPriority.MEDIUM,
    status: TechStatus.ACTIVE
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TechPointFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // 获取技术分类
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // 暂时使用空数组，等待后端API实现
      setCategories([]);
    } catch (error) {
      console.error('获取技术分类失败:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 获取品牌列表
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

  // 根据品牌获取车型列表
  const fetchCarModelsByBrand = async (brandId: number) => {
    setModelsLoading(true);
    try {
      const response = await carModelService.getByBrand(brandId);
      setCarModels(response.data || []);
    } catch (error) {
      console.error('获取车型列表失败:', error);
      setCarModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  // 根据车型获取车系列表
  const fetchCarSeriesByModel = async (modelId: number) => {
    setSeriesLoading(true);
    try {
      const response = await carSeriesService.getByModel(modelId);
      setCarSeries(response.data || []);
    } catch (error) {
      console.error('获取车系列表失败:', error);
      setCarSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      fetchCarModelsByBrand(selectedBrandId);
      setCarSeries([]);
      setSelectedModelId(null);
    } else {
      setCarModels([]);
      setCarSeries([]);
      setSelectedModelId(null);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    if (selectedModelId) {
      fetchCarSeriesByModel(selectedModelId);
    } else {
      setCarSeries([]);
    }
  }, [selectedModelId]);

  useEffect(() => {
    if (techPoint) {
      setFormData({
        name: techPoint.name,
        description: techPoint.description,
        category_id: techPoint.category_id,
        type: techPoint.type,
        priority: techPoint.priority,
        status: techPoint.status
      });
    }
  }, [techPoint]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TechPointFormData, string>> = {};

    // 技术点名称验证
    if (!formData.name.trim()) {
      newErrors.name = '技术点名称不能为空';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '技术点名称至少需要2个字符';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = '技术点名称不能超过100个字符';
    } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/.test(formData.name.trim())) {
      newErrors.name = '技术点名称只能包含中文、英文、数字、空格和常用符号';
    }

    // 技术点描述验证
    if (!formData.description.trim()) {
      newErrors.description = '技术点描述不能为空';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = '技术点描述至少需要10个字符';
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = '技术点描述不能超过1000个字符';
    }

    // 技术分类验证
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = '请选择技术分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 实时验证单个字段
  const validateField = (name: keyof TechPointFormData, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (typeof value === 'string') {
          if (!value.trim()) {
            newErrors.name = '技术点名称不能为空';
          } else if (value.trim().length < 2) {
            newErrors.name = '技术点名称至少需要2个字符';
          } else if (value.trim().length > 100) {
            newErrors.name = '技术点名称不能超过100个字符';
          } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/.test(value.trim())) {
            newErrors.name = '技术点名称只能包含中文、英文、数字、空格和常用符号';
          } else {
            delete newErrors.name;
          }
        }
        break;
      case 'description':
        if (typeof value === 'string') {
          if (!value.trim()) {
            newErrors.description = '技术点描述不能为空';
          } else if (value.trim().length < 10) {
            newErrors.description = '技术点描述至少需要10个字符';
          } else if (value.trim().length > 1000) {
            newErrors.description = '技术点描述不能超过1000个字符';
          } else {
            delete newErrors.description;
          }
        }
        break;
      case 'category_id':
        if (!value || value === 0) {
          newErrors.category_id = '请选择技术分类';
        } else {
          delete newErrors.category_id;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof TechPointFormData;
    
    let processedValue: any = value;
    if (fieldName === 'category_id') {
      processedValue = parseInt(value, 10) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: processedValue
    }));

    // 实时验证
    validateField(fieldName, processedValue);
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = parseInt(e.target.value, 10) || null;
    setSelectedBrandId(brandId);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = parseInt(e.target.value, 10) || null;
    setSelectedModelId(modelId);
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
      const success = await onSubmit(formData);
      if (success) {
        setSubmitSuccess(true);
        // 重置表单
        if (!techPoint) {
          setFormData({
            name: '',
            description: '',
            category_id: 0,
            type: TechType.FEATURE,
            priority: TechPriority.MEDIUM,
            status: TechStatus.ACTIVE
          });
          setErrors({});
        }
      }
    } catch (error) {
      console.error('提交失败:', error);
      setSubmitError(error instanceof Error ? error.message : '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type: TechType): string => {
    const labels = {
      [TechType.FEATURE]: '功能特性',
      [TechType.IMPROVEMENT]: '改进优化',
      [TechType.INNOVATION]: '创新技术',
      [TechType.TECHNOLOGY]: '核心技术'
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority: TechPriority): string => {
    const labels = {
      [TechPriority.LOW]: '低',
      [TechPriority.MEDIUM]: '中',
      [TechPriority.HIGH]: '高'
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: TechStatus): string => {
    const labels = {
      [TechStatus.ACTIVE]: '启用',
      [TechStatus.INACTIVE]: '禁用',
      [TechStatus.DRAFT]: '草稿',
      [TechStatus.ARCHIVED]: '归档'
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {techPoint ? '编辑技术点' : '新增技术点'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          请填写技术点的详细信息，所有标记为 * 的字段都是必填项。
        </p>
      </div>

      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {techPoint ? '技术点更新成功！' : '技术点创建成功！'}
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 三层级选择器 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
              品牌
            </label>
            <select
              id="brand"
              value={selectedBrandId || ''}
              onChange={handleBrandChange}
              disabled={brandsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择品牌</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="carModel" className="block text-sm font-medium text-gray-700 mb-1">
              车型
            </label>
            <select
              id="carModel"
              value={selectedModelId || ''}
              onChange={handleModelChange}
              disabled={!selectedBrandId || modelsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">请选择车型</option>
              {carModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="carSeries" className="block text-sm font-medium text-gray-700 mb-1">
              车系
            </label>
            <select
              id="carSeries"
              disabled={!selectedModelId || seriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">请选择车系</option>
              {carSeries.map(series => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 技术点名称 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            技术点名称 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="请输入技术点名称"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* 技术点描述 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            技术点描述 *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="请输入技术点的详细描述"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* 技术分类 */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            技术分类 *
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            disabled={categoriesLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.category_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value={0}>请选择技术分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>

        {/* 技术类型、优先级、状态 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              技术类型
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(TechType).map(type => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              优先级
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(TechPriority).map(priority => (
                <option key={priority} value={priority}>
                  {getPriorityLabel(priority)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(TechStatus).map(status => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? '提交中...' : (techPoint ? '更新' : '创建')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TechPointForm;