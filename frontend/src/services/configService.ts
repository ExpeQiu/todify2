// 配置服务 - 管理Dify API配置和工作流配置

export interface DifyAPIConfig {
  id: string;
  name: string;
  description: string;
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkflowStepConfig {
  stepId: number;
  stepName: string;
  stepKey: string;
  difyConfigId: string;
  customPrompt?: string;
  enabled?: boolean;
}

// 新增：智能工作流节点配置
export interface SmartWorkflowNodeConfig {
  id: string;
  name: string;
  description: string;
  connectionType: 'chatflow' | 'workflow';
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 新增：独立页面配置
export interface IndependentPageConfig {
  id: string;
  name: string;
  description: string;
  connectionType: 'chatflow';
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface DifyAPITestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

class ConfigService {
  private readonly STORAGE_KEYS = {
    DIFY_CONFIGS: 'difyConfigs',
    WORKFLOW_CONFIGS: 'workflowConfigs',
    SMART_WORKFLOW_CONFIGS: 'smartWorkflowConfigs',
    INDEPENDENT_PAGE_CONFIGS: 'independentPageConfigs',
  };

  // 默认的工作流步骤配置
  private readonly DEFAULT_WORKFLOW_STEPS: Omit<WorkflowStepConfig, 'difyConfigId'>[] = [
    { stepId: 1, stepName: "AI问答", stepKey: "smartSearch" },
    { stepId: 2, stepName: "技术包装", stepKey: "techPackage" },
    { stepId: 3, stepName: "技术策略", stepKey: "techStrategy" },
    { stepId: 4, stepName: "技术推广策略", stepKey: "promotionStrategy" },
    { stepId: 5, stepName: "技术通稿", stepKey: "coreDraft" },
    { stepId: 6, stepName: "发布会演讲稿", stepKey: "speechGeneration" },
  ];

