import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight"; // 移除代码高亮，避免干扰Markdown渲染
import {
  Save,
  Download,
  Edit3,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { InlineLoading } from "./LoadingSpinner";

interface StandaloneDocumentEditorProps {
  initialContent?: string;
  title?: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onContentChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave?: (content: string, title: string) => void;
  onExportPDF?: (content: string, title: string) => void;
}

/**
 * 独立的文档编辑器组件
 * 内置所有样式，不依赖外部CSS文件
 * 专门用于解决样式冲突问题
 */
const StandaloneDocumentEditor: React.FC<StandaloneDocumentEditorProps> = ({
  initialContent = "",
  title: initialTitle = "未命名文档",
  isEditing: externalIsEditing,
  onToggleEdit,
  onContentChange,
  onSave,
  onExportPDF,
}) => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [internalIsEditing, setInternalIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当props发生变化时，更新内部状态
  React.useEffect(() => {
    console.log('StandaloneDocumentEditor: initialContent changed:', initialContent.substring(0, 100) + '...');
    setContent(initialContent);
  }, [initialContent]);

  React.useEffect(() => {
    console.log('StandaloneDocumentEditor: title changed:', initialTitle);
    setTitle(initialTitle);
  }, [initialTitle]);

  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(content, title);
      if (externalIsEditing === undefined) {
        setInternalIsEditing(false);
      }
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!onExportPDF) return;

    setIsExporting(true);
    try {
      await onExportPDF(content, title);
    } catch (error) {
      console.error("导出PDF失败:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (onContentChange) {
      onContentChange(e);
    }
  };

  // 内联样式定义
  const editorStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      backgroundColor: '#ffffff',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    title: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontSize: '20px',
      fontWeight: 600,
      color: '#111827',
      backgroundColor: 'transparent',
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    buttonBase: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s',
    },
    buttonPrimary: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    buttonSecondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    buttonSuccess: {
      backgroundColor: '#10b981',
      color: 'white',
    },
    toolbar: {
      display: 'flex',
      gap: '16px',
      padding: '12px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
    },
    toolbarGroup: {
      display: 'flex',
      gap: '4px',
    },
    textarea: {
      width: '100%',
      minHeight: 'calc(100vh - 200px)',
      padding: '20px',
      border: 'none',
      outline: 'none',
      fontSize: '16px',
      lineHeight: '1.7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
      color: '#1f2937',
      backgroundColor: '#ffffff',
      resize: 'vertical' as const,
    },
    preview: {
      padding: '40px',
      minHeight: 'calc(100vh - 200px)',
      maxWidth: '100%',
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      wordWrap: 'break-word' as const,
      wordBreak: 'break-word' as const,
      backgroundColor: '#ffffff',
      color: '#1f2937',
      fontSize: '16px',
      lineHeight: '1.8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
  };

  // Markdown 渲染样式
  const markdownStyles = {
    '*': {
      color: '#1f2937 !important' as any,
      backgroundColor: 'transparent !important' as any,
    },
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      marginTop: '0',
      marginBottom: '16px',
      color: '#111827',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '8px',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      marginTop: '32px',
      marginBottom: '12px',
      color: '#111827',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '4px',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginTop: '24px',
      marginBottom: '8px',
      color: '#374151',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      marginTop: '20px',
      marginBottom: '8px',
      color: '#374151',
    },
    'p, li': {
      marginBottom: '12px',
      color: '#1f2937',
    },
    'ul, ol': {
      marginLeft: '24px',
      marginBottom: '16px',
    },
    strong: {
      fontWeight: 600,
      color: '#111827',
    },
    code: {
      backgroundColor: '#f3f4f6',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.9em',
      fontFamily: 'Monaco, "Courier New", monospace',
      color: '#dc2626',
    },
    'pre code': {
      backgroundColor: '#1f2937',
      color: '#f3f4f6',
      padding: '16px',
      borderRadius: '8px',
      display: 'block',
      overflowX: 'auto',
    },
    blockquote: {
      borderLeft: '4px solid #3b82f6',
      paddingLeft: '16px',
      marginLeft: 0,
      color: '#6b7280',
      fontStyle: 'italic',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '16px',
    },
    'th, td': {
      border: '1px solid #e5e7eb',
      padding: '8px 12px',
      textAlign: 'left' as const,
    },
    th: {
      backgroundColor: '#f9fafb',
      fontWeight: 600,
      color: '#374151',
    },
  };

  return (
    <div style={editorStyles.container} id="standalone-document-editor">
      <style dangerouslySetInnerHTML={{__html: `
        #standalone-document-editor {
          background: white !important;
        }
        #standalone-document-editor * {
          color: #1f2937 !important;
        }
      `}} />
      <div style={editorStyles.header}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={editorStyles.title}
          placeholder="输入文档标题..."
        />
        <div style={editorStyles.actions}>
          <button
            onClick={() => {
              if (onToggleEdit) {
                onToggleEdit();
              } else {
                setInternalIsEditing(!internalIsEditing);
              }
            }}
            style={{
              ...editorStyles.buttonBase,
              ...(isEditing ? {
                backgroundColor: '#3b82f6',
                color: 'white'
              } : editorStyles.buttonSecondary)
            }}
          >
            <Edit3 size={16} />
            {isEditing ? "预览" : "编辑"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              ...editorStyles.buttonBase,
              ...editorStyles.buttonPrimary,
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? (
              <InlineLoading size="sm" text="保存中..." />
            ) : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              ...editorStyles.buttonBase,
              ...editorStyles.buttonSuccess,
              opacity: isExporting ? 0.6 : 1
            }}
          >
            {isExporting ? (
              <InlineLoading size="sm" text="导出中..." />
            ) : (
              <>
                <Download size={16} />
                导出PDF
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          style={editorStyles.textarea}
          placeholder="请输入markdown格式的内容..."
        />
        ) : (
        <div style={editorStyles.preview} id="standalone-markdown-preview">
          <style dangerouslySetInnerHTML={{__html: `
            #standalone-markdown-preview {
              background: white !important;
              max-width: 100% !important;
              overflow-x: auto !important;
              word-wrap: break-word !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
            }
          `}} />
          <style>{`
            .standalone-markdown-preview {
              max-width: 100%;
              overflow-x: auto;
              word-wrap: break-word;
              word-break: break-word;
              overflow-wrap: break-word;
              color: #1f2937;
            }
            .standalone-markdown-preview h1 {
              font-size: 2.25rem !important;
              font-weight: 700 !important;
              margin-top: 0;
              margin-bottom: 16px !important;
              color: #111827 !important;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
              max-width: 100%;
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: block !important;
            }
            .standalone-markdown-preview h2 {
              font-size: 1.875rem !important;
              font-weight: 700 !important;
              margin-top: 32px !important;
              margin-bottom: 12px !important;
              color: #111827 !important;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 4px;
              display: block !important;
            }
            .standalone-markdown-preview h3 {
              font-size: 1.5rem !important;
              font-weight: 600 !important;
              margin-top: 24px !important;
              margin-bottom: 8px !important;
              color: #374151 !important;
              display: block !important;
            }
            .standalone-markdown-preview h4 {
              font-size: 1.25rem !important;
              font-weight: 600 !important;
              margin-top: 20px !important;
              margin-bottom: 8px !important;
              color: #374151 !important;
              display: block !important;
            }
            .standalone-markdown-preview p {
              margin-bottom: 12px !important;
              color: #1f2937 !important;
              max-width: 100%;
              word-wrap: break-word;
              overflow-wrap: break-word;
              display: block !important;
            }
            .standalone-markdown-preview li {
              margin-bottom: 6px;
              color: #1f2937 !important;
              display: list-item !important;
            }
            .standalone-markdown-preview ul, .standalone-markdown-preview ol {
              margin-left: 24px !important;
              margin-bottom: 16px !important;
              padding-left: 24px;
              display: block !important;
            }
            .standalone-markdown-preview ul {
              list-style-type: disc !important;
            }
            .standalone-markdown-preview ol {
              list-style-type: decimal !important;
            }
            .standalone-markdown-preview strong {
              font-weight: 600 !important;
              color: #111827 !important;
              display: inline !important;
            }
            .standalone-markdown-preview em {
              font-style: italic !important;
              display: inline !important;
            }
            .standalone-markdown-preview code {
              background-color: #f3f4f6 !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
              font-size: 0.9em !important;
              font-family: Monaco, "Courier New", monospace !important;
              color: #dc2626 !important;
              display: inline !important;
            }
            .standalone-markdown-preview pre {
              background-color: #1f2937;
              color: #f3f4f6;
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
              margin-bottom: 16px;
            }
            .standalone-markdown-preview pre code {
              background-color: transparent;
              color: #f3f4f6;
              padding: 0;
            }
            .standalone-markdown-preview blockquote {
              border-left: 4px solid #3b82f6;
              padding-left: 16px;
              margin-left: 0;
              color: #6b7280;
              font-style: italic;
            }
            .standalone-markdown-preview table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            .standalone-markdown-preview th, .standalone-markdown-preview td {
              border: 1px solid #e5e7eb;
              padding: 8px 12px;
              text-align: left;
            }
            .standalone-markdown-preview th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #374151;
            }
          `}</style>
          <div className="standalone-markdown-preview">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneDocumentEditor;

