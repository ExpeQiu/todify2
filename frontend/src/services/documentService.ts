import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DocumentData {
  id?: string;
  title: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class DocumentService {
  private readonly STORAGE_KEY = 'todify2_documents';

  // 保存文档到本地存储
  saveDocument(document: DocumentData): DocumentData {
    try {
      const documents = this.getAllDocuments();
      const now = new Date();
      
      if (document.id) {
        // 更新现有文档
        const index = documents.findIndex(doc => doc.id === document.id);
        if (index !== -1) {
          documents[index] = {
            ...document,
            updatedAt: now
          };
        }
      } else {
        // 创建新文档
        document.id = this.generateId();
        document.createdAt = now;
        document.updatedAt = now;
        documents.push(document);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
      return document;
    } catch (error) {
      console.error('保存文档失败:', error);
      throw new Error('保存文档失败');
    }
  }

  // 获取所有文档
  getAllDocuments(): DocumentData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取文档列表失败:', error);
      return [];
    }
  }

  // 根据ID获取文档
  getDocumentById(id: string): DocumentData | null {
    try {
      const documents = this.getAllDocuments();
      return documents.find(doc => doc.id === id) || null;
    } catch (error) {
      console.error('获取文档失败:', error);
      return null;
    }
  }

  // 删除文档
  deleteDocument(id: string): boolean {
    try {
      const documents = this.getAllDocuments();
      const filteredDocuments = documents.filter(doc => doc.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDocuments));
      return true;
    } catch (error) {
      console.error('删除文档失败:', error);
      return false;
    }
  }

  // 导出为PDF
  async exportToPDF(title: string, content: string): Promise<void> {
    try {
      // 创建临时容器来渲染HTML内容
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4宽度
      tempContainer.style.padding = '20mm';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#000';
      tempContainer.style.backgroundColor = '#fff';

      // 添加标题和内容
      tempContainer.innerHTML = `
        <h1 style="font-size: 24px; margin-bottom: 20px; text-align: center;">${title}</h1>
        <div>${content}</div>
      `;

      document.body.appendChild(tempContainer);

      // 使用html2canvas转换为图片
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // 移除临时容器
      document.body.removeChild(tempContainer);

      // 创建PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4宽度
      const pageHeight = 295; // A4高度
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页，添加更多页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 下载PDF
      const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('导出PDF失败:', error);
      throw new Error('导出PDF失败');
    }
  }

  // 导出为HTML文件
  exportToHTML(title: string, content: string): void {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2, h3 {
            color: #2c3e50;
        }
        p {
            margin: 10px 0;
        }
        ul, ol {
            margin: 10px 0;
            padding-left: 30px;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div>${content}</div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出HTML失败:', error);
      throw new Error('导出HTML失败');
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const documentService = new DocumentService();