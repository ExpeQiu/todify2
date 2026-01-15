import { Request, Response } from 'express';
import { projectModel, sourceInformationModel } from '../models';
import { CreateProjectDTO, UpdateProjectDTO, ProjectStatus, ProjectType } from '../types/database';
import { ChatMessageService } from '../services/ChatMessageService';

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
}
