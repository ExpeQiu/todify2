import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import FieldMappingConfig from './FieldMappingConfig';
import { agentWorkflowService } from '../../services/agentWorkflowService';
import { aiSearchService } from '../../services/aiSearchService';
import { WorkflowConfig } from '../../types/aiSearch';

interface FieldMappingConfigModalProps {
  workflowId: string;
  onClose: () => void;
  onSave: () => void;
}

const FieldMappingConfigModal: React.FC<FieldMappingConfigModalProps> = ({
  workflowId,
  onClose,
  onSave,
}) => {
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowConfig();
  }, [workflowId]);

  const loadWorkflowConfig = async () => {
    try {
      setLoading(true);
      const workflows = await agentWorkflowService.getAllWorkflows();
      const workflow = workflows.find((w) => w.id === workflowId);
      
      if (workflow) {
        const inputNode = workflow.nodes?.find((n: any) => n.type === 'input');
        const outputNode = workflow.nodes?.find((n: any) => n.type === 'output');
        
        const inputParameters = inputNode?.data?.inputs || [];
        const outputParameters = outputNode?.data?.outputs || [];
        
        const config: WorkflowConfig = {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          inputParameters: inputParameters.map((p: any) => ({
            name: p.name,
            type: p.type || 'string',
            required: p.required || false,
            description: p.description,
          })),
          outputParameters: outputParameters.map((p: any) => ({
            name: p.name,
            type: p.type || 'object',
            description: p.description,
          })),
        };
        
        setWorkflowConfig(config);
      }
    } catch (error) {
      console.error('加载工作流配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: any) => {
    try {
      await aiSearchService.saveFieldMappingConfig(workflowId, config);
      onSave();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!workflowConfig) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600">工作流配置不存在</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <FieldMappingConfig
      workflowConfig={workflowConfig}
      onClose={onClose}
      onSave={handleSave}
    />
  );
};

export default FieldMappingConfigModal;

