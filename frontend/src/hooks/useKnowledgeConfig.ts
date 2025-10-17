import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  KnowledgeConfig, 
  KnowledgePoint, 
  ConfigPreset, 
  ConfigChangeEvent,
  FilterConfig,
  ColumnConfig,
  ActionConfig
} from '../types/knowledgeConfig';
import { knowledgeConfigService } from '../services/knowledgeConfigService';

// 主要的知识点配置Hook
export function useKnowledgeConfig() {
  const [configs, setConfigs] = useState<KnowledgeConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<KnowledgeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有配置
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allConfigs = knowledgeConfigService.getAllConfigs();
      const active = knowledgeConfigService.getActiveConfig();
      
      setConfigs(allConfigs);
      setActiveConfig(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建新配置
  const createConfig = useCallback(async (configData: Omit<KnowledgeConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newConfig = knowledgeConfigService.createConfig(configData);
      await loadConfigs(); // 重新加载配置列表
      return newConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 更新配置
  const updateConfig = useCallback(async (id: string, updates: Partial<KnowledgeConfig>) => {
    try {
      const updatedConfig = knowledgeConfigService.updateConfig(id, updates);
      if (updatedConfig) {
        await loadConfigs(); // 重新加载配置列表
        return updatedConfig;
      }
      throw new Error('配置不存在');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 删除配置
  const deleteConfig = useCallback(async (id: string) => {
    try {
      const success = knowledgeConfigService.deleteConfig(id);
      if (success) {
        await loadConfigs(); // 重新加载配置列表
        return true;
      }
      throw new Error('删除配置失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 激活配置
  const activateConfig = useCallback(async (id: string) => {
    try {
      const success = knowledgeConfigService.activateConfig(id);
      if (success) {
        await loadConfigs(); // 重新加载配置列表
        return true;
      }
      throw new Error('激活配置失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '激活配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 复制配置
  const duplicateConfig = useCallback(async (id: string, newName?: string) => {
    try {
      const duplicatedConfig = knowledgeConfigService.duplicateConfig(id, newName);
      if (duplicatedConfig) {
        await loadConfigs(); // 重新加载配置列表
        return duplicatedConfig;
      }
      throw new Error('复制配置失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 应用预设
  const applyPreset = useCallback(async (configId: string, preset: ConfigPreset) => {
    try {
      const updatedConfig = knowledgeConfigService.applyPreset(configId, preset);
      if (updatedConfig) {
        await loadConfigs(); // 重新加载配置列表
        return updatedConfig;
      }
      throw new Error('应用预设失败');
    } catch (err) {
      setError(err instanceof Error ? err.message : '应用预设失败');
      throw err;
    }
  }, [loadConfigs]);

  // 导出配置
  const exportConfig = useCallback((id: string) => {
    try {
      return knowledgeConfigService.exportConfig(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出配置失败');
      throw err;
    }
  }, []);

  // 导入配置
  const importConfig = useCallback(async (configJson: string) => {
    try {
      const importedConfig = knowledgeConfigService.importConfig(configJson);
      await loadConfigs(); // 重新加载配置列表
      return importedConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入配置失败');
      throw err;
    }
  }, [loadConfigs]);

  // 监听配置变更事件
  useEffect(() => {
    const handleConfigChange = (event: ConfigChangeEvent) => {
      // 当配置发生变更时，重新加载配置
      loadConfigs();
    };

    knowledgeConfigService.addEventListener(handleConfigChange);
    
    return () => {
      knowledgeConfigService.removeEventListener(handleConfigChange);
    };
  }, [loadConfigs]);

  // 初始化加载
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return {
    // 配置管理
    configs,
    currentConfig: activeConfig,
    loading,
    error,
    
    // 预设和激活配置
    presets: ['minimal', 'standard', 'advanced', 'custom'] as ConfigPreset[],
    activeConfigId: activeConfig?.id || null,
    
    // CRUD 操作
    createConfig,
    updateConfig,
    deleteConfig,
    duplicateConfig,
    
    // 预设管理
    applyPreset,
    
    // 激活配置
    activateConfig,
    
    // 导入导出
    exportConfig,
    importConfig,
    
    // 验证配置
    validateConfig: knowledgeConfigService.validateConfig?.bind(knowledgeConfigService),
    
    // 事件监听
    addEventListener: knowledgeConfigService.addEventListener.bind(knowledgeConfigService),
    removeEventListener: knowledgeConfigService.removeEventListener.bind(knowledgeConfigService),
    
    refresh: loadConfigs
  };
}

// 知识点筛选Hook
export function useKnowledgePointFilter(
  knowledgePoints: KnowledgePoint[],
  filterConfigs: FilterConfig[]
) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filteredPoints, setFilteredPoints] = useState<KnowledgePoint[]>(knowledgePoints);

  // 应用筛选
  const applyFilters = useCallback(() => {
    let filtered = [...knowledgePoints];

    filterConfigs.forEach(filterConfig => {
      if (!filterConfig.visible) return;
      
      const filterValue = filterValues[filterConfig.id];
      if (!filterValue) return;

      filtered = filtered.filter(point => {
        const fieldValue = getNestedValue(point, filterConfig.field);
        
        switch (filterConfig.type) {
          case 'search':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
          
          case 'select':
            return fieldValue === filterValue;
          
          case 'multiselect':
            return Array.isArray(filterValue) && filterValue.includes(fieldValue);
          
          case 'range':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const numValue = Number(fieldValue);
              return numValue >= filterValue[0] && numValue <= filterValue[1];
            }
            return true;
          
          case 'date':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const dateValue = new Date(fieldValue);
              const startDate = new Date(filterValue[0]);
              const endDate = new Date(filterValue[1]);
              return dateValue >= startDate && dateValue <= endDate;
            }
            return true;
          
          default:
            return true;
        }
      });
    });

    setFilteredPoints(filtered);
  }, [knowledgePoints, filterConfigs, filterValues]);

  // 更新筛选值
  const updateFilter = useCallback((filterId: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }));
  }, []);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setFilterValues({});
  }, []);

  // 清除单个筛选
  const clearFilter = useCallback((filterId: string) => {
    setFilterValues(prev => {
      const { [filterId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // 当知识点或筛选配置变化时重新应用筛选
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    filteredPoints,
    filterValues,
    updateFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters: Object.keys(filterValues).length > 0
  };
}

// 知识点排序Hook
export function useKnowledgePointSort(
  knowledgePoints: KnowledgePoint[],
  columnConfigs: ColumnConfig[]
) {
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedPoints = useMemo(() => {
    if (!sortConfig) return knowledgePoints;

    const sorted = [...knowledgePoints].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      // 处理不同类型的排序
      let comparison = 0;
      
      if (aValue === null || aValue === undefined) {
        comparison = bValue === null || bValue === undefined ? 0 : 1;
      } else if (bValue === null || bValue === undefined) {
        comparison = -1;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [knowledgePoints, sortConfig]);

  const updateSort = useCallback((field: string) => {
    setSortConfig(prev => {
      if (prev?.field === field) {
        // 如果是同一个字段，切换排序方向
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else {
          return null; // 取消排序
        }
      } else {
        // 新字段，默认升序
        return { field, direction: 'asc' };
      }
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  return {
    sortedPoints,
    sortConfig,
    updateSort,
    clearSort
  };
}

// 知识点选择Hook
export function useKnowledgePointSelection(
  selectionMode: 'none' | 'single' | 'multiple' = 'single'
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectPoint = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      if (selectionMode === 'single') {
        newSet.clear();
        newSet.add(id);
      } else if (selectionMode === 'multiple') {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      
      return newSet;
    });
  }, [selectionMode]);

  const selectAll = useCallback((pointIds: string[]) => {
    if (selectionMode === 'multiple') {
      setSelectedIds(new Set(pointIds));
    }
  }, [selectionMode]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const getSelectedPoints = useCallback((allPoints: KnowledgePoint[]) => {
    return allPoints.filter(point => selectedIds.has(point.id));
  }, [selectedIds]);

  return {
    selectedIds: Array.from(selectedIds),
    selectPoint,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedPoints,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size
  };
}

// 工具函数：获取嵌套对象的值
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}