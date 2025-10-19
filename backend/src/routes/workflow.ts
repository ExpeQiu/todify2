import express from 'express';
import DifyClient, { DifyAppType, DifyChatResponse } from '../services/DifyClient';
import { 
  validateAiSearchRequest, 
  validateTechAppRequest,
  validateAiSearchResponse,
  validateTechAppResponse,
  formatApiResponse,
  formatValidationErrorResponse
} from '../utils/validation';

const router = express.Router();

// AI搜索接口
router.post('/ai-search', async (req, res) => {
  try {
    console.log('收到AI搜索请求:', req.body);
    
    // 验证请求参数
    const validation = validateAiSearchRequest(req.body);
    if (!validation.isValid) {
      console.log('请求参数验证失败:', validation.errors);
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { query, inputs = {} } = req.body;
    console.log('开始调用AI搜索API, query:', query, 'inputs:', inputs);

    // 调用AI搜索API (使用聊天消息API)
    const result: DifyChatResponse = await DifyClient.aiSearch(query, inputs);
    console.log('AI搜索API调用成功:', result);
    
    // 验证响应数据格式
    const responseValidation = validateAiSearchResponse(result);
    if (!responseValidation.isValid) {
      console.warn('AI搜索响应格式验证失败:', responseValidation.errors);
    }
    
    // 返回标准化响应
    res.json(formatApiResponse(true, result, 'AI搜索完成'));
  } catch (error) {
    console.error('AI搜索API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      'AI搜索失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 技术包装接口
router.post('/tech-package', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs } = req.body;
    const result = await DifyClient.techPackage(inputs);
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('技术包装响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '技术包装完成'));
  } catch (error) {
    console.error('技术包装API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '技术包装失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 技术策略接口
router.post('/tech-strategy', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs } = req.body;
    const result = await DifyClient.techStrategy(inputs);
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('技术策略响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '技术策略完成'));
  } catch (error) {
    console.error('技术策略API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '技术策略失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 技术通稿接口
router.post('/tech-article', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs } = req.body;
    const result = await DifyClient.techArticle(inputs);
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('技术通稿响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '技术通稿完成'));
  } catch (error) {
    console.error('技术通稿API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '技术通稿失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 技术发布接口
router.post('/tech-publish', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs } = req.body;
    const result = await DifyClient.techPublish(inputs);
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('技术发布响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '技术发布完成'));
  } catch (error) {
    console.error('技术发布API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '技术发布失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;