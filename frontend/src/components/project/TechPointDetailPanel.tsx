import React, { useState, useEffect, useMemo } from 'react';
import { X, Package } from 'lucide-react';
import { BookOutlined, CarOutlined, CalendarOutlined, FileImageOutlined, FileOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Card, Descriptions, Tag, Space, Empty, Spin, Typography, Divider, Row, Col, Image, Modal } from 'antd';
import { TechPoint } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
import { knowledgePointService } from '../../services/knowledgePointService';
import type { KnowledgePoint } from '../../types/knowledgePoint';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TechPointDetailPanelProps {
  techPoint: TechPoint;
  projectId?: number;
  onClose?: () => void;
  onSave?: () => void;
}

interface AssociatedContent {
  packagingMaterials?: any[];
  promotionStrategies?: any[];
  pressReleases?: any[];
  speeches?: any[];
  resources?: any[];
}

interface ParsedDescription {
  principle: string;
  value: string;
  boundary: string;
  highlights: string[];
  evidenceMeasured: string[];
  evidenceCertified: string[];
  evidenceComparison: string[];
}

const TechPointDetailPanel: React.FC<TechPointDetailPanelProps> = ({
  techPoint,
  onClose
}) => {
  const [currentTechPoint, setCurrentTechPoint] = useState<TechPoint>(techPoint);
  const [loading, setLoading] = useState(false);
  const [associatedContent, setAssociatedContent] = useState<AssociatedContent>({
    packagingMaterials: [],
    promotionStrategies: [],
    pressReleases: [],
    speeches: [],
    resources: [],
  });
  const [associatedCarModels, setAssociatedCarModels] = useState<any[]>([]);
  const [associatedResources, setAssociatedResources] = useState<any[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [technologyName, setTechnologyName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTechPoint(techPoint);
    fetchTechPointData();
  }, [techPoint.id]);

  const fetchTechPointData = async () => {
    try {
      setLoading(true);
      const response = await techPointService.getTechPointById(techPoint.id);
      if (response.success && response.data) {
        setCurrentTechPoint(response.data);
        await Promise.all([fetchAssociatedData(), fetchTechnologyInfo(), fetchCategoryInfo()]);
      }
    } catch (error) {
      console.error('加载技术点数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnologyInfo = async () => {
    const techId = currentTechPoint.technology_id;
    if (!techId) {
      setTechnologyName(null);
      return;
    }
    // 技术IP功能暂未实现，后续可以添加
    setTechnologyName(null);
  };

  const fetchCategoryInfo = async () => {
    const categoryId = currentTechPoint.category_id;
    if (!categoryId) {
      setCategoryName(null);
      return;
    }

    try {
      const response = await techPointService.getTechCategories();
      if (response.success && response.data) {
        const categories = Array.isArray(response.data) ? response.data : [];
        const category = categories.find((cat: any) => cat.id === categoryId);
        setCategoryName(category ? category.name : null);
      } else {
        setCategoryName(null);
      }
    } catch (error) {
      console.error('获取技术领域信息失败:', error);
      setCategoryName(null);
    }
  };

  const parsedDescription = useMemo<ParsedDescription>(() => {
    const result: ParsedDescription = {
      principle: '',
      value: '',
      boundary: '',
      highlights: [],
      evidenceMeasured: [],
      evidenceCertified: [],
      evidenceComparison: [],
    };

    if (!currentTechPoint.description) return result;

    const lines = currentTechPoint.description.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('原理：')) {
        result.principle = line.replace('原理：', '').trim();
        continue;
      }
      if (line.includes('价值：')) {
        result.value = line.replace('价值：', '').trim();
        continue;
      }
      if (line.includes('适用边界：')) {
        result.boundary = line.replace('适用边界：', '').trim();
        continue;
      }
      if (line.includes('亮点：')) {
        currentSection = 'highlights';
        continue;
      }
      if (line.includes('实测：')) {
        currentSection = 'evidenceMeasured';
        continue;
      }
      if (line.includes('认证：')) {
        currentSection = 'evidenceCertified';
        continue;
      }
      if (line.includes('对比：')) {
        currentSection = 'evidenceComparison';
        continue;
      }

      if (line.startsWith('- ')) {
        const item = line.substring(2).trim();
        if (currentSection === 'highlights' && result.highlights.length < 5) {
          result.highlights.push(item);
        } else if (currentSection === 'evidenceMeasured' && result.evidenceMeasured.length < 5) {
          result.evidenceMeasured.push(item);
        } else if (currentSection === 'evidenceCertified' && result.evidenceCertified.length < 5) {
          result.evidenceCertified.push(item);
        } else if (currentSection === 'evidenceComparison' && result.evidenceComparison.length < 5) {
          result.evidenceComparison.push(item);
        }
        continue;
      }
    }

    return result;
  }, [currentTechPoint.description]);

  const fetchAssociatedData = async () => {
    try {
      const [contentResult, carModelsResult, knowledgePointsResult] = await Promise.allSettled([
        techPointService.getTechPointAssociatedContent(currentTechPoint.id),
        techPointService.getTechPointAssociatedCarModels(currentTechPoint.id),
        knowledgePointService.getByTechPointId(currentTechPoint.id, { pageSize: 100 }),
      ]);

      if (contentResult.status === 'fulfilled' && contentResult.value.success && contentResult.value.data) {
        const contentData = contentResult.value.data as AssociatedContent;
        setAssociatedContent(contentData);
        if (contentData.resources) {
          setAssociatedResources(contentData.resources);
        }
      } else {
        setAssociatedContent({
          packagingMaterials: [],
          promotionStrategies: [],
          pressReleases: [],
          speeches: [],
          resources: [],
        });
        setAssociatedResources([]);
      }

      if (carModelsResult.status === 'fulfilled' && carModelsResult.value.success && carModelsResult.value.data) {
        setAssociatedCarModels(carModelsResult.value.data);
      } else {
        setAssociatedCarModels([]);
      }

      if (knowledgePointsResult.status === 'fulfilled' && knowledgePointsResult.value.success) {
        const response = knowledgePointsResult.value;
        let kpData: KnowledgePoint[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            kpData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            kpData = response.data.data;
          }
        }
        setKnowledgePoints(kpData);
      } else {
        setKnowledgePoints([]);
      }
    } catch (err) {
      console.error('获取关联数据失败:', err);
      setAssociatedContent({
        packagingMaterials: [],
        promotionStrategies: [],
        pressReleases: [],
        speeches: [],
        resources: [],
      });
      setAssociatedCarModels([]);
      setAssociatedResources([]);
      setKnowledgePoints([]);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '未知';
    try {
      const date = dayjs(dateString);
      if (!date.isValid()) return '未知';
      return date.format('YYYY/MM/DD');
    } catch (error) {
      console.error('日期格式化失败:', error);
      return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'blue';
      case 'improvement':
        return 'cyan';
      case 'innovation':
        return 'purple';
      case 'technology':
        return 'geekblue';
      default:
        return 'default';
    }
  };

  const renderKnowledgePoints = () => {
    if (knowledgePoints && knowledgePoints.length > 0) {
      const groupedByTitle: Record<string, KnowledgePoint[]> = {};
      knowledgePoints.forEach(kp => {
        let title = kp.title || '未分类';
        const titleMatch = title.match(/^(.+?)\s+\d+$/);
        if (titleMatch) {
          title = titleMatch[1];
        }
        
        if (!groupedByTitle[title]) {
          groupedByTitle[title] = [];
        }
        groupedByTitle[title].push(kp);
      });

      const titleOrder = ['技术原理', '价值', '适用边界', '技术亮点', '实测证据', '认证证据', '对比证据'];
      const sortedTitles = Object.keys(groupedByTitle).sort((a, b) => {
        const indexA = titleOrder.indexOf(a);
        const indexB = titleOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

      return (
        <div className="space-y-3">
          {sortedTitles.map((title) => {
            const kps = groupedByTitle[title];
            return (
              <div key={title}>
                <Text strong className="text-sm">- {title}：</Text>
                <div className="ml-4 mt-1">
                  {kps.length === 1 ? (
                    <Text className="text-sm whitespace-pre-wrap">{kps[0].content}</Text>
                  ) : (
                    kps.map((kp, index) => (
                      <div key={kp.id || index} className="mb-1">
                        <Text className="text-sm whitespace-pre-wrap">{kp.content}</Text>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const principle = currentTechPoint.technical_details?.tech_principle || 
                     currentTechPoint.tech_principle || 
                     parsedDescription.principle || '';
    const value = currentTechPoint.technical_details?.tech_value || 
                 currentTechPoint.tech_value || 
                 parsedDescription.value || '';
    const boundary = currentTechPoint.technical_details?.tech_boundary || 
                    currentTechPoint.tech_boundary || 
                    parsedDescription.boundary || '';
    const highlights = currentTechPoint.technical_details?.highlights || 
                      currentTechPoint.highlights || 
                      parsedDescription.highlights || [];
    const evidenceMeasured = currentTechPoint.technical_details?.evidence_measured || 
                            currentTechPoint.evidence_measured || 
                            parsedDescription.evidenceMeasured || [];
    const evidenceCertified = currentTechPoint.technical_details?.evidence_certified || 
                             currentTechPoint.evidence_certified || 
                             parsedDescription.evidenceCertified || [];
    const evidenceComparison = currentTechPoint.technical_details?.evidence_comparison || 
                              currentTechPoint.evidence_comparison || 
                              parsedDescription.evidenceComparison || [];

    const hasAnyData = principle || value || boundary || 
                      (Array.isArray(highlights) && highlights.length > 0) || 
                      (Array.isArray(evidenceMeasured) && evidenceMeasured.length > 0) || 
                      (Array.isArray(evidenceCertified) && evidenceCertified.length > 0) || 
                      (Array.isArray(evidenceComparison) && evidenceComparison.length > 0);

    if (!hasAnyData) {
      return <Empty description="暂无知识点" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div className="space-y-3">
        {principle && (
          <div>
            <Text strong className="text-sm">- 技术原理：</Text>
            <div className="ml-4 mt-1">
              <Text className="text-sm">{principle}</Text>
            </div>
          </div>
        )}

        {value && (
          <div>
            <Text strong className="text-sm">- 价值：</Text>
            <div className="ml-4 mt-1">
              <Text className="text-sm">{value}</Text>
            </div>
          </div>
        )}

        {boundary && (
          <div>
            <Text strong className="text-sm">- 适用边界：</Text>
            <div className="ml-4 mt-1">
              <Text className="text-sm">{boundary}</Text>
            </div>
          </div>
        )}

        {Array.isArray(highlights) && highlights.length > 0 && (
          <div>
            <Text strong className="text-sm">- 技术亮点：</Text>
            <div className="ml-4 mt-1">
              {highlights.map((item: string, index: number) => (
                <div key={index} className="mb-1">
                  <Text className="text-sm">{item}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(evidenceMeasured) && evidenceMeasured.length > 0 && (
          <div>
            <Text strong className="text-sm">- 实测证据：</Text>
            <div className="ml-4 mt-1">
              {evidenceMeasured.map((item: string, index: number) => (
                <div key={index} className="mb-1">
                  <Text className="text-sm">{item}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(evidenceCertified) && evidenceCertified.length > 0 && (
          <div>
            <Text strong className="text-sm">- 认证证据：</Text>
            <div className="ml-4 mt-1">
              {evidenceCertified.map((item: string, index: number) => (
                <div key={index} className="mb-1">
                  <Text className="text-sm">{item}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(evidenceComparison) && evidenceComparison.length > 0 && (
          <div>
            <Text strong className="text-sm">- 对比证据：</Text>
            <div className="ml-4 mt-1">
              {evidenceComparison.map((item: string, index: number) => (
                <div key={index} className="mb-1">
                  <Text className="text-sm">{item}</Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">技术点详情</h2>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
            <span className="ml-3 text-gray-500">加载中...</span>
          </div>
        ) : (
          <div className="max-w-4xl space-y-6">
            {/* 基本信息卡片 */}
            <Card title="基本信息" size="small" className="shadow-sm">
              {/* 名称字段 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">名称</label>
                <div className="text-base font-bold text-gray-900">{currentTechPoint.name}</div>
              </div>

              <Descriptions column={2} size="small">
                <Descriptions.Item label="技术领域">
                  {categoryName || currentTechPoint.category?.name || '未关联技术领域'}
                </Descriptions.Item>
                <Descriptions.Item label="技术IP">
                  {technologyName || '未关联技术IP'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <div className="flex items-center gap-2">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#9ca3af' }} />
                    {formatDate(currentTechPoint.created_at)}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  <div className="flex items-center gap-2">
                    <CalendarOutlined style={{ fontSize: '16px', color: '#9ca3af' }} />
                    {formatDate(currentTechPoint.updated_at)}
                  </div>
                </Descriptions.Item>
              </Descriptions>

              <Divider className="my-4" />

              {/* 基本信息字段 */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">技术类型</label>
                    <Tag color={getTypeColor(currentTechPoint.tech_type)}>{currentTechPoint.tech_type}</Tag>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                    <Tag color={getPriorityColor(currentTechPoint.priority)}>{currentTechPoint.priority}</Tag>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                    <Tag color={getStatusColor(currentTechPoint.status)}>{currentTechPoint.status}</Tag>
                  </div>
                </div>

                {currentTechPoint.description && (
                  <>
                    <Divider className="my-4" />
                    <div>
                      <Text strong className="block mb-2">完整描述</Text>
                      <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap break-words text-sm text-gray-700 leading-relaxed">
                        {currentTechPoint.description}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* 知识点记录卡片 */}
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <BookOutlined style={{ fontSize: '16px' }} />
                  <span>知识点记录</span>
                </div>
              }
              size="small"
              className="shadow-sm"
            >
              {renderKnowledgePoints()}
            </Card>

            {/* 关联车型卡片 */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <CarOutlined style={{ fontSize: '16px' }} />
                  <span>关联车型</span>
                </div>
              }
              size="small"
              className="shadow-sm"
            >
              {associatedCarModels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {associatedCarModels.map((carModel: any) => {
                    const brandName = carModel.brand_name?.trim();
                    const modelName = carModel.name?.trim() || '未知车型';
                    const displayName = brandName && brandName !== '' 
                      ? `${brandName} ${modelName}` 
                      : modelName;
                    
                    return (
                      <Tag key={carModel.id} color="blue">
                        {displayName}
                      </Tag>
                    );
                  })}
                </div>
              ) : (
                <Empty description="暂无关联车型" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {/* 关联资源卡片 */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileImageOutlined style={{ fontSize: '16px' }} />
                  <span>关联资源</span>
                </div>
              }
              size="small"
              className="shadow-sm"
            >
              {associatedResources.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {associatedResources.map((resource: any) => {
                    let attachments: any[] = [];
                    if (resource.attachments) {
                      if (typeof resource.attachments === 'string') {
                        try {
                          attachments = JSON.parse(resource.attachments);
                        } catch (e) {
                          console.error('解析附件失败:', e);
                        }
                      } else if (Array.isArray(resource.attachments)) {
                        attachments = resource.attachments;
                      }
                    }

                    if (attachments.length === 0) {
                      return (
                        <Col key={resource.id} xs={12} sm={8} md={6} lg={4}>
                          <Card
                            hoverable
                            size="small"
                            bodyStyle={{ padding: '8px', textAlign: 'center' }}
                          >
                            <FileOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                            <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {resource.name || '未命名资源'}
                            </div>
                          </Card>
                        </Col>
                      );
                    }

                    return attachments.map((attachment: any, index: number) => {
                      const getFileUrl = (url: string) => {
                        if (url.startsWith('http')) return url;
                        if (url.startsWith('/')) return url;
                        return `/${url}`;
                      };

                      const isImage = attachment.mimeType?.startsWith('image/') || 
                                     attachment.type?.startsWith('image/') ||
                                     resource.type === '产品素材';
                      const isVideo = attachment.mimeType?.startsWith('video/') || 
                                     attachment.type?.startsWith('video/') ||
                                     resource.type === '实拍视频';
                      const fileUrl = getFileUrl(attachment.url || attachment.file_url || '');

                      return (
                        <Col key={`${resource.id}-${index}`} xs={12} sm={8} md={6} lg={4}>
                          <Card
                            hoverable
                            size="small"
                            bodyStyle={{ padding: '8px' }}
                            onClick={() => {
                              if (isImage) {
                                Modal.info({
                                  title: attachment.name || resource.name,
                                  width: 800,
                                  content: (
                                    <Image
                                      src={fileUrl}
                                      alt={attachment.name || resource.name}
                                      style={{ width: '100%' }}
                                      preview={{
                                        mask: '查看大图'
                                      }}
                                    />
                                  ),
                                  okText: '关闭',
                                });
                              } else if (isVideo) {
                                Modal.info({
                                  title: attachment.name || resource.name,
                                  width: 800,
                                  content: (
                                    <video
                                      src={fileUrl}
                                      style={{ width: '100%' }}
                                      controls
                                    />
                                  ),
                                  okText: '关闭',
                                });
                              } else {
                                window.open(fileUrl, '_blank');
                              }
                            }}
                          >
                            <div style={{ 
                              aspectRatio: '16/9', 
                              backgroundColor: '#f5f5f5', 
                              marginBottom: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              {isImage ? (
                                <Image
                                  src={fileUrl}
                                  alt={attachment.name || resource.name}
                                  preview={false}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : isVideo ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <video
                                    src={fileUrl}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    preload="metadata"
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'rgba(0,0,0,0.5)',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <VideoCameraOutlined style={{ fontSize: '20px', color: '#fff' }} />
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <FileOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                    {attachment.mimeType?.includes('pdf') ? 'PDF' :
                                     attachment.mimeType?.includes('word') || attachment.mimeType?.includes('document') ? 'Word' :
                                     attachment.mimeType?.includes('excel') || attachment.mimeType?.includes('spreadsheet') ? 'Excel' :
                                     attachment.mimeType?.includes('powerpoint') || attachment.mimeType?.includes('presentation') ? 'PowerPoint' :
                                     '文档'}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              textAlign: 'center'
                            }}>
                              {attachment.name || resource.name || '未命名'}
                            </div>
                          </Card>
                        </Col>
                      );
                    });
                  })}
                </Row>
              ) : (
                <Empty description="暂无关联资源" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechPointDetailPanel;
