import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { documentService, type DocumentData } from '@/services/documentService';

type SaveDocumentVariables = {
  title: string;
  content: string;
  id?: string;
};

type ExportFormat = 'pdf' | 'html';

type ExportDocumentVariables = {
  title: string;
  content: string;
  format?: ExportFormat;
};

export const useSaveDocumentMutation = () =>
  useMutation<DocumentData, Error, SaveDocumentVariables>({
    mutationFn: async (variables) => {
      return documentService.saveDocument({
        id: variables.id,
        title: variables.title,
        content: variables.content,
      });
    },
    onSuccess: (data) => {
      toast.success('文档保存成功', {
        description: `"${data.title}" 已保存到本地存储`,
      });
    },
    onError: (error) => {
      toast.error('文档保存失败', {
        description: error.message || '保存文档时发生错误，请重试',
      });
    },
  });

export const useExportDocumentMutation = () =>
  useMutation<void, Error, ExportDocumentVariables>({
    mutationFn: async ({ title, content, format = 'pdf' }) => {
      if (format === 'html') {
        documentService.exportToHTML(title, content);
        return;
      }

      await documentService.exportToPDF(title, content);
    },
    onSuccess: (_, variables) => {
      const formatLabel = variables.format === 'html' ? 'HTML' : 'PDF';
      toast.success('文档导出成功', {
        description: `"${variables.title}" 已导出为 ${formatLabel} 格式`,
      });
    },
    onError: (error) => {
      toast.error('文档导出失败', {
        description: error.message || '导出文档时发生错误，请重试',
      });
    },
  });
