import React, { useState, useEffect } from "react";
import {
  TechPoint,
  TechPointFormData,
  TechType,
  TechPriority,
  TechStatus,
  TechCategory,
} from "../../types/techPoint";
import { Brand } from "../../types/brand";
import { CarModel } from "../../types/carModel";
import { CarSeries } from "../../types/carSeries";
import { techPointService } from "../../services/techPointService";
import { brandService } from "../../services/brandService";
import { carModelService } from "../../services/carModelService";
import { carSeriesService } from "../../services/carSeriesService";

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
  loading = false,
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
    name: "",
    description: "",
    category_id: 0,
    type: TechType.FEATURE,
    priority: TechPriority.MEDIUM,
    status: TechStatus.ACTIVE,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof TechPointFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  // 获取技术分类
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      // 暂时使用空数组，等待后端API实现
      setCategories([]);
    } catch (error) {
      console.error("获取技术分类失败:", error);
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
      console.error("获取品牌列表失败:", error);
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
      console.error("获取车型列表失败:", error);
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
      console.error("获取车系列表失败:", error);
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
        status: techPoint.status,
      });
    }
  }, [techPoint]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TechPointFormData, string>> = {};

    // 技术点名称验证
    if (!formData.name.trim()) {
      newErrors.name = "技术点名称不能为空";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "技术点名称至少需要2个字符";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "技术点名称不能超过100个字符";
    } else if (
      !/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/.test(formData.name.trim())
    ) {
      newErrors.name = "技术点名称只能包含中文、英文、数字、空格和常用符号";
    }

    // 技术点描述验证
    if (!formData.description.trim()) {
      newErrors.description = "技术点描述不能为空";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "技术点描述至少需要10个字符";
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = "技术点描述不能超过1000个字符";
    }

    // 技术分类验证
    if (!formData.category_id || formData.category_id === 0) {
      newErrors.category_id = "请选择技术分类";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 实时验证单个字段
  const validateField = (name: keyof TechPointFormData, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (typeof value === "string") {
          if (!value.trim()) {
            newErrors.name = "技术点名称不能为空";
          } else if (value.trim().length < 2) {
            newErrors.name = "技术点名称至少需要2个字符";
          } else if (value.trim().length > 100) {
            newErrors.name = "技术点名称不能超过100个字符";
          } else if (
            !/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/.test(value.trim())
          ) {
            newErrors.name =
              "技术点名称只能包含中文、英文、数字、空格和常用符号";
          } else {
            delete newErrors.name;
          }
        }
        break;
      case "description":
        if (typeof value === "string") {
          if (!value.trim()) {
            newErrors.description = "技术点描述不能为空";
          } else if (value.trim().length < 10) {
            newErrors.description = "技术点描述至少需要10个字符";
          } else if (value.trim().length > 1000) {
            newErrors.description = "技术点描述不能超过1000个字符";
          } else {
            delete newErrors.description;
          }
        }
        break;
      case "category_id":
        if (!value || value === 0) {
          newErrors.category_id = "请选择技术分类";
        } else {
          delete newErrors.category_id;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof TechPointFormData;

    let processedValue: any = value;
    if (fieldName === "category_id") {
      processedValue = parseInt(value, 10) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: processedValue,
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
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const success = await onSubmit(formData);
      if (success) {
        setSubmitSuccess(true);
        // 重置表单
        if (!techPoint) {
          setFormData({
            name: "",
            description: "",
            category_id: 0,
            type: TechType.FEATURE,
            priority: TechPriority.MEDIUM,
            status: TechStatus.ACTIVE,
          });
          setErrors({});
        }
      }
    } catch (error) {
      console.error("提交失败:", error);
      setSubmitError(
        error instanceof Error ? error.message : "提交失败，请重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type: TechType): string => {
    const labels = {
      [TechType.FEATURE]: "功能特性",
      [TechType.IMPROVEMENT]: "改进优化",
      [TechType.INNOVATION]: "创新技术",
      [TechType.TECHNOLOGY]: "核心技术",
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority: TechPriority): string => {
    const labels = {
      [TechPriority.LOW]: "低",
      [TechPriority.MEDIUM]: "中",
      [TechPriority.HIGH]: "高",
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: TechStatus): string => {
    const labels = {
      [TechStatus.ACTIVE]: "启用",
      [TechStatus.INACTIVE]: "禁用",
      [TechStatus.DRAFT]: "草稿",
      [TechStatus.ARCHIVED]: "归档",
    };
    return labels[status] || status;
  };

  return (
    <div
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md"
      data-oid="4eszd.6"
    >
      <div className="mb-6" data-oid="i9fct2b">
        <h2 className="text-2xl font-bold text-gray-900" data-oid="-4x5--4">
          {techPoint ? "编辑技术点" : "新增技术点"}
        </h2>
        <p className="mt-2 text-sm text-gray-600" data-oid="_sr9eb9">
          请填写技术点的详细信息，所有标记为 * 的字段都是必填项。
        </p>
      </div>

      {submitSuccess && (
        <div
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md"
          data-oid="day82ff"
        >
          <div className="flex" data-oid="eh223:h">
            <div className="flex-shrink-0" data-oid=":1x.gd0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                data-oid="0ej88c9"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                  data-oid="oemcqmy"
                />
              </svg>
            </div>
            <div className="ml-3" data-oid="7xpnsb_">
              <p
                className="text-sm font-medium text-green-800"
                data-oid="lycz30q"
              >
                {techPoint ? "技术点更新成功！" : "技术点创建成功！"}
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"
          data-oid="ycx2sz2"
        >
          <div className="flex" data-oid="0fq_mpr">
            <div className="flex-shrink-0" data-oid="loatun0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                data-oid="hoctih."
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                  data-oid="pfec74l"
                />
              </svg>
            </div>
            <div className="ml-3" data-oid="d0.ada4">
              <p
                className="text-sm font-medium text-red-800"
                data-oid="x.b4p4n"
              >
                {submitError}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-oid="-_kvt6f">
        {/* 三层级选择器 */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-oid="dvgp42q"
        >
          <div data-oid="h.kaq_z">
            <label
              htmlFor="brand"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="77jpz.n"
            >
              品牌
            </label>
            <select
              id="brand"
              value={selectedBrandId || ""}
              onChange={handleBrandChange}
              disabled={brandsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-oid="3k4k76t"
            >
              <option value="" data-oid="-k5dsv6">
                请选择品牌
              </option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id} data-oid="itjm9gy">
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div data-oid="aq3bhua">
            <label
              htmlFor="carModel"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="9wlq5i1"
            >
              车型
            </label>
            <select
              id="carModel"
              value={selectedModelId || ""}
              onChange={handleModelChange}
              disabled={!selectedBrandId || modelsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              data-oid="051p:cf"
            >
              <option value="" data-oid="2l1-fle">
                请选择车型
              </option>
              {carModels.map((model) => (
                <option key={model.id} value={model.id} data-oid="fd-effq">
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div data-oid="uigg02b">
            <label
              htmlFor="carSeries"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="8z-k3ts"
            >
              车系
            </label>
            <select
              id="carSeries"
              disabled={!selectedModelId || seriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              data-oid="qxg5icg"
            >
              <option value="" data-oid="xhsfa50">
                请选择车系
              </option>
              {carSeries.map((series) => (
                <option key={series.id} value={series.id} data-oid="4fesuur">
                  {series.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 技术点名称 */}
        <div data-oid="w-ac4zy">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
            data-oid="kjltcob"
          >
            技术点名称 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="请输入技术点名称"
            data-oid="ose:xhw"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600" data-oid="cy5mbf:">
              {errors.name}
            </p>
          )}
        </div>

        {/* 技术点描述 */}
        <div data-oid="y9ks6_k">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
            data-oid="38.ld1b"
          >
            技术点描述 *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="请输入技术点的详细描述"
            data-oid="aa513cq"
          />

          {errors.description && (
            <p className="mt-1 text-sm text-red-600" data-oid="i-:z_fz">
              {errors.description}
            </p>
          )}
        </div>

        {/* 技术分类 */}
        <div data-oid="oj4qx0r">
          <label
            htmlFor="category_id"
            className="block text-sm font-medium text-gray-700 mb-1"
            data-oid="3q.aaav"
          >
            技术分类 *
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            disabled={categoriesLoading}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.category_id ? "border-red-300" : "border-gray-300"
            }`}
            data-oid="of_qq4w"
          >
            <option value={0} data-oid="l5wu3:c">
              请选择技术分类
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} data-oid=".0pfm1r">
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600" data-oid="dt2mky8">
              {errors.category_id}
            </p>
          )}
        </div>

        {/* 技术类型、优先级、状态 */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-oid="sq-1dtw"
        >
          <div data-oid="x.j928i">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="c-:_sx6"
            >
              技术类型
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-oid="unj40t:"
            >
              {Object.values(TechType).map((type) => (
                <option key={type} value={type} data-oid="vs80jdn">
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div data-oid=":7.-5t1">
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="fy4s:_:"
            >
              优先级
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-oid="kg4y958"
            >
              {Object.values(TechPriority).map((priority) => (
                <option key={priority} value={priority} data-oid="_1fpt05">
                  {getPriorityLabel(priority)}
                </option>
              ))}
            </select>
          </div>

          <div data-oid="v:c:5f5">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
              data-oid="j0wtt6k"
            >
              状态
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-oid="7tpceq0"
            >
              {Object.values(TechStatus).map((status) => (
                <option key={status} value={status} data-oid="9yqlmoy">
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 提交按钮 */}
        <div
          className="flex justify-end space-x-3 pt-6 border-t border-gray-200"
          data-oid="3kf.n77"
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            data-oid="_yulbs0"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            data-oid="12yfvf5"
          >
            {isSubmitting ? "提交中..." : techPoint ? "更新" : "创建"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TechPointForm;
