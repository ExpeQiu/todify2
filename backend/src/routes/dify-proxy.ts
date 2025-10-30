import express from 'express';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

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
    case 'speech-workflow':
      return process.env.TECH_PUBLISH_API_KEY || '';
    case 'tech-package-workflow':
      return process.env.TECH_PACKAGE_API_KEY || '';
    case 'tech-strategy-workflow':
      return process.env.TECH_STRATEGY_API_KEY || '';
    case 'tech-article-workflow':
      return process.env.TECH_ARTICLE_API_KEY || '';
    default:
      return '';
  }
};

// Dify聊天消息代理
router.post('/chat-messages', async (req, res) => {
  try {
    Logger.http('Dify Chat Messages Proxy', { appType: req.body.appType });
    Logger.debug('Dify代理请求体', { body: req.body });

    const { appType, apiKey: clientApiKey, ...requestBody } = req.body;
    const apiKey = getApiKey(appType) || clientApiKey;

    if (!apiKey) {
      Logger.error('API key缺失', { appType });
      return res.status(400).json({ error: 'API key is required' });
    }

    Logger.debug('使用API key', {
      appType,
      keyPreview: apiKey.substring(0, 10) + '...'
    });

    // 直接使用Dify后端地址（9999端口）
    const difyBaseUrl = 'http://47.113.225.93:9999/v1';
    Logger.debug('Dify base URL', { url: difyBaseUrl });

    // 清理requestBody，确保只发送Dify需要的字段
    const { appType: _, ...cleanedBody } = requestBody;

    Logger.debug('发送给Dify的请求体', {
      query: cleanedBody.query,
      inputs: cleanedBody.inputs,
      conversation_id: cleanedBody.conversation_id,
      response_mode: 'blocking'
    });

    // 正确的Dify API端点
    const difyApiUrl = 'http://47.113.225.93:9999/v1/chat-messages';
    Logger.debug('请求Dify API', { url: difyApiUrl });

    const difyResponse = await axios.post(
      difyApiUrl,
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

    Logger.info('Dify Chat响应成功', { status: difyResponse.status });
    res.json(difyResponse.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    Logger.error('Dify API代理错误', {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data
    });
    res.status(axiosError.response?.status || 500).json({
      error: axiosError.response?.data || axiosError.message
    });
  }
});

// Dify工作流代理
router.post('/workflows/run', async (req, res) => {
  try {
    Logger.http('Dify Workflow Proxy', { appType: req.body.appType });
    Logger.debug('Dify工作流请求体', { body: req.body });

    const { appType, apiKey: clientApiKey, ...requestBody } = req.body;
    const apiKey = getApiKey(appType) || clientApiKey;

    if (!apiKey) {
      Logger.error('API key缺失', { appType });
      return res.status(400).json({ error: 'API key is required' });
    }

    Logger.debug('使用API key', { appType });
    // 直接使用正确的Dify工作流API端点
    const difyWorkflowUrl = 'http://47.113.225.93:9999/v1/workflows/run';
    Logger.debug('Dify workflow URL', { url: difyWorkflowUrl });

    const difyResponse = await axios.post(
      difyWorkflowUrl,
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

    Logger.info('Dify Workflow响应成功', { status: difyResponse.status });
    res.json(difyResponse.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    Logger.error('Dify工作流代理错误', {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data
    });
    res.status(axiosError.response?.status || 500).json({
      error: axiosError.response?.data || axiosError.message
    });
  }
});

export default router;
