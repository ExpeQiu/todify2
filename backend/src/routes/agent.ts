import express from 'express';
import { formatApiResponse } from '../utils/validation';
import { RequirementExtractor, SelectedResources, ExtractedRequirement } from '../services/agent/RequirementExtractor';
import { AgentOrchestrator } from '../services/agent/AgentOrchestrator';
import { MultiAgentExecutor } from '../services/agent/MultiAgentExecutor';
import { HumanInLoopManager } from '../services/agent/HumanInLoopManager';
import { ExportService } from '../services/agent/ExportService';
import { ChatMessage } from '../services/llm/types';
import { aiRoleModel } from '../models';

const router = express.Router();
const agentOrchestrator = new AgentOrchestrator();
const requirementExtractor = new RequirementExtractor(agentOrchestrator);
const multiAgentExecutor = new MultiAgentExecutor();
const humanInLoopManager = new HumanInLoopManager();
const exportService = new ExportService();

/**
 * 从对话提取需求
 * POST /api/v1/agent/extract-requirement
 */
router.post('/extract-requirement', async (req, res) => {
  try {
    const { projectId, conversationHistory, selectedResources } = req.body;

    if (!projectId) {
      return res.status(400).json(formatApiResponse(false, null, '项目ID不能为空'));
    }

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json(formatApiResponse(false, null, '对话历史格式错误'));
    }

    if (!selectedResources) {
      return res.status(400).json(formatApiResponse(false, null, '已选资源不能为空'));
    }

    // 转换对话历史格式
    const chatMessages: ChatMessage[] = conversationHistory.map((msg: any) => {
      // 支持多种格式的对话历史
      if (msg.role) {
        return {
          role: msg.role,
          content: msg.content || msg.text || '',
          name: msg.name,
          tool_call_id: msg.tool_call_id
        };
      } else if (msg.sender === 'user' || msg.type === 'user') {
        return {
          role: 'user',
          content: msg.content || msg.text || msg.message || ''
        };
      } else if (msg.sender === 'ai' || msg.sender === 'assistant' || msg.type === 'assistant') {
        return {
          role: 'assistant',
          content: msg.content || msg.text || msg.message || ''
        };
      } else {
        return {
          role: 'user',
          content: String(msg.content || msg.text || msg.message || '')
        };
      }
    });

    const resources: SelectedResources = {
      techPointIds: selectedResources.techPointIds || [],
      knowledgePointIds: selectedResources.knowledgePointIds || [],
      sourceIds: selectedResources.sourceIds || []
    };

    // 提取需求
    const extractedRequirement = await requirementExtractor.extractFromConversation(
      projectId,
      chatMessages,
      resources
    );

    res.json(formatApiResponse(true, extractedRequirement, '需求提取成功'));
  } catch (error) {
    console.error('提取需求失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '提取需求失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取可用的Agent列表（用于需求提取等）
 * GET /api/v1/agent/available-agents
 */
router.get('/available-agents', async (req, res) => {
  try {
    const allRoles = await aiRoleModel.getAll();
    const availableAgents = allRoles
      .filter(role => role.enabled && role.provider === 'direct-agent')
      .map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        provider: role.provider
      }));

    res.json(formatApiResponse(true, availableAgents, '获取可用Agent列表成功'));
  } catch (error) {
    console.error('获取可用Agent列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取可用Agent列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 启动多Agent执行
 * POST /api/v1/agent/multi-agent/execute
 */
router.post('/multi-agent/execute', async (req, res) => {
  try {
    const { projectId, scene, requirement } = req.body;

    if (!projectId) {
      return res.status(400).json(formatApiResponse(false, null, '项目ID不能为空'));
    }

    if (!scene || !['tech-package', 'tech-strategy', 'tech-article'].includes(scene)) {
      return res.status(400).json(formatApiResponse(false, null, '场景类型无效'));
    }

    if (!requirement) {
      return res.status(400).json(formatApiResponse(false, null, '需求信息不能为空'));
    }

    // 执行多Agent工作流
    const result = await multiAgentExecutor.execute(
      parseInt(projectId),
      scene,
      requirement as ExtractedRequirement
    );

    res.json(formatApiResponse(true, result, '多Agent执行成功'));
  } catch (error) {
    console.error('多Agent执行失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '多Agent执行失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 查询执行状态
 * GET /api/v1/agent/executions/:executionId
 */
router.get('/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // TODO: 从数据库加载执行记录
    // 目前返回一个占位响应
    res.json(formatApiResponse(true, {
      executionId,
      message: '执行记录查询功能待实现'
    }, '查询执行状态成功'));
  } catch (error) {
    console.error('查询执行状态失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '查询执行状态失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 局部优化
 * POST /api/v1/agent/optimize-local
 */
router.post('/optimize-local', async (req, res) => {
  try {
    const request = req.body;

    if (!request.executionId || !request.versionId || !request.selectedText) {
      return res.status(400).json(formatApiResponse(false, null, '参数不完整'));
    }

    const result = await humanInLoopManager.optimizeLocalContent(request);

    res.json(formatApiResponse(true, result, '局部优化成功'));
  } catch (error) {
    console.error('局部优化失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '局部优化失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取版本历史
 * GET /api/v1/agent/executions/:executionId/versions
 */
router.get('/executions/:executionId/versions', async (req, res) => {
  try {
    const { executionId } = req.params;
    const versions = await humanInLoopManager.getVersionHistory(executionId);

    res.json(formatApiResponse(true, {
      executionId,
      versions,
      currentVersionId: versions.length > 0 ? versions[0].versionId : null
    }, '获取版本历史成功'));
  } catch (error) {
    console.error('获取版本历史失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取版本历史失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 回退版本
 * POST /api/v1/agent/executions/:executionId/revert
 */
router.post('/executions/:executionId/revert', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { targetVersionId } = req.body;

    if (!targetVersionId) {
      return res.status(400).json(formatApiResponse(false, null, '目标版本ID不能为空'));
    }

    const version = await humanInLoopManager.revertToVersion(executionId, targetVersionId);

    res.json(formatApiResponse(true, version, '回退版本成功'));
  } catch (error) {
    console.error('回退版本失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '回退版本失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 导出内容
 * POST /api/v1/agent/executions/:executionId/export
 */
router.post('/executions/:executionId/export', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { format = 'markdown', versionId } = req.body;

    // TODO: 从数据库加载执行记录
    // 目前从sessionStorage获取（前端传递）
    // 实际应该从数据库加载
    const executionData = req.body.execution;
    
    if (!executionData) {
      return res.status(400).json(formatApiResponse(false, null, '执行记录不存在'));
    }

    const result = await exportService.export(executionData, format, versionId);

    // 设置响应头
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);

    // 发送文件
    if (Buffer.isBuffer(result.content)) {
      res.send(result.content);
    } else {
      res.send(result.content);
    }
  } catch (error) {
    console.error('导出失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '导出失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

/**
 * 获取工具Agent列表
 * GET /api/v1/agent/tool-agents
 */
router.get('/tool-agents', async (req, res) => {
  try {
    const toolAgents = [
      {
        id: 'polish-writer',
        name: '文字润色',
        description: '改进文字表达，使其更加流畅、专业',
        category: 'optimize',
        icon: '✨'
      },
      {
        id: 'simplify-writer',
        name: '简化表达',
        description: '将复杂的技术内容简化，提高可读性',
        category: 'optimize',
        icon: '📝'
      },
      {
        id: 'enhance-technical',
        name: '技术增强',
        description: '增加技术深度，补充技术细节',
        category: 'optimize',
        icon: '🔬'
      },
      {
        id: 'web-search-supplement',
        name: '互联网搜索补充',
        description: '通过互联网搜索补充相关信息',
        category: 'search',
        icon: '🔍'
      },
      {
        id: 'competitor-research',
        name: '竞品调研',
        description: '补充竞品对比和市场调研信息',
        category: 'research',
        icon: '📊'
      },
      {
        id: 'case-study-finder',
        name: '案例补充',
        description: '为技术点补充应用案例和实践经验',
        category: 'research',
        icon: '💼'
      },
      {
        id: 'format-structure',
        name: '结构优化',
        description: '优化内容结构和层次',
        category: 'format',
        icon: '📐'
      },
      {
        id: 'bullet-points',
        name: '转换为要点',
        description: '将段落内容转换为要点列表',
        category: 'format',
        icon: '📋'
      }
    ];

    res.json(formatApiResponse(true, { toolAgents }, '获取工具Agent列表成功'));
  } catch (error) {
    console.error('获取工具Agent列表失败:', error);
    res.status(500).json(formatApiResponse(
      false,
      null,
      '获取工具Agent列表失败',
      error instanceof Error ? error.message : '未知错误'
    ));
  }
});

export default router;

