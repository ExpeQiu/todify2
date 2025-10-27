import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const getApiKey = (appType: string): string => {
  switch (appType) {
    case 'AI_SEARCH':
    case 'default-ai-search':
      return process.env.AI_SEARCH_API_KEY || '';
    case 'TECH_PACKAGE':
    case 'default-tech-package':
      return process.env.TECH_PACKAGE_API_KEY || '';
    case 'TECH_STRATEGY':
    case 'default-tech-strategy':
      return process.env.TECH_STRATEGY_API_KEY || '';
    case 'TECH_ARTICLE':
    case 'default-core-draft':
      return process.env.TECH_ARTICLE_API_KEY || '';
    case 'TECH_PUBLISH':
    case 'default-speech-generation':
      return process.env.TECH_PUBLISH_API_KEY || '';
    case 'SMART_WORKFLOW_AI_QA':
      return process.env.AI_SEARCH_API_KEY || '';
    case 'SMART_WORKFLOW_TECH_PACKAGE':
      return process.env.TECH_PACKAGE_API_KEY || '';
    case 'SMART_WORKFLOW_TECH_STRATEGY':
      return process.env.TECH_STRATEGY_API_KEY || '';
    case 'SMART_WORKFLOW_TECH_ARTICLE':
      return process.env.TECH_ARTICLE_API_KEY || '';
    case 'SMART_WORKFLOW_SPEECH':
      return process.env.TECH_PUBLISH_API_KEY || '';
    case 'INDEPENDENT_AI_QA':
      return process.env.AI_SEARCH_API_KEY || '';
    case 'INDEPENDENT_TECH_PACKAGE':
      return process.env.TECH_PACKAGE_API_KEY || '';
    case 'INDEPENDENT_TECH_STRATEGY':
      return process.env.TECH_STRATEGY_API_KEY || '';
    case 'INDEPENDENT_TECH_ARTICLE':
      return process.env.TECH_ARTICLE_API_KEY || '';
    case 'INDEPENDENT_TECH_PUBLISH':
      return process.env.TECH_PUBLISH_API_KEY || '';
    default:
      return '';
  }
};

// Dify聊天消息代理
router.post('/chat-messages', async (req, res) => {
  try {
    console.log('=== Dify Chat Messages Proxy ===');
    console.log('Request body:', req.body);
    
    const { appType, apiKey: clientApiKey, ...requestBody } = req.body;
    const apiKey = getApiKey(appType) || clientApiKey;

    if (!apiKey) {
      console.error('API key is missing for appType:', appType);
      return res.status(400).json({ error: 'API key is required' });
    }

    console.log('Using API key for appType:', appType);
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    // 直接使用Dify后端地址（9999端口）
    const difyBaseUrl = 'http://47.113.225.93:9999/v1';
    console.log('Dify base URL:', difyBaseUrl);

    // 清理requestBody，确保只发送Dify需要的字段
    const { appType: _, ...cleanedBody } = requestBody;
    
    console.log('发送给Dify的请求体:', {
      query: cleanedBody.query,
      inputs: cleanedBody.inputs,
      conversation_id: cleanedBody.conversation_id,
      response_mode: 'blocking'
    });

    const difyResponse = await axios.post(
      difyBaseUrl + '/chat-messages',
      { 
        query: cleanedBody.query,
        inputs: cleanedBody.inputs || {},
        conversation_id: cleanedBody.conversation_id || '',
        user: requestBody.user || `user-${Date.now()}`, 
        response_mode: 'blocking' 
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    console.log('Dify response received:', difyResponse.status);
    res.json(difyResponse.data);
  } catch (error: any) {
    console.error('Dify API proxy error:', error.message);
    console.error('Error details:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

// Dify工作流代理
router.post('/workflows/run', async (req, res) => {
  try {
    console.log('=== Dify Workflow Proxy ===');
    console.log('Request body:', req.body);
    
    const { appType, apiKey: clientApiKey, ...requestBody } = req.body;
    const apiKey = getApiKey(appType) || clientApiKey;

    if (!apiKey) {
      console.error('API key is missing for appType:', appType);
      return res.status(400).json({ error: 'API key is required' });
    }

    console.log('Using API key for appType:', appType);
    console.log('Dify workflow base URL:', process.env.DIFY_WORKFLOW_BASE_URL);

    const difyResponse = await axios.post(
      process.env.DIFY_WORKFLOW_BASE_URL + '/workflows/run',
      { 
        ...requestBody, 
        user: requestBody.user || `user-${Date.now()}`, 
        response_mode: 'blocking' 
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    console.log('Dify workflow response received:', difyResponse.status);
    res.json(difyResponse.data);
  } catch (error: any) {
    console.error('Dify workflow proxy error:', error.message);
    console.error('Error details:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message
    });
  }
});

export default router;
