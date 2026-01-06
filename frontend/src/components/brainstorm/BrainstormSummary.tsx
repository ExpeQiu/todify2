import React, { useState } from 'react';
import { Copy, Check, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface BrainstormSummaryProps {
  summary: string;
  sessionTitle?: string;
}

export const BrainstormSummary: React.FC<BrainstormSummaryProps> = ({
  summary,
  sessionTitle = '讨论总结',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleExport = (format: 'txt' | 'md' = 'txt') => {
    let content = summary;
    let mimeType = 'text/plain;charset=utf-8';
    let extension = 'txt';
    let filename = `${sessionTitle}_总结_${new Date().toISOString().split('T')[0]}`;

    if (format === 'md') {
      content = `# ${sessionTitle} - 讨论总结\n\n${summary}`;
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>讨论总结</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </>
            )}
          </button>
          <div className="relative group">
            <button
              onClick={() => handleExport('txt')}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                导出为 TXT
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                导出为 Markdown
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="prose max-w-none">
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      </div>
    </div>
  );
};

