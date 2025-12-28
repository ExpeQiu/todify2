import { MultiAgentExecutionResult } from './MultiAgentExecutor';

/**
 * 导出格式
 */
export type ExportFormat = 'markdown' | 'docx' | 'pdf' | 'txt';

/**
 * 导出服务
 * 负责将生成的内容导出为不同格式
 */
export class ExportService {
  /**
   * 导出为Markdown
   */
  async exportToMarkdown(content: string, metadata?: any): Promise<string> {
    let markdown = '';

    // 添加元数据（如果提供）
    if (metadata) {
      markdown += '---\n';
      if (metadata.title) markdown += `title: ${metadata.title}\n`;
      if (metadata.author) markdown += `author: ${metadata.author}\n`;
      if (metadata.date) markdown += `date: ${metadata.date}\n`;
      markdown += '---\n\n';
    }

    markdown += content;

    return markdown;
  }

  /**
   * 导出为纯文本
   */
  async exportToText(content: string): Promise<string> {
    // 移除Markdown格式，转换为纯文本
    let text = content
      .replace(/^#+\s+/gm, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接
      .replace(/`([^`]+)`/g, '$1') // 移除代码标记
      .replace(/\n{3,}/g, '\n\n'); // 规范化换行

    return text;
  }

  /**
   * 导出为DOCX（简化版，返回Markdown格式，实际应该使用docx库）
   */
  async exportToDocx(content: string, metadata?: any): Promise<Buffer> {
    // TODO: 使用docx库生成真正的DOCX文件
    // 目前返回Markdown内容的Buffer作为占位
    const markdown = await this.exportToMarkdown(content, metadata);
    return Buffer.from(markdown, 'utf-8');
  }

  /**
   * 导出为PDF（简化版，实际应该使用PDF生成库）
   */
  async exportToPdf(content: string, metadata?: any): Promise<Buffer> {
    // TODO: 使用PDF生成库（如pdfkit或puppeteer）生成PDF
    // 目前返回Markdown内容的Buffer作为占位
    const markdown = await this.exportToMarkdown(content, metadata);
    return Buffer.from(markdown, 'utf-8');
  }

  /**
   * 导出内容
   */
  async export(
    execution: MultiAgentExecutionResult,
    format: ExportFormat,
    versionId?: string
  ): Promise<{ content: Buffer | string; mimeType: string; filename: string }> {
    let content: Buffer | string;
    let mimeType: string;
    let filename: string;

    // 获取要导出的内容
    const contentToExport = execution.finalOutput;
    const sceneName = execution.scene === 'tech-package' ? '技术包装' : 
                     execution.scene === 'tech-strategy' ? '技术策略' : '技术通稿';
    const timestamp = new Date().toISOString().split('T')[0];

    // 元数据
    const metadata = {
      title: `${sceneName}-${timestamp}`,
      date: new Date().toISOString(),
      scene: execution.scene
    };

    switch (format) {
      case 'markdown':
        content = await this.exportToMarkdown(contentToExport, metadata);
        mimeType = 'text/markdown';
        filename = `${sceneName}-${timestamp}.md`;
        break;

      case 'txt':
        content = await this.exportToText(contentToExport);
        mimeType = 'text/plain';
        filename = `${sceneName}-${timestamp}.txt`;
        break;

      case 'docx':
        content = await this.exportToDocx(contentToExport, metadata);
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${sceneName}-${timestamp}.docx`;
        break;

      case 'pdf':
        content = await this.exportToPdf(contentToExport, metadata);
        mimeType = 'application/pdf';
        filename = `${sceneName}-${timestamp}.pdf`;
        break;

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }

    return { content, mimeType, filename };
  }
}

