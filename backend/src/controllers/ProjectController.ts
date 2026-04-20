import { Request, Response } from 'express';
import { projectModel, sourceInformationModel } from '../models';
import { CreateProjectDTO, UpdateProjectDTO, ProjectStatus, ProjectType } from '../types/database';
import { ChatMessageService } from '../services/ChatMessageService';
import difyClient from '../services/DifyClient';

export class ProjectController {
  /**
   * 创建项目
   */
  async create(req: Request, res: Response) {
    try {
      const data: CreateProjectDTO = req.body;
      const project = await projectModel.create(data);
      res.status(201).json({
        success: true,
        data: project,
        message: '项目创建成功'
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '创建项目失败'
      });
    }
  }

  /**
   * 获取项目详情
   */
  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const project = await projectModel.findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      // 获取来源数量和技术点数量
      const [sourceCount, techPointCount] = await Promise.all([
        projectModel.getSourceCount(id),
        projectModel.getTechPointCount(id)
      ]);

      res.json({
        success: true,
        data: {
          ...project,
          sourceCount,
          techPointCount
        }
      });
    } catch (error) {
      console.error('Get project error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Error details:', { errorMessage, errorStack });
      res.status(500).json({
        success: false,
        message: '获取项目失败',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }

  /**
   * 获取项目详情（包含所有关联数据）
   */
  async getProjectDetails(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const projectDetails = await projectModel.getProjectDetails(id);
      if (!projectDetails) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        data: projectDetails
      });
    } catch (error) {
      console.error('Get project details error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: '获取项目详情失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV !== 'production' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      });
    }
  }

  /**
   * 添加项目关联（通用接口）
   */
  async addProjectRelation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const { relationType, relationId, notes } = req.body;

      if (!relationType || !relationId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：relationType 和 relationId'
        });
      }

      let success = false;
      switch (relationType) {
        case 'tech_point':
          success = await projectModel.addTechPoint(id, relationId, notes);
          break;
        case 'knowledge_point':
          success = await projectModel.addKnowledgePoint(id, relationId, notes);
          break;
        case 'file':
          success = await projectModel.addFile(id, relationId, notes);
          break;
        case 'source_information':
          success = await projectModel.addSourceInformation(id, relationId, notes);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `不支持的关联类型: ${relationType}`
          });
      }

      if (success) {
        res.json({
          success: true,
          message: '关联添加成功'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '关联添加失败，可能已存在'
        });
      }
    } catch (error) {
      console.error('Add project relation error:', error);
      res.status(500).json({
        success: false,
        message: '添加项目关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 移除项目关联（通用接口）
   */
  async removeProjectRelation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const { relationType, relationId } = req.body;

      if (!relationType || !relationId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：relationType 和 relationId'
        });
      }

      let success = false;
      switch (relationType) {
        case 'tech_point':
          success = await projectModel.removeTechPoint(id, relationId);
          break;
        case 'knowledge_point':
          success = await projectModel.removeKnowledgePoint(id, relationId);
          break;
        case 'file':
          success = await projectModel.removeFile(id, relationId);
          break;
        case 'source_information':
          success = await projectModel.removeSourceInformation(id, relationId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `不支持的关联类型: ${relationType}`
          });
      }

      if (success) {
        res.json({
          success: true,
          message: '关联移除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '关联不存在'
        });
      }
    } catch (error) {
      console.error('Remove project relation error:', error);
      res.status(500).json({
        success: false,
        message: '移除项目关联失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取项目列表
   */
  async getAll(req: Request, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        status,
        type
      } = req.query;

      const options = {
        limit: parseInt(pageSize as string),
        offset: (parseInt(page as string) - 1) * parseInt(pageSize as string),
        orderBy: orderBy as string,
        orderDirection: orderDirection as 'ASC' | 'DESC',
        where: {} as any
      };

      if (status) {
        options.where.status = status;
      } else {
        // 默认只显示活跃状态
        options.where.status = ProjectStatus.ACTIVE;
      }

      if (type) {
        options.where.type = type;
      }

      const result = await projectModel.findAll(options);
      
      // 为每个项目添加来源数量和技术点数量
      const projectsWithCounts = await Promise.all(
        result.data.map(async (project) => {
          const [sourceCount, techPointCount] = await Promise.all([
            projectModel.getSourceCount(project.id),
            projectModel.getTechPointCount(project.id)
          ]);
          return {
            ...project,
            sourceCount,
            techPointCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          ...result,
          data: projectsWithCounts
        }
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: '获取项目列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * 获取精选项目
   */
  async getFeatured(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await projectModel.findFeatured(limit);
      
      // 为每个项目添加来源数量和技术点数量
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const [sourceCount, techPointCount] = await Promise.all([
            projectModel.getSourceCount(project.id),
            projectModel.getTechPointCount(project.id)
          ]);
          return {
            ...project,
            sourceCount,
            techPointCount
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithCounts
      });
    } catch (error) {
      console.error('Get featured projects error:', error);
      res.status(500).json({
        success: false,
        message: '获取精选项目失败'
      });
    }
  }

  /**
   * 获取最近打开的项目
   */
  async getRecent(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const projects = await projectModel.findRecent(limit);
      
      // 为每个项目添加来源数量和技术点数量
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          const [sourceCount, techPointCount] = await Promise.all([
            projectModel.getSourceCount(project.id),
            projectModel.getTechPointCount(project.id)
          ]);
          return {
            ...project,
            sourceCount,
            techPointCount
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithCounts
      });
    } catch (error) {
      console.error('Get recent projects error:', error);
      res.status(500).json({
        success: false,
        message: '获取最近项目失败'
      });
    }
  }

  /**
   * 更新项目
   */
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const data: UpdateProjectDTO = req.body;
      const project = await projectModel.update(id, data);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        data: project,
        message: '项目更新成功'
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新项目失败'
      });
    }
  }

  /**
   * 更新最后打开时间
   */
  async updateLastOpenedAt(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      await projectModel.updateLastOpenedAt(id);

      res.json({
        success: true,
        message: '最后打开时间更新成功'
      });
    } catch (error) {
      console.error('Update last opened at error:', error);
      res.status(500).json({
        success: false,
        message: '更新最后打开时间失败'
      });
    }
  }

  /**
   * 删除项目
   */
  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const success = await projectModel.delete(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        message: '项目删除成功'
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '删除项目失败'
      });
    }
  }

  /**
   * 获取项目的对话记录列表
   */
  async getConversations(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const conversations = await ChatMessageService.getConversationsByProjectId(id, limit, offset);

      res.json({
        success: true,
        data: conversations,
        message: '获取项目对话记录成功'
      });
    } catch (error) {
      console.error('Get project conversations error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取项目对话记录失败'
      });
    }
  }

  /**
   * 获取项目的完整上下文（聚合接口）
   * 包括：来源信息（已分组）、知识点、对话记录（已分组）
   */
  async getFullContext(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      // 并行获取所有数据
      const [sources, projectDetails, conversations] = await Promise.all([
        sourceInformationModel.findByProjectId(id).catch(err => {
          console.error('获取来源信息失败:', err);
          return [];
        }),
        projectModel.getProjectDetails(id).catch(err => {
          console.error('获取项目详情失败:', err);
          return null;
        }),
        ChatMessageService.getConversationsByProjectId(id, 100, 0).catch(err => {
          console.error('获取对话记录失败:', err);
          return [];
        })
      ]);

      // 按 app_type 分组对话
      const groupedConversations = conversations.reduce((acc, conv) => {
        const appType = conv.app_type || 'other';
        if (!acc[appType]) {
          acc[appType] = [];
        }
        acc[appType].push(conv);
        return acc;
      }, {} as Record<string, typeof conversations>);

      // 构建响应数据
      const responseData = {
        sources: sources || [],
        knowledgePoints: projectDetails?.knowledgePoints || [],
        techPoints: projectDetails?.techPoints || [],
        conversations: groupedConversations,
        // 原始对话列表（用于兼容）
        conversationsList: conversations
      };

      res.json({
        success: true,
        data: responseData,
        message: '获取项目完整上下文成功'
      });
    } catch (error) {
      console.error('Get project full context error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取项目完整上下文失败'
      });
    }
  }

  /**
   * 项目多维度信息挖掘
   * 基于项目技术点、资源、AI共创记录进行结构化分析
   */
  async mineProjectIntelligence(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      const project = await projectModel.findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      console.log(`[ProjectIntelligenceMining] 开始挖掘项目 ${id} - ${project.name}`);

      const [sources, projectDetails, conversations] = await Promise.all([
        sourceInformationModel.findByProjectId(id).catch((err) => {
          console.error('[ProjectIntelligenceMining] 获取来源信息失败:', err);
          return [];
        }),
        projectModel.getProjectDetails(id).catch((err) => {
          console.error('[ProjectIntelligenceMining] 获取项目详情失败:', err);
          return null;
        }),
        ChatMessageService.getConversationsByProjectId(id, 12, 0).catch((err) => {
          console.error('[ProjectIntelligenceMining] 获取对话列表失败:', err);
          return [];
        })
      ]);

      const conversationSnapshots = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await ChatMessageService.getConversationMessages(conv.conversation_id, 6, 0).catch(() => []);
          const normalizedMessages = messages
            .slice(-6)
            .map((msg: any) => ({
              role: msg.message_type || 'unknown',
              content: this.truncateText(String(msg.content || ''), 500),
              created_at: msg.created_at
            }));

          return {
            conversation_id: conv.conversation_id,
            app_type: conv.app_type,
            session_name: conv.session_name,
            updated_at: conv.updated_at,
            messages: normalizedMessages
          };
        })
      );

      const contextForAi = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description || ''
        },
        tech_points: (projectDetails?.techPoints || []).map((tp: any) => ({
          id: tp.id,
          name: tp.name,
          description: this.truncateText(String(tp.description || ''), 500),
          tech_type: tp.tech_type,
          priority: tp.priority,
          status: tp.status
        })),
        resources: (sources || []).map((source: any) => ({
          id: source.id,
          title: source.title,
          type: source.type,
          category: source.metadata?.category || source.category || 'unknown',
          url: source.url,
          description: this.truncateText(String(source.description || ''), 500),
          created_at: source.created_at
        })),
        cocreation_conversations: conversationSnapshots
      };

      const miningPrompt = `你是资深技术情报分析专家。请基于给定项目上下文，输出“多维度结构化挖掘结果”。

要求：
1. 必须输出合法 JSON，不要输出 markdown。
2. 只输出一个 JSON 对象，字段必须完整，缺失时返回空数组或空字符串。
3. 结论要可执行、可落地，避免空话。

返回 JSON 结构：
{
  "overview": {
    "project_summary": "项目一句话摘要",
    "core_focus": ["核心关注点1", "核心关注点2"],
    "maturity_stage": "探索期/验证期/推进期/成熟期"
  },
  "technical_insights": [
    {
      "topic": "技术主题",
      "finding": "关键发现",
      "value": "业务价值",
      "confidence": "高/中/低"
    }
  ],
  "resource_insights": [
    {
      "topic": "资源主题",
      "finding": "资源发现",
      "gap": "缺口或不足",
      "suggestion": "补强建议"
    }
  ],
  "cocreation_insights": [
    {
      "app_type": "ai-search/tech-strategy/tech-package/tech-article",
      "finding": "共创发现",
      "status": "已明确/待验证/待落地"
    }
  ],
  "opportunities": [
    {
      "title": "机会点",
      "reason": "机会原因",
      "priority": "高/中/低"
    }
  ],
  "risks": [
    {
      "title": "风险点",
      "impact": "影响说明",
      "mitigation": "缓解措施",
      "priority": "高/中/低"
    }
  ],
  "next_actions": [
    {
      "action": "下一步动作",
      "owner": "建议角色",
      "timeline": "时间建议",
      "expected_output": "预期产出",
      "priority": "高/中/低"
    }
  ]
}`;

      const aiResponse = await difyClient.aiSearch(miningPrompt, {
        project_name: project.name,
        project_context: JSON.stringify(contextForAi)
      });

      const parsed = this.extractJsonObject(aiResponse.answer || '');
      if (!parsed) {
        console.error('[ProjectIntelligenceMining] AI 返回内容非 JSON:', aiResponse.answer);
        return res.status(502).json({
          success: false,
          message: '信息挖掘结果解析失败，请重试'
        });
      }

      console.log('[ProjectIntelligenceMining] 挖掘完成', {
        projectId: id,
        techPointCount: contextForAi.tech_points.length,
        resourceCount: contextForAi.resources.length,
        conversationCount: contextForAi.cocreation_conversations.length
      });

      res.json({
        success: true,
        data: {
          result: parsed,
          contextStats: {
            techPointCount: contextForAi.tech_points.length,
            resourceCount: contextForAi.resources.length,
            conversationCount: contextForAi.cocreation_conversations.length
          },
          generatedAt: new Date().toISOString()
        },
        message: '信息挖掘完成'
      });
    } catch (error) {
      console.error('[ProjectIntelligenceMining] 执行失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '信息挖掘失败'
      });
    }
  }

  private truncateText(input: string, maxLen: number): string {
    if (!input) {
      return '';
    }
    return input.length > maxLen ? `${input.slice(0, maxLen)}...` : input;
  }

  private extractJsonObject(rawText: string): any | null {
    if (!rawText || typeof rawText !== 'string') {
      return null;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      // 继续尝试从文本中提取 JSON
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}
