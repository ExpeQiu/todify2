import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Edit2, Sparkles } from 'lucide-react';
import { BookOutlined, CarOutlined, CalendarOutlined, FileImageOutlined, FileOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Card, Descriptions, Tag, Space, Empty, Spin, Typography, Divider, Row, Col, Image, Modal, message } from 'antd';
import { TechPoint } from '../../types/techPoint';
import { techPointService } from '../../services/techPointService';
import { knowledgePointService } from '../../services/knowledgePointService';
import type { KnowledgePoint } from '../../types/knowledgePoint';
import TechPointEditModal from '../techPoint/TechPointEditModal';
import sourceService from '../../services/sourceService';
import { workflowAPI } from '../../services/api';
import configService from '../../services/configService';
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
  projectId,
  onClose,
  onSave
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTechPoint, setCurrentTechPoint] = useState<TechPoint>(techPoint);
  const [loading, setLoading] = useState(false);
  const [aiMining, setAiMining] = useState(false);
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

  const handleEditSuccess = async () => {
    setEditModalVisible(false);
    message.success('保存成功');
    await fetchTechPointData();
    onSave?.();
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
  };

  // AI挖掘功能
  const handleAIMining = async () => {
    if (!projectId) {
      message.warning('项目ID不存在，无法进行AI挖掘');
      return;
    }

    setAiMining(true);
    try {
      // 1. 获取项目的AI共创信息
      const sourcesResult = await sourceService.loadSourceInformationByProjectId(projectId);
      const sources = sourcesResult.success && sourcesResult.data ? sourcesResult.data : [];

      if (sources.length === 0) {
        message.warning('当前项目暂无AI共创信息，无法进行挖掘');
        setAiMining(false);
        return;
      }

      // 2. 合并所有AI共创信息的内容
      const aiContent = sources
        .map(s => {
          const title = s.title || '';
          const description = s.description || '';
          return `${title}\n${description}`;
        })
        .join('\n\n');

      // 3. 构建AI提示词，要求挖掘技术点信息
      const miningPrompt = `你是一个技术信息挖掘专家。请基于以下AI共创信息，挖掘并更新技术点的相关信息。

当前技术点信息：
- 名称：${currentTechPoint.name}
- 描述：${currentTechPoint.description || '暂无描述'}
- 技术类型：${currentTechPoint.tech_type}
- 优先级：${currentTechPoint.priority}
- 状态：${currentTechPoint.status}

AI共创信息：
${aiContent}

请根据AI共创信息，挖掘以下信息并生成JSON格式：

必需字段：
1. description: 技术描述（更新或补充，1-2句话概括，不超过500字）
2. technical_details: 技术细节（JSON对象，包含：
   - tech_principle: 技术原理说明
   - tech_value: 技术价值说明
   - tech_boundary: 技术边界说明
   - highlights: 技术亮点数组（最多5条，每条不超过200字）
   - evidence_measured: 实测证据数组（最多5条，每条不超过200字）
   - evidence_certified: 认证证据数组（最多5条，每条不超过200字）
   - evidence_comparison: 对比证据数组（最多5条，每条不超过200字）
）
3. benefits: 技术优势（字符串数组，列出3-5个关键优势，每个不超过100字）
4. applications: 应用场景（字符串数组，列出应用场景，每个不超过100字）
5. keywords: 关键词（字符串数组，提取3-8个关键词）

输出要求：
- 只返回JSON格式，不要包含任何markdown代码块标记或其他文字说明
- JSON必须是有效的，可以直接用JSON.parse()解析
- 如果某些信息无法从AI共创信息中挖掘，保留原有值或使用空值
- 所有数组字段必须是数组格式，即使为空也要使用[]
- technical_details必须是对象格式，即使为空也要使用{}

示例JSON格式：
{
  "description": "更新后的技术描述",
  "technical_details": {
    "tech_principle": "技术原理说明",
    "tech_value": "技术价值说明",
    "tech_boundary": "技术边界说明",
    "highlights": ["亮点1", "亮点2", "亮点3"],
    "evidence_measured": ["实测1", "实测2"],
    "evidence_certified": ["认证1", "认证2"],
    "evidence_comparison": ["对比1", "对比2"]
  },
  "benefits": ["优势1", "优势2", "优势3"],
  "applications": ["场景1", "场景2"],
  "keywords": ["关键词1", "关键词2", "关键词3"]
}

现在请分析AI共创信息并返回JSON：`;

      // 4. 调用AI进行挖掘
      const aiQAConfig = await configService.getDifyConfig('smart-workflow-ai-qa');
      const result = await workflowAPI.aiSearch(
        miningPrompt,
        { context: [{ role: 'user', content: miningPrompt }] },
        (aiQAConfig && aiQAConfig.enabled) ? aiQAConfig : undefined,
        undefined
      );

      if (result.success && result.data) {
        const aiResponse = result.data.answer || result.data.result || '';
        
        // 5. 解析AI返回的JSON
        let minedData: any = null;
        try {
          const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            minedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            minedData = JSON.parse(aiResponse);
          }
        } catch (parseError) {
          console.error('解析AI返回的JSON失败:', parseError);
          message.error('AI挖掘完成，但JSON解析失败，请重试');
          setAiMining(false);
          return;
        }

        // 6. 合并挖掘的数据到现有技术点
        const updateData: any = {};
        
        if (minedData.description) {
          updateData.description = minedData.description;
        }
        
        if (minedData.technical_details) {
          // 合并technical_details
          const existingDetails = currentTechPoint.technical_details || {};
          updateData.technical_details = {
            ...existingDetails,
            ...minedData.technical_details
          };
        }
        
        if (minedData.benefits && Array.isArray(minedData.benefits)) {
          updateData.benefits = minedData.benefits;
        }
        
        if (minedData.applications && Array.isArray(minedData.applications)) {
          updateData.applications = minedData.applications;
        }
        
        if (minedData.keywords && Array.isArray(minedData.keywords)) {
          updateData.keywords = minedData.keywords;
        }

        // 7. 更新技术点
        const updateResponse = await techPointService.updateTechPoint(currentTechPoint.id, updateData);
        
        if (updateResponse.success) {
          message.success('AI挖掘完成，技术点信息已更新');
          await fetchTechPointData();
          onSave?.();
        } else {
          message.error(updateResponse.error || '更新技术点失败');
        }
      } else {
        message.error(result.error || 'AI挖掘失败，请重试');
      }
    } catch (error) {
      console.error('AI挖掘失败:', error);
      message.error(`AI挖掘失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setAiMining(false);
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
          {projectId && (
            <button
              onClick={handleAIMining}
              disabled={aiMining}
              className="px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${aiMining ? 'animate-spin' : ''}`} />
              {aiMining ? '挖掘中...' : 'AI挖掘'}
            </button>
          )}
          <button
            onClick={() => setEditModalVisible(true)}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            编辑
          </button>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">名称</label>
                  <div className="text-base text-gray-900">{currentTechPoint.name}</div>
                </div>

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

      {/* 编辑模态框 */}
      <TechPointEditModal
        visible={editModalVisible}
        techPoint={currentTechPoint}
        technology={null}
        onCancel={handleEditCancel}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default TechPointDetailPanel;
