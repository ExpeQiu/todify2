/**
 * 嵌入式技术通稿页面组件
 * 用于在项目资源页面中作为Tab内容显示
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Button, Space, message, Radio, Select, Row, Col } from 'antd';
import { ThunderboltOutlined, MessageOutlined } from '@ant-design/icons';
import SourceSelector from '../tech-article/SourceSelector';
import MultiVersionArticleView from '../tech-article/MultiVersionArticleView';
import DialogueContent from '../ai-search/DialogueContent';
import { aiSearchService } from '../../services/aiSearchService';
import { Conversation } from '../../types/aiSearch';
import { MultiVersionArticle } from '../../types/techArticle';
import articleTypeService, { ArticleType } from '../../services/articleTypeService';

const { Option } = Select;

type ViewMode = 'generate' | 'optimize';

// 默认文章类型（API 失败时的后备）
const DEFAULT_ARTICLE_TYPES: ArticleType[] = [
  { id: '1', code: 'media_release', name: '媒体通稿', enabled: 1, sort_order: 1 },
  { id: '2', code: 'internal_memo', name: '内部通报', enabled: 1, sort_order: 2 },
  { id: '3', code: 'social_media', name: '社交媒体', enabled: 1, sort_order: 3 },
];

interface EmbeddedTechArticlePageProps {
  projectId: string;
}

const EmbeddedTechArticlePage: React.FC<EmbeddedTechArticlePageProps> = ({ projectId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [selectedSources, setSelectedSources] = useState<{
    conversationIds: string[];
    outputIds: string[];
  }>({ conversationIds: [], outputIds: [] });
  const [availableArticleTypes, setAvailableArticleTypes] = useState<ArticleType[]>(DEFAULT_ARTICLE_TYPES);
  const [articleTypes, setArticleTypes] = useState<string[]>(['media_release', 'internal_memo', 'social_media']);
  const [tone, setTone] = useState<string>('专业严谨');
  const [targetAudience, setTargetAudience] = useState<string>('媒体记者');
  const [generatedArticle, setGeneratedArticle] = useState<MultiVersionArticle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizeConversation, setOptimizeConversation] = useState<Conversation | null>(null);
  
  // 防止重复加载的标志
  const articleTypesLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  // 加载文章类型配置（带防重复机制）
  useEffect(() => {
    // 如果已加载或正在加载，跳过
    if (articleTypesLoadedRef.current || loadingRef.current) {
      return;
    }
    
    const loadArticleTypes = async () => {
      loadingRef.current = true;
      try {
        const response = await articleTypeService.getAll(true);
        if (response.success && response.data && response.data.length > 0) {
          setAvailableArticleTypes(response.data);
          const enabledCodes = response.data.map(t => t.code);
          setArticleTypes(enabledCodes);
          articleTypesLoadedRef.current = true;
        }
        // 如果返回空或失败，保持默认值
      } catch (error) {
        console.error('加载文章类型配置失败:', error);
        // 保持默认值，不需要额外处理
      } finally {
        loadingRef.current = false;
      }
    };
    loadArticleTypes();
  }, []);

  const handleSelectionChange = useCallback((selection: {
    conversationIds: string[];
    outputIds: string[];
  }) => {
    setSelectedSources(selection);
  }, []);

  const handleGenerate = async () => {
    if (selectedSources.conversationIds.length === 0 && selectedSources.outputIds.length === 0) {
      message.warning('请至少选择一个对话或输出内容');
      return;
    }

    if (articleTypes.length === 0) {
      message.warning('请至少选择一种文章类型');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiSearchService.aggregateTechArticle({
        conversationIds: selectedSources.conversationIds,
        outputIds: selectedSources.outputIds,
        articleTypes,
        tone,
        targetAudience,
      });

      setGeneratedArticle(result);
      setViewMode('optimize');
      
      // 创建优化对话，关联项目ID
      const projectIdNum = parseInt(projectId);
      const conversation = await aiSearchService.createConversation({
        title: '技术通稿优化对话',
        sources: [],
        pageType: 'tech-article',
        projectId: !isNaN(projectIdNum) ? projectIdNum : undefined,
      });

      // 发送初始消息，包含生成的通稿内容
      if (conversation) {
        await aiSearchService.sendMessage(conversation.id, {
          content: `请帮我优化以下技术通稿内容。\n\n${JSON.stringify(result, null, 2)}`,
          sources: [],
        });
        const updatedConversation = await aiSearchService.getConversation(conversation.id);
        setOptimizeConversation(updatedConversation);
      }

      message.success('技术通稿生成成功');
    } catch (error: any) {
      console.error('生成技术通稿失败:', error);
      message.error(error.message || '生成技术通稿失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditVersion = (versionType: string, content: any) => {
    if (!generatedArticle) return;

    // 更新对应版本的内容
    const updated = { ...generatedArticle };
    setGeneratedArticle(updated);
    message.info('编辑内容已保存，可继续通过对话优化');
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f5f5f5', padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>技术通稿智能生成</h2>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="generate">
                <ThunderboltOutlined /> 生成模式
              </Radio.Button>
              <Radio.Button value="optimize">
                <MessageOutlined /> 优化模式
              </Radio.Button>
            </Radio.Group>
          </div>

          {viewMode === 'generate' ? (
            <>
              <Row gutter={16}>
                <Col span={24}>
                  <SourceSelector projectId={projectId} onSelectionChange={handleSelectionChange} />
                </Col>
              </Row>

              <Card size="small" title="生成配置">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <strong>文章类型：</strong>
                    <Select
                      mode="multiple"
                      value={articleTypes}
                      onChange={(values) => setArticleTypes(values)}
                      style={{ width: '100%', marginTop: 8 }}
                      placeholder="请选择文章类型"
                    >
                      {availableArticleTypes.map((type) => (
                        <Option key={type.id} value={type.code}>
                          {type.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <strong>语气风格：</strong>
                    <Select
                      value={tone}
                      onChange={setTone}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      <Option value="专业严谨">专业严谨</Option>
                      <Option value="通俗易懂">通俗易懂</Option>
                      <Option value="创新前沿">创新前沿</Option>
                      <Option value="权威可信">权威可信</Option>
                      <Option value="亲和友好">亲和友好</Option>
                    </Select>
                  </div>
                  <div>
                    <strong>目标受众：</strong>
                    <Select
                      value={targetAudience}
                      onChange={setTargetAudience}
                      style={{ width: '100%', marginTop: 8 }}
                    >
                      <Option value="媒体记者">媒体记者</Option>
                      <Option value="行业专家">行业专家</Option>
                      <Option value="技术开发者">技术开发者</Option>
                      <Option value="普通消费者">普通消费者</Option>
                      <Option value="投资者">投资者</Option>
                      <Option value="合作伙伴">合作伙伴</Option>
                    </Select>
                  </div>
                </Space>
              </Card>

              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
                loading={isGenerating}
                disabled={selectedSources.conversationIds.length === 0 && selectedSources.outputIds.length === 0}
                block
              >
                生成技术通稿
              </Button>

              {generatedArticle && (
                <MultiVersionArticleView
                  article={generatedArticle}
                  onEdit={handleEditVersion}
                />
              )}
            </>
          ) : (
            <>
              {generatedArticle ? (
                <Row gutter={16}>
                  <Col span={16}>
                    <DialogueContent
                      conversation={optimizeConversation}
                      sources={[]}
                      contextWindowSize={10}
                      dialogueTitle="内容优化助手"
                      pageType="tech-article"
                      onEnsureConversation={async () => {
                        if (!optimizeConversation) {
                          const projectIdNum = parseInt(projectId);
                          const conv = await aiSearchService.createConversation({
                            title: '技术通稿优化对话',
                            sources: [],
                            pageType: 'tech-article',
                            projectId: !isNaN(projectIdNum) ? projectIdNum : undefined,
                          });
                          if (conv) {
                            const updated = await aiSearchService.getConversation(conv.id);
                            setOptimizeConversation(updated);
                            return updated;
                          }
                        }
                        return optimizeConversation;
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <MultiVersionArticleView
                      article={generatedArticle}
                      onEdit={handleEditVersion}
                    />
                  </Col>
                </Row>
              ) : (
                <Card>
                  <p>请先生成技术通稿</p>
                  <Button onClick={() => setViewMode('generate')}>返回生成模式</Button>
                </Card>
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EmbeddedTechArticlePage;

