import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        {description && <div className="confirm-desc">{description}</div>}
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button className="btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
      <style>{`
        .confirm-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 16px;
        }
        .confirm-dialog {
          width: min(480px, 95vw);
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: 1px solid #e5e7eb;
          padding: 20px;
        }
        .confirm-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }
        .confirm-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn-secondary {
          padding: 8px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-secondary:hover { background: #f9fafb; }
        .btn-primary {
          padding: 8px 14px;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          background: #3b82f6;
          color: #ffffff;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary:hover { background: #2563eb; border-color: #2563eb; }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;