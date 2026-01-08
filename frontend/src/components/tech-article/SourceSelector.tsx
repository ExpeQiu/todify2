import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, Checkbox, Input, Button, Spin, Empty, Tag, Typography, Space } from 'antd';
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { aiSearchService } from '../../services/aiSearchService';
import { Conversation, OutputContent } from '../../types/aiSearch';
import ProjectConversationService from '../../services/projectConversationService';

const { Text, Paragraph } = Typography;

interface SourceSelectorProps {
  projectId?: string;
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

// 全局缓存（跨组件实例共享）
const globalCache: Record<string, { data: SourceItem[]; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 60秒缓存

export const SourceSelector: React.FC<SourceSelectorProps> = ({ projectId, onSelectionChange }) => {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [filteredSources, setFilteredSources] = useState<SourceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  
  // 防止重复加载的标志
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastProjectIdRef = useRef<string | undefined>(undefined);

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 加载数据（带防重复机制）
  useEffect(() => {
    // 如果 projectId 没变且正在加载，跳过
    if (loadingRef.current && lastProjectIdRef.current === projectId) {
      return;
    }
    lastProjectIdRef.current = projectId;
    loadSources();
  }, [projectId]);

  // 当选择变化时，通知父组件
  useEffect(() => {
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

  // 搜索过滤 - 使用 useMemo 优化
  const filteredSourcesMemo = useMemo(() => {
    if (!searchText.trim()) {
      return sources;
    }

    const text = searchText.toLowerCase();
    return sources.filter((source) => {
      return (
        source.title.toLowerCase().includes(text) ||
        source.summary.toLowerCase().includes(text) ||
        PAGE_TYPE_LABELS[source.pageType]?.toLowerCase().includes(text)
      );
    });
  }, [searchText, sources]);

  useEffect(() => {
    setFilteredSources(filteredSourcesMemo);
  }, [filteredSourcesMemo]);

  const loadSources = useCallback(async () => {
    // 防止并发加载
    if (loadingRef.current) {
      return;
    }
    
    // 检查全局缓存
    const cacheKey = projectId || 'all';
    const cached = globalCache[cacheKey];
    if (cached && cached.timestamp + CACHE_DURATION > Date.now()) {
      setSources(cached.data);
      setFilteredSources(cached.data);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      let conversations: Conversation[] = [];
      let outputs: OutputContent[] = [];

      if (projectId) {
        // 使用项目级别的 API
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          // 获取项目对话
          const projectConversations = await ProjectConversationService.getProjectConversations(
            projectIdNum,
            100,
            0
          );

          // 转换为 Conversation 格式
          conversations = projectConversations.map((conv) => ({
            id: conv.conversation_id,
            title: conv.session_name || '未命名对话',
            sources: [],
            messages: [],
            createdAt: conv.created_at ? new Date(conv.created_at) : new Date(),
            updatedAt: conv.updated_at ? new Date(conv.updated_at) : new Date(),
            pageType: conv.app_type || 'unknown',
          }));

          // 只获取前5个对话的详细信息作为摘要（进一步优化性能）
          const conversationIds = conversations.map((c) => c.id);
          const PREVIEW_COUNT = 5; // 减少预览数量
          const previewConversations = conversations.slice(0, PREVIEW_COUNT);
          
          // 并行获取对话详情
          const conversationDetails = await Promise.all(
            previewConversations.map(async (conv) => {
              try {
                const detail = await aiSearchService.getConversation(conv.id, { limit: 1 });
                return detail;
              } catch (error) {
                console.warn(`获取对话 ${conv.id} 详情失败:`, error);
                return null;
              }
            })
          );

          // 更新预览对话的详细信息
          conversationDetails.forEach((detail, index) => {
            if (detail && conversations[index]) {
              conversations[index] = detail;
            }
          });

          // 批量获取 outputs（只请求一次，通过后端过滤）
          const pageTypes = ['ai-qa', 'tech-package', 'tech-strategy'];
          const outputPromises = pageTypes.map((pageType) =>
            aiSearchService.getOutputs(undefined, pageType).catch(() => [])
          );
          const outputArrays = await Promise.all(outputPromises);
          const allOutputs = outputArrays.flat();
          
          // 只保留属于这些对话的 outputs
          const conversationIdSet = new Set(conversationIds);
          outputs = allOutputs.filter((output) => 
            output.conversationId && conversationIdSet.has(output.conversationId)
          );
        }
      } else {
        // 原有逻辑：从三个页面获取对话和输出
        const pageTypes = ['ai-qa', 'tech-package', 'tech-strategy'];
        [conversations, outputs] = await Promise.all([
          aiSearchService.getConversationsAcrossPages(pageTypes),
          aiSearchService.getOutputsAcrossPages(pageTypes),
        ]);
      }

      // 如果组件已卸载，不更新状态
      if (!mountedRef.current) {
        return;
      }

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

      // 更新全局缓存
      globalCache[cacheKey] = {
        data: sourceItems,
        timestamp: Date.now(),
      };

      setSources(sourceItems);
      setFilteredSources(sourceItems);
    } catch (error) {
      console.error('加载来源数据失败:', error);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projectId]);

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredSources.length) {
        return new Set();
      } else {
        return new Set(filteredSources.map((s) => s.id));
      }
    });
  }, [filteredSources]);

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
              let dateStr = '';
              try {
                dateStr = new Date(source.createdAt).toLocaleString('zh-CN');
              } catch {
                dateStr = '';
              }

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
                        {dateStr}
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

