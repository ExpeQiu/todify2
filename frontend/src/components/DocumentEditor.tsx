import React, { useState, useRef } from 'react';
import { Save, Download, Edit3, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { InlineLoading } from './LoadingSpinner';
import './DocumentEditor.css';

interface DocumentEditorProps {
  initialContent?: string;
  title?: string;
  onSave?: (content: string, title: string) => void;
  onExportPDF?: (content: string, title: string) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialContent = '',
  title: initialTitle = '未命名文档',
  onSave,
  onExportPDF
}) => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(content, title);
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
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
      console.error('导出PDF失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="document-editor">
      <div className="editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="document-title"
          placeholder="输入文档标题..."
        />
        <div className="editor-actions">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn btn-secondary btn-sm ${isEditing ? 'btn-active' : ''}`}
            title="编辑模式"
          >
            <Edit3 size={16} />
            {isEditing ? '预览' : '编辑'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`btn btn-primary btn-sm ${isSaving ? 'btn-loading' : ''}`}
            title="保存文档"
          >
            {isSaving ? <InlineLoading size="sm" text="保存中..." /> : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`btn btn-success btn-sm ${isExporting ? 'btn-loading' : ''}`}
            title="导出PDF"
          >
            {isExporting ? <InlineLoading size="sm" text="导出中..." /> : (
              <>
                <Download size={16} />
                导出PDF
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => formatText('bold')}
              className="btn btn-ghost btn-xs"
              title="粗体"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => formatText('italic')}
              className="btn btn-ghost btn-xs"
              title="斜体"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => formatText('underline')}
              className="btn btn-ghost btn-xs"
              title="下划线"
            >
              <Underline size={14} />
            </button>
          </div>
          
          <div className="toolbar-group">
            <button
              onClick={() => formatText('justifyLeft')}
              className="btn btn-ghost btn-xs"
              title="左对齐"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => formatText('justifyCenter')}
              className="btn btn-ghost btn-xs"
              title="居中对齐"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => formatText('justifyRight')}
              className="btn btn-ghost btn-xs"
              title="右对齐"
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="toolbar-group">
            <button
              onClick={() => formatText('insertUnorderedList')}
              className="btn btn-ghost btn-xs"
              title="无序列表"
            >
              <List size={14} />
            </button>
            <select
              onChange={(e) => formatText('formatBlock', e.target.value)}
              className="input input-sm"
              defaultValue=""
            >
              <option value="">段落格式</option>
              <option value="h1">标题 1</option>
              <option value="h2">标题 2</option>
              <option value="h3">标题 3</option>
              <option value="p">正文</option>
            </select>
          </div>
        </div>
      )}

      <div className="editor-content">
        {isEditing ? (
          <div
            ref={editorRef}
            contentEditable
            className="content-editable"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleContentChange}
            onBlur={handleContentChange}
          />
        ) : (
          <div
            className="content-preview"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;