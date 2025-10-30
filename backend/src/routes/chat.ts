import express from 'express';
import { ChatMessageService } from '../services/ChatMessageService';
import { formatApiResponse, formatValidationErrorResponse } from '../utils/validation';
import { Logger } from '../utils/logger';

const router = express.Router();

/**
 * 获取用户的对话列表
 * GET /api/chat/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const { userId, appType, limit = 20, offset = 0 } = req.query;
    
    const conversations = await ChatMessageService.getUserConversations(
      userId as string,
      appType as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(formatApiResponse(true, conversations, '获取对话列表成功'));
  } catch (error) {
    Logger.exception(error as Error, '获取对话列表');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取对话列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取指定对话的消息历史
 * GET /api/chat/conversations/:conversationId/messages
 */
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!conversationId) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'conversationId',
        message: '对话ID不能为空',
        value: conversationId
      }]));
    }
    
    const messages = await ChatMessageService.getConversationMessages(
      conversationId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(formatApiResponse(true, messages, '获取消息历史成功'));
  } catch (error) {
    Logger.exception(error as Error, '获取消息历史');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取消息历史失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取指定对话的详细信息
 * GET /api/chat/conversations/:conversationId
 */
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'conversationId',
        message: '对话ID不能为空',
        value: conversationId
      }]));
    }
    
    const conversation = await ChatMessageService.getConversationById(conversationId);
    
    if (!conversation) {
      return res.status(404).json(formatApiResponse(false, null, '对话不存在'));
    }
    
    res.json(formatApiResponse(true, conversation, '获取对话信息成功'));
  } catch (error) {
    Logger.exception(error as Error, '获取对话信息');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取对话信息失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取指定消息的详细信息
 * GET /api/chat/messages/:messageId
 */
router.get('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'messageId',
        message: '消息ID不能为空',
        value: messageId
      }]));
    }
    
    const message = await ChatMessageService.getChatMessageById(messageId);
    
    if (!message) {
      return res.status(404).json(formatApiResponse(false, null, '消息不存在'));
    }
    
    res.json(formatApiResponse(true, message, '获取消息信息成功'));
  } catch (error) {
    Logger.exception(error as Error, '获取消息信息');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取消息信息失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取工作流执行记录
 * GET /api/chat/workflow-executions/:workflowRunId
 */
router.get('/workflow-executions/:workflowRunId', async (req, res) => {
  try {
    const { workflowRunId } = req.params;

    if (!workflowRunId) {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'workflowRunId',
        message: '工作流执行ID不能为空',
        value: workflowRunId
      }]));
    }

    const execution = await ChatMessageService.getWorkflowExecutionById(workflowRunId);

    if (!execution) {
      return res.status(404).json(formatApiResponse(false, null, '工作流执行记录不存在'));
    }

    res.json(formatApiResponse(true, execution, '获取工作流执行记录成功'));
  } catch (error) {
    Logger.exception(error as Error, '获取工作流执行记录');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取工作流执行记录失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 搜索对话和消息
 * POST /api/chat/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query, appType, userId, messageType, limit = 20, offset = 0 } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json(formatValidationErrorResponse([{
        field: 'query',
        message: '搜索关键词不能为空',
        value: query
      }]));
    }

    // 这里可以实现更复杂的搜索逻辑
    // 目前先返回基础的对话列表
    const conversations = await ChatMessageService.getUserConversations(
      userId,
      appType,
      limit,
      offset
    );

    // 简单的关键词过滤
    const filteredConversations = conversations.filter(conv =>
      conv.session_name?.toLowerCase().includes(query.toLowerCase())
    );

    res.json(formatApiResponse(true, filteredConversations, '搜索完成'));
  } catch (error) {
    Logger.exception(error as Error, '搜索对话');
    res.status(500).json(formatApiResponse(
      false,
      null,
      '搜索失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;