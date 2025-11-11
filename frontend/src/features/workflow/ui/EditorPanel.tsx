import React from 'react';

import StandaloneDocumentEditor from '@/components/StandaloneDocumentEditor';

interface EditorPanelProps {
  title?: string;
  content: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  onExport: (value: string) => void;
  error?: string | null;
  onDismissError?: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  title,
  content,
  isEditing,
  onToggleEdit,
  onChange,
  onSave,
  onExport,
  error,
  onDismissError,
}) => (
  <div className="content-editor-section">
    <StandaloneDocumentEditor
      initialContent={content}
      title={title}
      isEditing={isEditing}
      onToggleEdit={onToggleEdit}
      onContentChange={(event) => onChange(event.target.value)}
      onSave={(value) => onSave(value)}
      onExportPDF={(value) => onExport(value)}
    />

    {error && (
      <div className="error-message">
        <span>⚠️ {error}</span>
        <button className="error-close" onClick={onDismissError}>
          ×
        </button>
      </div>
    )}
  </div>
);
