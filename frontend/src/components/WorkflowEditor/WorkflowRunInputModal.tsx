import React, { useMemo, useState } from 'react';
import { InputParameter } from '../../types/agentWorkflow';

interface WorkflowRunInputModalProps {
  open: boolean;
  params: InputParameter[];
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => void;
}

const WorkflowRunInputModal: React.FC<WorkflowRunInputModalProps> = ({ open, params, onCancel, onSubmit }) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialValues = useMemo(() => {
    const v: Record<string, any> = {};
    params.forEach(p => {
      if (p.defaultValue !== undefined) v[p.name] = p.defaultValue;
    });
    return v;
  }, [params]);

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  React.useEffect(() => {
    if (open) reset();
  }, [open]);

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    params.forEach(p => {
      const val = values[p.name];
      if (p.required && (val === undefined || val === '' || val === null)) {
        e[p.name] = '必填项';
      }
      if ((p.type === 'object' || p.type === 'array') && typeof val === 'string') {
        try { JSON.parse(val); } catch { e[p.name] = 'JSON 格式错误'; }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const out: Record<string, any> = {};
    params.forEach(p => {
      let val = values[p.name];
      if ((p.type === 'object' || p.type === 'array') && typeof val === 'string') {
        try { val = JSON.parse(val); } catch {}
      }
      out[p.name] = val;
    });
    onSubmit(out);
  };

  if (!open) return null;

  return (
    <div className="run-modal-overlay" onClick={onCancel}>
      <div className="run-modal" onClick={e => e.stopPropagation()}>
        <div className="run-title">工作流输入参数</div>
        <div className="run-content">
          {params.length === 0 ? (
            <div className="empty">无参数</div>
          ) : (
            params.map(p => (
              <div key={p.name} className="form-group">
                <label className="form-label">
                  {p.name}{p.required ? ' *' : ''}
                </label>
                {p.description && <div className="form-desc">{p.description}</div>}
                {p.type === 'file' ? (
                  <input
                    type="file"
                    accept={p.accept}
                    onChange={e => setValue(p.name, e.target.files && e.target.files[0])}
                    className="form-input"
                  />
                ) : p.type === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={values[p.name] || false}
                    onChange={e => setValue(p.name, e.target.checked)}
                  />
                ) : p.type === 'number' ? (
                  <input
                    type="number"
                    defaultValue={initialValues[p.name] !== undefined ? String(initialValues[p.name]) : ''}
                    onChange={e => setValue(p.name, e.target.value ? Number(e.target.value) : undefined)}
                    className="form-input"
                  />
                ) : (p.type === 'object' || p.type === 'array') ? (
                  <textarea
                    defaultValue={initialValues[p.name] !== undefined ? JSON.stringify(initialValues[p.name], null, 2) : ''}
                    onChange={e => setValue(p.name, e.target.value)}
                    className="form-textarea"
                    rows={4}
                    placeholder="请输入 JSON 格式"
                  />
                ) : (
                  <input
                    type="text"
                    defaultValue={initialValues[p.name] !== undefined ? String(initialValues[p.name]) : ''}
                    onChange={e => setValue(p.name, e.target.value)}
                    className="form-input"
                  />
                )}
                {errors[p.name] && <div className="form-error">{errors[p.name]}</div>}
              </div>
            ))
          )}
        </div>
        <div className="run-actions">
          <button className="btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn-primary" onClick={submit}>执行</button>
        </div>
      </div>
      <style>{`
        .run-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000; padding:16px; }
        .run-modal { width: min(720px, 95vw); max-height: 85vh; overflow:auto; background:#fff; border-radius:12px; border:1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .run-title { padding: 16px 20px; font-size:16px; font-weight:600; color:#111827; border-bottom:1px solid #e5e7eb; }
        .run-content { padding: 16px 20px; }
        .form-group { margin-bottom: 14px; }
        .form-label { font-size:14px; font-weight:500; color:#374151; margin-bottom:6px; display:block; }
        .form-desc { font-size:12px; color:#6b7280; margin-bottom:6px; }
        .form-input { width: 100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; }
        .form-textarea { width: 100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-family: 'Monaco','Courier New', monospace; font-size:12px; }
        .form-error { color:#dc2626; font-size:12px; margin-top:6px; }
        .run-actions { display:flex; justify-content:flex-end; gap:8px; padding: 16px 20px; border-top:1px solid #e5e7eb; }
        .btn-secondary { padding:8px 14px; border:1px solid #d1d5db; border-radius:8px; background:#fff; color:#374151; }
        .btn-primary { padding:8px 14px; border:1px solid #3b82f6; border-radius:8px; background:#3b82f6; color:#fff; }
      `}</style>
    </div>
  );
};

export default WorkflowRunInputModal;