import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Input, Button, Spin, Empty, Tag, Typography, Space } from 'antd';
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { aiSearchService } from '../../services/aiSearchService';
import { Conversation, OutputContent } from '../../types/aiSearch';

const { Text, Paragraph } = Typography;

interface SourceSelectorProps {
  onSelectionChange: (selected: {
    conversationIds: string[];
    outputIds: string[];
  }) => void;
}

interface SourceItem {
  id: string;
  type: 'conversation' | 'output';
  pageType: string;
  title: string;
  summary: string;
  createdAt: Date;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  'ai-qa': 'AI问答',
  'tech-package': '技术包装',
  'tech-strategy': '技术策略',
};

export const SourceSelector: React.FC<SourceSelectorProps> = ({ onSelectionChange }) => {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [filteredSources, setFilteredSources] = useState<SourceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    // 当选择变化时，通知父组件
    const conversationIds: string[] = [];
    const outputIds: string[] = [];

    selectedIds.forEach((id) => {
      const source = sources.find((s) => s.id === id);
      if (source) {
        if (source.type === 'conversation') {
          conversationIds.push(id);
        } else {
          outputIds.push(id);
        }
      }
    });

    onSelectionChange({ conversationIds, outputIds });
  }, [selectedIds, sources, onSelectionChange]);

  useEffect(() => {
    // 搜索过滤
    if (!searchText.trim()) {
      setFilteredSources(sources);
      return;
    }

    const filtered = sources.filter((source) => {
      const text = searchText.toLowerCase();
      return (
        source.title.toLowerCase().includes(text) ||
        source.summary.toLowerCase().includes(text) ||
        PAGE_TYPE_LABELS[source.pageType]?.toLowerCase().includes(text)
      );
    });
    setFilteredSources(filtered);
  }, [searchText, sources]);

  const loadSources = async () => {
    setLoading(true);
    try {
      // 从三个页面获取对话和输出
      const pageTypes = ['ai-qa', 'tech-package', 'tech-strategy'];
      
      const [conversations, outputs] = await Promise.all([
        aiSearchService.getConversationsAcrossPages(pageTypes),
        aiSearchService.getOutputsAcrossPages(pageTypes),
      ]);

      // 转换为统一格式
      const sourceItems: SourceItem[] = [];

      conversations.forEach((conv) => {
        const firstMessage = conv.messages?.[0];
        const summary = firstMessage?.content?.substring(0, 200) || '';
        sourceItems.push({
          id: conv.id,
          type: 'conversation',
          pageType: conv.pageType || 'unknown',
          title: conv.title,
          summary: summary + (summary.length >= 200 ? '...' : ''),
          createdAt: conv.createdAt,
        });
      });

      outputs.forEach((output) => {
        let contentStr = '';
        if (typeof output.content === 'string') {
          contentStr = output.content;
        } else if (output.content) {
          contentStr = JSON.stringify(output.content);
        }
        const summary = contentStr.substring(0, 200) + (contentStr.length >= 200 ? '...' : '');
        
        sourceItems.push({
          id: output.id,
          type: 'output',
          pageType: output.pageType || 'unknown',
          title: output.title,
          summary,
          createdAt: output.createdAt,
        });
      });

      // 按时间排序
      sourceItems.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      setSources(sourceItems);
      setFilteredSources(sourceItems);
    } catch (error) {
      console.error('加载来源数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredSources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSources.map((s) => s.id)));
    }
  };

  return (
    <Card
      title="选择信息源"
      extra={
        <Space>
          <Button size="small" onClick={handleSelectAll}>
            {selectedIds.size === filteredSources.length ? '取消全选' : '全选'}
          </Button>
          <Text type="secondary">
            已选择 {selectedIds.size} 项
          </Text>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input
          placeholder="搜索对话或输出内容..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : filteredSources.length === 0 ? (
          <Empty description="暂无数据" />
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredSources.map((source) => {
              const isSelected = selectedIds.has(source.id);
              return (
                <Card
                  key={source.id}
                  size="small"
                  style={{
                    marginBottom: 8,
                    border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggleSelection(source.id)}
                  hoverable
                >
                  <Space style={{ width: '100%' }} align="start">
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleSelection(source.id)}
                    />
                    <div style={{ flex: 1 }}>
                      <Space style={{ marginBottom: 8 }}>
                        <Tag color={source.type === 'conversation' ? 'blue' : 'green'}>
                          {source.type === 'conversation' ? '对话' : '输出'}
                        </Tag>
                        <Tag>{PAGE_TYPE_LABELS[source.pageType] || source.pageType}</Tag>
                        {isSelected && <CheckCircleOutlined style={{ color: '#1890ff' }} />}
                      </Space>
                      <Text strong>{source.title}</Text>
                      <Paragraph
                        ellipsis={{ rows: 2, expandable: false }}
                        style={{ marginTop: 8, marginBottom: 0, color: '#666' }}
                      >
                        {source.summary || '无摘要'}
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(source.createdAt).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                  </Space>
                </Card>
              );
            })}
          </div>
        )}
      </Space>
    </Card>
  );
};

export default SourceSelector;

