import React, { useState, useEffect } from 'react';
import {
  Modal,
  Space,
  Button,
  message,
  Progress,
  Descriptions,
  Alert,
  Typography,
  Divider,
  Select,
  Tooltip,
  Input,
  Form,
  Switch,
  Table,
  Popconfirm,
} from 'antd';
import { SyncOutlined, SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { techPointSyncService } from '../../services/techPointSyncService';
import { techHubApiConfigService, TechHubAPIConfig } from '../../services/techHubApiConfigService';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface TechPointSyncModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const TechPointSyncModal: React.FC<TechPointSyncModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    synced: number;
    updated?: number;
    created?: number;
    errors: number;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [apiConfigs, setApiConfigs] = useState<TechHubAPIConfig[]>([]);
  const [selectedApiConfigId, setSelectedApiConfigId] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // 加载 API 配置
  useEffect(() => {
    if (visible) {
      loadApiConfigs();
    }
  }, [visible]);

  const loadApiConfigs = async () => {
    try {
      const configs = await techHubApiConfigService.getConfigs();
      setApiConfigs(configs);
      
      // 自动选择默认启用的配置
      const defaultConfig = configs.find(config => config.enabled) || configs[0];
      if (defaultConfig) {
        setSelectedApiConfigId(defaultConfig.id);
      }
    } catch (error) {
      console.error('加载 API 配置失败:', error);
      message.error('加载 API 配置失败');
    }
  };

  useEffect(() => {
    if (!visible) {
      // 重置状态
      setSyncing(false);
      setSyncProgress(null);
      setSyncResult(null);
      setSyncError(null);
      setShowConfigModal(false);
    }
  }, [visible]);

  const handleSync = async () => {
    // 验证 API 配置
    if (!selectedApiConfigId) {
      message.warning('请选择 API 配置');
      return;
    }

    const selectedConfig = apiConfigs.find(config => config.id === selectedApiConfigId);
    if (!selectedConfig) {
      message.error('选择的 API 配置不存在');
      return;
    }

    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    setSyncProgress({ total: 0, completed: 0, failed: 0 });

    try {
      const result = await techPointSyncService.syncFromTechHub({
        fullSync: true,
        apiBaseUrl: selectedConfig.apiBaseUrl,
        apiKey: selectedConfig.apiKey,
      });

      if (result.success && result.data) {
        setSyncResult(result.data);
        message.success('从 tech-hub 同步成功');
        // 触发成功回调
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setSyncError(result.error || '同步失败');
        message.error(result.error || '同步失败');
      }
    } catch (error: any) {
      const errorMsg = error?.message || '同步过程中发生错误';
      setSyncError(errorMsg);
      message.error(errorMsg);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleCancel = () => {
    if (syncing) {
      message.warning('同步正在进行中，请稍候...');
      return;
    }
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <SyncOutlined />
          <span>同步技术点</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={syncing}>
          取消
        </Button>,
        <Button
          key="sync"
          type="primary"
          icon={<SyncOutlined />}
          loading={syncing}
          onClick={handleSync}
        >
          {syncing ? '同步中...' : '开始同步'}
        </Button>,
      ]}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>API 配置：</Text>
            <Tooltip title="管理 API 配置">
              <Button
                type="link"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setShowConfigModal(true)}
                disabled={syncing}
              >
                管理配置
              </Button>
            </Tooltip>
          </div>
          <Select
            value={selectedApiConfigId}
            onChange={setSelectedApiConfigId}
            style={{ width: '100%' }}
            disabled={syncing}
            placeholder="请选择 API 配置"
          >
            {apiConfigs.map(config => (
              <Option key={config.id} value={config.id} disabled={!config.enabled}>
                {config.name} {!config.enabled && '(已禁用)'}
                {config.enabled && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    ({config.apiBaseUrl})
                  </Text>
                )}
              </Option>
            ))}
          </Select>
          {selectedApiConfigId && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {apiConfigs.find(c => c.id === selectedApiConfigId)?.description}
            </Text>
          )}
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div>
          <Text strong>同步模式：</Text>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="单向拉取同步（tech-hub -> 当前项目）"
            description="同步时仅从 tech-hub 拉取技术点数据，并覆盖/更新本地技术点，不会向外部系统回写。"
          />
        </div>

        {syncing && syncProgress && (
          <div>
            <Text strong>同步进度：</Text>
            <Progress
              percent={
                syncProgress.total > 0
                  ? Math.round(
                      (syncProgress.completed / syncProgress.total) * 100
                    )
                  : 0
              }
              status="active"
              style={{ marginTop: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              已完成: {syncProgress.completed} / {syncProgress.total}
              {syncProgress.failed > 0 && ` | 失败: ${syncProgress.failed}`}
            </Text>
          </div>
        )}

        {syncError && (
          <Alert
            message="同步失败"
            description={syncError}
            type="error"
            showIcon
            closable
            onClose={() => setSyncError(null)}
          />
        )}

        {syncResult && (
          <div>
            <Text strong>同步结果：</Text>
            <Descriptions
              bordered
              size="small"
              column={1}
              style={{ marginTop: 8 }}
            >
              {syncResult.created !== undefined && (
                <Descriptions.Item label="新创建">
                  <Text type="success">{syncResult.created}</Text>
                </Descriptions.Item>
              )}
              {syncResult.updated !== undefined && (
                <Descriptions.Item label="已更新">
                  <Text type="warning">{syncResult.updated}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="同步总数">
                <Text>{syncResult.synced}</Text>
              </Descriptions.Item>
              {syncResult.errors > 0 && (
                <Descriptions.Item label="错误数量">
                  <Text type="danger">{syncResult.errors}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}

        <Divider />

        <Alert
          message="注意事项"
          description={
            <Paragraph style={{ margin: 0, fontSize: 12 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>同步操作会覆盖目标系统中的数据，请谨慎操作</li>
                <li>建议在同步前备份重要数据</li>
                <li>同步过程可能需要较长时间，请耐心等待</li>
                <li>同步过程中请勿关闭此窗口</li>
              </ul>
            </Paragraph>
          }
          type="warning"
          showIcon
        />
      </Space>

      {/* API 配置管理模态框 */}
      <Modal
        title="API 配置管理"
        open={showConfigModal}
        onCancel={() => setShowConfigModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowConfigModal(false)}>
            关闭
          </Button>,
        ]}
      >
        <ApiConfigManager
          configs={apiConfigs}
          onConfigChange={loadApiConfigs}
          onSelectConfig={(configId) => {
            setSelectedApiConfigId(configId);
            setShowConfigModal(false);
          }}
        />
      </Modal>
    </Modal>
  );
};

// API 配置管理组件
interface ApiConfigManagerProps {
  configs: TechHubAPIConfig[];
  onConfigChange: () => void;
  onSelectConfig: (configId: string) => void;
}

const ApiConfigManager: React.FC<ApiConfigManagerProps> = ({
  configs,
  onConfigChange,
  onSelectConfig,
}) => {
  const [form] = Form.useForm();
  const [editingConfig, setEditingConfig] = useState<TechHubAPIConfig | null>(null);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingConfig({
      id: '',
      name: '',
      description: '',
      apiBaseUrl: '',
      enabled: true,
    });
    form.resetFields();
  };

  const handleEdit = (config: TechHubAPIConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingConfig?.id && editingConfig.id !== '') {
        // 更新现有配置
        await techHubApiConfigService.updateConfig(editingConfig.id, values);
        message.success('配置更新成功');
      } else {
        // 添加新配置
        await techHubApiConfigService.addConfig(values);
        message.success('配置添加成功');
      }
      
      setEditingConfig(null);
      form.resetFields();
      onConfigChange();
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await techHubApiConfigService.deleteConfig(id);
      message.success('配置删除成功');
      onConfigChange();
    } catch (error) {
      console.error('删除配置失败:', error);
      message.error('删除配置失败');
    }
  };

  const handleTest = async (config: TechHubAPIConfig) => {
    setTestingConfigId(config.id);
    try {
      const result = await techHubApiConfigService.testConnection(config);
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('测试连接失败');
    } finally {
      setTestingConfigId(null);
    }
  };

  const handleToggleEnabled = async (config: TechHubAPIConfig) => {
    try {
      await techHubApiConfigService.updateConfig(config.id, {
        enabled: !config.enabled,
      });
      message.success(`配置已${config.enabled ? '禁用' : '启用'}`);
      onConfigChange();
    } catch (error) {
      message.error('更新配置失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'API 地址',
      dataIndex: 'apiBaseUrl',
      key: 'apiBaseUrl',
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'enabled',
      render: (_: any, record: TechHubAPIConfig) => (
        <Switch
          checked={record.enabled}
          onChange={() => handleToggleEnabled(record)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TechHubAPIConfig) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => onSelectConfig(record.id)}
          >
            使用
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            loading={testingConfigId === record.id}
            onClick={() => handleTest(record)}
          >
            测试
          </Button>
          {!record.id.startsWith('default-') && (
            <Popconfirm
              title="确定要删除这个配置吗？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>API 配置列表</Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加配置
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={configs}
        rowKey="id"
        pagination={false}
        size="small"
      />

      {editingConfig && (
        <Modal
          title={editingConfig.id ? '编辑配置' : '添加配置'}
          open={!!editingConfig}
          onOk={handleSave}
          onCancel={() => {
            setEditingConfig(null);
            form.resetFields();
          }}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={editingConfig}
          >
            <Form.Item
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="例如：tech-hub 生产环境" />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea
                rows={2}
                placeholder="配置的简要描述"
              />
            </Form.Item>
            <Form.Item
              name="apiBaseUrl"
              label="API 基础地址"
              rules={[
                { required: true, message: '请输入 API 基础地址' },
                { type: 'url', message: '请输入有效的 URL' },
              ]}
            >
              <Input placeholder="Docker 内同步填 http://geelytpd2-tech-hub:8080/api/v1（经网关可从宿主机用 /tech/api/v1）" />
            </Form.Item>
            <Form.Item
              name="apiKey"
              label="API Key（可选）"
            >
              <Input.Password placeholder="如果需要认证，请输入 API Key" />
            </Form.Item>
            <Form.Item
              name="enabled"
              label="启用"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Space>
  );
};

export default TechPointSyncModal;
