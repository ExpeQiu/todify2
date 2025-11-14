import api from "./api";

export interface Source {
  id: string;
  title: string;
  type: "knowledge_base" | "external";
  url?: string;
  description?: string;
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
};

export default sourceService;

