import { Router, Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// 博查 Web Search API 端点
const BOCHA_API_URL = 'https://api.bocha.cn/v1/web-search';
const BOCHA_API_KEY = process.env.BOCHA_API_KEY || '';

interface BochaWebSearchRequest {
  query: string;
  freshness?: string;
  summary?: boolean;
  count?: number;
  include?: string;
  exclude?: string;
}

// Web Search API
router.post('/web-search', async (req: Request, res: Response) => {
  try {
    const { query, freshness, summary, count, include, exclude }: BochaWebSearchRequest = req.body;

    // 验证必填参数
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: '缺少必填参数: query'
        }
      });
    }

    // 检查 API Key
    if (!BOCHA_API_KEY) {
      console.error('BOCHA_API_KEY 未配置');
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: '博查 API Key 未配置，请在环境变量中设置 BOCHA_API_KEY'
        }
      });
    }

    // 构建请求体
    const requestBody: BochaWebSearchRequest = {
      query: query.trim(),
      summary: summary !== undefined ? summary : true,
      count: count && count > 0 && count <= 50 ? count : 10,
    };

    if (freshness) {
      requestBody.freshness = freshness;
    }
    if (include) {
      requestBody.include = include;
    }
    if (exclude) {
      requestBody.exclude = exclude;
    }

    // 调用博查 API
    const response = await axios.post(BOCHA_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${BOCHA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30秒超时
    });

    // 返回结果
    res.json({
      success: true,
      data: response.data.data || response.data,
      log_id: response.data.log_id
    });

  } catch (error: any) {
    console.error('博查 Web Search API 调用失败:', error);

    // 处理 axios 错误
    if (error.response) {
      // API 返回了错误响应
      const statusCode = error.response.status || 500;
      const errorData = error.response.data || {};
      
      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorData.code || 'API_ERROR',
          message: errorData.message || error.message || '博查 API 调用失败',
          log_id: errorData.log_id
        }
      });
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return res.status(500).json({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '无法连接到博查 API 服务器，请检查网络连接'
        }
      });
    } else {
      // 其他错误
      return res.status(500).json({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || '未知错误'
        }
      });
    }
  }
});

// 验证服务可用性端点
router.get('/health', async (req: Request, res: Response) => {
  try {
    // 检查 API Key 是否配置
    if (!BOCHA_API_KEY) {
      return res.status(503).json({
        success: false,
        status: 'unavailable',
        message: 'BOCHA_API_KEY 未配置',
        error: {
          code: 'CONFIG_ERROR',
          message: '博查 API Key 未配置，请在环境变量中设置 BOCHA_API_KEY'
        }
      });
    }

    // 执行一个简单的测试搜索来验证服务可用性
    const testResponse = await axios.post(
      BOCHA_API_URL,
      {
        query: 'test',
        summary: false,
        count: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${BOCHA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10秒超时
      }
    );

    // 检查响应状态
    if (testResponse.status === 200) {
      return res.json({
        success: true,
        status: 'available',
        message: '博查 Web Search API 服务可用',
        api_key_configured: true,
        api_key_prefix: BOCHA_API_KEY.substring(0, 7) + '...',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        success: false,
        status: 'unavailable',
        message: '博查 Web Search API 响应异常',
        status_code: testResponse.status,
      });
    }
  } catch (error: any) {
    console.error('博查 Web Search API 健康检查失败:', error);

    // 根据错误类型返回不同的状态
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data || {};

      // 401/403 通常是 API Key 问题
      if (statusCode === 401 || statusCode === 403) {
        return res.status(503).json({
          success: false,
          status: 'auth_error',
          message: 'API Key 认证失败',
          error: {
            code: errorData.code || 'AUTH_ERROR',
            message: errorData.message || 'API Key 无效或已过期',
            log_id: errorData.log_id,
          },
          api_key_configured: true,
          api_key_prefix: BOCHA_API_KEY.substring(0, 7) + '...',
        });
      }

      // 其他 HTTP 错误
      return res.status(503).json({
        success: false,
        status: 'api_error',
        message: '博查 API 返回错误',
        error: {
          code: errorData.code || 'API_ERROR',
          message: errorData.message || error.message,
          log_id: errorData.log_id,
        },
        status_code: statusCode,
        api_key_configured: true,
        api_key_prefix: BOCHA_API_KEY.substring(0, 7) + '...',
      });
    } else if (error.request) {
      // 网络错误
      return res.status(503).json({
        success: false,
        status: 'network_error',
        message: '无法连接到博查 API 服务器',
        error: {
          code: 'NETWORK_ERROR',
          message: '请检查网络连接和 API 服务器状态',
        },
        api_key_configured: true,
        api_key_prefix: BOCHA_API_KEY.substring(0, 7) + '...',
      });
    } else {
      // 其他错误
      return res.status(500).json({
        success: false,
        status: 'unknown_error',
        message: '健康检查失败',
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || '未知错误',
        },
        api_key_configured: !!BOCHA_API_KEY,
        api_key_prefix: BOCHA_API_KEY ? BOCHA_API_KEY.substring(0, 7) + '...' : 'not_configured',
      });
    }
  }
});

export default router;
