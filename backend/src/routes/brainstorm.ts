import express from 'express';
import { formatApiResponse } from '../utils/validation';
import { brainstormService } from '../services/brainstorm/BrainstormService';
import { brainstormOrchestrator } from '../services/brainstorm/BrainstormOrchestrator';
import {
  CreateBrainstormSessionDTO,
  UpdateBrainstormSessionDTO,
  AddParticipantDTO,
} from '../models/Brainstorm';

const router = express.Router();

/**
 * 创建会话
 * POST /api/v1/brainstorm/sessions
 */
router.post('/sessions', async (req, res) => {
  try {
    const data: CreateBrainstormSessionDTO = {
      title: req.body.title,
      topic: req.body.topic,
      description: req.body.description,
      creatorId: req.body.creatorId,
      config: req.body.config,
      participantRoleIds: req.body.participantRoleIds || [],
    };

    if (!data.title || !data.topic) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        '标题和话题不能为空'
      ));
    }

    if (!data.participantRoleIds || data.participantRoleIds.length === 0) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        '至少需要选择一个参与者'
      ));
    }

    const session = await brainstormService.createSession(data);
    res.json(formatApiResponse(true, session, '创建会话成功'));
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '创建会话失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取会话列表
 * GET /api/v1/brainstorm/sessions
 */
