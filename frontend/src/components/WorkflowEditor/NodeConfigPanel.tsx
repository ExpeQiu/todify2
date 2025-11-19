import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, Code, Plus, Trash2 } from 'lucide-react';
import { AgentWorkflowNode, AgentWorkflow, ConditionNodeData, AssignNodeData, MergeNodeData, TransformNodeData, InputNodeData, OutputNodeData, MemoryNodeData, ComparisonOperator, MergeStrategy, TransformRuleType, InputParameter, OutputParameter } from '../../types/agentWorkflow';
import { AIRoleConfig } from '../../types/aiRole';
import InputSourceSelector from './InputSourceSelector';

interface NodeConfigPanelProps {
  node: AgentWorkflowNode | null;
  agents: AIRoleConfig[];
  workflow?: AgentWorkflow;
  onClose?: () => void;
  onSave?: (node: AgentWorkflowNode) => void;
}

/**
 * 节点配置面板组件
 */
const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  agents,
  workflow,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<AgentWorkflowNode>>({
    ...node,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // 当节点变化时，重置表单数据
    if (node) {
      setFormData({ 
        ...node,
        // 确保 data 字段被正确初始化
        data: node.data ? { ...node.data } : {} as any,
      });
    }
  }, [node]);

  const isValid = useMemo(() => {
    const e: Record<string, string> = {};
    if (!node) return true;
    if (node.type === 'agent') {
      if (!formData.agentId || String(formData.agentId).trim() === '') e.agentId = '请选择Agent';
    }
    if (node.type === 'input') {
      const data = formData.data as any;
      const inputs = (data?.inputs || []) as InputParameter[];
      const names = new Set<string>();
      inputs.forEach((p, i) => {
        const name = (p.name || '').trim();
        if (!name) e[`input_name_${i}`] = '参数名不能为空';
        if (name) {
          if (names.has(name)) e[`input_name_${i}`] = '参数名重复';
          names.add(name);
        }
      });
    }
    if (node.type === 'output') {
      const data = formData.data as any;
      const outputs = (data?.outputs || []) as OutputParameter[];
      const names = new Set<string>();
      outputs.forEach((p, i) => {
        const name = (p.name || '').trim();
        if (!name) e[`output_name_${i}`] = '输出名不能为空';
        if (name) {
          if (names.has(name)) e[`output_name_${i}`] = '输出名重复';
          names.add(name);
        }
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData, node]);

  const handleSave = () => {
    if (!node) {
      console.error('无法保存：节点不存在');
      return;
    }
    if (!isValid) return;
    
    try {
      // 首先，确保保留节点的所有核心字段
      const baseNode: AgentWorkflowNode = {
        id: node.id,
        type: node.type,
        position: formData.position || node.position,
        agentId: formData.agentId !== undefined ? formData.agentId : node.agentId,
        agentConfig: formData.agentConfig || node.agentConfig,
        data: node.data, // 先使用原始数据作为基础
      };
      
      // 然后，合并 formData 中的更改
      // 确保 data 字段被正确合并
      const updatedData = {
        ...baseNode.data,
        ...formData.data,
      };
      
      // 确保 label 字段存在
      if (!updatedData.label) {
        updatedData.label = formData.data?.label || node.data?.label || '未命名节点';
      } else {
        updatedData.label = formData.data?.label || updatedData.label;
      }
      
      // 根据节点类型进行特殊处理
      switch (node.type) {
        case 'agent': {
          const agentData = updatedData as any;
          const selectedAgent = agents.find(a => a.id === formData.agentId);
          
          // 更新 agentName
          if (selectedAgent) {
            agentData.agentName = selectedAgent.name;
          } else if (formData.agentId && !agentData.agentName) {
            // 如果设置了 agentId 但没有 agentName，尝试从原始节点获取
            agentData.agentName = (node.data as any).agentName;
          }
          
          // 确保必需字段存在
          if (!agentData.inputs) {
            agentData.inputs = (node.data as any).inputs || {};
          }
          if (!agentData.outputs) {
            agentData.outputs = (node.data as any).outputs || [];
          }
          if (formData.data && (formData.data as any).inputSources !== undefined) {
            agentData.inputSources = (formData.data as any).inputSources;
          } else if (agentData.inputSources === undefined) {
            agentData.inputSources = (node.data as any).inputSources || {};
          }
          break;
        }
        case 'condition': {
          const conditionData = updatedData as any;
          if (!conditionData.condition) {
            conditionData.condition = (node.data as any).condition || { left: '', operator: '==', right: '' };
          }
          break;
        }
        case 'assign': {
          const assignData = updatedData as any;
          if (!assignData.variable) {
            assignData.variable = (node.data as any).variable || 'result';
          }
          break;
        }
        case 'merge': {
          const mergeData = updatedData as any;
          if (!mergeData.strategy) {
            mergeData.strategy = (node.data as any).strategy || 'override';
          }
          if (!mergeData.sources) {
            mergeData.sources = (node.data as any).sources || [];
          }
          break;
        }
        case 'transform': {
          const transformData = updatedData as any;
          if (!transformData.ruleType) {
            transformData.ruleType = (node.data as any).ruleType || 'json_path';
          }
          if (!transformData.rule) {
            transformData.rule = (node.data as any).rule || {};
          }
          break;
        }
        case 'input': {
          const inputData = updatedData as any;
          if (!inputData.inputs) {
            inputData.inputs = (node.data as any).inputs || [];
          }
          break;
        }
        case 'output': {
          const outputData = updatedData as any;
          if (!outputData.outputs) {
            outputData.outputs = (node.data as any).outputs || [];
          }
          break;
        }
        case 'memory': {
          const memoryData = updatedData as any;
          if (memoryData.content === undefined) {
            memoryData.content = (node.data as any).content || '';
          }
          if (memoryData.editable === undefined) {
            memoryData.editable = (node.data as any).editable !== false;
          }
          if (memoryData.autoSave === undefined) {
            memoryData.autoSave = (node.data as any).autoSave === true;
          }
          break;
        }
      }
      
      // 构建最终更新的节点
      const updatedNode: AgentWorkflowNode = {
        ...baseNode,
        data: updatedData as any,
      };
      
      console.log('保存节点配置:', {
        nodeId: updatedNode.id,
        nodeType: updatedNode.type,
        agentId: updatedNode.agentId,
        dataKeys: Object.keys(updatedNode.data),
        dataLabel: (updatedNode.data as any).label,
      });
      
      // 调用保存回调
      if (onSave) {
        onSave(updatedNode);
        // 添加成功提示
        console.log('节点配置保存成功！');
      } else {
        console.error('onSave 回调未定义');
      }
    } catch (error) {
      console.error('保存节点配置时出错:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 处理输入源变化
  const handleInputSourceChange = (inputSources: Record<string, any>) => {
    const currentData = formData.data as any;
    setFormData({
      ...formData,
      data: {
        ...currentData,
        label: currentData?.label || node.data?.label || '未命名节点',
        inputSources,
      },
    });
  };

  if (!node) {
    return null;
  }

  // 根据节点类型渲染不同的配置表单
  const renderNodeConfig = () => {
    switch (node.type) {
      case 'agent':
        return renderAgentConfig();
      case 'condition':
        return renderConditionConfig();
      case 'assign':
        return renderAssignConfig();
      case 'merge':
        return renderMergeConfig();
      case 'transform':
        return renderTransformConfig();
      case 'input':
        return renderInputConfig();
      case 'output':
        return renderOutputConfig();
      case 'memory':
        return renderMemoryConfig();
      default:
        return null;
    }
  };

  // Agent节点配置
  const renderAgentConfig = () => {
    const data = formData.data as any;
    return (
      <>
        <div className="form-group">
          <label className="form-label">关联Agent</label>
          <select
            className="form-select"
            value={formData.agentId || ''}
            onChange={(e) => {
              const selectedAgent = agents.find(a => a.id === e.target.value);
              const currentData = formData.data as any;
              
              setFormData({
                ...formData,
                agentId: e.target.value,
                data: {
                  ...currentData,
                  label: currentData?.label || node.data?.label || '未命名节点',
                  agentName: selectedAgent?.name,
                  // 保留原有的 inputs, outputs, inputSources 等字段
                  inputs: currentData?.inputs || {},
                  outputs: currentData?.outputs || [],
                  inputSources: currentData?.inputSources || {},
                },
              });
            }}
          >
            <option value="">请选择Agent</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          {errors.agentId && (
            <div className="form-hint" style={{ color: '#dc2626' }}>{errors.agentId}</div>
          )}
        </div>

        {data?.agentName && (
          <div className="form-group">
            <label className="form-label">Agent描述</label>
            <div className="form-description">
              {agents.find(a => a.id === formData.agentId)?.description || '无描述'}
            </div>
          </div>
        )}

        {/* 输入配置 */}
        {workflow && (
          <div className="form-group">
            <label className="form-label">输入配置</label>
            <div className="input-sources-container">
              <InputSourceSelector
                currentNodeId={node.id}
                nodes={workflow.nodes}
                edges={workflow.edges}
                inputSources={data?.inputSources}
                onChange={handleInputSourceChange}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  // 条件节点配置
  const renderConditionConfig = () => {
    const data = formData.data as ConditionNodeData;
    const condition = data?.condition || { left: '', operator: '==', right: '' };
    
    return (
      <>
        <div className="form-group">
          <label className="form-label">左侧值</label>
          <input
            type="text"
            className="form-input"
            value={condition.left || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                condition: { ...condition, left: e.target.value },
              },
            })}
            placeholder="例如: ${nodeId.output.result}"
          />
          <p className="form-hint">支持变量引用，如 $&#123;nodeId.output.field&#125;</p>
        </div>

        <div className="form-group">
          <label className="form-label">比较操作符</label>
          <select
            className="form-select"
            value={condition.operator || '=='}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                condition: { ...condition, operator: e.target.value as ComparisonOperator },
              },
            })}
          >
            <option value="==">=</option>
            <option value="!=">≠</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value="<=">≤</option>
            <option value="contains">包含</option>
            <option value="not_contains">不包含</option>
            <option value="startsWith">开头是</option>
            <option value="endsWith">结尾是</option>
            <option value="exists">存在</option>
            <option value="not_exists">不存在</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">右侧值</label>
          <input
            type="text"
            className="form-input"
            value={String(condition.right || '')}
            onChange={(e) => {
              let value: string | number | boolean = e.target.value;
              // 尝试转换为数字或布尔值
              if (value === 'true') value = true;
              else if (value === 'false') value = false;
              else if (!isNaN(Number(value)) && value !== '') value = Number(value);
              
              setFormData({
                ...formData,
                data: {
                  ...data,
                  condition: { ...condition, right: value },
                },
              });
            }}
            placeholder="例如: 100 或 '文本'"
          />
        </div>

        <div className="form-group">
          <label className="form-label">True分支标签</label>
          <input
            type="text"
            className="form-input"
            value={data?.trueLabel || '是'}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                trueLabel: e.target.value,
              },
            })}
            placeholder="满足条件时的分支标签"
          />
        </div>

        <div className="form-group">
          <label className="form-label">False分支标签</label>
          <input
            type="text"
            className="form-input"
            value={data?.falseLabel || '否'}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                falseLabel: e.target.value,
              },
            })}
            placeholder="不满足条件时的分支标签"
          />
        </div>

        <div className="form-group">
          <label className="form-label">条件表达式（可选）</label>
          <textarea
            className="form-textarea"
            value={condition.expression || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                condition: { ...condition, expression: e.target.value },
              },
            })}
            placeholder="例如: node.output.count > 100"
            rows={3}
          />
          <p className="form-hint">完整的JavaScript表达式，优先级高于左侧/右侧值</p>
        </div>
      </>
    );
  };

  // 赋值节点配置
  const renderAssignConfig = () => {
    const data = formData.data as AssignNodeData;
    
    return (
      <>
        <div className="form-group">
          <label className="form-label">变量名</label>
          <input
            type="text"
            className="form-input"
            value={data?.variable || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                variable: e.target.value,
              },
            })}
            placeholder="例如: result"
          />
          <p className="form-hint">变量名将保存到共享上下文中</p>
        </div>

        <div className="form-group">
          <label className="form-label">值类型</label>
          <select
            className="form-select"
            value={data?.valueType || 'auto'}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                valueType: e.target.value as any,
              },
            })}
          >
            <option value="auto">自动识别</option>
            <option value="string">字符串</option>
            <option value="number">数字</option>
            <option value="boolean">布尔值</option>
            <option value="object">对象</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">值/表达式</label>
          <textarea
            className="form-textarea"
            value={data?.value || data?.expression || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                value: e.target.value,
                expression: e.target.value,
              },
            })}
            placeholder="例如: ${node.output.result} 或 '固定值' 或 node.output.data + ' processed'"
            rows={4}
          />
          <p className="form-hint">支持变量引用和JavaScript表达式</p>
        </div>
      </>
    );
  };

  // 合并节点配置
  const renderMergeConfig = () => {
    const data = formData.data as MergeNodeData;
    const availableNodes = workflow?.nodes.filter(n => n.id !== node.id) || [];
    
    return (
      <>
        <div className="form-group">
          <label className="form-label">合并策略</label>
          <select
            className="form-select"
            value={data?.strategy || 'override'}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                strategy: e.target.value as MergeStrategy,
              },
            })}
          >
            <option value="override">覆盖（后面的覆盖前面的）</option>
            <option value="merge">合并（深度合并对象）</option>
            <option value="append">追加（数组追加）</option>
            <option value="concat">连接（字符串或数组连接）</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">数据源节点</label>
          <div className="form-hint" style={{ marginBottom: '8px' }}>
            选择要合并的上游节点
          </div>
          {availableNodes.map((sourceNode) => {
            const isSelected = data?.sources?.includes(sourceNode.id);
            return (
              <label key={sourceNode.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const currentSources = data?.sources || [];
                    const newSources = e.target.checked
                      ? [...currentSources, sourceNode.id]
                      : currentSources.filter(id => id !== sourceNode.id);
                    
                    setFormData({
                      ...formData,
                      data: {
                        ...data,
                        sources: newSources,
                      },
                    });
                  }}
                />
                <span>{sourceNode.data.label || sourceNode.id}</span>
              </label>
            );
          })}
          {availableNodes.length === 0 && (
            <p className="form-hint">暂无其他节点可合并</p>
          )}
        </div>
      </>
    );
  };

  // 转换节点配置
  const renderTransformConfig = () => {
    const data = formData.data as TransformNodeData;
    const rule = data?.rule || {};
    
    return (
      <>
        <div className="form-group">
          <label className="form-label">转换类型</label>
          <select
            className="form-select"
            value={data?.ruleType || 'json_path'}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                ruleType: e.target.value as TransformRuleType,
                rule: { ...rule },
              },
            })}
          >
            <option value="json_path">JSON路径提取</option>
            <option value="format">格式化</option>
            <option value="parse">解析</option>
            <option value="stringify">序列化</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">源字段</label>
          <input
            type="text"
            className="form-input"
            value={data?.sourceField || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                sourceField: e.target.value,
              },
            })}
            placeholder="例如: ${node.output.data} 或 data.result"
          />
        </div>

        <div className="form-group">
          <label className="form-label">目标字段</label>
          <input
            type="text"
            className="form-input"
            value={data?.targetField || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                targetField: e.target.value,
              },
            })}
            placeholder="输出字段名（可选）"
          />
        </div>

        {data?.ruleType === 'json_path' && (
          <div className="form-group">
            <label className="form-label">JSON路径</label>
            <input
              type="text"
              className="form-input"
              value={rule.jsonPath || ''}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  rule: { ...rule, jsonPath: e.target.value },
                },
              })}
              placeholder="例如: $.data.result"
            />
            <p className="form-hint">使用JSONPath语法提取数据</p>
          </div>
        )}

        {data?.ruleType === 'format' && (
          <div className="form-group">
            <label className="form-label">格式字符串</label>
            <input
              type="text"
              className="form-input"
              value={rule.format || ''}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  rule: { ...rule, format: e.target.value },
                },
              })}
              placeholder="例如: {0} - {1}"
            />
          </div>
        )}

        {data?.ruleType === 'parse' && (
          <div className="form-group">
            <label className="form-label">解析类型</label>
            <select
              className="form-select"
              value={rule.parseAs || 'json'}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  rule: { ...rule, parseAs: e.target.value as any },
                },
              })}
            >
              <option value="json">JSON</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="date">日期</option>
            </select>
          </div>
        )}
      </>
    );
  };

  // 输入节点配置
  const renderInputConfig = () => {
    const data = formData.data as InputNodeData;
    
    // 向后兼容：如果没有inputs数组，使用旧字段创建单个参数
    const inputs: InputParameter[] = data.inputs || (data.inputName ? [{
      name: data.inputName,
      type: data.inputType,
      defaultValue: data.defaultValue,
      description: data.description,
      required: data.required,
    }] : []);
    
    const updateInputs = (newInputs: InputParameter[]) => {
      setFormData({
        ...formData,
        data: {
          ...data,
          inputs: newInputs,
        },
      });
    };
    
    const addInput = () => {
      const newInput: InputParameter = {
        name: `input_${inputs.length + 1}`,
        type: 'string',
        required: false,
      };
      updateInputs([...inputs, newInput]);
    };
    
    const removeInput = (index: number) => {
      updateInputs(inputs.filter((_, i) => i !== index));
    };
    
    const updateInput = (index: number, field: keyof InputParameter, value: any) => {
      const newInputs = [...inputs];
      newInputs[index] = { ...newInputs[index], [field]: value };
      updateInputs(newInputs);
    };
    
    return (
      <>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label">输入参数</label>
            <button
              type="button"
              onClick={addInput}
              className="btn-add-param"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Plus size={14} />
              添加参数
            </button>
          </div>
          
          {inputs.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              暂无输入参数，点击"添加参数"添加
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inputs.map((input, index) => (
                <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>参数 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeInput(index)}
                      style={{
                        padding: '4px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="删除参数"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">参数名</label>
                    <input
                      type="text"
                      className="form-input"
                      value={input.name || ''}
                      onChange={(e) => updateInput(index, 'name', e.target.value)}
                      placeholder="例如: query"
                    />
                  </div>
                  
                   <div className="form-group" style={{ marginBottom: '8px' }}>
                     <label className="form-label">参数类型</label>
                     <select
                       className="form-select"
                       value={input.type || 'string'}
                       onChange={(e) => updateInput(index, 'type', e.target.value)}
                     >
                       <option value="string">字符串</option>
                       <option value="number">数字</option>
                       <option value="boolean">布尔值</option>
                       <option value="object">对象</option>
                       <option value="array">数组</option>
                       <option value="file">文件</option>
                     </select>
                   </div>
                   
                   {input.type === 'file' && (
                     <>
                       <div className="form-group" style={{ marginBottom: '8px' }}>
                         <label className="form-label">接受的文件类型</label>
                         <input
                           type="text"
                           className="form-input"
                           value={input.accept || ''}
                           onChange={(e) => updateInput(index, 'accept', e.target.value)}
                           placeholder='例如: image/* 或 .pdf,.doc,.docx'
                         />
                         <p className="form-hint">MIME类型或文件扩展名，如 image/*, .pdf, .doc</p>
                       </div>
                       
                       <div className="form-group" style={{ marginBottom: '8px' }}>
                         <label className="form-label">最大文件大小（MB）</label>
                         <input
                           type="number"
                           className="form-input"
                           value={input.maxSize ? input.maxSize / (1024 * 1024) : ''}
                           onChange={(e) => {
                             const mb = parseFloat(e.target.value);
                             updateInput(index, 'maxSize', mb ? mb * 1024 * 1024 : undefined);
                           }}
                           placeholder="例如: 10"
                           min="0"
                           step="0.1"
                         />
                         <p className="form-hint">单位：MB，留空表示不限制</p>
                       </div>
                     </>
                   )}
                   
                   {input.type !== 'file' && (
                     <div className="form-group" style={{ marginBottom: '8px' }}>
                       <label className="form-label">默认值（可选）</label>
                       <textarea
                         className="form-textarea"
                         value={input.defaultValue !== undefined ? JSON.stringify(input.defaultValue) : ''}
                         onChange={(e) => {
                           try {
                             const defaultValue = e.target.value ? JSON.parse(e.target.value) : undefined;
                             updateInput(index, 'defaultValue', defaultValue);
                           } catch {
                             // 忽略无效JSON
                           }
                         }}
                         placeholder='例如: "默认值" 或 {"key": "value"}'
                         rows={2}
                       />
                     </div>
                   )}
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-textarea"
                      value={input.description || ''}
                      onChange={(e) => updateInput(index, 'description', e.target.value)}
                      placeholder="参数描述"
                      rows={2}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={input.required === true}
                        onChange={(e) => updateInput(index, 'required', e.target.checked)}
                      />
                      <span>必需参数</span>
                    </label>
                  </div>
                  {errors[`input_name_${index}`] && (
                    <div className="form-hint" style={{ color: '#dc2626' }}>{errors[`input_name_${index}`]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // 输出节点配置
  const renderOutputConfig = () => {
    const data = formData.data as OutputNodeData;
    const availableNodes = workflow?.nodes.filter(n => n.id !== node.id && n.type !== 'output') || [];
    
    // 向后兼容：如果没有outputs数组，使用旧字段创建单个参数
    const outputs: OutputParameter[] = data.outputs || (data.outputName ? [{
      name: data.outputName,
      sourceNodeId: data.sourceNodeId,
      sourceField: data.sourceField,
      type: data.outputType,
      description: data.description,
    }] : []);
    
    const updateOutputs = (newOutputs: OutputParameter[]) => {
      setFormData({
        ...formData,
        data: {
          ...data,
          outputs: newOutputs,
        },
      });
    };
    
    const addOutput = () => {
      const newOutput: OutputParameter = {
        name: `output_${outputs.length + 1}`,
        type: 'object',
      };
      updateOutputs([...outputs, newOutput]);
    };
    
    const removeOutput = (index: number) => {
      updateOutputs(outputs.filter((_, i) => i !== index));
    };
    
    const updateOutput = (index: number, field: keyof OutputParameter, value: any) => {
      const newOutputs = [...outputs];
      newOutputs[index] = { ...newOutputs[index], [field]: value };
      updateOutputs(newOutputs);
    };
    
    return (
      <>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label">输出参数</label>
            <button
              type="button"
              onClick={addOutput}
              className="btn-add-param"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Plus size={14} />
              添加参数
            </button>
          </div>
          
          {outputs.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              暂无输出参数，点击"添加参数"添加
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {outputs.map((output, index) => (
                <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>参数 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeOutput(index)}
                      style={{
                        padding: '4px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="删除参数"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">输出参数名</label>
                    <input
                      type="text"
                      className="form-input"
                      value={output.name || ''}
                      onChange={(e) => updateOutput(index, 'name', e.target.value)}
                      placeholder="例如: result"
                    />
                    <p className="form-hint">工作流执行结果的输出参数名</p>
                  </div>
                  
                   <div className="form-group" style={{ marginBottom: '8px' }}>
                     <label className="form-label">输出类型</label>
                     <select
                       className="form-select"
                       value={output.type || 'object'}
                       onChange={(e) => updateOutput(index, 'type', e.target.value)}
                     >
                       <option value="string">字符串</option>
                       <option value="number">数字</option>
                       <option value="boolean">布尔值</option>
                       <option value="object">对象</option>
                       <option value="array">数组</option>
                       <option value="file">文件</option>
                     </select>
                   </div>
                   
                   {output.type === 'file' && (
                     <div className="form-group" style={{ marginBottom: '8px' }}>
                       <label className="form-label">下载文件名（可选）</label>
                       <input
                         type="text"
                         className="form-input"
                         value={output.downloadFileName || ''}
                         onChange={(e) => updateOutput(index, 'downloadFileName', e.target.value)}
                         placeholder="例如: result.pdf"
                       />
                       <p className="form-hint">文件下载时的默认文件名</p>
                     </div>
                   )}
                  
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label className="form-label">数据源节点</label>
                    <select
                      className="form-select"
                      value={output.sourceNodeId || ''}
                      onChange={(e) => updateOutput(index, 'sourceNodeId', e.target.value)}
                    >
                      <option value="">请选择数据源节点</option>
                      {availableNodes.map((sourceNode) => (
                        <option key={sourceNode.id} value={sourceNode.id}>
                          {sourceNode.data.label || sourceNode.id}
                        </option>
                      ))}
                    </select>
                    <p className="form-hint">选择要输出数据的来源节点</p>
                  </div>
                  
                  {output.sourceNodeId && (
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label">源字段（可选）</label>
                      <input
                        type="text"
                        className="form-input"
                        value={output.sourceField || ''}
                        onChange={(e) => updateOutput(index, 'sourceField', e.target.value)}
                        placeholder="例如: result 或 data.content"
                      />
                      <p className="form-hint">如果指定，则只输出该字段的值</p>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-textarea"
                      value={output.description || ''}
                      onChange={(e) => updateOutput(index, 'description', e.target.value)}
                      placeholder="输出参数的描述"
                      rows={2}
                    />
                  </div>
                  {errors[`output_name_${index}`] && (
                    <div className="form-hint" style={{ color: '#dc2626' }}>{errors[`output_name_${index}`]}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // 文本记忆节点配置
  const renderMemoryConfig = () => {
    const data = formData.data as MemoryNodeData;
    const availableNodes = workflow?.nodes.filter(n => n.id !== node.id && n.type !== 'output') || [];
    
    return (
      <>
        <div className="form-group">
          <label className="form-label">数据源节点（可选）</label>
          <select
            className="form-select"
            value={data.sourceNodeId || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                sourceNodeId: e.target.value || undefined,
              },
            })}
          >
            <option value="">不指定（手动输入）</option>
            {availableNodes.map((sourceNode) => (
              <option key={sourceNode.id} value={sourceNode.id}>
                {sourceNode.data.label || sourceNode.id}
              </option>
            ))}
          </select>
          <p className="form-hint">选择要存储文本的上游节点，留空则手动输入</p>
        </div>

        {data.sourceNodeId && (
          <div className="form-group">
            <label className="form-label">源字段（可选）</label>
            <input
              type="text"
              className="form-input"
              value={data.sourceField || ''}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  sourceField: e.target.value || undefined,
                },
              })}
              placeholder="例如: output.content 或 output.result"
            />
            <p className="form-hint">如果指定，则从该字段提取文本；否则使用整个输出</p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">文本内容</label>
          <textarea
            className="form-textarea"
            value={data.content || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: {
                ...data,
                content: e.target.value,
              },
            })}
            placeholder={data.sourceNodeId ? '将从上游节点自动获取，也可手动编辑' : '请输入要存储的文本内容'}
            rows={8}
            disabled={!data.sourceNodeId && false}
          />
          <p className="form-hint">存储的文本内容，可在执行时编辑</p>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={data.editable !== false}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  editable: e.target.checked,
                },
              })}
            />
            <span>允许编辑</span>
          </label>
          <p className="form-hint">是否允许在执行时编辑文本内容</p>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={data.autoSave === true}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  autoSave: e.target.checked,
                },
              })}
            />
            <span>自动保存</span>
          </label>
          <p className="form-hint">编辑后是否自动保存到记忆ID（需要配置记忆ID）</p>
        </div>

        {data.autoSave && (
          <div className="form-group">
            <label className="form-label">记忆ID（可选）</label>
            <input
              type="text"
              className="form-input"
              value={data.memoryId || ''}
              onChange={(e) => setFormData({
                ...formData,
                data: {
                  ...data,
                  memoryId: e.target.value || undefined,
                },
              })}
              placeholder="例如: user_123_memory"
            />
            <p className="form-hint">用于持久化存储的唯一标识，启用自动保存时建议配置</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="node-config-panel">
      <div className="config-panel-header">
        <h3 className="config-panel-title">节点配置</h3>
        <button className="config-panel-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="config-panel-content">
        {/* 基本信息 */}
        <div className="form-group">
          <label className="form-label">节点名称</label>
          <input
            type="text"
            className="form-input"
            value={formData.data?.label || ''}
            onChange={(e) => setFormData({
              ...formData,
              data: { ...formData.data, label: e.target.value },
            })}
            placeholder="请输入节点名称"
          />
        </div>

        {/* 根据节点类型渲染不同的配置 */}
        {renderNodeConfig()}

        {/* 高级配置 - 折叠区域 */}
        <div className="advanced-config">
          <button
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <ChevronDown size={16} className="text-gray-600" />
            ) : (
              <ChevronRight size={16} className="text-gray-600" />
            )}
            <Code size={16} className="text-gray-600" />
            <span>高级配置</span>
          </button>

          {showAdvanced && (
            <div className="form-group">
              <label className="form-label">原始数据 (JSON)</label>
              <textarea
                className="form-textarea"
                value={JSON.stringify(formData.data || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const newData = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      data: newData,
                    });
                  } catch {
                    // 忽略无效JSON
                  }
                }}
                placeholder='请输入JSON格式的节点数据'
                rows={8}
              />
              <p className="form-hint">
                高级用户可以使用JSON直接配置节点数据
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="config-panel-footer">
        <button 
          className="config-panel-button" 
          disabled={!isValid}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave();
          }}
          type="button"
        >
          保存
        </button>
        <button 
          className="config-panel-button config-panel-button-secondary" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          type="button"
        >
          取消
        </button>
      </div>

      <style>{`
        .node-config-panel {
          width: 380px;
          height: 100%;
          background: white;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }
        
        .config-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .config-panel-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .config-panel-close {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .config-panel-close:hover {
          background: #f3f4f6;
        }
        
        .config-panel-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        
        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #111827;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-textarea {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          resize: vertical;
        }
        
        .form-description {
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.5;
        }

        .form-hint {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 6px;
          margin-bottom: 0;
        }
        
        .input-sources-container {
          margin-top: 8px;
        }

        .advanced-config {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 8px;
        }

        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          transition: background 0.2s;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        .advanced-toggle:hover {
          background: #f9fafb;
        }

        .advanced-toggle span {
          margin-left: 2px;
        }
        
        .config-panel-footer {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }
        
        .config-panel-button {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          background: #3b82f6;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .config-panel-button:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .config-panel-button-secondary {
          background: white;
          color: #374151;
          border-color: #d1d5db;
        }
        
        .config-panel-button-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default NodeConfigPanel;
