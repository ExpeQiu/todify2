import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Save, Code, Sparkles, Info, Eye } from "lucide-react";
import {
  WorkflowConfig,
  FieldMappingConfig as FieldMappingConfigType,
  FieldMappingRule,
  OutputMappingRule,
  FeatureObjectType,
} from "../../types/aiSearch";
import api from "../../services/api";
import { agentWorkflowService } from "../../services/agentWorkflowService";
import { AgentWorkflow } from "../../types/agentWorkflow";

interface FieldMappingConfigProps {
  workflowConfig: WorkflowConfig | null;
  onClose: () => void;
  onSave: (config: FieldMappingConfigType) => void;
}

const FieldMappingConfig: React.FC<FieldMappingConfigProps> = ({
  workflowConfig,
  onClose,
  onSave,
}) => {
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    workflowConfig?.id || ""
  );
  const [currentWorkflowConfig, setCurrentWorkflowConfig] = useState<WorkflowConfig | null>(
    workflowConfig
  );
  const [config, setConfig] = useState<FieldMappingConfigType>({
    workflowId: workflowConfig?.id || "",
    inputMappings: [],
    outputMappings: [],
    featureObjects: [],
  });

  const [loading, setLoading] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<FeatureObjectType | null>(null);
  const [sampleInputText, setSampleInputText] = useState<string>(() =>
    JSON.stringify(
      {
        query: "请根据以下资料生成专家分析摘要",
        sources: [
          {
            id: "kb_101",
            title: "产品X-技术亮点",
            type: "knowledge_base",
            description: "核心指标、竞品对比等信息",
          },
        ],
        files: [],
        history: [
          { role: "user", content: "产品X的独特价值是什么？" },
          { role: "assistant", content: "产品X提供高性能、低功耗的指标表现。" },
        ],
        summary: "用户关注产品X优势，提供差异化亮点",
        keyPhrases: ["性能领先", "节能高效"],
      },
      null,
      2
    )
  );
  const [sampleOutputText, setSampleOutputText] = useState<string>(() =>
    JSON.stringify(
      {
        text: "产品X在性能与能耗方面具有显著优势，建议突出节能卖点。",
        structured: {
          title: "产品X卖点提炼",
          bulletPoints: ["性能领先", "节能高效", "适配多场景"],
        },
        attachments: [],
      },
      null,
      2
    )
  );

  const parseJSON = (text: string) => {
    if (!text?.trim()) {
      return { data: null, error: "未提供示例数据，将使用空对象预览" };
    }
    try {
      return { data: JSON.parse(text), error: null };
    } catch (error: any) {
      return { data: null, error: error?.message || "JSON 解析失败" };
    }
  };

  const sampleInputParsed = useMemo(() => parseJSON(sampleInputText), [sampleInputText]);
  const sampleInputData = sampleInputParsed.data || {};

  const sampleOutputParsed = useMemo(() => parseJSON(sampleOutputText), [sampleOutputText]);
  const sampleOutputData = sampleOutputParsed.data || {};

  const expressionSnippets: Array<{ label: string; value: string }> = [
    { label: "合并来源标题", value: "sources.map(item => item.title).join('、')" },
    { label: "最近一条用户消息", value: "history.filter(msg => msg.role === 'user').slice(-1)[0]?.content" },
    { label: "历史摘要回退", value: "summary || query" },
    { label: "提取关键短语", value: "(keyPhrases || []).join(', ')" },
  ];

  const inputPreview = useMemo(() => {
    if (!Array.isArray(config.inputMappings) || !sampleInputData) {
      return { result: {}, errors: {} as Record<string, string> };
    }

    const result: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    config.inputMappings.forEach((mapping) => {
      if (!mapping?.workflowInputName) {
        return;
      }

      try {
        let value: unknown;
        if (mapping.sourceType === "expression") {
          const expression = mapping.expression || "";
          const evaluator = new Function(
            "query",
            "sources",
            "files",
            "history",
            "summary",
            "keyPhrases",
            "context",
            `return (${expression});`
          );
          value = evaluator(
            sampleInputData.query,
            sampleInputData.sources,
            sampleInputData.files,
            sampleInputData.history || [],
            sampleInputData.summary,
            sampleInputData.keyPhrases || [],
            sampleInputData
          );
        } else if (mapping.sourceField) {
          value = sampleInputData[mapping.sourceField];
        }

        if (
          (value === undefined || value === null || value === "") &&
          mapping.defaultValue !== undefined
        ) {
          value = mapping.defaultValue;
        }

        result[mapping.workflowInputName] = value;
      } catch (error: any) {
        errors[mapping.workflowInputName] =
          error?.message || "表达式执行失败，请检查语法";
      }
    });

    return { result, errors };
  }, [config.inputMappings, sampleInputData]);

  const outputPreview = useMemo(() => {
    if (!Array.isArray(config.outputMappings) || !sampleOutputData) {
      return { result: {}, errors: {} as Record<string, string> };
    }

    const result: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    config.outputMappings.forEach((mapping) => {
      if (!mapping?.workflowOutputName || !mapping.extractExpression) {
        return;
      }

      try {
        const evaluator = new Function(
          "output",
          "workflowResult",
          "context",
          `return (${mapping.extractExpression});`
        );
        const value = evaluator(
          sampleOutputData,
          { data: sampleOutputData },
          sampleInputData
        );
        result[mapping.workflowOutputName] = mapping.targetField === "content"
          ? value
          : {
              targetField: mapping.targetField,
              value,
            };
      } catch (error: any) {
        errors[mapping.workflowOutputName] =
          error?.message || "表达式执行失败，请检查语法";
      }
    });

    return { result, errors };
  }, [config.outputMappings, sampleOutputData, sampleInputData]);
  
  // 功能对象列表
  const featureObjects: { value: FeatureObjectType; label: string }[] = [
    { value: 'ai-dialog', label: 'AI对话框' },
    { value: 'five-view-analysis', label: '五看分析' },
    { value: 'three-fix-analysis', label: '三定分析' },
    { value: 'tech-matrix', label: '技术矩阵' },
    { value: 'propagation-strategy', label: '传播策略' },
    { value: 'exhibition-video', label: '展具与视频' },
    { value: 'translation', label: '翻译' },
    { value: 'ppt-outline', label: 'PPT大纲' },
    { value: 'script', label: '脚本' },
  ];

  // 可用的AI对话字段
  const availableFields = [
    { value: "query", label: "用户问题 (query)" },
    { value: "sources", label: "来源列表 (sources)" },
    { value: "files", label: "文件列表 (files)" },
    { value: "history", label: "对话历史 (history)" },
    { value: "summary", label: "历史摘要 (summary)" },
    { value: "keyPhrases", label: "关键短语 (keyPhrases)" },
  ];

  // 可用的目标字段
  const availableTargetFields = [
    { value: "content", label: "文本内容 (content)" },
    { value: "files", label: "文件列表 (files)" },
    { value: "metadata", label: "元数据 (metadata)" },
  ];

  // 加载配置
  useEffect(() => {
    loadWorkflows();
  }, []);

  // 当选择的工作流改变时，加载对应的配置
  useEffect(() => {
    if (selectedWorkflowId && selectedFeatureType) {
      loadWorkflowConfig(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      const workflowList = await agentWorkflowService.getAllWorkflows();
      setWorkflows(workflowList);
      
      // 如果没有初始工作流配置，选择第一个工作流
      if (!workflowConfig && workflowList.length > 0) {
        setSelectedWorkflowId(workflowList[0].id);
      }
    } catch (error) {
      console.error("加载工作流列表失败:", error);
    }
  };

  // 转换工作流为配置格式
  const convertWorkflowToConfig = (workflow: AgentWorkflow): WorkflowConfig => {
    const inputNode = workflow.nodes?.find((n: any) => n.type === 'input');
    const outputNode = workflow.nodes?.find((n: any) => n.type === 'output');
    
    const inputParameters = inputNode?.data?.inputs || [];
    const outputParameters = outputNode?.data?.outputs || [];
    
    return {
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
  };

  // 加载工作流配置和字段映射配置
  const loadWorkflowConfig = async (workflowId: string) => {
    try {
      setLoading(true);
      
      // 获取工作流详情
      const workflow = workflows.find((w) => w.id === workflowId);
      if (!workflow) {
        const workflowList = await agentWorkflowService.getAllWorkflows();
        const foundWorkflow = workflowList.find((w) => w.id === workflowId);
        if (foundWorkflow) {
          const workflowConfig = convertWorkflowToConfig(foundWorkflow);
          setCurrentWorkflowConfig(workflowConfig);
          
          // 加载字段映射配置
          await loadConfig(workflowId, workflowConfig);
        }
      } else {
        const workflowConfig = convertWorkflowToConfig(workflow);
        setCurrentWorkflowConfig(workflowConfig);
        
        // 加载字段映射配置
        await loadConfig(workflowId, workflowConfig);
      }
    } catch (error) {
      console.error("加载工作流配置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (workflowId: string, workflowConfig: WorkflowConfig) => {
    try {
      const response = await api.get(`/ai-search/field-mappings/${workflowId}`);
      if (response.data.success && response.data.data) {
        const loadedConfig = response.data.data;
        
        // 如果当前选择的功能对象有配置，加载其配置
        if (selectedFeatureType) {
          const featureConfig = loadedConfig.featureObjects?.find(
            f => f.featureType === selectedFeatureType && f.workflowId === workflowId
          );
          
          if (featureConfig) {
            setConfig({
              ...loadedConfig,
              workflowId: featureConfig.workflowId,
              inputMappings: featureConfig.inputMappings,
              outputMappings: featureConfig.outputMappings,
            });
          } else {
            // 如果没有找到功能对象配置，使用默认配置
            initializeDefaultConfig(workflowConfig);
          }
        } else {
          // 如果没有选择功能对象，使用默认配置
          setConfig(loadedConfig);
        }
      } else {
        // 初始化默认配置
        initializeDefaultConfig(workflowConfig);
      }
    } catch (error) {
      console.error("加载字段映射配置失败:", error);
      // 如果不存在，初始化默认配置
      initializeDefaultConfig(workflowConfig);
    }
  };

  const initializeDefaultConfig = (workflowConfig: WorkflowConfig) => {
    if (!workflowConfig) return;

    const inputMappings: FieldMappingRule[] = workflowConfig.inputParameters.map(
      (param) => {
        // 尝试智能匹配
        let defaultMapping: FieldMappingRule = {
          workflowInputName: param.name,
          sourceType: "field",
          sourceField: "query",
        };

        // 根据参数名智能匹配
        const paramNameLower = param.name.toLowerCase();
        if (paramNameLower.includes("query") || paramNameLower.includes("question")) {
          defaultMapping.sourceField = "query";
        } else if (
          paramNameLower.includes("source") ||
          paramNameLower.includes("knowledge")
        ) {
          defaultMapping.sourceField = "sources";
        } else if (paramNameLower.includes("file")) {
          defaultMapping.sourceField = "files";
        }

        return defaultMapping;
      }
    );

    const outputMappings: OutputMappingRule[] =
      workflowConfig.outputParameters.map((param) => ({
        workflowOutputName: param.name,
        targetField: "content",
        extractExpression: `output.${param.name}`,
      }));

    setConfig({
      workflowId: workflowConfig.id,
      inputMappings,
      outputMappings,
    });
  };

  const handleSave = async () => {
    if (!selectedWorkflowId || !selectedFeatureType) {
      alert("请先选择功能对象和工作流");
      return;
    }

    try {
      setLoading(true);
      
      // 构建功能对象配置
      const featureConfig: FeatureObjectConfig = {
        featureType: selectedFeatureType,
        workflowId: selectedWorkflowId,
        inputMappings: config.inputMappings,
        outputMappings: config.outputMappings,
      };

      // 更新功能对象配置列表
      const updatedFeatureObjects = config.featureObjects 
        ? [...config.featureObjects.filter(f => f.featureType !== selectedFeatureType), featureConfig]
        : [featureConfig];

      const configToSave: FieldMappingConfigType = {
        ...config,
        workflowId: selectedWorkflowId, // 向后兼容
        featureObjects: updatedFeatureObjects,
      };

      const response = await api.post(
        `/ai-search/field-mappings/${selectedWorkflowId}`,
        configToSave
      );
      if (response.data.success) {
        onSave(configToSave);
        alert(`功能对象"${featureObjects.find(f => f.value === selectedFeatureType)?.label}"的配置已保存`);
        // 不清空选择，允许继续配置其他功能对象
      } else {
        alert("保存失败: " + (response.data.error || "未知错误"));
      }
    } catch (error: any) {
      console.error("保存字段映射配置失败:", error);
      alert("保存失败: " + (error?.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    
    // 如果当前功能对象已有配置，保留其配置
    if (selectedFeatureType) {
      const existingConfig = config.featureObjects?.find(
        f => f.featureType === selectedFeatureType
      );
      
      if (existingConfig && existingConfig.workflowId === workflowId) {
        // 如果工作流相同，保留现有映射
        setConfig({
          ...config,
          workflowId,
          inputMappings: existingConfig.inputMappings,
          outputMappings: existingConfig.outputMappings,
        });
      } else {
        // 如果工作流不同，重置映射
        setConfig({
          ...config,
          workflowId,
          inputMappings: [],
          outputMappings: [],
        });
      }
    } else {
      setConfig({
        ...config,
        workflowId,
        inputMappings: [],
        outputMappings: [],
      });
    }
  };

  const updateInputMapping = (
    index: number,
    updates: Partial<FieldMappingRule>
  ) => {
    const newMappings = [...config.inputMappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    setConfig({ ...config, inputMappings: newMappings });
  };

  const addInputMapping = () => {
    if (!currentWorkflowConfig) return;

    const newMapping: FieldMappingRule = {
      workflowInputName: "",
      sourceType: "field",
      sourceField: "query",
    };
    setConfig({
      ...config,
      inputMappings: [...config.inputMappings, newMapping],
    });
  };

  const removeInputMapping = (index: number) => {
    const newMappings = config.inputMappings.filter((_, i) => i !== index);
    setConfig({ ...config, inputMappings: newMappings });
  };

  const updateOutputMapping = (
    index: number,
    updates: Partial<OutputMappingRule>
  ) => {
    const newMappings = [...config.outputMappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    setConfig({ ...config, outputMappings: newMappings });
  };

  const addOutputMapping = () => {
    if (!currentWorkflowConfig) return;

    const newMapping: OutputMappingRule = {
      workflowOutputName: "",
      targetField: "content",
      extractExpression: "output.text",
    };
    setConfig({
      ...config,
      outputMappings: [...config.outputMappings, newMapping],
    });
  };

  const removeOutputMapping = (index: number) => {
    const newMappings = config.outputMappings.filter((_, i) => i !== index);
    setConfig({ ...config, outputMappings: newMappings });
  };

  if (!currentWorkflowConfig && workflows.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-gray-600">加载工作流列表中...</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            字段映射配置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 功能对象选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            需配置的功能对象
          </label>
          <div className="grid grid-cols-3 gap-3">
            {featureObjects.map((feature) => {
              const featureConfig = config.featureObjects?.find(
                f => f.featureType === feature.value
              );
              const isSelected = selectedFeatureType === feature.value;
              const hasConfig = !!featureConfig;
              
              return (
                <button
                  key={feature.value}
                  onClick={() => {
                    if (hasConfig) {
                      setSelectedFeatureType(feature.value);
                      setSelectedWorkflowId(featureConfig.workflowId);
                      setConfig({
                        ...config,
                        workflowId: featureConfig.workflowId,
                        inputMappings: featureConfig.inputMappings,
                        outputMappings: featureConfig.outputMappings,
                      });
                      loadWorkflowConfig(featureConfig.workflowId);
                    } else {
                      setSelectedFeatureType(feature.value);
                      setSelectedWorkflowId('');
                      setConfig({
                        ...config,
                        workflowId: '',
                        inputMappings: [],
                        outputMappings: [],
                      });
                      setCurrentWorkflowConfig(null);
                    }
                  }}
                  className={`px-4 py-3 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : hasConfig
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{feature.label}</span>
                    {hasConfig && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        已配置
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工作流选择 */}
        {selectedFeatureType && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择工作流
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => handleWorkflowChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择工作流</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {currentWorkflowConfig && selectedFeatureType && (
          <div className="mb-4 text-sm text-gray-600">
            功能对象: <span className="font-medium">{featureObjects.find(f => f.value === selectedFeatureType)?.label}</span>
            {' | '}
            工作流: <span className="font-medium">{currentWorkflowConfig.name}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : !selectedFeatureType ? (
          <div className="text-center py-8 text-gray-500">
            请先选择一个功能对象
          </div>
        ) : currentWorkflowConfig ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-gray-900">示例对话上下文</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    用于预览输入映射。可粘贴实际的 query/sources/files/history 等数据。
                  </p>
                  <textarea
                    className="w-full h-48 font-mono text-xs bg-gray-50 border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sampleInputText}
                    onChange={(event) => setSampleInputText(event.target.value)}
                    spellCheck={false}
                  />
                  {sampleInputParsed.error && (
                    <p className="mt-2 text-xs text-red-600">
                      JSON 解析失败：{sampleInputParsed.error}
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-gray-900">示例工作流输出</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    用于预览输出映射。可粘贴一次真实执行的工作流返回结果。
                  </p>
                  <textarea
                    className="w-full h-40 font-mono text-xs bg-gray-50 border border-gray-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={sampleOutputText}
                    onChange={(event) => setSampleOutputText(event.target.value)}
                    spellCheck={false}
                  />
                  {sampleOutputParsed.error && (
                    <p className="mt-2 text-xs text-red-600">
                      JSON 解析失败：{sampleOutputParsed.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-900">输入映射预览</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    基于示例上下文实时计算映射结果。表达式错误会显示在下方。
                  </p>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-white border border-blue-100 rounded-md p-3 max-h-48 overflow-auto">
                    {JSON.stringify(inputPreview.result, null, 2)}
                  </pre>
                  {Object.keys(inputPreview.errors).length > 0 && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-600 mb-2">表达式错误</p>
                      <ul className="space-y-1 text-xs text-red-600">
                        {Object.entries(inputPreview.errors).map(([field, message]) => (
                          <li key={field}>
                            <span className="font-medium">{field}</span>：{message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-green-200 rounded-lg p-4 bg-green-50/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <h3 className="text-sm font-semibold text-gray-900">输出映射预览</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    基于示例工作流输出计算提取结果，帮助验证表达式是否正确。
                  </p>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-white border border-green-100 rounded-md p-3 max-h-48 overflow-auto">
                    {JSON.stringify(outputPreview.result, null, 2)}
                  </pre>
                  {Object.keys(outputPreview.errors).length > 0 && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-600 mb-2">表达式错误</p>
                      <ul className="space-y-1 text-xs text-red-600">
                        {Object.entries(outputPreview.errors).map(([field, message]) => (
                          <li key={field}>
                            <span className="font-medium">{field}</span>：{message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 输入字段映射 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  输入字段映射
                </h3>
                <button
                  onClick={addInputMapping}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加映射
                </button>
              </div>

              <div className="space-y-4">
                {currentWorkflowConfig.inputParameters.map((param, index) => {
                  const mapping = config.inputMappings.find(
                    (m) => m.workflowInputName === param.name
                  );
                  const mappingIndex = mapping
                    ? config.inputMappings.indexOf(mapping)
                    : -1;

                  if (mappingIndex === -1) {
                    // 如果还没有映射，创建一个
                    const newMapping: FieldMappingRule = {
                      workflowInputName: param.name,
                      sourceType: "field",
                      sourceField: "query",
                    };
                    return (
                      <div
                        key={param.name}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {param.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({param.type})
                            </span>
                            {param.required && (
                              <span className="text-xs text-red-500 ml-2">
                                必需
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newMappings = [...config.inputMappings];
                              newMappings.push(newMapping);
                              setConfig({
                                ...config,
                                inputMappings: newMappings,
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            添加映射
                          </button>
                        </div>
                        {param.description && (
                          <p className="text-xs text-gray-500 mb-2">
                            {param.description}
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={param.name}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {param.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({param.type})
                          </span>
                          {param.required && (
                            <span className="text-xs text-red-500 ml-2">
                              必需
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeInputMapping(mappingIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {param.description && (
                        <p className="text-xs text-gray-500 mb-3">
                          {param.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            映射类型
                          </label>
                          <select
                            value={mapping.sourceType}
                            onChange={(e) =>
                              updateInputMapping(mappingIndex, {
                                sourceType: e.target.value as "field" | "expression",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="field">字段映射</option>
                            <option value="expression">表达式映射</option>
                          </select>
                        </div>

                        {mapping.sourceType === "field" ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                源字段
                              </label>
                              <select
                                value={mapping.sourceField || ""}
                                onChange={(e) =>
                                  updateInputMapping(mappingIndex, {
                                    sourceField: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {availableFields.map((field) => (
                                  <option key={field.value} value={field.value}>
                                    {field.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                默认值（可选）
                              </label>
                              <input
                                type="text"
                                value={mapping.defaultValue || ""}
                                onChange={(e) =>
                                  updateInputMapping(mappingIndex, {
                                    defaultValue: e.target.value,
                                  })
                                }
                                placeholder="当源字段为空时使用"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                表达式
                              </label>
                              <textarea
                                value={mapping.expression || ""}
                                onChange={(e) =>
                                  updateInputMapping(mappingIndex, {
                                    expression: e.target.value,
                                  })
                                }
                                placeholder='例如: sources.map(s => s.title).join(", ")'
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                可用变量: query, sources, files, history, summary, keyPhrases
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {expressionSnippets.map((snippet) => (
                                  <button
                                    key={snippet.label}
                                    type="button"
                                    onClick={() => {
                                      const current = mapping.expression || "";
                                      const suggestion = snippet.value;
                                      const newExpression = current
                                        ? `${current}\n${suggestion}`
                                        : suggestion;
                                      updateInputMapping(mappingIndex, {
                                        expression: newExpression,
                                      });
                                    }}
                                    className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {snippet.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                默认值（可选）
                              </label>
                              <input
                                type="text"
                                value={mapping.defaultValue || ""}
                                onChange={(e) =>
                                  updateInputMapping(mappingIndex, {
                                    defaultValue: e.target.value,
                                  })
                                }
                                placeholder="当表达式结果为空时使用"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 输出字段映射 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  输出字段映射
                </h3>
                <button
                  onClick={addOutputMapping}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加映射
                </button>
              </div>

              <div className="space-y-4">
                {currentWorkflowConfig.outputParameters.map((param, index) => {
                  const mapping = config.outputMappings.find(
                    (m) => m.workflowOutputName === param.name
                  );
                  const mappingIndex = mapping
                    ? config.outputMappings.indexOf(mapping)
                    : -1;

                  if (mappingIndex === -1) {
                    const newMapping: OutputMappingRule = {
                      workflowOutputName: param.name,
                      targetField: "content",
                      extractExpression: `output.${param.name}`,
                    };
                    return (
                      <div
                        key={param.name}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {param.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({param.type})
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const newMappings = [...config.outputMappings];
                              newMappings.push(newMapping);
                              setConfig({
                                ...config,
                                outputMappings: newMappings,
                              });
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            添加映射
                          </button>
                        </div>
                        {param.description && (
                          <p className="text-xs text-gray-500 mb-2">
                            {param.description}
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={param.name}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {param.name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({param.type})
                          </span>
                        </div>
                        <button
                          onClick={() => removeOutputMapping(mappingIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {param.description && (
                        <p className="text-xs text-gray-500 mb-3">
                          {param.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            目标字段
                          </label>
                          <select
                            value={mapping.targetField}
                            onChange={(e) =>
                              updateOutputMapping(mappingIndex, {
                                targetField: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {availableTargetFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            提取表达式
                          </label>
                          <input
                            type="text"
                            value={mapping.extractExpression}
                            onChange={(e) =>
                              updateOutputMapping(mappingIndex, {
                                extractExpression: e.target.value,
                              })
                            }
                            placeholder='例如: output.text 或 output.files'
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            使用 output.参数名 访问工作流输出
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !selectedWorkflowId || !selectedFeatureType}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                保存配置
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            请选择一个工作流
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldMappingConfig;

