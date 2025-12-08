import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message, Empty, DatePicker, Divider, Row, Col } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import type { TechPoint, TechCategory } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
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

  useEffect(() => {
    if (visible) {
      loadTechCategories();
      if (techPoint) {
        loadTechPointData();
      } else {
        form.resetFields();
      }
    }
  }, [visible, techPoint]);

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

  const loadTechPointData = async () => {
    if (!techPoint) return;

    try {
      // 填充表单数据
      form.setFieldsValue({
        name: techPoint.name,
        description: techPoint.description || '',
        category_id: techPoint.category_id,
        technology_id: techPoint.technology_id || undefined,
        tech_principle: techPoint.tech_principle || '',
        tech_value: techPoint.tech_value || '',
        tech_boundary: techPoint.tech_boundary || '',
        highlights: techPoint.highlights || [],
        evidence_measured: techPoint.evidence_measured || [],
        evidence_certified: techPoint.evidence_certified || [],
        evidence_comparison: techPoint.evidence_comparison || [],
        release_date: techPoint.release_date ? dayjs(techPoint.release_date) : null,
        tech_type: techPoint.tech_type || 'feature',
        priority: techPoint.priority || 'medium',
        status: techPoint.status || 'draft',
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
      width={800}
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

        <Form.Item
          name="tech_principle"
          label="技术原理"
        >
          <Input.TextArea rows={3} placeholder="请输入技术原理" />
        </Form.Item>

        <Form.Item
          name="tech_value"
          label="价值"
        >
          <Input.TextArea rows={3} placeholder="请输入价值" />
        </Form.Item>

        <Form.Item
          name="tech_boundary"
          label="适用边界"
        >
          <Input.TextArea rows={3} placeholder="请输入适用边界" />
        </Form.Item>

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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="release_date" label="发布日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择发布日期" />
            </Form.Item>
          </Col>
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
