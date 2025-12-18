import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message, Empty, DatePicker, Divider, Row, Col } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import type { TechPoint, TechCategory } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
import { brandService } from '../../services/brandService';
import { carModelService } from '../../services/carModelService';
import { carSeriesService } from '../../services/carSeriesService';
import type { Brand } from '../../types/brand';
import type { CarModel } from '../../types/carModel';
import type { CarSeries } from '../../types/carSeries';
import CarModelAssociation from './CarModelAssociation';
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  
  // 品牌、车型、车系相关状态
  const [brands, setBrands] = useState<Brand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTechCategories();
      loadBrands();
      if (techPoint) {
        // 重新从后端获取最新数据，确保所有字段都正确加载
        loadTechPointDataFromServer();
      } else {
        form.resetFields();
        setSelectedBrandId(null);
        setSelectedModelId(null);
        setSelectedSeriesId(null);
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
        category_id: data.category_id,
        technology_id: data.technology_id || undefined,
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

  // 品牌变化处理
  useEffect(() => {
    if (selectedBrandId) {
      loadCarModelsByBrand(selectedBrandId);
      setCarSeries([]);
      setSelectedModelId(null);
      setSelectedSeriesId(null);
    } else {
      setCarModels([]);
      setCarSeries([]);
      setSelectedModelId(null);
      setSelectedSeriesId(null);
    }
  }, [selectedBrandId]);

  // 车型变化处理
  useEffect(() => {
    if (selectedModelId) {
      loadCarSeriesByModel(selectedModelId);
      setSelectedSeriesId(null);
    } else {
      setCarSeries([]);
      setSelectedSeriesId(null);
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
        category_id: techPoint.category_id,
        technology_id: techPoint.technology_id || undefined,
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
          category_id: values.category_id || null,
          technology_id: values.technology_id || null,
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
          technology_id: values.technology_id || null,
          category_id: values.category_id,
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
      bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
    >
      <Divider style={{ margin: '0 0 24px 0' }} />
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
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>基本信息</h4>
          <Form.Item
            name="name"
            label="技术点名称"
            rules={[{ required: true, message: '请输入技术点名称' }]}
          >
            <Input placeholder="请输入技术点名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入技术点描述" />
          </Form.Item>
        </div>

        <Divider />

        {/* 技术详情 */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>技术详情</h4>
          <Form.Item
            name="tech_principle"
            label="技术原理"
          >
            <Input.TextArea rows={3} placeholder="请输入技术原理" id="tech_principle" />
          </Form.Item>

          <Form.Item
            name="tech_value"
            label="价值"
          >
            <Input.TextArea rows={3} placeholder="请输入价值" id="tech_value" />
          </Form.Item>

          <Form.Item
            name="tech_boundary"
            label="适用边界"
          >
            <Input.TextArea rows={3} placeholder="请输入适用边界" id="tech_boundary" />
          </Form.Item>
        </div>

        <Divider />

        {/* 车型信息选择 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>车型信息（可选）</label>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="品牌">
                <Select
                  placeholder="请选择品牌"
                  value={selectedBrandId}
                  onChange={(value) => {
                    setSelectedBrandId(value);
                    form.setFieldsValue({ car_model_id: undefined, car_series_id: undefined });
                  }}
                  loading={brandsLoading}
                  allowClear
                >
                  {brands.map(brand => (
                    <Select.Option key={brand.id} value={brand.id}>
                      {brand.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="车型">
                <Select
                  placeholder="请选择车型"
                  value={selectedModelId}
                  onChange={(value) => {
                    setSelectedModelId(value);
                    form.setFieldsValue({ car_series_id: undefined });
                  }}
                  disabled={!selectedBrandId}
                  loading={modelsLoading}
                  allowClear
                >
                  {carModels.map(model => (
                    <Select.Option key={model.id} value={model.id}>
                      {model.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="车系">
                <Select
                  placeholder="请选择车系"
                  value={selectedSeriesId}
                  onChange={(value) => setSelectedSeriesId(value)}
                  disabled={!selectedModelId}
                  loading={seriesLoading}
                  allowClear
                >
                  {carSeries.map(series => (
                    <Select.Option key={series.id} value={series.id}>
                      {series.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {techPoint && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>关联车型管理</div>
              <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                技术点创建后，可在详情页面管理关联车型。当前技术点ID: {techPoint.id}
              </p>
            </div>
          )}
        </div>

        <Divider />

        <Form.List name="highlights">
          {(fields, { add, remove }) => (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label>技术亮点（最多5条）</label>
                <Button size="small" disabled={fields.length >= 5} onClick={() => add()} type="dashed">添加</Button>
              </div>
              {fields.map(field => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...field} name={[field.name]} rules={[{ max: 200, message: '最多200字' }]}>
                    <Input placeholder="如：多级热防护与电芯级隔离" style={{ width: 600 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} size="small">移除</Button>
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <Form.List name="evidence_measured">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label>证据-实测（最多5条）</label>
                <Button size="small" disabled={fields.length >= 5} onClick={() => add()} type="dashed">添加</Button>
              </div>
              {fields.map(field => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...field} name={[field.name]} rules={[{ max: 200, message: '最多200字' }]}>
                    <Input placeholder="如：冬测衰减≤X%" style={{ width: 600 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} size="small">移除</Button>
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <Form.List name="evidence_certified">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label>证据-认证（最多5条）</label>
                <Button size="small" disabled={fields.length >= 5} onClick={() => add()} type="dashed">添加</Button>
              </div>
              {fields.map(field => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...field} name={[field.name]} rules={[{ max: 200, message: '最多200字' }]}>
                    <Input placeholder="如：通过XXXX针刺/挤压测试" style={{ width: 600 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} size="small">移除</Button>
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <Form.List name="evidence_comparison">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label>证据-对比（最多5条）</label>
                <Button size="small" disabled={fields.length >= 5} onClick={() => add()} type="dashed">添加</Button>
              </div>
              {fields.map(field => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...field} name={[field.name]} rules={[{ max: 200, message: '最多200字' }]}>
                    <Input placeholder="如：同级能量密度领先X%" style={{ width: 600 }} />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} size="small">移除</Button>
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <Divider />

        {/* 关联信息 */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Form.Item
              name="technology_id"
              label="关联的技术IP"
            >
              <Select
                placeholder="请选择技术IP"
                showSearch
                allowClear
                disabled
              >
                {/* 技术IP功能暂未实现 */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category_id"
              label="关联技术领域"
              rules={[{ required: true, message: '请选择技术领域' }]}
            >
              <Select
                placeholder="请选择技术领域"
                showSearch
                optionFilterProp="label"
                allowClear
              >
                {Array.isArray(techCategories) && techCategories.map(category => (
                  <Select.Option key={category.id} value={category.id} label={category.name}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* 日期信息 */}
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

        <Divider />
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
