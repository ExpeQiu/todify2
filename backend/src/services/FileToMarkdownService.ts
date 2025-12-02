import fs from 'fs';
import path from 'path';
import { logger } from '@/shared/lib/logger';

/**
 * 文件转Markdown服务
 * 将PDF、Word、PPT、TXT、Markdown等文件转换为Markdown格式
 */
export class FileToMarkdownService {
  /**
   * 将文件转换为Markdown格式
   * @param filePath 文件路径
   * @param mimeType 文件MIME类型
   * @param originalName 原始文件名
   * @returns Markdown格式的文本内容
   */
  async convertToMarkdown(
    filePath: string,
    mimeType: string,
    originalName: string
  ): Promise<string> {
    try {
      const fileExtension = path.extname(originalName).toLowerCase();
      
      // 根据文件类型选择转换方法
      if (mimeType === 'application/pdf' || fileExtension === '.pdf') {
        return await this.convertPdfToMarkdown(filePath, originalName);
      } else if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === '.doc' ||
        fileExtension === '.docx'
      ) {
        return await this.convertWordToMarkdown(filePath, originalName);
      } else if (
        mimeType === 'application/vnd.ms-powerpoint' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        fileExtension === '.ppt' ||
        fileExtension === '.pptx'
      ) {
        return await this.convertPptToMarkdown(filePath, originalName);
      } else if (
        mimeType === 'text/plain' ||
        mimeType === 'text/markdown' ||
        fileExtension === '.txt' ||
        fileExtension === '.md' ||
        fileExtension === '.markdown'
      ) {
        return await this.convertTextToMarkdown(filePath, originalName);
      } else {
        logger.warn('不支持的文件类型，返回空内容', { mimeType, fileExtension, originalName });
        return `# ${originalName}\n\n不支持的文件类型: ${mimeType}`;
      }
    } catch (error) {
      logger.error('文件转Markdown失败', {
        filePath,
        mimeType,
        originalName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 转换PDF为Markdown
   */
  private async convertPdfToMarkdown(filePath: string, originalName: string): Promise<string> {
    let parser: any = null;
    try {
      // 尝试使用pdf-parse库 (v2.x版本)
      let PDFParse: any;
      try {
        const pdfParseModule = require('pdf-parse');
        // pdf-parse 2.x版本：PDFParse是一个类，需要实例化
        PDFParse = pdfParseModule.PDFParse || pdfParseModule.default;
        
        // 检查是否是类/函数
        if (typeof PDFParse !== 'function') {
          logger.error('pdf-parse导入失败：PDFParse不是函数', { 
            type: typeof PDFParse,
            hasPDFParse: !!pdfParseModule.PDFParse,
            hasDefault: !!pdfParseModule.default,
            keys: Object.keys(pdfParseModule).slice(0, 5)
          });
          throw new Error('PDFParse 不是一个函数');
        }
      } catch (e) {
        logger.warn('pdf-parse库未安装或导入失败', { originalName, error: e });
        return `# ${originalName}\n\nPDF文件内容提取需要安装pdf-parse库。\n请运行: npm install pdf-parse`;
      }

      // 读取文件为buffer
      const dataBuffer = fs.readFileSync(filePath);
      
      // 使用pdf-parse v2 API：创建实例并调用getText()
      parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      
      // 清理资源
      if (parser && typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      
      const markdown = `# ${originalName}\n\n${result.text || ''}`;
      logger.info('PDF转Markdown成功', { originalName, textLength: result.text?.length || 0 });
      return markdown;
    } catch (error) {
      // 确保清理资源
      if (parser && typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (destroyError) {
          logger.warn('清理PDF解析器资源失败', { error: destroyError });
        }
      }
      
      logger.error('PDF转Markdown失败', {
        filePath,
        originalName,
        error: error instanceof Error ? error.message : String(error),
      });
      return `# ${originalName}\n\nPDF文件解析失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * 转换Word为Markdown
   */
  private async convertWordToMarkdown(filePath: string, originalName: string): Promise<string> {
    try {
      // 尝试使用mammoth库
      let mammoth: any;
      try {
        const mammothModule = require('mammoth');
        // mammoth可能是默认导出或命名导出
        mammoth = mammothModule.default || mammothModule;
        
        // 检查是否有extractRawText方法
        if (!mammoth || typeof mammoth.extractRawText !== 'function') {
          throw new Error('mammoth.extractRawText 不是一个函数');
        }
      } catch (e) {
        logger.warn('mammoth库未安装或导入失败', { originalName, error: e });
        return `# ${originalName}\n\nWord文件内容提取需要安装mammoth库。\n请运行: npm install mammoth`;
      }

      const result = await mammoth.extractRawText({ path: filePath });
      const markdown = `# ${originalName}\n\n${result.value || ''}`;
      logger.info('Word转Markdown成功', { originalName, textLength: result.value?.length || 0 });
      return markdown;
    } catch (error) {
      logger.error('Word转Markdown失败', {
        filePath,
        originalName,
        error: error instanceof Error ? error.message : String(error),
      });
      return `# ${originalName}\n\nWord文件解析失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * 转换PPT为Markdown
   */
  private async convertPptToMarkdown(filePath: string, originalName: string): Promise<string> {
    try {
      // PPT转换比较复杂，可以使用officegen或其他库
      // 这里先返回一个占位符，提示需要安装相应库
      logger.warn('PPT转Markdown功能需要额外库支持', { originalName });
      return `# ${originalName}\n\nPPT文件内容提取功能正在开发中。\n当前版本暂不支持PPT文件的文本提取。`;
    } catch (error) {
      logger.error('PPT转Markdown失败', {
        filePath,
        originalName,
        error: error instanceof Error ? error.message : String(error),
      });
      return `# ${originalName}\n\nPPT文件解析失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * 转换文本文件为Markdown
   */
  private async convertTextToMarkdown(filePath: string, originalName: string): Promise<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileExtension = path.extname(originalName).toLowerCase();
      
      // 如果已经是markdown文件，直接返回
      if (fileExtension === '.md' || fileExtension === '.markdown') {
        return content;
      }
      
      // 普通文本文件，添加标题
      const markdown = `# ${originalName}\n\n${content}`;
      logger.info('文本转Markdown成功', { originalName, textLength: content.length });
      return markdown;
    } catch (error) {
      logger.error('文本转Markdown失败', {
        filePath,
        originalName,
        error: error instanceof Error ? error.message : String(error),
      });
      return `# ${originalName}\n\n文本文件读取失败: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

export const fileToMarkdownService = new FileToMarkdownService();

