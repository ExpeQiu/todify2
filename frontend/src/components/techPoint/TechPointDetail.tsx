import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Empty,
  Spin,
  Typography,
  Divider,
  List,
  Row,
  Col,
  Image,
  Dropdown,
  message,
} from 'antd';
import {
  BookOutlined,
  CarOutlined,
  CalendarOutlined,
  PlusOutlined,
  FileImageOutlined,
  FileOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { TechPoint } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const { Text } = Typography;

interface TechPointDetailProps {
  techPoint: TechPoint;
  onClose: () => void;
  onRefresh?: () => void;
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

const TechPointDetail: React.FC<TechPointDetailProps> = ({
  techPoint,
  onClose,
  onRefresh,
}) => {
  const [currentTechPoint, setCurrentTechPoint] = useState<TechPoint>(techPoint);
  const [associatedContent, setAssociatedContent] = useState<AssociatedContent>({
    packagingMaterials: [],
    promotionStrategies: [],
    pressReleases: [],
    speeches: [],
    resources: [],
  });
  const [associatedCarModels, setAssociatedCarModels] = useState<any[]>([]);
  const [associatedResources, setAssociatedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [technologyName, setTechnologyName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const detailContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTechPoint(techPoint);
    fetchTechPointData();
  }, [techPoint.id, techPoint.technology_id, techPoint.category_id]);

  const fetchTechPointData = async () => {
    try {
      const response = await techPointService.getTechPointById(techPoint.id);
      if (response.success && response.data) {
        setCurrentTechPoint(response.data);
        await Promise.all([fetchAssociatedData(), fetchTechnologyInfo(), fetchCategoryInfo()]);
      }
    } catch (error) {
      console.error('重新加载技术点数据失败:', error);
    }
  };

  useEffect(() => {
    fetchAssociatedData();
    fetchTechnologyInfo();
    fetchCategoryInfo();
  }, [currentTechPoint.id, currentTechPoint.technology_id, currentTechPoint.category_id]);

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
        // 确保 data 是数组
        const categories = Array.isArray(response.data) 
          ? response.data 
          : [];
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
    setLoading(true);
    setError(null);

    try {
      const [contentResult, carModelsResult] = await Promise.allSettled([
        techPointService.getTechPointAssociatedContent(currentTechPoint.id),
        techPointService.getTechPointAssociatedCarModels(currentTechPoint.id),
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
    } finally {
      setLoading(false);
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

  const handleExportToPDF = async () => {
    if (!detailContentRef.current) {
      message.warning('无法导出，请稍后再试');
      return;
    }

    setExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = detailContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = pdfWidth / imgWidth;
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      let heightLeft = imgScaledHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgScaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgScaledWidth, imgScaledHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `${currentTechPoint.name}_技术点详情_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      pdf.save(fileName);
      message.success('导出PDF成功');
    } catch (error) {
      console.error('导出PDF失败:', error);
      message.error('导出PDF失败，请稍后再试');
    } finally {
      setExporting(false);
    }
  };

  const handleExportToJSON = () => {
    try {
      const exportData = {
        ...currentTechPoint,
        technology_name: technologyName,
        category_name: categoryName,
        associated_car_models: associatedCarModels,
        associated_resources: associatedResources,
        export_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentTechPoint.name}_技术点详情_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('导出JSON成功');
    } catch (error) {
      console.error('导出JSON失败:', error);
      message.error('导出JSON失败，请稍后再试');
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: '导出PDF',
      icon: <FileOutlined />,
      onClick: handleExportToPDF,
    },
    {
      key: 'json',
      label: '导出JSON',
      icon: <FileOutlined />,
      onClick: handleExportToJSON,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>{currentTechPoint.name}</span>
          {currentTechPoint.tech_type && (
            <Tag color={getTypeColor(currentTechPoint.tech_type)}>{currentTechPoint.tech_type}</Tag>
          )}
          {currentTechPoint.priority && (
            <Tag color={getPriorityColor(currentTechPoint.priority)}>{currentTechPoint.priority}</Tag>
          )}
          <Tag color={getStatusColor(currentTechPoint.status)}>{currentTechPoint.status}</Tag>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={[
        <Dropdown key="export" menu={{ items: exportMenuItems }} trigger={['click']}>
          <Button icon={<DownloadOutlined />} loading={exporting}>
            导出
          </Button>
        </Dropdown>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={900}
      style={{ top: 20 }}
      styles={{
        body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' },
      }}
    >
      <div ref={detailContentRef}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>加载关联数据中...</div>
          </div>
        )}

      {error && (
        <div style={{ marginBottom: 16, padding: '12px', background: '#fff7e6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
          <Text type="warning">{error}</Text>
        </div>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="基本信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="技术领域">
              {categoryName || currentTechPoint.category?.name || '未关联技术领域'}
            </Descriptions.Item>
            <Descriptions.Item label="技术IP">
              {technologyName || '未关联技术IP'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              <Space>
                <CalendarOutlined />
                {formatDate(currentTechPoint.created_at)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              <Space>
                <CalendarOutlined />
                {formatDate(currentTechPoint.updated_at)}
              </Space>
            </Descriptions.Item>
          </Descriptions>

          {(parsedDescription.principle || parsedDescription.value || parsedDescription.boundary) && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>描述</Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {parsedDescription.principle && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>原理：</Text>
                      <Text style={{ fontSize: '14px', marginLeft: 8 }}>{parsedDescription.principle}</Text>
                    </div>
                  )}
                  {parsedDescription.value && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>价值：</Text>
                      <Text style={{ fontSize: '14px', marginLeft: 8 }}>{parsedDescription.value}</Text>
                    </div>
                  )}
                  {parsedDescription.boundary && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '14px' }}>适用边界：</Text>
                      <Text style={{ fontSize: '14px', marginLeft: 8 }}>{parsedDescription.boundary}</Text>
                    </div>
                  )}
                </Space>
              </div>
            </>
          )}

          {currentTechPoint.description && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>完整描述</Text>
                <div style={{
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.6',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  {currentTechPoint.description}
                </div>
              </div>
            </>
          )}
        </Card>

        <Card
          title={
            <Space>
              <BookOutlined />
              <span>知识点记录</span>
            </Space>
          }
          size="small"
        >
          {(() => {
            const getHighlights = () => {
              if (currentTechPoint.highlights) {
                return Array.isArray(currentTechPoint.highlights) 
                  ? currentTechPoint.highlights 
                  : (typeof currentTechPoint.highlights === 'string' ? JSON.parse(currentTechPoint.highlights) : []);
              }
              return parsedDescription.highlights || [];
            };
            
            const getEvidenceMeasured = () => {
              if (currentTechPoint.evidence_measured) {
                return Array.isArray(currentTechPoint.evidence_measured) 
                  ? currentTechPoint.evidence_measured 
                  : (typeof currentTechPoint.evidence_measured === 'string' ? JSON.parse(currentTechPoint.evidence_measured) : []);
              }
              return parsedDescription.evidenceMeasured || [];
            };
            
            const getEvidenceCertified = () => {
              if (currentTechPoint.evidence_certified) {
                return Array.isArray(currentTechPoint.evidence_certified) 
                  ? currentTechPoint.evidence_certified 
                  : (typeof currentTechPoint.evidence_certified === 'string' ? JSON.parse(currentTechPoint.evidence_certified) : []);
              }
              return parsedDescription.evidenceCertified || [];
            };
            
            const getEvidenceComparison = () => {
              if (currentTechPoint.evidence_comparison) {
                return Array.isArray(currentTechPoint.evidence_comparison) 
                  ? currentTechPoint.evidence_comparison 
                  : (typeof currentTechPoint.evidence_comparison === 'string' ? JSON.parse(currentTechPoint.evidence_comparison) : []);
              }
              return parsedDescription.evidenceComparison || [];
            };

            const principle = currentTechPoint.tech_principle || parsedDescription.principle || '';
            const value = currentTechPoint.tech_value || parsedDescription.value || '';
            const boundary = currentTechPoint.tech_boundary || parsedDescription.boundary || '';
            const highlights = getHighlights();
            const evidenceMeasured = getEvidenceMeasured();
            const evidenceCertified = getEvidenceCertified();
            const evidenceComparison = getEvidenceComparison();

            const hasAnyData = principle || value || boundary || 
                              (Array.isArray(highlights) && highlights.length > 0) || 
                              (Array.isArray(evidenceMeasured) && evidenceMeasured.length > 0) || 
                              (Array.isArray(evidenceCertified) && evidenceCertified.length > 0) || 
                              (Array.isArray(evidenceComparison) && evidenceComparison.length > 0);

            if (!hasAnyData) {
              return <Empty description="暂无知识点" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
            }

            return (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {principle && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 技术原理：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text style={{ fontSize: '14px' }}>{principle}</Text>
                    </div>
                  </div>
                )}

                {value && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 价值：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text style={{ fontSize: '14px' }}>{value}</Text>
                    </div>
                  </div>
                )}

                {boundary && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 适用边界：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      <Text style={{ fontSize: '14px' }}>{boundary}</Text>
                    </div>
                  </div>
                )}

                {Array.isArray(highlights) && highlights.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 技术亮点：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      {highlights.map((item: string, index: number) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: '14px' }}>{item}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(evidenceMeasured) && evidenceMeasured.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 实测证据：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      {evidenceMeasured.map((item: string, index: number) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: '14px' }}>{item}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(evidenceCertified) && evidenceCertified.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 认证证据：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      {evidenceCertified.map((item: string, index: number) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: '14px' }}>{item}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(evidenceComparison) && evidenceComparison.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>- 对比证据：</Text>
                    <div style={{ marginLeft: 16, marginTop: 4 }}>
                      {evidenceComparison.map((item: string, index: number) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: '14px' }}>{item}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Space>
            );
          })()}
        </Card>

        <Card
          title={
            <Space>
              <CarOutlined />
              <span>关联车型</span>
            </Space>
          }
          size="small"
        >
          {associatedCarModels.length > 0 ? (
            <Space wrap>
              {associatedCarModels.map((carModel: any) => (
                <Tag key={carModel.id} color="blue">
                  {carModel.name}
                </Tag>
              ))}
            </Space>
          ) : (
            <Empty description="暂无关联车型" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        <Card
          title={
            <Space>
              <FileImageOutlined />
              <span>关联资源</span>
            </Space>
          }
          size="small"
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
      </Space>
      </div>
    </Modal>
  );
};

export default TechPointDetail;
