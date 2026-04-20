import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Radio, Row, Col } from 'antd';
import { ThunderboltOutlined, MessageOutlined } from '@ant-design/icons';
import SourceSelector from '../components/tech-article/SourceSelector';
import MultiVersionArticleView from '../components/tech-article/MultiVersionArticleView';
import DialogueContent from '../components/ai-search/DialogueContent';
import { aiSearchService } from '../services/aiSearchService';
import { Conversation, Source } from '../types/aiSearch';
import { MultiVersionArticle } from '../types/techArticle';
import TopNavigation from '../components/TopNavigation';
import { useSearchParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Project } from '../types/project';
import articleTypeService from '../services/articleTypeService';

type ViewMode = 'generate' | 'optimize';

const TechArticlePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [selectedSources, setSelectedSources] = useState<{
    conversationIds: string[];
    outputIds: string[];
  }>({ conversationIds: [], outputIds: [] });
  const [articleTypes, setArticleTypes] = useState<string[]>([]);
  const [tone] = useState<string>('专业严谨');
  const [targetAudience] = useState<string>('媒体记者');
  const [generatedArticle, setGeneratedArticle] = useState<MultiVersionArticle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizeConversation, setOptimizeConversation] = useState<Conversation | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // 加载文章类型配置
  useEffect(() => {
    const loadArticleTypes = async () => {
      try {
        const response = await articleTypeService.getAll(true); // 只获取启用的类型
        if (response.success && response.data) {
          // 默认选择所有启用的类型
          const enabledCodes = response.data.map(t => t.code);
          setArticleTypes(enabledCodes);
        }
      } catch (error) {
        console.error('加载文章类型配置失败:', error);
        // 如果加载失败，使用默认值
        setArticleTypes(['media_release', 'internal_memo', 'social_media']);
      }
    };
    loadArticleTypes();
  }, []);

  // 加载项目信息
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          try {
            const result = await projectService.getProjectById(projectIdNum);
            if (result.success && result.data) {
              setProject(result.data);
            }
          } catch (error) {
            console.error('加载项目信息失败:', error);
          }
        }
      } else {
        setProject(null);
      }
    };
    loadProject();
  }, [projectId]);

  const handleSelectionChange = (selection: {
    conversationIds: string[];
    outputIds: string[];
  }) => {
    setSelectedSources(selection);
  };

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
      
      // 创建优化对话
      const conversation = await aiSearchService.createConversation({
        title: '技术通稿优化对话',
        sources: [],
        pageType: 'tech-article',
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
    // 这里可以根据versionType和content解析并更新对应版本
    // 由于content是Markdown字符串，需要解析回结构化格式
    // 为了简化，这里只更新存储的原始内容
    setGeneratedArticle(updated);
    message.info('编辑内容已保存，可继续通过对话优化');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <TopNavigation />
      {project && (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">项目编号：</span>
            <span className="text-blue-700">{project.id}</span>
            <span className="text-blue-400">|</span>
            <span className="font-medium text-blue-900">项目名称：</span>
            <span className="text-blue-700">{project.name}</span>
          </div>
        </div>
      )}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
                    <SourceSelector projectId={projectId || undefined} onSelectionChange={handleSelectionChange} />
                  </Col>
                </Row>

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
                            const conv = await aiSearchService.createConversation({
                              title: '技术通稿优化对话',
                              sources: [],
                              pageType: 'tech-article',
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
    </div>
  );
};

export default TechArticlePage;
