import axios from 'axios';

class DifyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DIFY_API_KEY || '';
    this.baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
    
    if (!this.apiKey) {
      console.warn('DIFY_API_KEY not found in environment variables');
    }
  }

  async runWorkflow(workflowType: string, inputs: any, responseMode: string = 'blocking'): Promise<any> {
    try {
      // 根据工作流类型获取对应的工作流ID
      const workflowId = this.getWorkflowId(workflowType);
      
      if (!workflowId) {
        throw new Error(`Workflow ID not found for type: ${workflowType}`);
      }

      const response = await axios.post(
        `${this.baseUrl}/workflows/run`,
        {
          inputs,
          response_mode: responseMode,
          user: 'todify2-user'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            workflow_id: workflowId
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Dify API error:', error);
      throw error;
    }
  }

  private getWorkflowId(workflowType: string): string | null {
    const workflowIds: { [key: string]: string } = {
      'smart-search-workflow': process.env.SMART_SEARCH_WORKFLOW_ID || '',
      'tech-package-workflow': process.env.TECH_PACKAGE_WORKFLOW_ID || '',
      'promotion-strategy-workflow': process.env.PROMOTION_STRATEGY_WORKFLOW_ID || '',
      'core-draft-workflow': process.env.CORE_DRAFT_WORKFLOW_ID || '',
      'speech-workflow': process.env.SPEECH_WORKFLOW_ID || ''
    };

    return workflowIds[workflowType] || null;
  }
}

export default new DifyClient();