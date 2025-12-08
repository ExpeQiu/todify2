import React, { useState, useEffect } from 'react';
import {
  Modal,
  Radio,
  Space,
  Button,
  message,
  Progress,
  Descriptions,
  Alert,
  Typography,
  Divider,
} from 'antd';
import { SyncOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { techPointSyncService } from '../../services/techPointSyncService';

const { Text, Paragraph } = Typography;

interface TechPointSyncModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

type SyncDirection = 'from_tpd2' | 'to_tpd2';

const TechPointSyncModal: React.FC<TechPointSyncModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('from_tpd2');
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

  useEffect(() => {
    if (!visible) {
      // 重置状态
      setSyncDirection('from_tpd2');
      setSyncing(false);
      setSyncProgress(null);
      setSyncResult(null);
      setSyncError(null);
    }
  }, [visible]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    setSyncProgress({ total: 0, completed: 0, failed: 0 });

    try {
      let result;
      if (syncDirection === 'from_tpd2') {
        // 从 TPD2 同步到当前项目
        result = await techPointSyncService.syncFromTPD2({
          fullSync: true,
        });
      } else {
        // 从当前项目同步到 TPD2
        result = await techPointSyncService.syncToTPD2();
      }

      if (result.success && result.data) {
        setSyncResult(result.data);
        message.success(
          syncDirection === 'from_tpd2'
            ? '从 TPD2 同步成功'
            : '同步到 TPD2 成功'
        );
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
          <Text strong>选择同步方向：</Text>
          <Radio.Group
            value={syncDirection}
            onChange={(e) => setSyncDirection(e.target.value)}
            style={{ marginTop: 12, width: '100%' }}
            disabled={syncing}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Radio value="from_tpd2" style={{ width: '100%', padding: '12px' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <ArrowRightOutlined />
                    <Text strong>从 TPD2 同步到当前项目</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 24 }}>
                    将 TPD2 项目中的技术点数据同步到当前项目，覆盖或创建本地技术点
                  </Text>
                </Space>
              </Radio>
              <Radio value="to_tpd2" style={{ width: '100%', padding: '12px' }} disabled>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space>
                    <ArrowLeftOutlined />
                    <Text strong>从当前项目同步到 TPD2</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>(暂未实现)</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 24 }}>
                    将当前项目中的技术点数据同步到 TPD2 项目（此功能将在后续版本中提供）
                  </Text>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
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
    </Modal>
  );
};

export default TechPointSyncModal;
