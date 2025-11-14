import { useState, useEffect, useCallback } from 'react';
import {
  TechPoint,
  TechCategory,
  CarModel,
  TechPointStats,
  TechPointSearchParams,
  TechPointFormData,
  PaginatedResponse
} from '../types/techPoint';
import { techPointService } from '../services/techPointService';

export const useTechPoints = () => {
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  // 获取技术点列表
  const fetchTechPoints = useCallback(async (params?: TechPointSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.getTechPoints(params);
      if (response.success && response.data) {
        setTechPoints(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        });
      } else {
        setError(response.error || '获取技术点列表失败');
      }
    } catch (err) {
      setError('获取技术点列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建技术点
  const createTechPoint = useCallback(async (data: TechPointFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.createTechPoint(data);
      if (response.success) {
        // 重新获取列表
        await fetchTechPoints();
        return true;
      } else {
        setError(response.error || '创建技术点失败');
        return false;
      }
    } catch (err) {
      setError('创建技术点失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTechPoints]);

  // 更新技术点
  const updateTechPoint = useCallback(async (id: number, data: Partial<TechPointFormData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.updateTechPoint(id, data);
      if (response.success) {
        // 重新获取列表
        await fetchTechPoints();
        return true;
      } else {
        setError(response.error || '更新技术点失败');
        return false;
      }
    } catch (err) {
      setError('更新技术点失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTechPoints]);

  // 删除技术点
  const deleteTechPoint = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.deleteTechPoint(id);
      if (response.success) {
        // 重新获取列表
        await fetchTechPoints();
        return true;
      } else {
        setError(response.error || '删除技术点失败');
        return false;
      }
    } catch (err) {
      setError('删除技术点失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTechPoints]);

  // 搜索技术点
  const searchTechPoints = useCallback(async (keyword: string, params?: Omit<TechPointSearchParams, 'keyword'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.searchTechPoints(keyword, params);
      if (response.success && response.data) {
        setTechPoints(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        });
      } else {
        setError(response.error || '搜索技术点失败');
      }
    } catch (err) {
      setError('搜索技术点失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    techPoints,
    loading,
    error,
    pagination,
    fetchTechPoints,
    createTechPoint,
    updateTechPoint,
    deleteTechPoint,
    searchTechPoints,
    setError
  };
};

export const useTechPointStats = () => {
  const [stats, setStats] = useState<TechPointStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.getTechPointStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};

export const useTechCategories = () => {
  const [categories, setCategories] = useState<TechCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.getTechCategories();
      if (response.success && response.data) {
        // 检查返回的数据结构，如果是分页数据则提取data字段
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || [];
        setCategories(categoriesData);
      } else {
        setError(response.error || '获取技术分类失败');
      }
    } catch (err) {
      setError('获取技术分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories
  };
};

export const useCarModels = () => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCarModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await techPointService.getCarModels();
      if (response.success && response.data) {
        setCarModels(response.data);
      } else {
        setError(response.error || '获取车型列表失败');
      }
    } catch (err) {
      setError('获取车型列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarModels();
  }, [fetchCarModels]);

  return {
    carModels,
    loading,
    error,
    fetchCarModels
  };
};