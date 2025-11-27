import api from "./api";

export interface Source {
  id: string;
  title: string;
  type: "knowledge_base" | "external";
  url?: string;
  description?: string;
}

export interface SourceInformation {
  id?: number;
  source_id: string;
  title: string;
  type: "knowledge_base" | "external";
  url?: string;
  description?: string;
  page_type?: "tech-package" | "press-release" | "tech-strategy" | "tech-article";
  conversation_id?: string;
  metadata?: Record<string, any>;
  status?: "active" | "archived" | "deleted";
  created_by?: string;
}

export interface AddExternalSourceParams {
  title: string;
  url?: string;
  file?: File;
  description?: string;
}

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  techPoint?: string;
  description?: string;
}

const sourceService = {
  /**
   * 获取知识库列表
   */
  async getKnowledgeBaseList(): Promise<{
    success: boolean;
    data?: KnowledgeBaseItem[];
    error?: string;
  }> {
    try {
      // 这里可以调用实际的API，目前先返回空数组
      // const response = await api.get('/knowledge-base/list');
      // return response.data;
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error("获取知识库列表失败:", error);
      return {
        success: false,
        error: "获取知识库列表失败",
      };
    }
  },

  /**
   * 添加外部来源
   */
  async addExternalSource(
    params: AddExternalSourceParams
  ): Promise<{
    success: boolean;
    data?: Source;
    error?: string;
  }> {
    try {
      // 这里可以调用实际的API
      // const formData = new FormData();
      // if (params.file) {
      //   formData.append('file', params.file);
      // }
      // if (params.url) {
      //   formData.append('url', params.url);
      // }
      // formData.append('title', params.title);
      // if (params.description) {
      //   formData.append('description', params.description);
      // }
      // const response = await api.post('/sources/external', formData);
      // return response.data;

      // 临时实现：直接返回本地创建的对象
      const source: Source = {
        id: `external_${Date.now()}`,
        title: params.title,
        type: "external",
        url: params.url,
        description: params.description,
      };
      return {
        success: true,
        data: source,
      };
    } catch (error) {
      console.error("添加外部来源失败:", error);
      return {
        success: false,
        error: "添加外部来源失败",
      };
    }
  },

  /**
   * 删除来源
   */
  async deleteSource(sourceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 这里可以调用实际的API
      // const response = await api.delete(`/sources/${sourceId}`);
      // return response.data;
      return {
        success: true,
      };
    } catch (error) {
      console.error("删除来源失败:", error);
      return {
        success: false,
        error: "删除来源失败",
      };
    }
  },

  /**
   * 更新来源信息
   */
  async updateSource(
    sourceId: string,
    updates: Partial<Source>
  ): Promise<{
    success: boolean;
    data?: Source;
    error?: string;
  }> {
    try {
      // 这里可以调用实际的API
      // const response = await api.put(`/sources/${sourceId}`, updates);
      // return response.data;
      return {
        success: true,
        data: updates as Source,
      };
    } catch (error) {
      console.error("更新来源失败:", error);
      return {
        success: false,
        error: "更新来源失败",
      };
    }
  },

  /**
   * 保存来源信息到数据库
   */
  async saveSourceInformation(
    source: Source,
    pageType?: string,
    conversationId?: string
  ): Promise<{
    success: boolean;
    data?: SourceInformation;
    error?: string;
  }> {
    try {
      const sourceInfo: Partial<SourceInformation> = {
        source_id: source.id,
        title: source.title,
        type: source.type,
        url: source.url,
        description: source.description,
        page_type: pageType as any,
        conversation_id: conversationId,
        status: "active",
      };

      const response = await api.post("/source-information", sourceInfo);
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
      };
    } catch (error) {
      console.error("保存来源信息失败:", error);
      return {
        success: false,
        error: "保存来源信息失败",
      };
    }
  },

  /**
   * 批量保存来源信息到数据库
   */
  async saveSourceInformationBatch(
    sources: Source[],
    pageType?: string,
    conversationId?: string
  ): Promise<{
    success: boolean;
    data?: SourceInformation[];
    error?: string;
  }> {
    try {
      const sourceInfoList: Partial<SourceInformation>[] = sources.map((source) => ({
        source_id: source.id,
        title: source.title,
        type: source.type,
        url: source.url,
        description: source.description,
        page_type: pageType as any,
        conversation_id: conversationId,
        status: "active",
      }));

      console.log('[SourceService] 批量保存来源信息:', {
        count: sourceInfoList.length,
        pageType,
        conversationId,
        sources: sourceInfoList.map(s => ({ source_id: s.source_id, title: s.title }))
      });

      const response = await api.post("/source-information/batch", sourceInfoList);
      console.log('[SourceService] 批量保存响应:', {
        success: response.data.success,
        dataCount: response.data.data?.length || 0,
        error: response.data.error
      });
      
      return {
        success: response.data.success,
        data: response.data.data,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error("[SourceService] 批量保存来源信息失败:", error);
      console.error("[SourceService] 错误详情:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        error: error.response?.data?.error || error.message || "批量保存来源信息失败",
      };
    }
  },

  /**
   * 根据对话ID加载来源信息
   */
  async loadSourceInformationByConversationId(
    conversationId: string
  ): Promise<{
    success: boolean;
    data?: Source[];
    error?: string;
  }> {
    try {
      const response = await api.get(`/source-information/conversation/${conversationId}`);
      if (response.data.success && response.data.data) {
        // 将数据库格式转换为前端Source格式
        const sources: Source[] = response.data.data.map((item: SourceInformation) => ({
          id: item.source_id,
          title: item.title,
          type: item.type,
          url: item.url,
          description: item.description,
        }));
        return {
          success: true,
          data: sources,
        };
      }
      return {
        success: false,
        error: response.data.error || "加载来源信息失败",
      };
    } catch (error) {
      console.error("加载来源信息失败:", error);
      return {
        success: false,
        error: "加载来源信息失败",
      };
    }
  },

  /**
   * 根据页面类型加载来源信息
   */
  async loadSourceInformationByPageType(
    pageType: string
  ): Promise<{
    success: boolean;
    data?: Source[];
    error?: string;
  }> {
    try {
      console.log('[SourceService] 加载页面类型来源信息:', pageType);
      const response = await api.get(`/source-information/page-type/${pageType}`);
      console.log('[SourceService] 加载响应:', {
        success: response.data.success,
        dataCount: response.data.data?.length || 0,
        error: response.data.error,
        rawData: response.data
      });
      
      if (response.data.success && response.data.data) {
        // 将数据库格式转换为前端Source格式
        const sources: Source[] = response.data.data.map((item: SourceInformation) => ({
          id: item.source_id,
          title: item.title,
          type: item.type,
          url: item.url,
          description: item.description,
        }));
        console.log('[SourceService] 转换后的来源:', sources.map(s => ({ id: s.id, title: s.title })));
        return {
          success: true,
          data: sources,
        };
      }
      return {
        success: false,
        error: response.data.error || "加载来源信息失败",
      };
    } catch (error: any) {
      console.error("[SourceService] 加载来源信息失败:", error);
      console.error("[SourceService] 错误详情:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        error: error.response?.data?.error || error.message || "加载来源信息失败",
      };
    }
  },

  /**
   * 删除来源信息（从数据库）
   */
  async deleteSourceInformation(sourceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await api.delete(`/source-information/source-id/${sourceId}`);
      return {
        success: response.data.success,
        error: response.data.error,
      };
    } catch (error) {
      console.error("删除来源信息失败:", error);
      return {
        success: false,
        error: "删除来源信息失败",
      };
    }
  },
};

export default sourceService;

