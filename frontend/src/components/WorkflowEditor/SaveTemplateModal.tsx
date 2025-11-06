import React, { useState, useEffect } from 'react';
import { X, Save, FileDown } from 'lucide-react';
import { AgentWorkflow } from '../../types/agentWorkflow';
import { workflowTemplateService } from '../../services/agentWorkflowService';

interface SaveTemplateModalProps {
  workflow: AgentWorkflow | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * 保存模版弹窗组件
 */
const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  workflow,
  onClose,
  onSuccess,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化表单数据
  useEffect(() => {
    if (workflow) {
      setTemplateName(workflow.name || '');
      setDescription(workflow.description || '');
      setCategory('custom');
      setIsPublic(false);
    }
  }, [workflow]);

  const handleSave = async () => {
    if (!workflow) {
      setError('工作流不存在');
      return;
    }

    if (!templateName.trim()) {
      setError('请输入模版名称');
      return;
    }

    if (!description.trim()) {
      setError('请输入模版描述');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 验证工作流数据
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        setError('工作流节点数据无效');
        return;
      }

      if (!workflow.edges || !Array.isArray(workflow.edges)) {
        setError('工作流连接数据无效');
        return;
      }

      // 验证至少有一个节点
      if (workflow.nodes.length === 0) {
        setError('工作流至少需要包含一个节点');
        return;
      }

      // 构建工作流结构
      const workflowStructure = {
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        executionMode: workflow.executionMode || 'auto',
      };

      // 确保数据可以被序列化（移除任何不可序列化的对象）
      let serializableWorkflowStructure;
      try {
        const stringified = JSON.stringify(workflowStructure);
        console.log('序列化前:', workflowStructure);
        console.log('序列化字符串:', stringified);
        
        if (!stringified || stringified === '{}' || stringified === 'null' || stringified === 'undefined') {
          throw new Error('工作流结构序列化后为空');
        }

        serializableWorkflowStructure = JSON.parse(stringified);
        
        // 验证序列化后的数据
        if (!serializableWorkflowStructure || typeof serializableWorkflowStructure !== 'object') {
          throw new Error('工作流结构序列化后无效');
        }

        // 验证 nodes 和 edges 字段存在
        if (!serializableWorkflowStructure.nodes || !Array.isArray(serializableWorkflowStructure.nodes)) {
          throw new Error('工作流节点数据丢失');
        }

        if (!serializableWorkflowStructure.edges || !Array.isArray(serializableWorkflowStructure.edges)) {
          throw new Error('工作流连接数据丢失');
        }

        console.log('序列化后:', serializableWorkflowStructure);
      } catch (serializeError: any) {
        console.error('序列化失败:', serializeError);
        setError(serializeError?.message || '工作流数据序列化失败，请检查工作流配置');
        return;
      }

      await workflowTemplateService.createTemplate({
        name: templateName.trim(),
        description: description.trim(),
        category,
        workflowStructure: serializableWorkflowStructure,
        metadata: {
          version: workflow.version || '1.0.0',
          originalWorkflowId: workflow.id,
        },
        isPublic,
      });

      alert('模版保存成功！');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('保存模版失败:', error);
      console.error('错误响应数据:', error?.response?.data);
      console.error('错误状态码:', error?.response?.status);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || '保存模版失败，请重试';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!workflow) return null;

  return (
    <div className="save-template-modal-overlay" onClick={onClose}>
      <div className="save-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <FileDown size={20} className="modal-icon" />
            <h2 className="modal-title">保存工作流模版</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              模版名称 <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模版名称"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              模版描述 <span className="required">*</span>
            </label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入模版描述"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">分类</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
            >
              <option value="custom">自定义</option>
              <option value="smart">智能工作流</option>
              <option value="automation">自动化</option>
              <option value="analysis">分析</option>
              <option value="processing">处理</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={saving}
              />
              <span>公开模版（其他人可以使用）</span>
            </label>
          </div>

          <div className="workflow-info">
            <div className="info-item">
              <span className="info-label">当前工作流:</span>
              <span className="info-value">{workflow.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">节点数量:</span>
              <span className="info-value">{workflow.nodes.length} 个</span>
            </div>
            <div className="info-item">
              <span className="info-label">连接数量:</span>
              <span className="info-value">{workflow.edges.length} 个</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-button secondary"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </button>
          <button
            className="modal-button primary"
            onClick={handleSave}
            disabled={saving || !templateName.trim() || !description.trim()}
          >
            {saving ? (
              <>
                <div className="spinner" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>保存模版</span>
              </>
            )}
          </button>
        </div>

        <style>{`
          .save-template-modal-overlay {
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

          .save-template-modal {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
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

          .modal-header-content {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .modal-icon {
            color: #3b82f6;
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

          .error-message {
            padding: 12px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
          }

          .form-label .required {
            color: #dc2626;
          }

          .form-input,
          .form-textarea,
          .form-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s;
          }

          .form-input:focus,
          .form-textarea:focus,
          .form-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-textarea {
            resize: vertical;
            font-family: inherit;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }

          .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: #3b82f6;
          }

          .workflow-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin-top: 8px;
          }

          .info-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }

          .info-label {
            color: #6b7280;
          }

          .info-value {
            color: #111827;
            font-weight: 500;
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

          .modal-button.primary:hover:not(:disabled) {
            background: #2563eb;
          }

          .modal-button.secondary {
            background: #f3f4f6;
            color: #374151;
          }

          .modal-button.secondary:hover:not(:disabled) {
            background: #e5e7eb;
          }

          .modal-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SaveTemplateModal;

