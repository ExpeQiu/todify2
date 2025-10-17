import { 
  KnowledgeConfig, 
  ConfigPreset, 
  ConfigChangeEvent, 
  ConfigValidationResult,
  ConfigManager,
  ThemeConfig,
  LayoutConfig,
  BehaviorConfig,
  FilterConfig,
  ColumnConfig,
  ActionConfig
} from '../types/knowledgeConfig';

// 默认主题配置
const DEFAULT_THEME: ThemeConfig = {
  name: 'default',
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#388e3c',
    warning: '#f57c00',
    danger: '#d32f2f',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    border: '#e0e0e0'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: '4px',
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 6px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.12)'
  }
};

// 预设配置模板
const PRESET_TEMPLATES: Record<ConfigPreset, Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>> = {
  minimal: {
    name: '极简配置',
    description: '最基础的知识点展示配置',
    version: '1.0.0',
    filters: [
      {
        id: 'search',
        name: '搜索',
        type: 'search',
        field: 'title',
        placeholder: '搜索知识点标题...',
        visible: true
      }
    ],
    columns: [
      {
        id: 'title',
        field: 'title',
        label: '标题',
        sortable: true,
        visible: true,
        align: 'left'
      },
      {
        id: 'category',
        field: 'category',
        label: '分类',
        sortable: true,
        visible: true,
        align: 'center'
      }
    ],
    actions: [
      {
        id: 'select',
        label: '选择',
        type: 'primary',
        position: 'row',
        visible: true,
        onClick: () => {}
      }
    ],
    theme: DEFAULT_THEME,
    layout: {
      type: 'table',
      density: 'comfortable',
      showHeader: true,
      showFooter: false,
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50],
      selectionMode: 'single'
    },
    behavior: {
      autoSave: false,
      confirmBeforeDelete: true,
      enableSearch: true,
      enableSort: true,
      enableFilter: false,
      enableExport: false,
      enableImport: false,
      rememberFilters: false,
      rememberSort: false,
      rememberPageSize: false
    },
    tags: ['minimal', 'basic'],
    isDefault: false,
    isActive: false
  },

  standard: {
    name: '标准配置',
    description: '包含常用功能的标准配置',
    version: '1.0.0',
    filters: [
      {
        id: 'search',
        name: '搜索',
        type: 'search',
        field: 'title',
        placeholder: '搜索知识点...',
        visible: true
      },
      {
        id: 'category',
        name: '分类',
        type: 'select',
        field: 'category',
        options: [],
        visible: true
      },
      {
        id: 'vehicleModel',
        name: '车型',
        type: 'select',
        field: 'metadata.vehicleModel',
        options: [],
        visible: true
      }
    ],
    columns: [
      {
        id: 'title',
        field: 'title',
        label: '标题',
        sortable: true,
        visible: true,
        align: 'left'
      },
      {
        id: 'category',
        field: 'category',
        label: '分类',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'vehicleModel',
        field: 'metadata.vehicleModel',
        label: '车型',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'priority',
        field: 'metadata.priority',
        label: '优先级',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'lastUpdated',
        field: 'metadata.lastUpdated',
        label: '更新时间',
        sortable: true,
        visible: true,
        align: 'center',
        formatter: (value) => new Date(value).toLocaleDateString()
      }
    ],
    actions: [
      {
        id: 'multiSelect',
        label: '批量选择',
        type: 'primary',
        position: 'header',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'select',
        label: '选择',
        type: 'secondary',
        position: 'row',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'export',
        label: '导出',
        type: 'secondary',
        position: 'footer',
        visible: true,
        onClick: () => {}
      }
    ],
    theme: DEFAULT_THEME,
    layout: {
      type: 'table',
      density: 'comfortable',
      showHeader: true,
      showFooter: true,
      showPagination: true,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      selectionMode: 'multiple'
    },
    behavior: {
      autoSave: true,
      confirmBeforeDelete: true,
      enableSearch: true,
      enableSort: true,
      enableFilter: true,
      enableExport: true,
      enableImport: false,
      rememberFilters: true,
      rememberSort: true,
      rememberPageSize: true
    },
    tags: ['standard', 'common'],
    isDefault: true,
    isActive: false
  },

  advanced: {
    name: '高级配置',
    description: '功能完整的高级配置',
    version: '1.0.0',
    filters: [
      {
        id: 'search',
        name: '全文搜索',
        type: 'search',
        field: 'content',
        placeholder: '搜索标题、内容、标签...',
        visible: true
      },
      {
        id: 'category',
        name: '分类',
        type: 'multiselect',
        field: 'category',
        options: [],
        visible: true
      },
      {
        id: 'vehicleModel',
        name: '车型',
        type: 'multiselect',
        field: 'metadata.vehicleModel',
        options: [],
        visible: true
      },
      {
        id: 'techCategory',
        name: '技术分类',
        type: 'multiselect',
        field: 'metadata.techCategory',
        options: [],
        visible: true
      },
      {
        id: 'difficulty',
        name: '难度',
        type: 'select',
        field: 'metadata.difficulty',
        options: [
          { label: '基础', value: 'basic' },
          { label: '中级', value: 'intermediate' },
          { label: '高级', value: 'advanced' }
        ],
        visible: true
      },
      {
        id: 'priority',
        name: '优先级',
        type: 'select',
        field: 'metadata.priority',
        options: [
          { label: '低', value: 'low' },
          { label: '中', value: 'medium' },
          { label: '高', value: 'high' }
        ],
        visible: true
      },
      {
        id: 'dateRange',
        name: '更新时间',
        type: 'date',
        field: 'metadata.lastUpdated',
        visible: true
      }
    ],
    columns: [
      {
        id: 'title',
        field: 'title',
        label: '标题',
        width: '25%',
        sortable: true,
        visible: true,
        align: 'left'
      },
      {
        id: 'category',
        field: 'category',
        label: '分类',
        width: '15%',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'tags',
        field: 'tags',
        label: '标签',
        width: '20%',
        sortable: false,
        visible: true,
        align: 'left',
        formatter: (value) => Array.isArray(value) ? value.join(', ') : ''
      },
      {
        id: 'vehicleModel',
        field: 'metadata.vehicleModel',
        label: '车型',
        width: '10%',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'difficulty',
        field: 'metadata.difficulty',
        label: '难度',
        width: '8%',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'priority',
        field: 'metadata.priority',
        label: '优先级',
        width: '8%',
        sortable: true,
        visible: true,
        align: 'center'
      },
      {
        id: 'lastUpdated',
        field: 'metadata.lastUpdated',
        label: '更新时间',
        width: '14%',
        sortable: true,
        visible: true,
        align: 'center',
        formatter: (value) => new Date(value).toLocaleDateString()
      }
    ],
    actions: [
      {
        id: 'create',
        label: '新建',
        type: 'primary',
        position: 'header',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'batchSelect',
        label: '批量操作',
        type: 'secondary',
        position: 'header',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'import',
        label: '导入',
        type: 'secondary',
        position: 'header',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'select',
        label: '选择',
        type: 'primary',
        position: 'row',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'edit',
        label: '编辑',
        type: 'secondary',
        position: 'row',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'export',
        label: '导出选中',
        type: 'success',
        position: 'footer',
        visible: true,
        onClick: () => {}
      },
      {
        id: 'delete',
        label: '删除选中',
        type: 'danger',
        position: 'footer',
        visible: true,
        onClick: () => {}
      }
    ],
    theme: DEFAULT_THEME,
    layout: {
      type: 'table',
      density: 'compact',
      showHeader: true,
      showFooter: true,
      showPagination: true,
      pageSize: 50,
      pageSizeOptions: [20, 50, 100, 200],
      selectionMode: 'multiple',
      expandable: true
    },
    behavior: {
      autoSave: true,
      confirmBeforeDelete: true,
      enableSearch: true,
      enableSort: true,
      enableFilter: true,
      enableExport: true,
      enableImport: true,
      rememberFilters: true,
      rememberSort: true,
      rememberPageSize: true
    },
    tags: ['advanced', 'full-featured'],
    isDefault: false,
    isActive: false
  },

  custom: {
    name: '自定义配置',
    description: '用户自定义的配置模板',
    version: '1.0.0',
    filters: [],
    columns: [],
    actions: [],
    theme: DEFAULT_THEME,
    layout: {
      type: 'table',
      density: 'comfortable',
      showHeader: true,
      showFooter: false,
      showPagination: true,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50],
      selectionMode: 'single'
    },
    behavior: {
      autoSave: false,
      confirmBeforeDelete: true,
      enableSearch: true,
      enableSort: true,
      enableFilter: true,
      enableExport: false,
      enableImport: false,
      rememberFilters: false,
      rememberSort: false,
      rememberPageSize: false
    },
    tags: ['custom'],
    isDefault: false,
    isActive: false
  }
};