  // 默认的Dify API配置
  private readonly DEFAULT_DIFY_CONFIGS: DifyAPIConfig[] = [
    {
      id: "default-ai-search",
      name: "AI问答模型",
      description: "用于处理用户问答的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-t1X4eu8B4eucyO6IfrTbw1t2",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-tech-package",
      name: "技术包装模型",
      description: "用于技术内容包装的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-YDVb91faDHwTqIei4WWSNaTM",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-tech-strategy",
      name: "技术策略模型",
      description: "用于生成技术策略的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-awRZf7tKfvC73DEVANAGGNr8",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-promotion-strategy",
      name: "推广策略模型",
      description: "用于生成技术推广策略的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-awRZf7tKfvC73DEVANAGGNr8",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-core-draft",
      name: "通稿生成模型",
      description: "用于生成技术通稿的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-3TK9U2F3WwFP7vOoq0Ut84KA",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "default-speech-generation",
      name: "演讲稿生成模型",
      description: "用于生成发布会演讲稿的Dify API配置",
      apiUrl: "http://47.113.225.93:9999/v1",
      apiKey: "app-WcV5IDjuNKbOKIBDPWdb7HF4",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 智能工作流节点默认配置
  private readonly DEFAULT_SMART_WORKFLOW_CONFIGS: SmartWorkflowNodeConfig[] = [
    {
      id: "smart-workflow-ai-qa",
      name: "AI问答",
      description: "智能工作流中的AI问答节点",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-t1X4eu8B4eucyO6IfrTbw1t2",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "smart-workflow-tech-package",
      name: "技术包装",
      description: "智能工作流中的技术包装节点",
      connectionType: "workflow",
      apiUrl: "http://47.113.225.93:9999/v1/workflows/run",
      apiKey: "app-YDVb91faDHwTqIei4WWSNaTM",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "smart-workflow-tech-strategy",
      name: "技术策略",
      description: "智能工作流中的技术策略节点",
      connectionType: "workflow",
      apiUrl: "http://47.113.225.93:9999/v1/workflows/run",
      apiKey: "app-awRZf7tKfvC73DEVANAGGNr8",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "smart-workflow-tech-article",
      name: "技术通稿",
      description: "智能工作流中的技术通稿节点",
      connectionType: "workflow",
      apiUrl: "http://47.113.225.93:9999/v1/workflows/run",
      apiKey: "app-3TK9U2F3WwFP7vOoq0Ut84KA",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "smart-workflow-speech",
      name: "发布会稿",
      description: "智能工作流中的发布会稿节点",
      connectionType: "workflow",
      apiUrl: "http://47.113.225.93:9999/v1/workflows/run",
      apiKey: "app-WcV5IDjuNKbOKIBDPWdb7HF4",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 独立页面默认配置
  private readonly DEFAULT_INDEPENDENT_PAGE_CONFIGS: IndependentPageConfig[] = [
    {
      id: "independent-ai-qa",
      name: "AI问答",
      description: "独立页面中的AI问答功能",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-HC8dx24idIWm1uva66VmHXsm",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "independent-tech-package",
      name: "技术包装",
      description: "独立页面中的技术包装功能",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-GgD3uUNDWOFu7DlBgSVkIrIt",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "independent-tech-strategy",
      name: "技术策略",
      description: "独立页面中的技术策略功能",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-DesVds4LQch6k7Unu7KpBCS4",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "independent-tech-article",
      name: "技术通稿",
      description: "独立页面中的技术通稿功能",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-c7HLp8OGiTgnpvg5cIYqQCYZ",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "independent-tech-publish",
      name: "技术发布",
      description: "独立页面中的技术发布功能",
      connectionType: "chatflow",
      apiUrl: "http://47.113.225.93:9999/v1/chat-messages",
      apiKey: "app-iAiKRQ7h8zCwkz2TBkezgtGs",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * 获取所有Dify API配置
   */
  async getDifyConfigs(): Promise<DifyAPIConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.DIFY_CONFIGS);
      if (stored) {
        const configs = JSON.parse(stored);
        // 检查是否有技术包装配置，如果没有或API Key不正确，强制更新
        const techPackageConfig = configs.find((config: any) => config.id === 'default-tech-package');
        if (!techPackageConfig || techPackageConfig.apiKey !== 'app-YDVb91faDHwTqIei4WWSNaTM') {
          console.log('技术包装配置需要更新，强制使用默认配置');
          await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
          return this.DEFAULT_DIFY_CONFIGS;
        }
        
        // 确保日期对象正确解析
        return configs.map((config: any) => ({
          ...config,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        }));
      }
      
      // 如果没有存储的配置，返回默认配置
      await this.saveDifyConfigs(this.DEFAULT_DIFY_CONFIGS);
      return this.DEFAULT_DIFY_CONFIGS;
    } catch (error) {
      console.error('获取Dify配置失败:', error);
      return this.DEFAULT_DIFY_CONFIGS;
    }
  }

  /**
   * 保存Dify API配置
   */
  async saveDifyConfigs(configs: DifyAPIConfig[]): Promise<ConfigResponse> {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date(),
      }));
      
      localStorage.setItem(this.STORAGE_KEYS.DIFY_CONFIGS, JSON.stringify(configsWithTimestamp));
      return { success: true, message: 'Dify配置保存成功' };
    } catch (error) {
      console.error('保存Dify配置失败:', error);
      return { success: false, message: '保存Dify配置失败' };
    }
  }

  /**
   * 获取单个Dify API配置
   */
  async getDifyConfig(id: string): Promise<DifyAPIConfig | null> {
    const configs = await this.getDifyConfigs();
    return configs.find(config => config.id === id) || null;
  }

