import express from 'express';
import DifyClient, { DifyAppType, DifyChatResponse } from '../services/DifyClient';
import { createContentConcatenationService } from '../services/ContentConcatenationService';
import { ChatMessageService } from '../services/ChatMessageService';
import { db } from '../config/database';
import { 
  validateAiSearchRequest, 
  validateTechAppRequest,
  validateAiSearchResponse,
  validateTechAppResponse,
  formatApiResponse,
  formatValidationErrorResponse
} from '../utils/validation';

const router = express.Router();

// 格式化前端数据为Dify工作流期望的Additional_information格式
function formatAdditionalInformation(inputs: any): string {
  try {
    // 如果inputs包含searchResults（智能搜索结果）
    if (inputs.searchResults) {
      const searchData = inputs.searchResults;
      let formattedInfo = '';
      
      // 添加搜索查询信息
      if (searchData.query) {
        formattedInfo += `查询内容：${searchData.query}\n\n`;
      }
      
      // 添加搜索结果
      if (searchData.results && Array.isArray(searchData.results)) {
        formattedInfo += '搜索结果：\n';
        searchData.results.forEach((result: any, index: number) => {
          formattedInfo += `${index + 1}. ${result.title || result.content || JSON.stringify(result)}\n`;
        });
        formattedInfo += '\n';
      }
      
      // 添加模板信息
      if (inputs.template) {
        formattedInfo += `包装模板：${inputs.template}\n\n`;
      }
      
      return formattedInfo.trim() || JSON.stringify(inputs);
    }
    
    // 如果inputs包含query和selectedKnowledgePoints（来自TechPackageNode）
    if (inputs.query || inputs.selectedKnowledgePoints) {
      let formattedInfo = '';
      
      if (inputs.query) {
        formattedInfo += `查询内容：${inputs.query}\n\n`;
      }
      
      if (inputs.selectedKnowledgePoints && Array.isArray(inputs.selectedKnowledgePoints)) {
        formattedInfo += '相关知识点：\n';
        inputs.selectedKnowledgePoints.forEach((kp: any, index: number) => {
          formattedInfo += `${index + 1}. ${kp.title || kp.content || JSON.stringify(kp)}\n`;
        });
        formattedInfo += '\n';
      }
      
      return formattedInfo.trim() || JSON.stringify(inputs);
    }
    
    // 默认情况：将整个inputs对象转换为字符串
    return JSON.stringify(inputs, null, 2);
  } catch (error) {
    console.error('格式化Additional_information时出错:', error);
    return JSON.stringify(inputs);
  }
}

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

    // 处理知识点内容拼接
    let processedInputs = { ...inputs };
    
    // 检查是否有selectedKnowledgePoints需要处理
    if (inputs.selectedKnowledgePoints && Array.isArray(inputs.selectedKnowledgePoints) && inputs.selectedKnowledgePoints.length > 0) {
      try {
        console.log('开始处理知识点内容拼接, selectedKnowledgePoints:', inputs.selectedKnowledgePoints);
        
        // 创建内容拼接服务实例
        const contentService = createContentConcatenationService(db);
        
        // 构建知识点上下文
        const concatenatedContent = await contentService.buildContextFromSelectedItems(inputs.selectedKnowledgePoints);
        
        console.log('知识点内容拼接完成:', {
          totalItems: concatenatedContent.summary.totalItems,
          contentTypeCounts: concatenatedContent.summary.contentTypeCounts,
          knowledgePointIds: concatenatedContent.summary.knowledgePointIds,
          contextLength: concatenatedContent.contextString.length
        });
        
        // 将拼接后的内容添加到inputs中
        processedInputs.knowledgeContext = concatenatedContent.contextString;
        processedInputs.knowledgeContextSummary = concatenatedContent.summary;
        
        // 保留原始的selectedKnowledgePoints以供参考
        processedInputs.originalSelectedKnowledgePoints = inputs.selectedKnowledgePoints;
        
      } catch (contentError) {
        console.error('知识点内容拼接失败:', contentError);
        // 内容拼接失败时，仍然继续执行AI搜索，但记录错误
        processedInputs.knowledgeContextError = contentError instanceof Error ? contentError.message : '内容拼接失败';
      }
    }

    // 调用AI搜索API (使用聊天消息API)
    const result: DifyChatResponse = await DifyClient.aiSearch(query, processedInputs);
    console.log('AI搜索API调用成功:', result);
    
    // 保存Dify返回消息到数据库
    try {
      await ChatMessageService.saveDifyChatResponse(result, query, 'ai-search', processedInputs);
      console.log('AI搜索消息已保存到数据库');
    } catch (saveError) {
      console.error('保存AI搜索消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
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
    console.log('收到技术包装请求:', JSON.stringify(req.body, null, 2));
    
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      console.log('请求验证失败:', validation.errors);
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs, conversation_id } = req.body;
    console.log('提取的inputs:', JSON.stringify(inputs, null, 2));
    console.log('传入的conversation_id:', conversation_id);
    
    // 将前端数据映射到Dify工作流期望的格式
    const difyInputs = {
      Additional_information: formatAdditionalInformation(inputs)
    };
    console.log('格式化后的Dify输入:', JSON.stringify(difyInputs, null, 2));
    
    const result = await DifyClient.techPackage(difyInputs);
    console.log('Dify返回结果:', JSON.stringify(result, null, 2));
    
    // 保存Dify返回消息到数据库
    try {
      const userQuery = inputs.query || '技术包装请求';
      await ChatMessageService.saveDifyWorkflowResponse(result, userQuery, 'tech-package', inputs, conversation_id);
      console.log('技术包装消息已保存到数据库');
    } catch (saveError) {
      console.error('保存技术包装消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('技术包装响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '技术包装完成'));
  } catch (error) {
    console.error('技术包装API错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
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

    const { inputs, conversation_id } = req.body;
    
    // 构造Dify API所需的参数格式
    const difyInputs = {
      input1: inputs.techPackage || JSON.stringify(inputs),
      input2: inputs.techPackage || JSON.stringify(inputs),
      query: inputs.techPackage || JSON.stringify(inputs),
      techPackage: inputs.techPackage || JSON.stringify(inputs),
      template: inputs.template || 'default'
    };
    
    const result = await DifyClient.techStrategy(difyInputs);
    
    // 保存Dify工作流返回消息到数据库
    try {
      await ChatMessageService.saveDifyWorkflowResponse(result, '技术策略生成', 'tech-strategy', inputs, conversation_id);
      console.log('技术策略消息已保存到数据库');
    } catch (saveError) {
      console.error('保存技术策略消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
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

    const { inputs, conversation_id } = req.body;
    
    // 构造Dify API所需的参数格式 - 技术通稿使用input参数
    const inputContent = `${inputs.techTopic || ''}。${inputs.tech_content || ''}。车型：${inputs.vehicle_model || ''}。核心技术：${inputs.Highlight_tech || ''}。关联技术：${inputs.Associate_tech || ''}`;
    
    const difyInputs = {
      input: inputContent
    };
    
    const result = await DifyClient.techArticle(difyInputs);
    
    // 保存Dify工作流返回消息到数据库
    try {
      await ChatMessageService.saveDifyWorkflowResponse(result, '技术通稿生成', 'tech-article', inputs, conversation_id);
      console.log('技术通稿消息已保存到数据库');
    } catch (saveError) {
      console.error('保存技术通稿消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
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

// 核心稿件接口
router.post('/core-draft', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs, conversation_id } = req.body;
    
    // 格式化输入数据为Dify期望的格式
    const formattedInputs = {
      input3: typeof inputs.promotionStrategy === 'string' 
        ? inputs.promotionStrategy 
        : JSON.stringify(inputs.promotionStrategy),
      input: typeof inputs.promotionStrategy === 'string' 
        ? inputs.promotionStrategy 
        : JSON.stringify(inputs.promotionStrategy),
      promotionStrategy: inputs.promotionStrategy,
      template: inputs.template || 'default'
    };
    
    const result = await DifyClient.coreDraft(formattedInputs);
    
    // 保存Dify工作流返回消息到数据库
    try {
      await ChatMessageService.saveDifyWorkflowResponse(result, '核心稿件生成', 'core-draft', inputs, conversation_id);
      console.log('核心稿件消息已保存到数据库');
    } catch (saveError) {
      console.error('保存核心稿件消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('核心稿件响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '核心稿件生成完成'));
  } catch (error) {
    console.error('核心稿件API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '核心稿件生成失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 发布会稿生成接口 (根据专项-发布会稿.yml配置)
router.post('/speech-generation', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs, conversation_id } = req.body;
    
    // 根据专项-发布会稿.yml配置，支持多种参数映射方式
    const speechInputs = {
      Additional_information: inputs.Additional_information || inputs.coreDraft || inputs,
      'sys.query': inputs['sys.query'] || inputs.query || '请根据提供的补充信息生成技术发布会稿'
    };
    
    console.log('Speech Generation Inputs:', speechInputs);
    
    const result = await DifyClient.techPublish(speechInputs);
    
    // 保存Dify工作流返回消息到数据库
    try {
      await ChatMessageService.saveDifyWorkflowResponse(result, '发布会稿生成', 'speech-generation', inputs, conversation_id);
      console.log('发布会稿消息已保存到数据库');
    } catch (saveError) {
      console.error('保存发布会稿消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
    // 验证响应数据格式
    const responseValidation = validateTechAppResponse(result);
    if (!responseValidation.isValid) {
      console.warn('发布会稿响应格式验证失败:', responseValidation.errors);
    }
    
    res.json(formatApiResponse(true, result, '发布会稿生成完成'));
  } catch (error) {
    console.error('发布会稿生成API错误:', error);
    res.status(500).json(formatApiResponse(
      false, 
      null, 
      '发布会稿生成失败', 
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

// 技术发布接口 (使用chatflow模式)
router.post('/tech-publish', async (req, res) => {
  try {
    // 验证请求参数
    const validation = validateTechAppRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrorResponse(validation.errors));
    }

    const { inputs, conversation_id } = req.body;
    
    // 直接传递inputs给DifyClient，让其处理chatflow格式转换
    const result = await DifyClient.techPublish(inputs);
    
    // 保存Dify工作流返回消息到数据库
    try {
      await ChatMessageService.saveDifyWorkflowResponse(result, '技术发布生成', 'tech-publish', inputs, conversation_id);
      console.log('技术发布消息已保存到数据库');
    } catch (saveError) {
      console.error('保存技术发布消息到数据库失败:', saveError);
      // 不影响主流程，继续执行
    }
    
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