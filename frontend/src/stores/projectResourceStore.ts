import { create } from 'zustand';
import api from '../services/api';
import { SourceInformation } from '../services/sourceService';
import { KnowledgePoint } from '../types/knowledgePoint';
import { ConversationRecord } from '../services/chatHistoryService';
import { groupSourcesByCategory } from '../services/resourceClassifier';

/**
 * 项目资源数据接口
 */
export interface ProjectResources {
  sources: SourceInformation[];
  knowledgePoints: KnowledgePoint[];
  techPoints: any[];
  conversations: Record<string, ConversationRecord[]>;
  conversationsList: ConversationRecord[];
  timestamp: number; // 缓存时间戳
}

/**
 * 项目资源Store接口
 */
interface ProjectResourceStore {
  // 缓存数据：projectId -> ProjectResources
  cache: Map<number, ProjectResources>;
  
  // 正在加载的项目ID集合
  loading: Set<number>;
  
  // 获取项目资源（带缓存）
  getResources: (projectId: number) => Promise<ProjectResources>;
  
  // 使缓存失效
  invalidate: (projectId: number) => void;
  
  // 清除所有缓存
  clearCache: () => void;
  
  // 预加载资源
  preloadResources: (projectId: number) => Promise<void>;
}

// 缓存TTL：5分钟
const CACHE_TTL = 5 * 60 * 1000;

export const useProjectResourceStore = create<ProjectResourceStore>((set, get) => ({
  cache: new Map(),
  loading: new Set(),
  
  /**
   * 获取项目资源（带缓存）
   */
  getResources: async (projectId: number): Promise<ProjectResources> => {
    const state = get();
    
    // 检查缓存
    const cached = state.cache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }
    
    // 防止重复请求
    if (state.loading.has(projectId)) {
      // 等待现有请求完成
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!get().loading.has(projectId)) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 100);
        
        // 超时保护：最多等待5秒
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(undefined);
        }, 5000);
      });
      
      // 再次检查缓存
      const newCached = get().cache.get(projectId);
      if (newCached) {
        return newCached;
      }
    }
    
    // 标记为加载中
    set((state) => ({
      loading: new Set(state.loading).add(projectId)
    }));
    
    try {
      // 调用聚合接口
      const response = await api.get(`/projects/${projectId}/full-context`);
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        
        // 构建资源对象
        const resources: ProjectResources = {
          sources: data.sources || [],
          knowledgePoints: data.knowledgePoints || [],
          techPoints: data.techPoints || [],
          conversations: data.conversations || {},
          conversationsList: data.conversationsList || [],
          timestamp: Date.now(),
        };
        
        // 更新缓存
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(projectId, resources);
          const newLoading = new Set(state.loading);
          newLoading.delete(projectId);
          return {
            cache: newCache,
            loading: newLoading,
          };
        });
        
        return resources;
      } else {
        throw new Error(response.data?.message || '获取项目资源失败');
      }
    } catch (error) {
      console.error('获取项目资源失败:', error);
      
      // 移除加载标记
      set((state) => {
        const newLoading = new Set(state.loading);
        newLoading.delete(projectId);
        return { loading: newLoading };
      });
      
      // 如果缓存存在，返回缓存（即使过期）
      if (cached) {
        return cached;
      }
      
      // 返回空数据
      return {
        sources: [],
        knowledgePoints: [],
        techPoints: [],
        conversations: {},
        conversationsList: [],
        timestamp: Date.now(),
      };
    }
  },
  
  /**
   * 使指定项目的缓存失效
   */
  invalidate: (projectId: number) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.delete(projectId);
      return { cache: newCache };
    });
  },
  
  /**
   * 清除所有缓存
   */
  clearCache: () => {
    set({ cache: new Map() });
  },
  
  /**
   * 预加载资源（不阻塞）
   */
  preloadResources: async (projectId: number) => {
    const state = get();
    
    // 如果已有有效缓存，跳过
    const cached = state.cache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return;
    }
    
    // 如果正在加载，跳过
    if (state.loading.has(projectId)) {
      return;
    }
    
    // 异步预加载
    get().getResources(projectId).catch(err => {
      console.warn('预加载项目资源失败:', err);
    });
  },
}));