router.get('/sessions', async (req, res) => {
  try {
    const options = {
      creatorId: req.query.creatorId as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const sessions = await brainstormService.listSessions(options);
    res.json(formatApiResponse(true, sessions, '获取会话列表成功'));
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取会话列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取会话详情
 * GET /api/v1/brainstorm/sessions/:id
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await brainstormService.getSessionById(req.params.id);
    res.json(formatApiResponse(true, session, '获取会话详情成功'));
  } catch (error) {
    console.error('获取会话详情失败:', error);
    const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json(formatApiResponse(
      false,
      null,
      '获取会话详情失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 更新会话
 * PATCH /api/v1/brainstorm/sessions/:id
 */
router.patch('/sessions/:id', async (req, res) => {
  try {
    const data: UpdateBrainstormSessionDTO = {
      title: req.body.title,
      topic: req.body.topic,
      description: req.body.description,
      config: req.body.config,
      status: req.body.status,
    };

    const session = await brainstormService.updateSession(req.params.id, data);
    res.json(formatApiResponse(true, session, '更新会话成功'));
  } catch (error) {
    console.error('更新会话失败:', error);
    const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json(formatApiResponse(
      false,
      null,
      '更新会话失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除会话
 * DELETE /api/v1/brainstorm/sessions/:id
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    await brainstormService.deleteSession(req.params.id);
    res.json(formatApiResponse(true, null, '删除会话成功'));
  } catch (error) {
    console.error('删除会话失败:', error);
    const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json(formatApiResponse(
      false,
      null,
      '删除会话失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 添加参与者
 * POST /api/v1/brainstorm/sessions/:id/participants
 */
router.post('/sessions/:id/participants', async (req, res) => {
  try {
    const data: AddParticipantDTO = {
      aiRoleId: req.body.aiRoleId,
      displayName: req.body.displayName,
      roleType: req.body.roleType,
      sortOrder: req.body.sortOrder,
    };

    if (!data.aiRoleId) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        'AI角色ID不能为空'
      ));
    }

    const participant = await brainstormService.addParticipant(req.params.id, data);
    res.json(formatApiResponse(true, participant, '添加参与者成功'));
  } catch (error) {
    console.error('添加参与者失败:', error);
    const statusCode = error instanceof Error && (error.message.includes('不存在') || error.message.includes('已存在')) ? 400 : 500;
    res.status(statusCode).json(formatApiResponse(
      false,
      null,
      '添加参与者失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取参与者列表
 * GET /api/v1/brainstorm/sessions/:id/participants
 */
router.get('/sessions/:id/participants', async (req, res) => {
  try {
    const participants = await brainstormService.getParticipants(req.params.id);
    res.json(formatApiResponse(true, participants, '获取参与者列表成功'));
  } catch (error) {
    console.error('获取参与者列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取参与者列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 删除参与者
 * DELETE /api/v1/brainstorm/sessions/:id/participants/:participantId
 */
router.delete('/sessions/:id/participants/:participantId', async (req, res) => {
  try {
    const participantId = parseInt(req.params.participantId);
    if (isNaN(participantId)) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        '参与者ID无效'
      ));
    }

    await brainstormService.removeParticipant(participantId);
    res.json(formatApiResponse(true, null, '删除参与者成功'));
  } catch (error) {
    console.error('删除参与者失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '删除参与者失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 启动讨论
 * POST /api/v1/brainstorm/sessions/:id/start
 */
router.post('/sessions/:id/start', async (req, res) => {
  try {
    // 异步启动，不等待完成
    brainstormOrchestrator.startSession(req.params.id).catch(error => {
      console.error('启动讨论失败:', error);
    });

    res.json(formatApiResponse(true, null, '讨论已启动'));
  } catch (error) {
    console.error('启动讨论失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '启动讨论失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 停止讨论
 * POST /api/v1/brainstorm/sessions/:id/stop
 */
router.post('/sessions/:id/stop', async (req, res) => {
  try {
    await brainstormOrchestrator.stopSession(req.params.id);
    res.json(formatApiResponse(true, null, '讨论已停止'));
  } catch (error) {
    console.error('停止讨论失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '停止讨论失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取消息列表
 * GET /api/v1/brainstorm/sessions/:id/messages
 */
router.get('/sessions/:id/messages', async (req, res) => {
  try {
    const options = {
      roundNumber: req.query.roundNumber ? parseInt(req.query.roundNumber as string) : undefined,
      afterMessageId: req.query.afterMessageId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const messages = await brainstormService.getMessages(req.params.id, options);
    res.json(formatApiResponse(true, messages, '获取消息列表成功'));
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取消息列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取讨论总结
 * GET /api/v1/brainstorm/sessions/:id/summary
 */
router.get('/sessions/:id/summary', async (req, res) => {
  try {
    const session = await brainstormService.getSessionById(req.params.id);
    
    if (!session.summary) {
      return res.status(404).json(formatApiResponse(
        false,
        null,
        '讨论总结尚未生成'
      ));
    }

    res.json(formatApiResponse(true, { summary: session.summary }, '获取讨论总结成功'));
  } catch (error) {
    console.error('获取讨论总结失败:', error);
    const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
    res.status(statusCode).json(formatApiResponse(
      false,
      null,
      '获取讨论总结失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 添加用户消息
 * POST /api/v1/brainstorm/sessions/:id/user-messages
 */
router.post('/sessions/:id/user-messages', async (req, res) => {
  try {
    const { content, replyToId, userId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json(formatApiResponse(
        false,
        null,
        '消息内容不能为空'
      ));
    }

    const message = await brainstormService.addUserMessage(
      req.params.id,
      content.trim(),
      replyToId,
      userId
    );

    res.json(formatApiResponse(true, message, '用户消息已添加'));
  } catch (error) {
    console.error('添加用户消息失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '添加用户消息失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取会话状态
 * GET /api/v1/brainstorm/sessions/:id/status
 */
router.get('/sessions/:id/status', async (req, res) => {
  try {
    const session = await brainstormService.getSessionById(req.params.id);
    const isActive = brainstormOrchestrator.isSessionActive(req.params.id);
    const maxRound = await brainstormService.getMaxRoundNumber(req.params.id);

    res.json(formatApiResponse(true, {
      status: session.status,
      isActive,
      currentRound: maxRound,
      messageCount: session.messageCount || 0,
    }, '获取会话状态成功'));
  } catch (error) {
    console.error('获取会话状态失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取会话状态失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

