import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message, Empty, DatePicker, Divider, Row, Col, Card, Typography, Tooltip } from 'antd';
import { ImportOutlined, InfoCircleOutlined, BulbOutlined, ExperimentOutlined, SafetyCertificateOutlined, BarChartOutlined, CarOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import type { TechPoint, TechCategory } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
import { brandService } from '../../services/brandService';
import { carModelService } from '../../services/carModelService';
import { carSeriesService } from '../../services/carSeriesService';
import { technologyService, Technology } from '../../services/technologyService';
import type { Brand } from '../../types/brand';
import type { CarModel } from '../../types/carModel';
import type { CarSeries } from '../../types/carSeries';
import CarModelAssociation from './CarModelAssociation';
import SelectableOptionSelector, { Option } from '../common/SelectableOptionSelector';
import dayjs from 'dayjs';

interface TechPointEditModalProps {
  visible: boolean;
  techPoint: TechPoint | null;
  technology?: any | null; // 关联的技术IP
  onCancel: () => void;
  onSuccess: () => void;
}

const TechPointEditModal: React.FC<TechPointEditModalProps> = ({
  visible,
  techPoint,
  technology,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [techCategories, setTechCategories] = useState<TechCategory[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  
  // 品牌、车型、车系相关状态
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<(number | string)[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<(number | string)[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<(number | string)[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTechCategories();
      loadTechnologies();
      loadBrands();
      if (techPoint) {
        // 重新从后端获取最新数据，确保所有字段都正确加载
        loadTechPointDataFromServer();
      } else {
        form.resetFields();
        setSelectedBrandId([]);
        setSelectedModelId([]);
        setSelectedSeriesId([]);
        setCarModels([]);
        setCarSeries([]);
      }
    }
  }, [visible, techPoint]);

  // 从服务器重新加载技术点数据
  const loadTechPointDataFromServer = async () => {
    if (!techPoint) return;
    
    try {
      const response = await techPointService.getTechPointById(techPoint.id);
      if (response.success && response.data) {
        // 使用从服务器获取的最新数据
        loadTechPointDataWithData(response.data);
      } else {
        // 如果服务器请求失败，使用传入的 techPoint
        loadTechPointData();
      }
    } catch (error) {
      console.error('从服务器加载技术点数据失败:', error);
      // 如果服务器请求失败，使用传入的 techPoint
      loadTechPointData();
    }
  };

  // 使用指定数据加载表单
  const loadTechPointDataWithData = (data: TechPoint) => {
    try {
      // 从 technical_details 中提取字段（如果存在）
      const technicalDetails = data.technical_details || {};
      
      // 优先使用直接字段，如果没有则从 technical_details 中获取
      const techPrinciple = data.tech_principle || technicalDetails.tech_principle || '';
      const techValue = data.tech_value || technicalDetails.tech_value || '';
      const techBoundary = data.tech_boundary || technicalDetails.tech_boundary || '';
      
      // 处理 highlights 和 evidence 字段
      let highlights = data.highlights || [];
      let evidenceMeasured = data.evidence_measured || [];
      let evidenceCertified = data.evidence_certified || [];
      let evidenceComparison = data.evidence_comparison || [];
      
      // 如果字段是字符串，尝试解析为数组
      if (typeof highlights === 'string') {
        try {
          highlights = JSON.parse(highlights);
        } catch (e) {
          highlights = [];
        }
      }
      if (typeof evidenceMeasured === 'string') {
        try {
          evidenceMeasured = JSON.parse(evidenceMeasured);
        } catch (e) {
          evidenceMeasured = [];
        }
      }
      if (typeof evidenceCertified === 'string') {
        try {
          evidenceCertified = JSON.parse(evidenceCertified);
        } catch (e) {
          evidenceCertified = [];
        }
      }
      if (typeof evidenceComparison === 'string') {
        try {
          evidenceComparison = JSON.parse(evidenceComparison);
        } catch (e) {
          evidenceComparison = [];
        }
      }
      
      // 从 technical_details 中获取（如果直接字段为空）
      if (!highlights.length && technicalDetails.highlights) {
        highlights = Array.isArray(technicalDetails.highlights) 
          ? technicalDetails.highlights 
          : [];
      }
      if (!evidenceMeasured.length && technicalDetails.evidence_measured) {
        evidenceMeasured = Array.isArray(technicalDetails.evidence_measured) 
          ? technicalDetails.evidence_measured 
          : [];
      }
      if (!evidenceCertified.length && technicalDetails.evidence_certified) {
        evidenceCertified = Array.isArray(technicalDetails.evidence_certified) 
          ? technicalDetails.evidence_certified 
          : [];
      }
      if (!evidenceComparison.length && technicalDetails.evidence_comparison) {
        evidenceComparison = Array.isArray(technicalDetails.evidence_comparison) 
          ? technicalDetails.evidence_comparison 
          : [];
      }

      // 填充表单数据
      form.setFieldsValue({
        name: data.name,
        description: data.description || '',
        category_id: Array.isArray(data.category_id) ? data.category_id : (data.category_id ? [data.category_id] : undefined),
        technology_id: Array.isArray(data.technology_id) ? data.technology_id : (data.technology_id ? [data.technology_id] : undefined),
        tech_principle: techPrinciple,
        tech_value: techValue,
        tech_boundary: techBoundary,
        highlights: highlights,
        evidence_measured: evidenceMeasured,
        evidence_certified: evidenceCertified,
        evidence_comparison: evidenceComparison,
        release_date: data.release_date ? dayjs(data.release_date) : null,
        tech_type: data.tech_type || 'feature',
        priority: data.priority || 'medium',
        status: data.status || 'draft',
      });
      
      console.log('加载技术点数据:', {
        tech_principle: techPrinciple,
        tech_value: techValue,
        tech_boundary: techBoundary,
        technical_details: technicalDetails
      });
    } catch (error) {
      console.error('加载技术点数据失败:', error);
      message.error('加载技术点数据失败');
    }
  };

  const loadTechCategories = async () => {
    try {
      const response = await techPointService.getTechCategories();
      if (response.success && response.data) {
        // 确保 data 是数组
        const categories = Array.isArray(response.data) 
          ? response.data 
          : [];
        setTechCategories(categories);
      } else {
        setTechCategories([]);
      }
    } catch (error) {
      console.error('加载技术领域失败:', error);
      setTechCategories([]);
    }
  };

  // 加载技术IP列表
  const loadTechnologies = async () => {
    try {
      const response = await technologyService.getAll();
      if (response.data) {
        setTechnologies(response.data);
      } else {
        setTechnologies([]);
      }
    } catch (error) {
      console.error('加载技术IP列表失败:', error);
      setTechnologies([]);
    }
  };

  // 创建技术IP
  const handleCreateTechnology = async (name: string): Promise<Option | null> => {
    try {
      const response = await technologyService.create({ name });
      if (response.success && response.data) {
        const newTechnology = response.data;
        setTechnologies([...technologies, newTechnology]);
        return { id: newTechnology.id, name: newTechnology.name };
      }
      return null;
    } catch (error) {
      console.error('创建技术IP失败:', error);
      return null;
    }
  };

  // 删除技术IP
  const handleDeleteTechnology = async (id: number | string): Promise<boolean> => {
    try {
      const response = await technologyService.delete(Number(id));
      if (response.success) {
        setTechnologies(technologies.filter(tech => tech.id !== id));
        // 如果删除的是当前选中的，从选择中移除
        const currentValue = form.getFieldValue('technology_id');
        if (Array.isArray(currentValue)) {
          const newValues = currentValue.filter(v => v !== id);
          form.setFieldsValue({ technology_id: newValues.length > 0 ? newValues : undefined });
        } else if (currentValue === id) {
          form.setFieldsValue({ technology_id: undefined });
        }
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败：该技术IP可能有关联的技术点');
      return false;
    }
  };

  // 创建技术领域
  const handleCreateCategory = async (name: string): Promise<Option | null> => {
    try {
      const response = await techPointService.createTechCategory({ name });
      if (response.success && response.data) {
        const newCategory = response.data;
        setTechCategories([...techCategories, newCategory]);
        return { id: newCategory.id, name: newCategory.name };
      }
      return null;
    } catch (error) {
      console.error('创建技术领域失败:', error);
      return null;
    }
  };

  // 删除技术领域
  const handleDeleteCategory = async (id: number | string): Promise<boolean> => {
    try {
      const response = await techPointService.deleteTechCategory(Number(id));
      if (response.success) {
        setTechCategories(techCategories.filter(cat => cat.id !== id));
        // 如果删除的是当前选中的，从选择中移除
        const currentValue = form.getFieldValue('category_id');
        if (Array.isArray(currentValue)) {
          const newValues = currentValue.filter(v => v !== id);
          form.setFieldsValue({ category_id: newValues.length > 0 ? newValues : undefined });
        } else if (currentValue === id) {
          form.setFieldsValue({ category_id: undefined });
        }
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败：该技术领域可能有关联的技术点');
      return false;
    }
  };

  // 加载品牌列表
  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await brandService.getAll();
      if (response.data) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('加载品牌列表失败:', error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // 创建品牌
  const handleCreateBrand = async (name: string): Promise<Option | null> => {
    try {
      const response = await brandService.create({ name });
      if (response.success && response.data) {
        const newBrand = response.data;
        setBrands([...brands, newBrand]);
        return { id: newBrand.id, name: newBrand.name };
      }
      return null;
    } catch (error) {
      console.error('创建品牌失败:', error);
      return null;
    }
  };

  // 删除品牌
  const handleDeleteBrand = async (id: number | string): Promise<boolean> => {
    try {
      const response = await brandService.delete(Number(id));
      if (response.success) {
        setBrands(brands.filter(brand => brand.id !== id));
        // 如果删除的是当前选中的，从选择中移除
        const newBrandIds = selectedBrandId.filter(brandId => brandId !== id);
        setSelectedBrandId(newBrandIds);
        // 如果删除后没有选中的品牌，清空车型和车系
        if (newBrandIds.length === 0) {
          setCarModels([]);
          setCarSeries([]);
          setSelectedModelId([]);
          setSelectedSeriesId([]);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败：该品牌可能有关联的车型');
      return false;
    }
  };

  // 根据品牌加载车型列表
  const loadCarModelsByBrand = async (brandId: number) => {
    setModelsLoading(true);
    try {
      const response = await carModelService.getByBrand(brandId);
      if (response.data) {
        setCarModels(response.data);
      } else {
        setCarModels([]);
      }
    } catch (error) {
      console.error('加载车型列表失败:', error);
      setCarModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  // 创建车型
  const handleCreateCarModel = async (name: string): Promise<Option | null> => {
    if (selectedBrandId.length === 0) {
      message.warning('请先选择品牌');
      return null;
    }
    // 使用第一个选中的品牌
    try {
      const response = await carModelService.create({ name, brand_id: Number(selectedBrandId[0]) });
      if (response.success && response.data) {
        const newModel = response.data;
        setCarModels([...carModels, newModel]);
        return { id: newModel.id, name: newModel.name };
      }
      return null;
    } catch (error) {
      console.error('创建车型失败:', error);
      return null;
    }
  };

  // 删除车型
  const handleDeleteCarModel = async (id: number | string): Promise<boolean> => {
    try {
      const response = await carModelService.delete(Number(id));
      if (response.success) {
        setCarModels(carModels.filter(model => model.id !== id));
        // 如果删除的是当前选中的，从选择中移除
        const newModelIds = selectedModelId.filter(modelId => modelId !== id);
        setSelectedModelId(newModelIds);
        // 如果删除后没有选中的车型，清空车系
        if (newModelIds.length === 0) {
          setCarSeries([]);
          setSelectedSeriesId([]);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败：该车型可能有关联的车系');
      return false;
    }
  };

  // 根据车型加载车系列表
  const loadCarSeriesByModel = async (modelId: number) => {
    setSeriesLoading(true);
    try {
      const response = await carSeriesService.getByModel(modelId);
      if (response.data) {
        setCarSeries(response.data);
      } else {
        setCarSeries([]);
      }
    } catch (error) {
      console.error('加载车系列表失败:', error);
      setCarSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  };

  // 创建车系
  const handleCreateCarSeries = async (name: string): Promise<Option | null> => {
    if (selectedModelId.length === 0) {
      message.warning('请先选择车型');
      return null;
    }
    // 使用第一个选中的车型
    try {
      const response = await carSeriesService.create({ name, model_id: Number(selectedModelId[0]) });
      if (response.success && response.data) {
        const newSeries = response.data;
        setCarSeries([...carSeries, newSeries]);
        return { id: newSeries.id, name: newSeries.name };
      }
      return null;
    } catch (error) {
      console.error('创建车系失败:', error);
      return null;
    }
  };

  // 删除车系
  const handleDeleteCarSeries = async (id: number | string): Promise<boolean> => {
    try {
      const response = await carSeriesService.delete(Number(id));
      if (response.success) {
        setCarSeries(carSeries.filter(series => series.id !== id));
        // 如果删除的是当前选中的，从选择中移除
        const newSeriesIds = selectedSeriesId.filter(seriesId => seriesId !== id);
        setSelectedSeriesId(newSeriesIds);
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '删除失败');
      return false;
    }
  };

  // 品牌变化处理
  useEffect(() => {
    if (selectedBrandId.length > 0) {
      // 加载所有选中品牌的车型
      const loadAllModels = async () => {
        setModelsLoading(true);
        try {
          const allModels: CarModel[] = [];
          for (const brandId of selectedBrandId) {
            const response = await carModelService.getByBrand(Number(brandId));
            if (response.data) {
              allModels.push(...response.data);
            }
          }
          setCarModels(allModels);
        } catch (error) {
          console.error('加载车型列表失败:', error);
        } finally {
          setModelsLoading(false);
        }
      };
      loadAllModels();
      setCarSeries([]);
      setSelectedModelId([]);
      setSelectedSeriesId([]);
    } else {
      setCarModels([]);
      setCarSeries([]);
      setSelectedModelId([]);
      setSelectedSeriesId([]);
    }
  }, [selectedBrandId]);

  // 车型变化处理
  useEffect(() => {
    if (selectedModelId.length > 0) {
      // 加载所有选中车型的车系
      const loadAllSeries = async () => {
        setSeriesLoading(true);
        try {
          const allSeries: CarSeries[] = [];
          for (const modelId of selectedModelId) {
            const response = await carSeriesService.getByModel(Number(modelId));
            if (response.data) {
              allSeries.push(...response.data);
            }
          }
          setCarSeries(allSeries);
        } catch (error) {
          console.error('加载车系列表失败:', error);
        } finally {
          setSeriesLoading(false);
        }
      };
      loadAllSeries();
      setSelectedSeriesId([]);
    } else {
      setCarSeries([]);
      setSelectedSeriesId([]);
    }
  }, [selectedModelId]);

  const loadTechPointData = async () => {
    if (!techPoint) return;

    try {
      // 从 technical_details 中提取字段（如果存在）
      const technicalDetails = techPoint.technical_details || {};
      
      // 优先使用直接字段，如果没有则从 technical_details 中获取
      const techPrinciple = techPoint.tech_principle || technicalDetails.tech_principle || '';
      const techValue = techPoint.tech_value || technicalDetails.tech_value || '';
      const techBoundary = techPoint.tech_boundary || technicalDetails.tech_boundary || '';
      
      // 处理 highlights 和 evidence 字段
      let highlights = techPoint.highlights || [];
      let evidenceMeasured = techPoint.evidence_measured || [];
      let evidenceCertified = techPoint.evidence_certified || [];
      let evidenceComparison = techPoint.evidence_comparison || [];
      
      // 如果字段是字符串，尝试解析为数组
      if (typeof highlights === 'string') {
        try {
          highlights = JSON.parse(highlights);
        } catch (e) {
          highlights = [];
        }
      }
      if (typeof evidenceMeasured === 'string') {
        try {
          evidenceMeasured = JSON.parse(evidenceMeasured);
        } catch (e) {
          evidenceMeasured = [];
        }
      }
      if (typeof evidenceCertified === 'string') {
        try {
          evidenceCertified = JSON.parse(evidenceCertified);
        } catch (e) {
          evidenceCertified = [];
        }
      }
      if (typeof evidenceComparison === 'string') {
        try {
          evidenceComparison = JSON.parse(evidenceComparison);
        } catch (e) {
          evidenceComparison = [];
        }
      }
      
      // 从 technical_details 中获取（如果直接字段为空）
      if (!highlights.length && technicalDetails.highlights) {
        highlights = Array.isArray(technicalDetails.highlights) 
          ? technicalDetails.highlights 
          : [];
      }
      if (!evidenceMeasured.length && technicalDetails.evidence_measured) {
        evidenceMeasured = Array.isArray(technicalDetails.evidence_measured) 
          ? technicalDetails.evidence_measured 
          : [];
      }
      if (!evidenceCertified.length && technicalDetails.evidence_certified) {
        evidenceCertified = Array.isArray(technicalDetails.evidence_certified) 
          ? technicalDetails.evidence_certified 
          : [];
      }
      if (!evidenceComparison.length && technicalDetails.evidence_comparison) {
        evidenceComparison = Array.isArray(technicalDetails.evidence_comparison) 
          ? technicalDetails.evidence_comparison 
          : [];
      }

      // 填充表单数据
      form.setFieldsValue({
        name: techPoint.name,
        description: techPoint.description || '',
        category_id: Array.isArray(techPoint.category_id) ? techPoint.category_id : (techPoint.category_id ? [techPoint.category_id] : undefined),
        technology_id: Array.isArray(techPoint.technology_id) ? techPoint.technology_id : (techPoint.technology_id ? [techPoint.technology_id] : undefined),
        tech_principle: techPrinciple,
        tech_value: techValue,
        tech_boundary: techBoundary,
        highlights: highlights,
        evidence_measured: evidenceMeasured,
        evidence_certified: evidenceCertified,
        evidence_comparison: evidenceComparison,
        release_date: techPoint.release_date ? dayjs(techPoint.release_date) : null,
        tech_type: techPoint.tech_type || 'feature',
        priority: techPoint.priority || 'medium',
        status: techPoint.status || 'draft',
      });
      
      console.log('加载技术点数据:', {
        tech_principle: techPrinciple,
        tech_value: techValue,
        tech_boundary: techBoundary,
        technical_details: technicalDetails
      });
    } catch (error) {
      console.error('加载技术点数据失败:', error);
      message.error('加载技术点数据失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      if (techPoint) {
        // 更新技术点
        const updatePayload: any = {
          name: values.name,
          description: values.description || '',
          category_id: Array.isArray(values.category_id) ? (values.category_id.length > 0 ? values.category_id[0] : null) : (values.category_id || null),
          technology_id: Array.isArray(values.technology_id) ? (values.technology_id.length > 0 ? values.technology_id[0] : null) : (values.technology_id || null),
          tech_principle: values.tech_principle || null,
          tech_value: values.tech_value || null,
          tech_boundary: values.tech_boundary || null,
          highlights: values.highlights || [],
          evidence_measured: values.evidence_measured || [],
          evidence_certified: values.evidence_certified || [],
          evidence_comparison: values.evidence_comparison || [],
          release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
          tech_type: values.tech_type || 'feature',
          priority: values.priority || 'medium',
          status: values.status || 'draft',
        };

        // 使用techPointService更新
        const updateResponse = await techPointService.updateTechPoint(techPoint.id, updatePayload);
        if (!updateResponse.success) {
          throw new Error(updateResponse.error || '更新失败');
        }

        message.success('更新成功');
      } else {
        // 创建技术点
        const createPayload: any = {
          name: values.name,
          description: values.description || '',
          technology_id: Array.isArray(values.technology_id) ? (values.technology_id.length > 0 ? values.technology_id[0] : null) : (values.technology_id || null),
          category_id: Array.isArray(values.category_id) ? (values.category_id.length > 0 ? values.category_id[0] : null) : (values.category_id || null),
          tech_type: values.tech_type || 'feature',
          priority: values.priority || 'medium',
          status: values.status || 'draft',
          tech_principle: values.tech_principle || null,
          tech_value: values.tech_value || null,
          tech_boundary: values.tech_boundary || null,
          highlights: values.highlights || [],
          evidence_measured: values.evidence_measured || [],
          evidence_certified: values.evidence_certified || [],
          evidence_comparison: values.evidence_comparison || [],
          release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
        };

        const createResponse = await techPointService.createTechPoint(createPayload);
        if (!createResponse.success || !createResponse.data) {
          throw new Error(createResponse.error || '创建失败');
        }

        message.success('创建成功');
      }

      onSuccess();
      onCancel();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.response?.data?.message || error?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // JSON导入处理函数
  const handleImportJson = () => {
    try {
      if (!importJsonText.trim()) {
        message.warning('请输入JSON数据');
        return;
      }

      const jsonData = JSON.parse(importJsonText);

      // 支持两种字段名格式：technical_name 或 name
      const technicalName = jsonData.technical_name || jsonData.name;
      if (!technicalName || !jsonData.description) {
        message.error('JSON数据缺少必填字段：technical_name/name 或 description');
        return;
      }

      // 解析日期 - 支持 release_time (如"2025年3月") 或 release_date (如"2025-03-01")
      let releaseDate: any = null;
      if (jsonData.release_time) {
        // 尝试解析 "2025年3月" 格式
        const timeMatch = jsonData.release_time.match(/(\d{4})年(\d{1,2})月/);
        if (timeMatch) {
          const year = timeMatch[1];
          const month = timeMatch[2].padStart(2, '0');
          releaseDate = dayjs(`${year}-${month}-01`);
        } else {
          // 尝试直接解析
          releaseDate = dayjs(jsonData.release_time);
        }
      } else if (jsonData.release_date) {
        releaseDate = dayjs(jsonData.release_date);
      }

      // 获取当前表单值，用于合并（保留未提供的字段）
      const currentFormValues = form.getFieldsValue();

      // 构建更新对象，只包含JSON中提供的字段
      const updateValues: any = {};

      // 只有JSON中提供了该字段才更新
      if (technicalName) {
        updateValues.name = technicalName;
      }
      if (jsonData.description !== undefined) {
        updateValues.description = jsonData.description;
      }
      if (jsonData.tech_principle !== undefined) {
        updateValues.tech_principle = jsonData.tech_principle;
      }
      if (jsonData.value !== undefined || jsonData.tech_value !== undefined) {
        updateValues.tech_value = jsonData.value || jsonData.tech_value;
      }
      if (jsonData.boundaries !== undefined || jsonData.tech_boundary !== undefined) {
        updateValues.tech_boundary = jsonData.boundaries || jsonData.tech_boundary;
      }
      if (jsonData.highlights !== undefined) {
        updateValues.highlights = jsonData.highlights;
      }
      if (jsonData.evidence_measured !== undefined) {
        updateValues.evidence_measured = jsonData.evidence_measured;
      }
      if (jsonData.certifications !== undefined || jsonData.evidence_certified !== undefined) {
        updateValues.evidence_certified = jsonData.certifications || jsonData.evidence_certified;
      }
      if (jsonData.evidence_comparison !== undefined) {
        updateValues.evidence_comparison = jsonData.evidence_comparison;
      }
      if (releaseDate !== null) {
        updateValues.release_date = releaseDate;
      }

      // 合并当前表单值和更新值（更新值优先）
      const mergedValues = {
        ...currentFormValues,
        ...updateValues,
      };

      // 设置表单值（保留未提供的字段）
      form.setFieldsValue(mergedValues);

      message.success('JSON数据导入成功！请检查并确认表单内容，部分字段（如技术IP、技术领域、技术类型、优先级、状态等）需要手动维护');
      setImportModalVisible(false);
      setImportJsonText('');
    } catch (error: any) {
      console.error('JSON导入失败:', error);
      message.error(`JSON解析失败：${error.message || '格式错误'}`);
    }
  };

  return (
    <>
    <Modal
      title={techPoint ? `编辑技术点（${techPoint.name}）` : '新增技术点'}
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="import" icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
          Json导入
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {techPoint ? '保存' : '创建'}
        </Button>,
      ]}
      destroyOnHidden
      style={{ top: 20 }}
      styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          highlights: [],
          evidence_measured: [],
          evidence_certified: [],
          evidence_comparison: [],
          tech_type: 'feature',
          priority: 'medium',
          status: 'draft',
        }}
      >
        {/* 基本信息 */}
        <Card 
          size="small" 
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span>基本信息</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Form.Item
            name="name"
            label={
              <Space>
                <span>技术点名称</span>
                <Tooltip title="技术点的核心名称，应简洁明了">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入技术点名称' }]}
          >
            <Input 
              placeholder="请输入技术点名称" 
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <Space>
                <span>描述</span>
                <Tooltip title="简要描述技术点的核心功能和特点">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入技术点描述，建议包含核心功能、应用场景等" 
              showCount
              maxLength={500}
              style={{ borderRadius: 6 }}
            />
          </Form.Item>
        </Card>

        {/* 技术详情 */}
        <Card 
          size="small" 
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#52c41a' }} />
              <span>技术详情</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Form.Item
            name="tech_principle"
            label={
              <Space>
                <span>技术原理</span>
                <Tooltip title="详细说明技术的工作原理和实现方式">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                </Tooltip>
              </Space>
            }
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入技术原理，详细说明技术的工作原理和实现方式" 
              showCount
              maxLength={1000}
              style={{ borderRadius: 6 }}
              id="tech_principle" 
            />
          </Form.Item>

          <Form.Item
            name="tech_value"
            label={
              <Space>
                <span>价值</span>
                <Tooltip title="说明技术带来的价值和优势">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                </Tooltip>
              </Space>
            }
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入价值，说明技术带来的价值和优势" 
              showCount
              maxLength={1000}
              style={{ borderRadius: 6 }}
              id="tech_value" 
            />
          </Form.Item>

          <Form.Item
            name="tech_boundary"
            label={
              <Space>
                <span>适用边界</span>
                <Tooltip title="说明技术的适用范围和限制条件">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                </Tooltip>
              </Space>
            }
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入适用边界，说明技术的适用范围和限制条件" 
              showCount
              maxLength={1000}
              style={{ borderRadius: 6 }}
              id="tech_boundary" 
            />
          </Form.Item>
        </Card>

        {/* 技术亮点和证据 */}
        <Card 
          size="small" 
          title={
            <Space>
              <BulbOutlined style={{ color: '#faad14' }} />
              <span>技术亮点与证据</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Form.List name="highlights">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <BulbOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontWeight: 500 }}>技术亮点</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      （最多5条，已添加 {fields.length} 条）
                    </Typography.Text>
                  </Space>
                  <Button 
                    size="small" 
                    disabled={fields.length >= 5} 
                    onClick={() => add()} 
                    type="dashed"
                    icon={<PlusOutlined />}
                  >
                    添加
                  </Button>
                </div>
                {fields.length === 0 && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#fafafa', 
                    borderRadius: 6, 
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 13
                  }}>
                    暂无技术亮点，点击"添加"按钮添加
                  </div>
                )}
                {fields.map(field => {
                  const { key, ...fieldProps } = field;
                  return (
                    <div key={key} style={{ 
                      marginBottom: 12, 
                      padding: '12px', 
                      background: '#fafafa', 
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Form.Item 
                        {...fieldProps} 
                        name={[field.name]} 
                        rules={[{ max: 200, message: '最多200字' }]}
                        style={{ flex: 1, marginBottom: 0, minWidth: 0 }}
                      >
                        <Input 
                          placeholder="如：多级热防护与电芯级隔离" 
                          showCount
                          maxLength={200}
                          style={{ borderRadius: 6 }}
                        />
                      </Form.Item>
                      <Button 
                        onClick={() => remove(field.name)} 
                        size="small"
                        danger
                        type="text"
                        style={{ flexShrink: 0 }}
                      >
                        移除
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>

          <Divider style={{ margin: '20px 0' }} />

          <Form.List name="evidence_measured">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <ExperimentOutlined style={{ color: '#1890ff' }} />
                    <span style={{ fontWeight: 500 }}>证据-实测</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      （最多5条，已添加 {fields.length} 条）
                    </Typography.Text>
                  </Space>
                  <Button 
                    size="small" 
                    disabled={fields.length >= 5} 
                    onClick={() => add()} 
                    type="dashed"
                    icon={<PlusOutlined />}
                  >
                    添加
                  </Button>
                </div>
                {fields.length === 0 && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#fafafa', 
                    borderRadius: 6, 
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 13
                  }}>
                    暂无实测证据，点击"添加"按钮添加
                  </div>
                )}
                {fields.map(field => {
                  const { key, ...fieldProps } = field;
                  return (
                    <div key={key} style={{ 
                      marginBottom: 12, 
                      padding: '12px', 
                      background: '#fafafa', 
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Form.Item 
                        {...fieldProps} 
                        name={[field.name]} 
                        rules={[{ max: 200, message: '最多200字' }]}
                        style={{ flex: 1, marginBottom: 0, minWidth: 0 }}
                      >
                        <Input 
                          placeholder="如：冬测衰减≤X%" 
                          showCount
                          maxLength={200}
                          style={{ borderRadius: 6 }}
                        />
                      </Form.Item>
                      <Button 
                        onClick={() => remove(field.name)} 
                        size="small"
                        danger
                        type="text"
                        style={{ flexShrink: 0 }}
                      >
                        移除
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>

          <Divider style={{ margin: '20px 0' }} />

          <Form.List name="evidence_certified">
            {(fields, { add, remove }) => (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontWeight: 500 }}>证据-认证</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      （最多5条，已添加 {fields.length} 条）
                    </Typography.Text>
                  </Space>
                  <Button 
                    size="small" 
                    disabled={fields.length >= 5} 
                    onClick={() => add()} 
                    type="dashed"
                    icon={<PlusOutlined />}
                  >
                    添加
                  </Button>
                </div>
                {fields.length === 0 && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#fafafa', 
                    borderRadius: 6, 
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 13
                  }}>
                    暂无认证证据，点击"添加"按钮添加
                  </div>
                )}
                {fields.map(field => {
                  const { key, ...fieldProps } = field;
                  return (
                    <div key={key} style={{ 
                      marginBottom: 12, 
                      padding: '12px', 
                      background: '#fafafa', 
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Form.Item 
                        {...fieldProps} 
                        name={[field.name]} 
                        rules={[{ max: 200, message: '最多200字' }]}
                        style={{ flex: 1, marginBottom: 0, minWidth: 0 }}
                      >
                        <Input 
                          placeholder="如：通过XXXX针刺/挤压测试" 
                          showCount
                          maxLength={200}
                          style={{ borderRadius: 6 }}
                        />
                      </Form.Item>
                      <Button 
                        onClick={() => remove(field.name)} 
                        size="small"
                        danger
                        type="text"
                        style={{ flexShrink: 0 }}
                      >
                        移除
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>

          <Divider style={{ margin: '20px 0' }} />

          <Form.List name="evidence_comparison">
            {(fields, { add, remove }) => (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <BarChartOutlined style={{ color: '#722ed1' }} />
                    <span style={{ fontWeight: 500 }}>证据-对比</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      （最多5条，已添加 {fields.length} 条）
                    </Typography.Text>
                  </Space>
                  <Button 
                    size="small" 
                    disabled={fields.length >= 5} 
                    onClick={() => add()} 
                    type="dashed"
                    icon={<PlusOutlined />}
                  >
                    添加
                  </Button>
                </div>
                {fields.length === 0 && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#fafafa', 
                    borderRadius: 6, 
                    textAlign: 'center',
                    color: '#999',
                    fontSize: 13
                  }}>
                    暂无对比证据，点击"添加"按钮添加
                  </div>
                )}
                {fields.map(field => {
                  const { key, ...fieldProps } = field;
                  return (
                    <div key={key} style={{ 
                      marginBottom: 12, 
                      padding: '12px', 
                      background: '#fafafa', 
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Form.Item 
                        {...fieldProps} 
                        name={[field.name]} 
                        rules={[{ max: 200, message: '最多200字' }]}
                        style={{ flex: 1, marginBottom: 0, minWidth: 0 }}
                      >
                        <Input 
                          placeholder="如：同级能量密度领先X%" 
                          showCount
                          maxLength={200}
                          style={{ borderRadius: 6 }}
                        />
                      </Form.Item>
                      <Button 
                        onClick={() => remove(field.name)} 
                        size="small"
                        danger
                        type="text"
                        style={{ flexShrink: 0 }}
                      >
                        移除
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>
        </Card>

        {/* 车型信息选择 */}
        <Card 
          size="small" 
          title={
            <Space>
              <CarOutlined style={{ color: '#13c2c2' }} />
              <span>车型信息（可选）</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="品牌">
                <SelectableOptionSelector
                  value={selectedBrandId}
                  options={brands.map(brand => ({ id: brand.id, name: brand.name }))}
                  placeholder="请选择品牌"
                  onCreate={handleCreateBrand}
                  onDelete={handleDeleteBrand}
                  onChange={(value) => {
                    const brandIds = Array.isArray(value) ? value : (value ? [value] : []);
                    setSelectedBrandId(brandIds);
                    form.setFieldsValue({ car_model_id: undefined, car_series_id: undefined });
                  }}
                  allowClear
                  mode="multiple"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="车型">
                <SelectableOptionSelector
                  value={selectedModelId}
                  options={carModels.map(model => ({ id: model.id, name: model.name }))}
                  placeholder="请选择车型"
                  onCreate={handleCreateCarModel}
                  onDelete={handleDeleteCarModel}
                  onChange={(value) => {
                    const modelIds = Array.isArray(value) ? value : (value ? [value] : []);
                    setSelectedModelId(modelIds);
                    form.setFieldsValue({ car_series_id: undefined });
                  }}
                  disabled={selectedBrandId.length === 0}
                  allowClear
                  mode="multiple"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="车系">
                <SelectableOptionSelector
                  value={selectedSeriesId}
                  options={carSeries.map(series => ({ id: series.id, name: series.name }))}
                  placeholder="请选择车系"
                  onCreate={handleCreateCarSeries}
                  onDelete={handleDeleteCarSeries}
                  onChange={(value) => {
                    const seriesIds = Array.isArray(value) ? value : (value ? [value] : []);
                    setSelectedSeriesId(seriesIds);
                  }}
                  disabled={selectedModelId.length === 0}
                  allowClear
                  mode="multiple"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 关联信息 */}
        <Card 
          size="small" 
          title={
            <Space>
              <LinkOutlined style={{ color: '#eb2f96' }} />
              <span>关联信息</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="technology_id"
              label="关联的技术IP"
            >
              <SelectableOptionSelector
                options={technologies.map(tech => ({ id: tech.id, name: tech.name }))}
                placeholder="请选择技术IP"
                onCreate={handleCreateTechnology}
                onDelete={handleDeleteTechnology}
                allowClear
                mode="multiple"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category_id"
              label="关联技术领域"
              rules={[{ required: true, message: '请选择技术领域' }]}
            >
              <SelectableOptionSelector
                options={techCategories.map(cat => ({ id: cat.id, name: cat.name }))}
                placeholder="请选择技术领域"
                onCreate={handleCreateCategory}
                onDelete={handleDeleteCategory}
                allowClear
                mode="multiple"
              />
            </Form.Item>
          </Col>
        </Row>
        </Card>

        {/* 日期信息 */}
        <Card 
          size="small" 
          title="日期信息"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="release_date" label="发布日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择发布日期" />
            </Form.Item>
          </Col>
          {techPoint && (
            <>
              <Col span={12}>
                <Form.Item label="创建时间">
                  <Input 
                    value={techPoint.created_at ? dayjs(techPoint.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'} 
                    disabled 
                    style={{ background: '#f5f5f5' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="更新时间">
                  <Input 
                    value={techPoint.updated_at ? dayjs(techPoint.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'} 
                    disabled 
                    style={{ background: '#f5f5f5' }}
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
        </Card>

        {/* 分类与状态 */}
        <Card 
          size="small" 
          title="分类与状态"
          style={{ marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="tech_type"
              label="技术类型"
              rules={[{ required: true, message: '请选择技术类型' }]}
            >
              <Select>
                <Select.Option value="feature">功能特性</Select.Option>
                <Select.Option value="improvement">改进优化</Select.Option>
                <Select.Option value="innovation">创新技术</Select.Option>
                <Select.Option value="technology">核心技术</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select>
                <Select.Option value="low">低</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="high">高</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
                <Select.Option value="archived">归档</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        </Card>
      </Form>
    </Modal>

    {/* JSON导入模态框 */}
    <Modal
      title="Json导入技术点"
      open={importModalVisible}
      onCancel={() => {
        setImportModalVisible(false);
        setImportJsonText('');
      }}
      width={700}
      footer={[
        <Button key="cancel" onClick={() => {
          setImportModalVisible(false);
          setImportJsonText('');
        }}>
          取消
        </Button>,
        <Button key="import" type="primary" onClick={handleImportJson}>
          导入
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '12px' }}>
            支持标准JSON格式，以下字段会自动导入，其他字段（技术IP、技术领域、技术类型、优先级、状态等）需要手动维护。
          </span>
        </div>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px', 
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          marginTop: '8px'
        }}>
{`{
  "technical_name": "技术点名称（必填，也支持name）",
  "description": "描述（必填）",
  "tech_principle": "技术原理",
  "value": "价值（也支持tech_value）",
  "boundaries": "适用边界（也支持tech_boundary）",
  "highlights": ["亮点1", "亮点2"],
  "evidence_measured": ["实测1", "实测2"],
  "certifications": ["认证1", "认证2"]（也支持evidence_certified）,
  "evidence_comparison": ["对比1", "对比2"],
  "release_time": "2025年3月"（也支持release_date: "2025-03-01"）
}`}
        </pre>
      </div>
      <Input.TextArea
        rows={15}
        placeholder="请粘贴JSON数据..."
        value={importJsonText}
        onChange={(e) => setImportJsonText(e.target.value)}
      />
    </Modal>
    </>
  );
};

export default TechPointEditModal;
