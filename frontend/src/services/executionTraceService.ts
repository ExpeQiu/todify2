import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface ExecutionTrace {
  id: string;
  execution_id: string;
  agent_id: string;
  step_name: string;
  step_type: string;
  input?: string;
  output?: string;
  duration?: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  metadata?: string;
  created_at: string;
}

export interface ExecutionTraceListResponse {
  success: boolean;
  data: ExecutionTrace[];
  message: string;
}

export interface ExecutionTraceResponse {
  success: boolean;
  data: ExecutionTrace;
  message: string;
}

class ExecutionTraceService {
  /**
   * 根据执行ID获取追踪记录
   */
  async getByExecutionId(executionId: string): Promise<ExecutionTrace[]> {
    try {
      const response = await axios.get<ExecutionTraceListResponse>(
        `${API_BASE_URL}/execution-traces?executionId=${executionId}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || '获取执行追踪失败');
    } catch (error) {
      console.error('获取执行追踪失败:', error);
      throw error;
    }
  }

  /**
   * 根据Agent ID获取追踪记录
   */
  async getByAgentId(agentId: string): Promise<ExecutionTrace[]> {
    try {
      const response = await axios.get<ExecutionTraceListResponse>(
        `${API_BASE_URL}/execution-traces?agentId=${agentId}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || '获取执行追踪失败');
    } catch (error) {
      console.error('获取执行追踪失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个追踪记录详情
   */
  async getById(id: string): Promise<ExecutionTrace> {
    try {
      const response = await axios.get<ExecutionTraceResponse>(
        `${API_BASE_URL}/execution-traces/${id}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || '获取执行追踪详情失败');
    } catch (error) {
      console.error('获取执行追踪详情失败:', error);
      throw error;
    }
  }
}

export default new ExecutionTraceService();

