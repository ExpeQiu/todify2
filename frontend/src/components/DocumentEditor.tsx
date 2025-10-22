import React, { useState, useRef } from "react";
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
import "./DocumentEditor.css";

interface DocumentEditorProps {
  initialContent?: string;
  title?: string;
  onSave?: (content: string, title: string) => void;
  onExportPDF?: (content: string, title: string) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialContent = "",
  title: initialTitle = "未命名文档",
  onSave,
  onExportPDF,
}) => {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(true); // 默认设置为编辑状态
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
    <div className="document-editor" data-oid="50wqsfd">
      <div className="editor-header" data-oid="sh50fgp">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="document-title"
          placeholder="输入文档标题..."
          data-oid="agchxr."
        />

        <div className="editor-actions" data-oid="fp87qt2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn btn-secondary btn-sm ${isEditing ? "btn-active" : ""}`}
            title="编辑模式"
            data-oid="8x:38w2"
          >
            <Edit3 size={16} data-oid="hgvgmkg" />
            {isEditing ? "预览" : "编辑"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`btn btn-primary btn-sm ${isSaving ? "btn-loading" : ""}`}
            title="保存文档"
            data-oid="tk2sy24"
          >
            {isSaving ? (
              <InlineLoading size="sm" text="保存中..." data-oid="y84rqbi" />
            ) : (
              <>
                <Save size={16} data-oid="0lueve:" />
                保存
              </>
            )}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`btn btn-success btn-sm ${isExporting ? "btn-loading" : ""}`}
            title="导出PDF"
            data-oid=":n:vu0j"
          >
            {isExporting ? (
              <InlineLoading size="sm" text="导出中..." data-oid="3kj0m1l" />
            ) : (
              <>
                <Download size={16} data-oid="ms2t17k" />
                导出PDF
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="editor-toolbar" data-oid="jb_6qmy">
          <div className="toolbar-group" data-oid="i1ip5r-">
            <button
              onClick={() => formatText("bold")}
              className="btn btn-ghost btn-xs"
              title="粗体"
              data-oid="t6fduov"
            >
              <Bold size={14} data-oid="l2387mh" />
            </button>
            <button
              onClick={() => formatText("italic")}
              className="btn btn-ghost btn-xs"
              title="斜体"
              data-oid="g1st868"
            >
              <Italic size={14} data-oid="whgznmv" />
            </button>
            <button
              onClick={() => formatText("underline")}
              className="btn btn-ghost btn-xs"
              title="下划线"
              data-oid="ebb_o:u"
            >
              <Underline size={14} data-oid="6zan:r_" />
            </button>
          </div>

          <div className="toolbar-group" data-oid="kfjbn35">
            <button
              onClick={() => formatText("justifyLeft")}
              className="btn btn-ghost btn-xs"
              title="左对齐"
              data-oid="7lti_to"
            >
              <AlignLeft size={14} data-oid=".cw4td9" />
            </button>
            <button
              onClick={() => formatText("justifyCenter")}
              className="btn btn-ghost btn-xs"
              title="居中对齐"
              data-oid="x0qzk15"
            >
              <AlignCenter size={14} data-oid="zmsbaax" />
            </button>
            <button
              onClick={() => formatText("justifyRight")}
              className="btn btn-ghost btn-xs"
              title="右对齐"
              data-oid="rs.mczi"
            >
              <AlignRight size={14} data-oid="nc9p53m" />
            </button>
          </div>

          <div className="toolbar-group" data-oid="2plj5zb">
            <button
              onClick={() => formatText("insertUnorderedList")}
              className="btn btn-ghost btn-xs"
              title="无序列表"
              data-oid="2pfos9:"
            >
              <List size={14} data-oid="ufdslx_" />
            </button>
            <select
              onChange={(e) => formatText("formatBlock", e.target.value)}
              className="input input-sm"
              defaultValue=""
              data-oid="e2x-em3"
            >
              <option value="" data-oid="ndooe0q">
                段落格式
              </option>
              <option value="h1" data-oid="2alilpx">
                标题 1
              </option>
              <option value="h2" data-oid="8tjoxi8">
                标题 2
              </option>
              <option value="h3" data-oid="u-u7sek">
                标题 3
              </option>
              <option value="p" data-oid="pr1:hs-">
                正文
              </option>
            </select>
          </div>
        </div>
      )}

      <div className="editor-content" data-oid="3ehr5pn">
        {isEditing ? (
          <div
            ref={editorRef}
            contentEditable
            className="content-editable"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleContentChange}
            onBlur={handleContentChange}
            data-oid="6z1u-8b"
          />
        ) : (
          <div
            className="content-preview"
            dangerouslySetInnerHTML={{ __html: content }}
            data-oid="g67pz6h"
          />
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;
