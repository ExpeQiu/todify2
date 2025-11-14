import React, { useState, useEffect } from 'react';
import { X, Save, Play, Pause } from 'lucide-react';
import { AgentWorkflow, WorkflowExecutionMode } from '../../types/agentWorkflow';

interface WorkflowSettingsModalProps {
  workflow: AgentWorkflow | null;
  onClose: () => void;
  onSave: (settings: { executionMode: WorkflowExecutionMode }) => void;
}

/**
 * 工作流设置弹窗组件
 */
const WorkflowSettingsModal: React.FC<WorkflowSettingsModalProps> = ({
  workflow,
  onClose,
  onSave,
}) => {
  const [executionMode, setExecutionMode] = useState<WorkflowExecutionMode>('auto');

  // 初始化表单数据
  useEffect(() => {
    if (workflow) {
      setExecutionMode(workflow.executionMode || 'auto');
    }
  }, [workflow]);

  const handleSave = () => {
    if (!workflow) return;
    
    onSave({ executionMode });
    onClose();
  };

  if (!workflow) return null;

  return (
    <div className="workflow-settings-modal-overlay" onClick={onClose}>
      <div className="workflow-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">工作流设置</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="settings-section">
            <h3 className="section-title">执行方式</h3>
            <p className="section-description">
              选择工作流的执行方式，决定节点是否自动执行
            </p>

            <div className="execution-mode-options">
              <label className={`execution-mode-option ${executionMode === 'auto' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="executionMode"
                  value="auto"
                  checked={executionMode === 'auto'}
                  onChange={(e) => setExecutionMode(e.target.value as WorkflowExecutionMode)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <Play size={20} className="option-icon" />
                    <span className="option-title">自动触发</span>
                  </div>
                  <p className="option-description">
                    工作流启动后，所有节点按照连接顺序自动执行，无需手动干预
                  </p>
                </div>
              </label>

              <label className={`execution-mode-option ${executionMode === 'manual' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="executionMode"
                  value="manual"
                  checked={executionMode === 'manual'}
                  onChange={(e) => setExecutionMode(e.target.value as WorkflowExecutionMode)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <Pause size={20} className="option-icon" />
                    <span className="option-title">单点触发</span>
                  </div>
                  <p className="option-description">
                    工作流启动后，每个节点需要手动触发才能执行，可以更灵活地控制执行流程
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-button secondary" onClick={onClose}>
            取消
          </button>
          <button className="modal-button primary" onClick={handleSave}>
            <Save size={16} />
            <span>保存设置</span>
          </button>
        </div>
      </div>

      <style>{`
        .workflow-settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .workflow-settings-modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .modal-content {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .settings-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .section-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .execution-mode-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .execution-mode-option {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .execution-mode-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .execution-mode-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .execution-mode-option input[type="radio"] {
          margin: 0;
          margin-right: 12px;
          margin-top: 2px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .option-content {
          flex: 1;
        }

        .option-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .option-icon {
          color: #3b82f6;
          flex-shrink: 0;
        }

        .option-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }

        .option-description {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .modal-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .modal-button.primary {
          background: #3b82f6;
          color: white;
        }

        .modal-button.primary:hover {
          background: #2563eb;
        }

        .modal-button.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-button.secondary:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default WorkflowSettingsModal;