// 知识点配置管理服务
export class KnowledgeConfigService implements ConfigManager {
  private configs: Map<string, KnowledgeConfig> = new Map();
  private activeConfigId: string | null = null;
  private eventListeners: Array<(event: ConfigChangeEvent) => void> = [];
  private storageKey = 'knowledge_configs';

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultConfigs();
  }

  // 基础CRUD操作
  getConfig(id: string): KnowledgeConfig | null {
    return this.configs.get(id) || null;
  }

  getAllConfigs(): KnowledgeConfig[] {
    return Array.from(this.configs.values());
  }

  createConfig(config: Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeConfig {
    const id = this.generateId();
    const now = new Date();
    
    const newConfig: KnowledgeConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.configs.set(id, newConfig);
    this.saveToStorage();
    this.emitEvent({ type: 'create', configId: id, config: newConfig, timestamp: now });
    
    return newConfig;
  }

  updateConfig(id: string, updates: Partial<KnowledgeConfig>): KnowledgeConfig | null {
    const existingConfig = this.configs.get(id);
    if (!existingConfig) return null;

    const updatedConfig: KnowledgeConfig = {
      ...existingConfig,
      ...updates,
      id, // 确保ID不被覆盖
      createdAt: existingConfig.createdAt, // 确保创建时间不被覆盖
      updatedAt: new Date()
    };

    this.configs.set(id, updatedConfig);
    this.saveToStorage();
    this.emitEvent({ type: 'update', configId: id, config: updatedConfig, timestamp: new Date() });
    
    return updatedConfig;
  }

  deleteConfig(id: string): boolean {
    if (!this.configs.has(id)) return false;
    
    // 如果删除的是当前激活的配置，清除激活状态
    if (this.activeConfigId === id) {
      this.activeConfigId = null;
    }
    
    this.configs.delete(id);
    this.saveToStorage();
    this.emitEvent({ type: 'delete', configId: id, timestamp: new Date() });
    
    return true;
  }

  // 预设管理
  applyPreset(configId: string, preset: ConfigPreset): KnowledgeConfig | null {
    const template = this.getPresetTemplate(preset);
    return this.updateConfig(configId, template);
  }

  getPresetTemplate(preset: ConfigPreset): Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'> {
    return { ...PRESET_TEMPLATES[preset] };
  }

  // 配置操作
  duplicateConfig(id: string, newName?: string): KnowledgeConfig | null {
    const originalConfig = this.configs.get(id);
    if (!originalConfig) return null;

    const { id: _, createdAt: __, updatedAt: ___, ...configData } = originalConfig;
    
    return this.createConfig({
      ...configData,
      name: newName || `${originalConfig.name} (副本)`,
      isDefault: false,
      isActive: false
    });
  }

  activateConfig(id: string): boolean {
    const config = this.configs.get(id);
    if (!config) return false;

    // 取消其他配置的激活状态
    this.configs.forEach((cfg, cfgId) => {
      if (cfg.isActive && cfgId !== id) {
        this.updateConfig(cfgId, { isActive: false });
      }
    });

    // 激活指定配置
    this.updateConfig(id, { isActive: true });
    this.activeConfigId = id;
    this.emitEvent({ type: 'activate', configId: id, config, timestamp: new Date() });
    
    return true;
  }

  getActiveConfig(): KnowledgeConfig | null {
    if (this.activeConfigId) {
      return this.configs.get(this.activeConfigId) || null;
    }
    
    // 如果没有激活的配置，返回默认配置
    const defaultConfig = Array.from(this.configs.values()).find(config => config.isDefault);
    return defaultConfig || null;
  }

  // 导入导出
  exportConfig(id: string): string {
    const config = this.configs.get(id);
    if (!config) throw new Error(`配置 ${id} 不存在`);
    
    return JSON.stringify(config, null, 2);
  }

  importConfig(configJson: string): KnowledgeConfig {
    try {
      const configData = JSON.parse(configJson);
      const validation = this.validateConfig(configData);
      
      if (!validation.isValid) {
        throw new Error(`配置验证失败: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      // 移除ID相关字段，让createConfig重新生成
      const { id: _, createdAt: __, updatedAt: ___, ...cleanConfigData } = configData;
      
      return this.createConfig(cleanConfigData);
    } catch (error) {
      throw new Error(`导入配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 验证
  validateConfig(config: Partial<KnowledgeConfig>): ConfigValidationResult {
    const errors: ConfigValidationResult['errors'] = [];

    // 必填字段验证
    if (!config.name?.trim()) {
      errors.push({ field: 'name', message: '配置名称不能为空', severity: 'error' });
    }

    if (!config.version?.trim()) {
      errors.push({ field: 'version', message: '版本号不能为空', severity: 'error' });
    }

    // 数组字段验证
    if (config.filters && !Array.isArray(config.filters)) {
      errors.push({ field: 'filters', message: '筛选器配置必须是数组', severity: 'error' });
    }

    if (config.columns && !Array.isArray(config.columns)) {
      errors.push({ field: 'columns', message: '列配置必须是数组', severity: 'error' });
    }

    if (config.actions && !Array.isArray(config.actions)) {
      errors.push({ field: 'actions', message: '操作配置必须是数组', severity: 'error' });
    }

    // 布局配置验证
    if (config.layout) {
      const { layout } = config;
      if (layout.pageSize && (layout.pageSize < 1 || layout.pageSize > 1000)) {
        errors.push({ field: 'layout.pageSize', message: '页面大小必须在1-1000之间', severity: 'error' });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  // 事件监听
  addEventListener(listener: (event: ConfigChangeEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: ConfigChangeEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // 私有方法
  private generateId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(event: ConfigChangeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('配置事件监听器执行失败:', error);
      }
    });
  }

  private saveToStorage(): void {
    try {
      const data = {
        configs: Array.from(this.configs.entries()),
        activeConfigId: this.activeConfigId
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存配置到本地存储失败:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.configs = new Map(parsed.configs || []);
        this.activeConfigId = parsed.activeConfigId || null;
      }
    } catch (error) {
      console.error('从本地存储加载配置失败:', error);
    }
  }

  private initializeDefaultConfigs(): void {
    // 如果没有任何配置，创建默认预设
    if (this.configs.size === 0) {
      Object.entries(PRESET_TEMPLATES).forEach(([preset, template]) => {
        if (preset !== 'custom') {
          this.createConfig(template);
        }
      });
      
      // 激活标准配置
      const standardConfig = Array.from(this.configs.values()).find(config => config.name === '标准配置');
      if (standardConfig) {
        this.activateConfig(standardConfig.id);
      }
    }
  }
}

// 导出单例实例
export const knowledgeConfigService = new KnowledgeConfigService();