  /**
   * 添加新的Dify API配置
   */
  async addDifyConfig(config: Omit<DifyAPIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const newConfig: DifyAPIConfig = {
        ...config,
        id: `dify-config-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      configs.push(newConfig);
      const result = await this.saveDifyConfigs(configs);
      
      if (result.success) {
        return { success: true, message: '配置添加成功', data: newConfig };
      }
      return result;
    } catch (error) {
      console.error('添加Dify配置失败:', error);
      return { success: false, message: '添加配置失败' };
    }
  }

  /**
   * 更新Dify API配置
   */
  async updateDifyConfig(id: string, updates: Partial<DifyAPIConfig>): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const index = configs.findIndex(config => config.id === id);
      
      if (index === -1) {
        return { success: false, message: '配置不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        id, // 确保ID不被修改
        updatedAt: new Date(),
      };
      
      return await this.saveDifyConfigs(configs);
    } catch (error) {
      console.error('更新Dify配置失败:', error);
      return { success: false, message: '更新配置失败' };
    }
  }

  /**
   * 删除Dify API配置
   */
  async deleteDifyConfig(id: string): Promise<ConfigResponse> {
    try {
      const configs = await this.getDifyConfigs();
      const filteredConfigs = configs.filter(config => config.id !== id);
      
      if (filteredConfigs.length === configs.length) {
        return { success: false, message: '配置不存在' };
      }
      
      const result = await this.saveDifyConfigs(filteredConfigs);
      
      if (result.success) {
        // 同时更新工作流配置，将使用该配置的步骤重置
        await this.resetWorkflowConfigsUsingDifyConfig(id);
      }
      
      return result;
    } catch (error) {
      console.error('删除Dify配置失败:', error);
      return { success: false, message: '删除配置失败' };
    }
  }

  /**
   * 测试Dify API连接
   */
  async testDifyConnection(config: DifyAPIConfig): Promise<DifyAPITestResult> {
    const startTime = Date.now();
    
    try {
      if (!config.apiUrl || !config.apiKey) {
        return {
          success: false,
          message: 'API地址和密钥不能为空',
        };
      }

      // 使用Dify API的实际端点进行测试
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // 构建正确的Dify API测试请求
      const testUrl = `${config.apiUrl}/chat-messages`;
      const testPayload = {
        inputs: {},
        query: "Hello, this is a connection test.",
        response_mode: "blocking",
        conversation_id: "",
        user: "test-user"
      };
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      }).catch((error) => {
        console.error('Fetch error:', error);
        return null;
      });
      
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response) {
        if (response.ok) {
          return {
            success: true,
            message: `连接测试成功 (${responseTime}ms)`,
            responseTime,
          };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            message: `连接测试失败: HTTP ${response.status} - ${errorText} (${responseTime}ms)`,
            responseTime,
          };
        }
      } else {
        return {
          success: false,
          message: `连接测试失败，请检查API地址和密钥 (${responseTime}ms)`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = '未知错误';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        message: `连接测试失败: ${errorMessage} (${responseTime}ms)`,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 获取工作流配置
   */
  async getWorkflowConfigs(): Promise<WorkflowStepConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // 如果没有存储的配置，创建默认配置
      const difyConfigs = await this.getDifyConfigs();
      const defaultWorkflowConfigs: WorkflowStepConfig[] = this.DEFAULT_WORKFLOW_STEPS.map((step, index) => ({
        ...step,
        difyConfigId: difyConfigs[index]?.id || difyConfigs[0]?.id || '',
        enabled: true,
      }));
      
      await this.saveWorkflowConfigs(defaultWorkflowConfigs);
      return defaultWorkflowConfigs;
    } catch (error) {
      console.error('获取工作流配置失败:', error);
      return [];
    }
  }

  /**
   * 保存工作流配置
   */
  async saveWorkflowConfigs(configs: WorkflowStepConfig[]): Promise<ConfigResponse> {
    try {
      localStorage.setItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS, JSON.stringify(configs));
      return { success: true, message: '工作流配置保存成功' };
    } catch (error) {
      console.error('保存工作流配置失败:', error);
      return { success: false, message: '保存工作流配置失败' };
    }
  }

  /**
   * 更新工作流步骤配置
   */
  async updateWorkflowStepConfig(
    stepId: number, 
    updates: Partial<WorkflowStepConfig>
  ): Promise<ConfigResponse> {
    try {
      const configs = await this.getWorkflowConfigs();
      const index = configs.findIndex(config => config.stepId === stepId);
      
      if (index === -1) {
        return { success: false, message: '工作流步骤不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        stepId, // 确保stepId不被修改
      };
      
      return await this.saveWorkflowConfigs(configs);
    } catch (error) {
      console.error('更新工作流配置失败:', error);
      return { success: false, message: '更新工作流配置失败' };
    }
  }

  /**
   * 根据步骤获取对应的Dify配置
   */
  async getDifyConfigForStep(stepId: number): Promise<DifyAPIConfig | null> {
    try {
      const workflowConfigs = await this.getWorkflowConfigs();
      const stepConfig = workflowConfigs.find(config => config.stepId === stepId);
      
      if (!stepConfig || !stepConfig.difyConfigId) {
        return null;
      }
      
      return await this.getDifyConfig(stepConfig.difyConfigId);
    } catch (error) {
      console.error('获取步骤对应的Dify配置失败:', error);
      return null;
    }
  }

  /**
   * 重置使用指定Dify配置的工作流步骤
   */
  private async resetWorkflowConfigsUsingDifyConfig(difyConfigId: string): Promise<void> {
    try {
      const workflowConfigs = await this.getWorkflowConfigs();
      const difyConfigs = await this.getDifyConfigs();
      const fallbackConfigId = difyConfigs[0]?.id || '';
      
      const updatedConfigs = workflowConfigs.map(config =>
        config.difyConfigId === difyConfigId
          ? { ...config, difyConfigId: fallbackConfigId }
          : config
      );
      
      await this.saveWorkflowConfigs(updatedConfigs);
    } catch (error) {
      console.error('重置工作流配置失败:', error);
    }
  }

  /**
   * 导出配置
   */
  async exportConfigs(): Promise<{ difyConfigs: DifyAPIConfig[], workflowConfigs: WorkflowStepConfig[] }> {
    const difyConfigs = await this.getDifyConfigs();
    const workflowConfigs = await this.getWorkflowConfigs();
    
    return {
      difyConfigs,
      workflowConfigs,
    };
  }

  /**
   * 导入配置
   */
  async importConfigs(data: {
    difyConfigs?: DifyAPIConfig[],
    workflowConfigs?: WorkflowStepConfig[]
  }): Promise<ConfigResponse> {
    try {
      if (data.difyConfigs) {
        await this.saveDifyConfigs(data.difyConfigs);
      }
      
      if (data.workflowConfigs) {
        await this.saveWorkflowConfigs(data.workflowConfigs);
      }
      
      return { success: true, message: '配置导入成功' };
    } catch (error) {
      console.error('导入配置失败:', error);
      return { success: false, message: '导入配置失败' };
    }
  }

  /**
   * 清除所有配置
   */
  async clearAllConfigs(): Promise<ConfigResponse> {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.DIFY_CONFIGS);
      localStorage.removeItem(this.STORAGE_KEYS.WORKFLOW_CONFIGS);
      localStorage.removeItem(this.STORAGE_KEYS.SMART_WORKFLOW_CONFIGS);
      localStorage.removeItem(this.STORAGE_KEYS.INDEPENDENT_PAGE_CONFIGS);
      return { success: true, message: '所有配置已清除' };
    } catch (error) {
      console.error('清除配置失败:', error);
      return { success: false, message: '清除配置失败' };
    }
  }

  // ========== 智能工作流配置管理 ==========

  /**
   * 获取智能工作流节点配置
   */
  async getSmartWorkflowConfigs(): Promise<SmartWorkflowNodeConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SMART_WORKFLOW_CONFIGS);
      if (stored) {
        const configs = JSON.parse(stored);
        return configs.map((config: any) => ({
          ...config,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        }));
      }
      
      // 如果没有存储的配置，返回默认配置
      await this.saveSmartWorkflowConfigs(this.DEFAULT_SMART_WORKFLOW_CONFIGS);
      return this.DEFAULT_SMART_WORKFLOW_CONFIGS;
    } catch (error) {
      console.error('获取智能工作流配置失败:', error);
      return this.DEFAULT_SMART_WORKFLOW_CONFIGS;
    }
  }

  /**
   * 保存智能工作流节点配置
   */
  async saveSmartWorkflowConfigs(configs: SmartWorkflowNodeConfig[]): Promise<ConfigResponse> {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date(),
      }));
      
      localStorage.setItem(this.STORAGE_KEYS.SMART_WORKFLOW_CONFIGS, JSON.stringify(configsWithTimestamp));
      return { success: true, message: '智能工作流配置保存成功' };
    } catch (error) {
      console.error('保存智能工作流配置失败:', error);
      return { success: false, message: '保存智能工作流配置失败' };
    }
  }

  /**
   * 更新智能工作流节点配置
   */
  async updateSmartWorkflowConfig(id: string, updates: Partial<SmartWorkflowNodeConfig>): Promise<ConfigResponse> {
    try {
      const configs = await this.getSmartWorkflowConfigs();
      const index = configs.findIndex(config => config.id === id);
      
      if (index === -1) {
        return { success: false, message: '智能工作流配置不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        id, // 确保ID不被修改
        updatedAt: new Date(),
      };
      
      return await this.saveSmartWorkflowConfigs(configs);
    } catch (error) {
      console.error('更新智能工作流配置失败:', error);
      return { success: false, message: '更新智能工作流配置失败' };
    }
  }

  // ========== 独立页面配置管理 ==========

  /**
   * 获取独立页面配置
   */
  async getIndependentPageConfigs(): Promise<IndependentPageConfig[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.INDEPENDENT_PAGE_CONFIGS);
      if (stored) {
        const configs = JSON.parse(stored);
        return configs.map((config: any) => ({
          ...config,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
          updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
        }));
      }
      
      // 如果没有存储的配置，返回默认配置
      await this.saveIndependentPageConfigs(this.DEFAULT_INDEPENDENT_PAGE_CONFIGS);
      return this.DEFAULT_INDEPENDENT_PAGE_CONFIGS;
    } catch (error) {
      console.error('获取独立页面配置失败:', error);
      return this.DEFAULT_INDEPENDENT_PAGE_CONFIGS;
    }
  }

  /**
   * 保存独立页面配置
   */
  async saveIndependentPageConfigs(configs: IndependentPageConfig[]): Promise<ConfigResponse> {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date(),
      }));
      
      localStorage.setItem(this.STORAGE_KEYS.INDEPENDENT_PAGE_CONFIGS, JSON.stringify(configsWithTimestamp));
      return { success: true, message: '独立页面配置保存成功' };
    } catch (error) {
      console.error('保存独立页面配置失败:', error);
      return { success: false, message: '保存独立页面配置失败' };
    }
  }

  /**
   * 更新独立页面配置
   */
  async updateIndependentPageConfig(id: string, updates: Partial<IndependentPageConfig>): Promise<ConfigResponse> {
    try {
      const configs = await this.getIndependentPageConfigs();
      const index = configs.findIndex(config => config.id === id);
      
      if (index === -1) {
        return { success: false, message: '独立页面配置不存在' };
      }
      
      configs[index] = {
        ...configs[index],
        ...updates,
        id, // 确保ID不被修改
        updatedAt: new Date(),
      };
      
      return await this.saveIndependentPageConfigs(configs);
    } catch (error) {
      console.error('更新独立页面配置失败:', error);
      return { success: false, message: '更新独立页面配置失败' };
    }
  }

  // ========== 统一配置管理 ==========

  /**
   * 导出所有配置（包括新的双配置系统）
   */
  async exportAllConfigs(): Promise<{
    difyConfigs: DifyAPIConfig[],
    workflowConfigs: WorkflowStepConfig[],
    smartWorkflowConfigs: SmartWorkflowNodeConfig[],
    independentPageConfigs: IndependentPageConfig[]
  }> {
    const [difyConfigs, workflowConfigs, smartWorkflowConfigs, independentPageConfigs] = await Promise.all([
      this.getDifyConfigs(),
      this.getWorkflowConfigs(),
      this.getSmartWorkflowConfigs(),
      this.getIndependentPageConfigs()
    ]);

    return {
      difyConfigs,
      workflowConfigs,
      smartWorkflowConfigs,
      independentPageConfigs
    };
  }

  /**
   * 导入所有配置（包括新的双配置系统）
   */
  async importAllConfigs(data: {
    difyConfigs?: DifyAPIConfig[],
    workflowConfigs?: WorkflowStepConfig[],
    smartWorkflowConfigs?: SmartWorkflowNodeConfig[],
    independentPageConfigs?: IndependentPageConfig[]
  }): Promise<ConfigResponse> {
    try {
      const results = await Promise.all([
        data.difyConfigs ? this.saveDifyConfigs(data.difyConfigs) : Promise.resolve({ success: true }),
        data.workflowConfigs ? this.saveWorkflowConfigs(data.workflowConfigs) : Promise.resolve({ success: true }),
        data.smartWorkflowConfigs ? this.saveSmartWorkflowConfigs(data.smartWorkflowConfigs) : Promise.resolve({ success: true }),
        data.independentPageConfigs ? this.saveIndependentPageConfigs(data.independentPageConfigs) : Promise.resolve({ success: true })
      ]);

      const failedResults = results.filter(result => !result.success);
      if (failedResults.length > 0) {
        return { success: false, message: '部分配置导入失败' };
      }

      return { success: true, message: '所有配置导入成功' };
    } catch (error) {
      console.error('导入配置失败:', error);
      return { success: false, message: '导入配置失败' };
    }
  }
}

// 创建单例实例
export const configService = new ConfigService();

// 导出类型和服务
export default configService;