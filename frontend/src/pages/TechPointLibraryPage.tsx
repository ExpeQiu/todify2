import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Space,
  Tag,
  Button,
  Input,
  Select,
  message,
  Row,
  Col,
  Checkbox,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SyncOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { TechPoint, TechCategory, TechType, TechPriority, TechStatus } from '../types/techPoint';
import { techPointService } from '../services/techPointService';
import TechPointEditModal from '../components/techPoint/TechPointEditModal';
import TechPointSyncModal from '../components/techPoint/TechPointSyncModal';
import HomeNavigationBar from '../components/HomeNavigationBar';

const TechPointLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 选择模式相关状态
  const isSelectMode = searchParams.get('mode') === 'select';
  const returnUrl = searchParams.get('returnUrl') || '/';
  const initialSelectedIds = searchParams.get('selectedIds')?.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || [];
  
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [techCategories, setTechCategories] = useState<TechCategory[]>([]);
  const [technologies, setTechnologies] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 搜索和筛选
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TechType | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<TechPriority | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<TechStatus | undefined>(undefined);
  
  // 模态框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTechPoint, setSelectedTechPoint] = useState<TechPoint | null>(null);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  
  // 选择模式下的选中状态
  const [selectedTechPointIds, setSelectedTechPointIds] = useState<number[]>(initialSelectedIds);

  const loadTechCategories = useCallback(async () => {
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
  }, []);

  const loadTechnologies = useCallback(async () => {
    try {
      // 尝试加载技术IP列表（如果后端支持）
      // 如果API不存在，这个功能会静默失败，不影响主要功能
      // 后续可以在适配服务层时实现
      setTechnologies([]);
    } catch (error) {
      console.error('加载技术IP失败:', error);
    }
  }, []);

  const loadTechPoints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize,
      };
      
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      if (categoryFilter) {
        params.category_id = categoryFilter;
      }
      if (typeFilter) {
        params.tech_type = typeFilter;
      }
      if (priorityFilter) {
        params.priority = priorityFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await techPointService.getTechPoints(params);
      if (response.success && response.data) {
        const data = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.items || [];
        setTechPoints(data);
        setTotal(response.data.total || 0);
        // 如果当前页没有数据且不是第一页，跳转到第一页
        if (data.length === 0 && currentPage > 1) {
          setCurrentPage(1);
        }
      } else {
        message.error(response.error || '加载技术点失败');
      }
    } catch (error) {
      console.error('加载技术点失败:', error);
      message.error('加载技术点失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, categoryFilter, typeFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    loadTechCategories();
    loadTechnologies();
  }, [loadTechCategories, loadTechnologies]);

  useEffect(() => {
    loadTechPoints();
  }, [loadTechPoints]);

  const handleCreate = () => {
    setSelectedTechPoint(null);
    setEditModalVisible(true);
  };

  const handleEdit = (techPoint: TechPoint) => {
    setSelectedTechPoint(techPoint);
    setEditModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await techPointService.deleteTechPoint(id);
      if (response.success) {
        message.success('删除成功');
        // 重新加载数据，确保与后端同步（后端是软删除，状态变为archived）
        await loadTechPoints();
      } else {
        message.error(response.error || '删除失败');
      }
    } catch (error) {
      console.error('删除技术点失败:', error);
      message.error('删除失败');
    }
  };

  const handleViewDetail = (techPoint: TechPoint, event?: React.MouseEvent) => {
    if (isSelectMode) {
      // 选择模式下，点击行切换选中状态
      // 如果点击的是复选框，不处理（由复选框自己处理）
      if (event?.target instanceof HTMLElement && event.target.closest('.ant-checkbox-wrapper')) {
        return;
      }
      toggleSelectTechPoint(techPoint.id);
    } else {
      navigate(`/tech-point-library/${techPoint.id}`, {
        state: { from: '/tech-point-library' }
      });
    }
  };

  const toggleSelectTechPoint = (techPointId: number) => {
    setSelectedTechPointIds(prev => 
      prev.includes(techPointId)
        ? prev.filter(id => id !== techPointId)
        : [...prev, techPointId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTechPointIds(techPoints.map(tp => tp.id));
    } else {
      setSelectedTechPointIds([]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedTechPointIds.length === 0) {
      message.warning('请至少选择一个技术点');
      return;
    }
    
    // 将选中的技术点ID传回
    const separator = returnUrl.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    params.append('selectedTechPointIds', selectedTechPointIds.join(','));
    navigate(`${returnUrl}${separator}${params.toString()}`);
  };

  const handleCancelSelection = () => {
    navigate(returnUrl);
  };

  const handleModalSuccess = () => {
    setEditModalVisible(false);
    setSelectedTechPoint(null);
    loadTechPoints();
  };

  const handleModalCancel = () => {
    setEditModalVisible(false);
    setSelectedTechPoint(null);
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadTechPoints();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '技术点名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: TechPoint) => (
        isSelectMode ? (
          <span style={{ cursor: 'pointer' }} onClick={(e) => handleViewDetail(record, e)}>
            {text}
          </span>
        ) : (
          <Button
            type="link"
            onClick={() => handleViewDetail(record)}
            style={{ padding: 0 }}
          >
            {text}
          </Button>
        )
      ),
    },
    {
      title: '技术领域',
      dataIndex: 'category_id',
      key: 'category',
      width: 150,
      render: (categoryId: number) => {
        const category = techCategories.find(c => c.id === categoryId);
        return category ? <Tag color="blue">{category.name}</Tag> : '-';
      },
    },
    {
      title: '技术类型',
      dataIndex: 'tech_type',
      key: 'tech_type',
      width: 120,
      render: (type: TechType) => {
        const typeMap: Record<TechType, { label: string; color: string }> = {
          feature: { label: '功能特性', color: 'green' },
          improvement: { label: '改进优化', color: 'blue' },
          innovation: { label: '创新技术', color: 'purple' },
          technology: { label: '核心技术', color: 'red' },
        };
        const typeInfo = typeMap[type] || { label: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.label}</Tag>;
      },
    },
    {
      title: '关联技术IP',
      dataIndex: 'technology_id',
      key: 'technology_id',
      width: 150,
      render: (technologyId: number | undefined) => {
        if (!technologyId) {
          return <Tag color="default">未关联</Tag>;
        }
        const technology = technologies.find(tech => tech.id === technologyId);
        return technology ? (
          <Tag color="blue">{technology.name}</Tag>
        ) : (
          <Tag color="default">未关联</Tag>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: TechPriority) => {
        const priorityMap: Record<TechPriority, { label: string; color: string }> = {
          low: { label: '低', color: 'default' },
          medium: { label: '中', color: 'orange' },
          high: { label: '高', color: 'red' },
        };
        const priorityInfo = priorityMap[priority] || { label: priority, color: 'default' };
        return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TechStatus) => {
        const statusMap: Record<TechStatus, { label: string; color: string }> = {
          draft: { label: '草稿', color: 'default' },
          active: { label: '启用', color: 'green' },
          inactive: { label: '禁用', color: 'orange' },
          archived: { label: '归档', color: 'red' },
        };
        const statusInfo = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => {
        return date ? new Date(date).toLocaleString('zh-CN') : '-';
      },
    },
    ...(!isSelectMode ? [{
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: TechPoint) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个技术点吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
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
        </Space>
      ),
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <HomeNavigationBar currentPath={location.pathname} />
      
      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <h2 style={{ margin: 0 }}>
                {isSelectMode ? '选择技术点' : '技术点管理'}
                {isSelectMode && selectedTechPointIds.length > 0 && (
                  <span style={{ marginLeft: 12, fontSize: 14, color: '#666', fontWeight: 'normal' }}>
                    已选择 {selectedTechPointIds.length} 个
                  </span>
                )}
              </h2>
            </Col>
            <Col>
              <Space>
                {isSelectMode ? (
                  <>
                    <Button onClick={handleCancelSelection}>
                      取消
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleConfirmSelection}
                      disabled={selectedTechPointIds.length === 0}
                    >
                      确认选择 ({selectedTechPointIds.length})
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      icon={<SyncOutlined />}
                      onClick={() => setSyncModalVisible(true)}
                    >
                      同步技术点
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreate}
                    >
                      新增技术点
                    </Button>
                  </>
                )}
              </Space>
            </Col>
          </Row>
        </div>

        {/* 搜索和筛选 */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="搜索技术点名称、描述..."
                  allowClear
                  value={searchKeyword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchKeyword(value);
                    if (!value) {
                      handleSearch('');
                    }
                  }}
                  onPressEnter={(e) => {
                    handleSearch((e.target as HTMLInputElement).value);
                  }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => handleSearch(searchKeyword)}
                >
                  搜索
                </Button>
              </Space.Compact>
            </Col>
            <Col span={4}>
              <Select
                placeholder="技术领域"
                allowClear
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={(value) => {
                  setCategoryFilter(value);
                  handleFilterChange();
                }}
              >
                {Array.isArray(techCategories) && techCategories.map(category => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="技术类型"
                allowClear
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  handleFilterChange();
                }}
              >
                <Select.Option value="feature">功能特性</Select.Option>
                <Select.Option value="improvement">改进优化</Select.Option>
                <Select.Option value="innovation">创新技术</Select.Option>
                <Select.Option value="technology">核心技术</Select.Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: '100%' }}
                value={priorityFilter}
                onChange={(value) => {
                  setPriorityFilter(value);
                  handleFilterChange();
                }}
              >
                <Select.Option value="low">低</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="high">高</Select.Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                allowClear
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  handleFilterChange();
                }}
              >
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
                <Select.Option value="archived">归档</Select.Option>
              </Select>
            </Col>
            <Col span={2}>
              <Button
                onClick={() => {
                  setSearchKeyword('');
                  setCategoryFilter(undefined);
                  setTypeFilter(undefined);
                  setPriorityFilter(undefined);
                  setStatusFilter(undefined);
                  // 重置后会自动触发 useEffect 重新加载数据
                }}
              >
                重置
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 技术点列表 */}
        <Table
          columns={columns}
          dataSource={techPoints}
          rowKey="id"
          loading={loading}
          rowSelection={isSelectMode ? {
            selectedRowKeys: selectedTechPointIds,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedTechPointIds(selectedRowKeys as number[]);
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
              if (selected) {
                const allIds = techPoints.map(tp => tp.id);
                setSelectedTechPointIds(allIds);
              } else {
                setSelectedTechPointIds([]);
              }
            },
          } : undefined}
          onRow={isSelectMode ? (record) => ({
            onClick: (event) => {
              // 如果点击的是复选框，不处理（由复选框自己处理）
              if (event.target instanceof HTMLElement && event.target.closest('.ant-checkbox-wrapper, .ant-checkbox')) {
                return;
              }
              toggleSelectTechPoint(record.id);
            },
            style: { cursor: 'pointer' }
          }) : undefined}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 编辑/创建模态框 */}
      <TechPointEditModal
        visible={editModalVisible}
        techPoint={selectedTechPoint}
        technology={null}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />

      {/* 同步技术点模态框 */}
      <TechPointSyncModal
        visible={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        onSuccess={() => {
          setSyncModalVisible(false);
          // 重新加载技术点列表
          loadTechPoints();
        }}
      />
      </div>
    </div>
  );
};

export default TechPointLibraryPage;
