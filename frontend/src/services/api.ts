import { apiClient, type ApiErrorPayload, type ApiResponse } from "@/shared/lib/api/apiClient";

export interface WorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

const toWorkflowResponse = <T>(response: ApiResponse<T> & { message?: string }): WorkflowResponse => {
  if (response.success) {
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  }

  return {
    success: false,
    error: response.error?.message ?? response.message ?? "请求失败",
    data: response.data,
  };
};

const handleApiError = (scope: string, error: unknown): WorkflowResponse => {
  console.error(`${scope} error:`, error);
  if ((error as ApiErrorPayload)?.message) {
    return {
      success: false,
      error: (error as ApiErrorPayload).message,
    };
  }
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }
  return {
    success: false,
    error: "请求失败",
  };
};

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

const warnDeprecatedDifyConfig = (scope: string) => {
  console.warn(`[workflowAPI] 已忽略前端传入的 difyConfig (${scope})，所有调用均改为通过后端网关处理`);
};

export const workflowAPI = {
  // AI问答 - 支持自定义Dify配置
  aiSearch: async (query: string, inputs: any = {}, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('aiSearch');

    try {
      const response = await apiClient.post<{ message?: string }>("/workflow/ai-search", {
        query,
        inputs,
        conversationId,
      });
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("AI search API", error);
    }
  },

  // 智能搜索
  smartSearch: async (query: string, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('smartSearch');

    try {
      const requestData: any = { query };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/smart-search", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Smart search API", error);
    }
  },

  // 技术包装
  techPackage: async (searchResults: any, template?: string, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('techPackage');

    try {
      let inputs: any;

      if (searchResults && typeof searchResults === 'object' && searchResults.query) {
        inputs = {
          query: searchResults.query,
          selectedKnowledgePoints: searchResults.selectedKnowledgePoints,
        };
      } else {
        inputs = {
          searchResults: searchResults,
          template: template,
        };
      }

      const requestData: any = { inputs };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/tech-package", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Tech package API", error);
    }
  },

  // 技术策略
  techStrategy: async (techPackage: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('techStrategy');

    try {
      const requestData: any = {
        inputs: { techPackage },
      };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/tech-strategy", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Tech strategy API", error);
    }
  },

  // 推广策略
  promotionStrategy: async (techStrategy: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('promotionStrategy');

    try {
      const requestData: any = {
        inputs: { techStrategy },
      };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/promotion-strategy", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Promotion strategy API", error);
    }
  },

  // 技术通稿
  coreDraft: async (promotionStrategy: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('coreDraft');

    try {
      const requestData: any = {
        inputs: { promotionStrategy },
      };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/core-draft", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Core draft API", error);
    }
  },

  // 发布会演讲稿
  speechGeneration: async (coreDraft: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('speechGeneration');

    try {
      const requestData: any = {
        inputs: { coreDraft },
      };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/speech-generation", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Speech generation API", error);
    }
  },

  // 演讲稿
  speech: async (inputs: any, difyConfig?: DifyAPIConfig, conversationId?: string): Promise<WorkflowResponse> => {
    if (difyConfig) warnDeprecatedDifyConfig('speech');

    try {
      const requestData: any = { inputs };
      if (conversationId) {
        requestData.conversationId = conversationId;
      }

      const response = await apiClient.post("/workflow/speech-generation", requestData);
      return toWorkflowResponse(response);
    } catch (error) {
      return handleApiError("Speech API", error);
    }
  },
};

const legacyApi = {
  async get<T = unknown>(url: string, config?: any) {
    const data = await apiClient.get<T>(url, config);
    return { data };
  },
  async post<T = unknown>(url: string, body?: any, config?: any) {
    const data = await apiClient.post<T>(url, body, config);
    return { data };
  },
  async put<T = unknown>(url: string, body?: any, config?: any) {
    const data = await apiClient.put<T>(url, body, config);
    return { data };
  },
  async delete<T = unknown>(url: string, config?: any) {
    const data = await apiClient.delete<T>(url, config);
    return { data };
  },
};

export default legacyApi;
