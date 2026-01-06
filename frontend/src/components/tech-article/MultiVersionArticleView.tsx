import React, { useState } from 'react';
import { Tabs, Card, Button, Space, Typography, message, Input, Tag } from 'antd';
import { CopyOutlined, DownloadOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MultiVersionArticle } from '../../types/techArticle';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface MultiVersionArticleViewProps {
  article: MultiVersionArticle;
  onEdit?: (versionType: string, content: any) => void;
}

export const MultiVersionArticleView: React.FC<MultiVersionArticleViewProps> = ({
  article,
  onEdit,
}) => {
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<any>(null);

  // 将文章版本转换为Markdown格式
  const versionToMarkdown = (version: any, type: string): string => {
    if (type === 'social_media') {
      const social = article.socialMedia;
      if (!social) return '';
      let md = `# ${social.title}\n\n`;
      if (social.highlights && social.highlights.length > 0) {
        md += '## 关键亮点\n\n';
        social.highlights.forEach((h) => {
          md += `- ${h}\n`;
        });
        md += '\n';
      }
      if (social.hashtags && social.hashtags.length > 0) {
        md += `## 话题标签\n\n`;
        social.hashtags.forEach((tag) => {
          md += `#${tag} `;
        });
        md += '\n';
      }
      return md;
    }

    // 媒体通稿和内部通报
    let md = '';
    if (version.title) {
      md += `# ${version.title}\n\n`;
    }
    if (version.lead) {
      md += `**导语：** ${version.lead}\n\n---\n\n`;
    }
    if (version.body) {
      if (version.body.techBackground) {
        md += `## 技术背景\n\n${version.body.techBackground}\n\n`;
      }
      if (version.body.coreFeatures) {
        md += `## 核心功能\n\n${version.body.coreFeatures}\n\n`;
      }
      if (version.body.techAdvantages) {
        md += `## 技术优势\n\n${version.body.techAdvantages}\n\n`;
      }
      if (version.body.applicationScenarios) {
        md += `## 应用场景\n\n${version.body.applicationScenarios}\n\n`;
      }
      if (version.body.marketSignificance) {
        md += `## 市场意义\n\n${version.body.marketSignificance}\n\n`;
      }
      // 内部通报特有的字段
      if (version.body.data_support) {
        md += `## 数据支撑\n\n${version.body.data_support}\n\n`;
      }
      if (version.body.competitive_analysis) {
        md += `## 竞品对比\n\n${version.body.competitive_analysis}\n\n`;
      }
    }
    if (version.conclusion) {
      md += `---\n\n**结语：** ${version.conclusion}\n`;
    }
    return md;
  };

  // 获取当前版本的内容
  const getCurrentVersionContent = (type: string): string => {
    if (type === 'media_release') {
      return versionToMarkdown(article.mediaRelease, type);
    }
    if (type === 'internal_memo') {
      return versionToMarkdown(article.internalMemo, type);
    }
    if (type === 'social_media') {
      return versionToMarkdown(article.socialMedia, type);
    }
    return '';
  };

  // 复制到剪贴板
  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success(`${type === 'media_release' ? '媒体通稿' : type === 'internal_memo' ? '内部通报' : '社交媒体版本'}已复制到剪贴板`);
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 下载为Markdown文件
  const handleDownload = (content: string, type: string) => {
    const typeName = type === 'media_release' ? '媒体通稿' : type === 'internal_memo' ? '内部通报' : '社交媒体';
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${typeName}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  // 开始编辑
  const handleStartEdit = (type: string) => {
    const content = getCurrentVersionContent(type);
    setEditingVersion(type);
    setEditedContent(content);
  };

  // 保存编辑
  const handleSaveEdit = (type: string) => {
    if (onEdit && editedContent !== null) {
      onEdit(type, editedContent);
    }
    setEditingVersion(null);
    setEditedContent(null);
    message.success('编辑已保存');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingVersion(null);
    setEditedContent(null);
  };

  // 渲染版本内容
  const renderVersionContent = (type: string) => {
    const content = editingVersion === type && editedContent !== null
      ? editedContent
      : getCurrentVersionContent(type);

    if (editingVersion === type) {
      return (
        <div>
          <TextArea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={20}
            style={{ fontFamily: 'monospace', marginBottom: 16 }}
          />
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleSaveEdit(type)}
            >
              保存
            </Button>
            <Button onClick={handleCancelEdit}>取消</Button>
          </Space>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px', backgroundColor: '#fff' }}>
        <div className="markdown-preview" style={{ color: '#1f2937' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '暂无内容'}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  // 计算字数
  const getWordCount = (content: string): number => {
    return content.replace(/\s+/g, '').length;
  };

  const activeTabs: string[] = [];
  if (article.mediaRelease) activeTabs.push('media_release');
  if (article.internalMemo) activeTabs.push('internal_memo');
  if (article.socialMedia) activeTabs.push('social_media');

  return (
    <Card
      title="多版本技术通稿"
      extra={
        <Space>
          {article.metadata?.tokenUsage && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              消耗Token: {article.metadata.tokenUsage.total}
            </Text>
          )}
        </Space>
      }
    >
      <Tabs defaultActiveKey={activeTabs[0]}>
        {article.mediaRelease && (
          <TabPane tab="媒体通稿" key="media_release">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  字数: {getWordCount(getCurrentVersionContent('media_release'))} 字
                </Text>
                <Space>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(getCurrentVersionContent('media_release'), 'media_release')}
                  >
                    复制
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(getCurrentVersionContent('media_release'), 'media_release')}
                  >
                    下载
                  </Button>
                  {editingVersion !== 'media_release' && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit('media_release')}
                    >
                      编辑
                    </Button>
                  )}
                </Space>
              </div>
              {renderVersionContent('media_release')}
            </Space>
          </TabPane>
        )}

        {article.internalMemo && (
          <TabPane tab="内部通报" key="internal_memo">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  字数: {getWordCount(getCurrentVersionContent('internal_memo'))} 字
                </Text>
                <Space>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(getCurrentVersionContent('internal_memo'), 'internal_memo')}
                  >
                    复制
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(getCurrentVersionContent('internal_memo'), 'internal_memo')}
                  >
                    下载
                  </Button>
                  {editingVersion !== 'internal_memo' && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit('internal_memo')}
                    >
                      编辑
                    </Button>
                  )}
                </Space>
              </div>
              {renderVersionContent('internal_memo')}
            </Space>
          </TabPane>
        )}

        {article.socialMedia && (
          <TabPane tab="社交媒体" key="social_media">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  字数: {getWordCount(getCurrentVersionContent('social_media'))} 字
                </Text>
                <Space>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(getCurrentVersionContent('social_media'), 'social_media')}
                  >
                    复制
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(getCurrentVersionContent('social_media'), 'social_media')}
                  >
                    下载
                  </Button>
                  {editingVersion !== 'social_media' && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit('social_media')}
                    >
                      编辑
                    </Button>
                  )}
                </Space>
              </div>
              {renderVersionContent('social_media')}
            </Space>
          </TabPane>
        )}
      </Tabs>

      {article.sourceReferences && article.sourceReferences.length > 0 && (
        <Card
          size="small"
          title="来源引用"
          style={{ marginTop: 16 }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {article.sourceReferences.map((ref, index) => (
              <div key={index}>
                <Tag color={ref.type === 'conversation' ? 'blue' : 'green'}>
                  {ref.type === 'conversation' ? '对话' : '输出'}
                </Tag>
                <Tag>{ref.pageType}</Tag>
                <Text strong>{ref.title}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {ref.summary.substring(0, 100)}...
                </Text>
              </div>
            ))}
          </Space>
        </Card>
      )}
    </Card>
  );
};

export default MultiVersionArticleView;

