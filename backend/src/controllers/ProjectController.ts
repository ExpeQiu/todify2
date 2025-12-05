import { Request, Response } from 'express';
import { projectModel } from '../models';
import { CreateProjectDTO, UpdateProjectDTO, ProjectStatus, ProjectType } from '../types/database';

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

      // 获取来源数量
      const sourceCount = await projectModel.getSourceCount(id);

      res.json({
        success: true,
        data: {
          ...project,
          sourceCount
        }
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        message: '获取项目失败'
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
      res.status(500).json({
        success: false,
        message: '获取项目详情失败',
        error: error instanceof Error ? error.message : 'Unknown error'
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
      
      // 为每个项目添加来源数量
      const projectsWithSourceCount = await Promise.all(
        result.data.map(async (project) => {
          const sourceCount = await projectModel.getSourceCount(project.id);
          return {
            ...project,
            sourceCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          ...result,
          data: projectsWithSourceCount
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
      
      // 为每个项目添加来源数量
      const projectsWithSourceCount = await Promise.all(
        projects.map(async (project) => {
          const sourceCount = await projectModel.getSourceCount(project.id);
          return {
            ...project,
            sourceCount
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithSourceCount
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
      
      // 为每个项目添加来源数量
      const projectsWithSourceCount = await Promise.all(
        projects.map(async (project) => {
          const sourceCount = await projectModel.getSourceCount(project.id);
          return {
            ...project,
            sourceCount
          };
        })
      );

      res.json({
        success: true,
        data: projectsWithSourceCount
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
}
