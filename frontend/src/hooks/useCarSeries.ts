import { useState, useEffect, useCallback } from 'react';
import {
  CarSeries,
  CarSeriesStats,
  CarSeriesSearchParams,
  CarSeriesFormData,
  UpdateCarSeriesFormData,
  PaginatedResponse
} from '../types/carSeries';
import { carSeriesService } from '../services/carSeriesService';

export const useCarSeries = () => {
  const [carSeries, setCarSeries] = useState<CarSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });

  // 获取车系列表
  const fetchCarSeries = useCallback(async (params?: CarSeriesSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.getCarSeries(params);
      if (response.success && response.data) {
        setCarSeries(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        });
      } else {
        setError(response.error || '获取车系列表失败');
      }
    } catch (err) {
      setError('获取车系列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建车系
  const createCarSeries = useCallback(async (data: CarSeriesFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.createCarSeries(data);
      if (response.success) {
        // 重新获取列表
        await fetchCarSeries();
        return true;
      } else {
        setError(response.error || '创建车系失败');
        return false;
      }
    } catch (err) {
      setError('创建车系失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCarSeries]);

  // 更新车系
  const updateCarSeries = useCallback(async (id: number, data: UpdateCarSeriesFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.updateCarSeries(id, data);
      if (response.success) {
        // 重新获取列表
        await fetchCarSeries();
        return true;
      } else {
        setError(response.error || '更新车系失败');
        return false;
      }
    } catch (err) {
      setError('更新车系失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCarSeries]);

  // 停产车系（软删除）
  const discontinueCarSeries = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.discontinueCarSeries(id);
      if (response.success) {
        // 重新获取列表
        await fetchCarSeries();
        return true;
      } else {
        setError(response.error || '停产车系失败');
        return false;
      }
    } catch (err) {
      setError('停产车系失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCarSeries]);

  // 删除车系（硬删除）
  const deleteCarSeries = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.deleteCarSeries(id);
      if (response.success) {
        // 重新获取列表
        await fetchCarSeries();
        return true;
      } else {
        setError(response.error || '删除车系失败');
        return false;
      }
    } catch (err) {
      setError('删除车系失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCarSeries]);

  // 搜索车系
  const searchCarSeries = useCallback(async (keyword: string, params?: CarSeriesSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.searchCarSeries(keyword, params);
      if (response.success && response.data) {
        setCarSeries(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages
        });
      } else {
        setError(response.error || '搜索车系失败');
      }
    } catch (err) {
      setError('搜索车系失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    carSeries,
    loading,
    error,
    pagination,
    fetchCarSeries,
    createCarSeries,
    updateCarSeries,
    discontinueCarSeries,
    deleteCarSeries,
    searchCarSeries
  };
};

export const useCarSeriesStats = () => {
  const [stats, setStats] = useState<CarSeriesStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.getCarSeriesStats();
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

export const useCarSeriesDetail = (id: number) => {
  const [carSeries, setCarSeries] = useState<CarSeries | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCarSeries = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.getCarSeriesById(id);
      if (response.success && response.data) {
        setCarSeries(response.data);
      } else {
        setError(response.error || '获取车系详情失败');
      }
    } catch (err) {
      setError('获取车系详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCarSeries();
  }, [fetchCarSeries]);

  return {
    carSeries,
    loading,
    error,
    fetchCarSeries
  };
};

export const useBrands = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await carSeriesService.getBrands();
      if (response.success && response.data) {
        setBrands(response.data);
      } else {
        setError(response.error || '获取品牌列表失败');
      }
    } catch (err) {
      setError('获取品牌列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    loading,
    error,
    fetchBrands
  };
};