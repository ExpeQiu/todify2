// 全新的知识点配置系统类型定义

// 知识点数据结构
export interface KnowledgePoint {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  metadata: {
    vehicleModel?: string;
    vehicleSeries?: string;
    techCategory?: string;
    difficulty?: 'basic' | 'intermediate' | 'advanced';
    priority?: 'low' | 'medium' | 'high';
    lastUpdated: Date;
    createdAt: Date;
  };
}

// 筛选器配置
export interface FilterConfig {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'search' | 'range' | 'date';
  field: keyof KnowledgePoint | string; // 支持嵌套字段如 'metadata.vehicleModel'
  options?: Array<{
    label: string;
    value: string | number;
    count?: number; // 该选项下的知识点数量
  }>;
  placeholder?: string;
  defaultValue?: any;
  visible: boolean;
  required?: boolean;
}

// 显示列配置
export interface ColumnConfig {
  id: string;
  field: keyof KnowledgePoint | string;
  label: string;
  width?: number | string;
  sortable: boolean;
  visible: boolean;
  formatter?: (value: any, item: KnowledgePoint) => string;
  align?: 'left' | 'center' | 'right';
}

// 操作按钮配置
export interface ActionConfig {
  id: string;
  label: string;
  icon?: string;
  type: 'primary' | 'secondary' | 'danger' | 'success';
  position: 'header' | 'row' | 'footer';
  visible: boolean;
  disabled?: (selectedItems: KnowledgePoint[]) => boolean;
  onClick: (selectedItems: KnowledgePoint[]) => void;
}

// 样式主题配置
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// 布局配置
export interface LayoutConfig {
  type: 'table' | 'grid' | 'list';
  density: 'compact' | 'comfortable' | 'spacious';
  showHeader: boolean;
  showFooter: boolean;
  showPagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  selectionMode: 'none' | 'single' | 'multiple';
  expandable?: boolean;
}

// 行为配置
export interface BehaviorConfig {
  autoSave: boolean;
  confirmBeforeDelete: boolean;
  enableSearch: boolean;
  enableSort: boolean;
  enableFilter: boolean;
  enableExport: boolean;
  enableImport: boolean;
  rememberFilters: boolean;
  rememberSort: boolean;
  rememberPageSize: boolean;
}

// 完整的知识点配置
export interface KnowledgeConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  
  // 核心配置
  filters: FilterConfig[];
  columns: ColumnConfig[];
  actions: ActionConfig[];
  
  // 外观和行为
  theme: ThemeConfig;
  layout: LayoutConfig;
  behavior: BehaviorConfig;
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

// 配置预设类型
export type ConfigPreset = 'minimal' | 'standard' | 'advanced' | 'custom';

// 配置变更事件
export interface ConfigChangeEvent {
  type: 'create' | 'update' | 'delete' | 'activate';
  configId: string;
  config?: KnowledgeConfig;
  timestamp: Date;
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

// 配置管理器接口
export interface ConfigManager {
  // 基础CRUD操作
  getConfig(id: string): KnowledgeConfig | null;
  getAllConfigs(): KnowledgeConfig[];
  createConfig(config: Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeConfig;
  updateConfig(id: string, updates: Partial<KnowledgeConfig>): KnowledgeConfig | null;
  deleteConfig(id: string): boolean;
  
  // 预设管理
  applyPreset(configId: string, preset: ConfigPreset): KnowledgeConfig | null;
  getPresetTemplate(preset: ConfigPreset): Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>;
  
  // 配置操作
  duplicateConfig(id: string, newName?: string): KnowledgeConfig | null;
  activateConfig(id: string): boolean;
  getActiveConfig(): KnowledgeConfig | null;
  
  // 导入导出
  exportConfig(id: string): string;
  importConfig(configJson: string): KnowledgeConfig;
  
  // 验证
  validateConfig(config: Partial<KnowledgeConfig>): ConfigValidationResult;
  
  // 事件监听
  addEventListener(listener: (event: ConfigChangeEvent) => void): void;
  removeEventListener(listener: (event: ConfigChangeEvent) => void): void;
}

// 知识点选择器组件属性
export interface KnowledgePointSelectorProps {
  config: KnowledgeConfig;
  knowledgePoints: KnowledgePoint[];
  selectedIds?: string[];
  onSelectionChange?: (selectedPoints: KnowledgePoint[]) => void;
  onSave?: (selectedPoints: KnowledgePoint[]) => void;
  className?: string;
  style?: React.CSSProperties;
}