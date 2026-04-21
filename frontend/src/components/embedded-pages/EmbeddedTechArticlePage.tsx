/**
 * 嵌入式技术通稿页面组件
 * 用于在项目资源页面中作为Tab内容显示
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, Button, Space, message, Row, Col, Tooltip, Alert, Empty } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import SourceSelector from '../tech-article/SourceSelector';
import MultiVersionArticleView from '../tech-article/MultiVersionArticleView';
import DialogueContent from '../ai-search/DialogueContent';
import { aiSearchService } from '../../services/aiSearchService';
import { Conversation } from '../../types/aiSearch';
import { MultiVersionArticle } from '../../types/techArticle';
import articleTypeService from '../../services/articleTypeService';

// 生成阶段状态
type GenerationPhase = 'idle' | 'collecting' | 'generating' | 'parsing' | 'done';

const PHASE_LABELS: Record<GenerationPhase, string> = {
  idle: '',
  collecting: '正在收集数据源...',
  generating: '正在调用AI生成通稿...',
  parsing: '正在解析生成结果...',
  done: '生成完成',
};

interface EmbeddedTechArticlePageProps {
  projectId: string;
  initialConversationIds?: string[];
}

const EmbeddedTechArticlePage: React.FC<EmbeddedTechArticlePageProps> = ({ projectId, initialConversationIds = [] }) => {
  const [selectedSources, setSelectedSources] = useState<{
    conversationIds: string[];
    outputIds: string[];
  }>({ conversationIds: [], outputIds: [] });
  const [articleTypes, setArticleTypes] = useState<string[]>(['media_release', 'internal_memo', 'social_media']);
  const [tone] = useState<string>('专业严谨');
  const [targetAudience] = useState<string>('媒体记者');
  const [generatedArticle, setGeneratedArticle] = useState<MultiVersionArticle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
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
    setGenerationPhase('collecting');
    
    try {
      // 阶段1: 收集数据（前端只是发送请求，后端负责收集）
      setGenerationPhase('generating');
      
      const result = await aiSearchService.aggregateTechArticle({
        conversationIds: selectedSources.conversationIds,
        outputIds: selectedSources.outputIds,
        articleTypes,
        tone,
        targetAudience,
      });

      // 阶段3: 解析结果
      setGenerationPhase('parsing');
      setGeneratedArticle(result);
      
      // 阶段4: 完成
      setGenerationPhase('done');
      message.success('技术通稿生成成功');
      
      setGenerationPhase('idle');
      
    } catch (error: any) {
      console.error('生成技术通稿失败:', error);
      message.error(error.message || '生成技术通稿失败');
      setGenerationPhase('idle');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 创建优化对话
  const ensureOptimizeConversation = async () => {
    if (!generatedArticle) return null;
    if (optimizeConversation) return optimizeConversation;

    try {
      const projectIdNum = parseInt(projectId);
      const conversation = await aiSearchService.createConversation({
        title: '技术通稿优化对话',
        sources: [],
        pageType: 'tech-article',
        projectId: !isNaN(projectIdNum) ? projectIdNum : undefined,
      });

      if (conversation) {
        // 构建友好的初始消息
        const articleSummary = [
          generatedArticle.mediaRelease?.title && `媒体通稿: ${generatedArticle.mediaRelease.title}`,
          generatedArticle.internalMemo?.title && `内部通报: ${generatedArticle.internalMemo.title}`,
          generatedArticle.socialMedia?.title && `社交媒体: ${generatedArticle.socialMedia.title}`,
        ].filter(Boolean).join('\n');
        
        await aiSearchService.sendMessage(conversation.id, {
          content: `我已经生成了技术通稿，包含以下版本：\n\n${articleSummary}\n\n请问有什么需要调整或优化的地方吗？`,
          sources: [],
        });
        const updatedConversation = await aiSearchService.getConversation(conversation.id);
        setOptimizeConversation(updatedConversation);
        return updatedConversation;
      }
    } catch (error) {
      console.error('创建优化对话失败:', error);
    }
    return null;
  };

  const handleEditVersion = (versionType: string, content: any) => {
    if (!generatedArticle) return;

    // 深拷贝当前文章
    const updated = JSON.parse(JSON.stringify(generatedArticle)) as MultiVersionArticle;
    
    // 根据版本类型更新对应内容
    if (versionType === 'media_release' && updated.mediaRelease) {
      // content 是 Markdown 字符串，需要解析回结构化数据
      updated.mediaRelease = parseMarkdownToArticle(content, 'media_release');
    } else if (versionType === 'internal_memo' && updated.internalMemo) {
      updated.internalMemo = parseMarkdownToArticle(content, 'internal_memo');
    } else if (versionType === 'social_media' && updated.socialMedia) {
      updated.socialMedia = parseMarkdownToSocialMedia(content);
    }
    
    setGeneratedArticle(updated);
    message.success('编辑内容已保存');
  };
  
  // 解析 Markdown 回结构化文章格式
  const parseMarkdownToArticle = (markdown: string, type: string): any => {
    const lines = markdown.split('\n');
    const result: any = {
      title: '',
      lead: '',
      body: {},
      conclusion: '',
    };
    
    let currentSection = '';
    let currentContent: string[] = [];
    
    const saveCurrentSection = () => {
      const content = currentContent.join('\n').trim();
      if (!content) return;
      
      switch (currentSection) {
        case 'title':
          result.title = content;
          break;
        case 'lead':
          result.lead = content;
          break;
        case 'techBackground':
          result.body.techBackground = content;
          break;
        case 'coreFeatures':
          result.body.coreFeatures = content;
          break;
        case 'techAdvantages':
          result.body.techAdvantages = content;
          break;
        case 'applicationScenarios':
          result.body.applicationScenarios = content;
          break;
        case 'marketSignificance':
          result.body.marketSignificance = content;
          break;
        case 'conclusion':
          result.conclusion = content;
          break;
      }
      currentContent = [];
    };
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        saveCurrentSection();
        currentSection = 'title';
        currentContent.push(line.slice(2));
      } else if (line.startsWith('**导语：**') || line.startsWith('**导语:**')) {
        saveCurrentSection();
        currentSection = 'lead';
        currentContent.push(line.replace(/\*\*导语[：:]\*\*\s*/, ''));
      } else if (line.startsWith('## 技术背景')) {
        saveCurrentSection();
        currentSection = 'techBackground';
      } else if (line.startsWith('## 核心功能')) {
        saveCurrentSection();
        currentSection = 'coreFeatures';
      } else if (line.startsWith('## 技术优势') || line.startsWith('## 数据支撑')) {
        saveCurrentSection();
        currentSection = 'techAdvantages';
      } else if (line.startsWith('## 应用场景')) {
        saveCurrentSection();
        currentSection = 'applicationScenarios';
      } else if (line.startsWith('## 市场意义') || line.startsWith('## 竞品对比')) {
        saveCurrentSection();
        currentSection = 'marketSignificance';
      } else if (line.startsWith('**结语：**') || line.startsWith('**结语:**')) {
        saveCurrentSection();
        currentSection = 'conclusion';
        currentContent.push(line.replace(/\*\*结语[：:]\*\*\s*/, ''));
      } else if (line !== '---' && currentSection) {
        currentContent.push(line);
      }
    }
    saveCurrentSection();
    
    return result;
  };
  
  // 导出所有版本
  const handleExportAll = () => {
    if (!generatedArticle) return;
    
    let allContent = '';
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (generatedArticle.mediaRelease) {
      allContent += '# 媒体通稿\n\n';
      allContent += `## ${generatedArticle.mediaRelease.title || '无标题'}\n\n`;
      if (generatedArticle.mediaRelease.lead) {
        allContent += `**导语：** ${generatedArticle.mediaRelease.lead}\n\n`;
      }
      const body = generatedArticle.mediaRelease.body;
      if (body?.techBackground) allContent += `### 技术背景\n\n${body.techBackground}\n\n`;
      if (body?.coreFeatures) allContent += `### 核心功能\n\n${body.coreFeatures}\n\n`;
      if (body?.techAdvantages) allContent += `### 技术优势\n\n${body.techAdvantages}\n\n`;
      if (body?.applicationScenarios) allContent += `### 应用场景\n\n${body.applicationScenarios}\n\n`;
      if (body?.marketSignificance) allContent += `### 市场意义\n\n${body.marketSignificance}\n\n`;
      if (generatedArticle.mediaRelease.conclusion) {
        allContent += `**结语：** ${generatedArticle.mediaRelease.conclusion}\n\n`;
      }
      allContent += '---\n\n';
    }
    
    if (generatedArticle.internalMemo) {
      allContent += '# 内部通报\n\n';
      allContent += `## ${generatedArticle.internalMemo.title || '无标题'}\n\n`;
      const body = generatedArticle.internalMemo.body;
      if (body?.techBackground) allContent += `### 技术细节\n\n${body.techBackground}\n\n`;
      if (body?.techAdvantages) allContent += `### 数据支撑\n\n${body.techAdvantages}\n\n`;
      if (body?.marketSignificance) allContent += `### 竞品对比\n\n${body.marketSignificance}\n\n`;
      allContent += '---\n\n';
    }
    
    if (generatedArticle.socialMedia) {
      allContent += '# 社交媒体版本\n\n';
      allContent += `## ${generatedArticle.socialMedia.title || '无标题'}\n\n`;
      if (generatedArticle.socialMedia.highlights?.length) {
        allContent += '### 关键亮点\n\n';
        generatedArticle.socialMedia.highlights.forEach(h => {
          allContent += `- ${h}\n`;
        });
        allContent += '\n';
      }
      if (generatedArticle.socialMedia.hashtags?.length) {
        allContent += '### 话题标签\n\n';
        allContent += generatedArticle.socialMedia.hashtags.map(t => `#${t}`).join(' ') + '\n\n';
      }
    }
    
    // 下载文件
    const blob = new Blob([allContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `技术通稿全部版本_${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  // 解析 Markdown 回社交媒体格式
  const parseMarkdownToSocialMedia = (markdown: string): any => {
    const result: any = {
      title: '',
      highlights: [],
      hashtags: [],
    };
    
    const lines = markdown.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        result.title = line.slice(2).trim();
        currentSection = 'title';
      } else if (line.startsWith('## 关键亮点')) {
        currentSection = 'highlights';
      } else if (line.startsWith('## 话题标签')) {
        currentSection = 'hashtags';
      } else if (line.startsWith('- ') && currentSection === 'highlights') {
        result.highlights.push(line.slice(2).trim());
      } else if (currentSection === 'hashtags' && line.includes('#')) {
        // 提取所有 hashtag
        const tags = line.match(/#[\w\u4e00-\u9fa5]+/g);
        if (tags) {
          result.hashtags.push(...tags.map(t => t.slice(1)));
        }
      }
    }
    
    return result;
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#f5f5f5', padding: '24px' }}>
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>技术通稿智能生成</h2>
          </div>

          <Row gutter={16} align="top">
            <Col xs={24} xl={10}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <SourceSelector
                  projectId={projectId}
                  initialConversationIds={initialConversationIds}
                  onSelectionChange={handleSelectionChange}
                />

                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={selectedSources.conversationIds.length === 0 && selectedSources.outputIds.length === 0}
                  block
                >
                  {isGenerating ? PHASE_LABELS[generationPhase] || '生成中...' : '生成技术通稿'}
                </Button>
              </Space>
            </Col>

            <Col xs={24} xl={14}>
              <Card title="优化模式" size="small" style={{ marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <Alert
                      message="通过对话优化通稿内容，并在下方实时编辑版本"
                      type="info"
                      showIcon
                      style={{ marginBottom: 0 }}
                    />
                  </Space>
                  <Space>
                    <Tooltip title="重新生成（保留当前配置）">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setOptimizeConversation(null);
                          message.info('已清空优化会话，可重新生成');
                        }}
                      >
                        重新生成
                      </Button>
                    </Tooltip>
                    <Tooltip title="导出所有版本">
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleExportAll}
                        disabled={!generatedArticle}
                      >
                        导出全部
                      </Button>
                    </Tooltip>
                    <Tooltip title="清除并重新开始">
                      <Button
                        icon={<ClearOutlined />}
                        danger
                        onClick={() => {
                          setGeneratedArticle(null);
                          setOptimizeConversation(null);
                          message.info('已清除，可重新选择数据源');
                        }}
                      >
                        清除
                      </Button>
                    </Tooltip>
                  </Space>
                </Space>
              </Card>

              {generatedArticle ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card
                    title="AI 优化助手"
                    size="small"
                    style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ flex: 1, overflow: 'hidden', padding: 0 }}
                  >
                    <DialogueContent
                      conversation={optimizeConversation}
                      sources={[]}
                      contextWindowSize={10}
                      dialogueTitle=""
                      pageType="tech-article"
                      onEnsureConversation={ensureOptimizeConversation}
                    />
                  </Card>
                  <div style={{ maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
                    <MultiVersionArticleView
                      article={generatedArticle}
                      onEdit={handleEditVersion}
                    />
                  </div>
                </Space>
              ) : (
                <Card>
                  <Empty description="请先在左侧选择信息源并生成技术通稿" />
                </Card>
              )}
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default EmbeddedTechArticlePage;

