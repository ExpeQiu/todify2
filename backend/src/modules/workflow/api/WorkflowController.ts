import { Request, Response, NextFunction } from 'express';

import { logger } from '@/shared/lib/logger';
import { validateDTO } from '@/shared/lib/validator';

import { ExecuteAiSearchSchema, ExecuteAiSearchDTO } from '../application/dto/executeAiSearch.dto';
import { ExecuteAiSearchUseCase } from '../application/useCases/ExecuteAiSearch.usecase';
import { ExecuteTechPackageUseCase } from '../application/useCases/ExecuteTechPackage.usecase';
import { ExecuteTechStrategyUseCase } from '../application/useCases/ExecuteTechStrategy.usecase';
import { ExecuteTechArticleUseCase } from '../application/useCases/ExecuteTechArticle.usecase';
import { ExecuteCoreDraftUseCase } from '../application/useCases/ExecuteCoreDraft.usecase';
import { ExecuteSpeechUseCase } from '../application/useCases/ExecuteSpeech.usecase';
import { ExecuteTechPublishUseCase } from '../application/useCases/ExecuteTechPublish.usecase';
import { ExecuteTechPackageSchema } from '../application/dto/executeTechPackage.dto';
import { ExecuteTechStrategySchema } from '../application/dto/executeTechStrategy.dto';
import { ExecuteTechArticleSchema } from '../application/dto/executeTechArticle.dto';
import { ExecuteCoreDraftSchema } from '../application/dto/executeCoreDraft.dto';
import { ExecuteSpeechSchema } from '../application/dto/executeSpeech.dto';
import { ExecuteTechPublishSchema } from '../application/dto/executeTechPublish.dto';

export class WorkflowController {
  constructor(
    private readonly executeAiSearchUseCase: ExecuteAiSearchUseCase,
    private readonly executeTechPackageUseCase: ExecuteTechPackageUseCase,
    private readonly executeTechStrategyUseCase: ExecuteTechStrategyUseCase,
    private readonly executeTechArticleUseCase: ExecuteTechArticleUseCase,
    private readonly executeCoreDraftUseCase: ExecuteCoreDraftUseCase,
    private readonly executeSpeechUseCase: ExecuteSpeechUseCase,
    private readonly executeTechPublishUseCase: ExecuteTechPublishUseCase,
  ) {}

  executeAiSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationIdInput = req.body.conversationId ?? req.body.conversation_id;
      const normalizedConversationId = typeof conversationIdInput === 'string' ? conversationIdInput : '';

      const normalizedPayload: { query: unknown; inputs?: unknown; conversationId: string } = {
        query: req.body.query,
        inputs: req.body.inputs,
        conversationId: normalizedConversationId,
      };

      const dto = validateDTO<ExecuteAiSearchDTO>(ExecuteAiSearchSchema, normalizedPayload);
      const result = await this.executeAiSearchUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result.value,
        message: 'AI搜索完成',
      });
    } catch (error) {
      logger.error('AI 搜索接口执行失败', { error });
      next(error);
    }
  };

  executeTechPackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteTechPackageSchema, payload);
      const result = await this.executeTechPackageUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '技术包装完成' });
    } catch (error) {
      logger.error('技术包装接口执行失败', { error });
      next(error);
    }
  };

  executeTechStrategy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteTechStrategySchema, payload);
      const result = await this.executeTechStrategyUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '技术策略完成' });
    } catch (error) {
      logger.error('技术策略接口执行失败', { error });
      next(error);
    }
  };

  executeTechArticle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteTechArticleSchema, payload);
      const result = await this.executeTechArticleUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '技术通稿完成' });
    } catch (error) {
      logger.error('技术通稿接口执行失败', { error });
      next(error);
    }
  };

  executeCoreDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteCoreDraftSchema, payload);
      const result = await this.executeCoreDraftUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '核心稿件生成完成' });
    } catch (error) {
      logger.error('核心稿件接口执行失败', { error });
      next(error);
    }
  };

  executeSpeech = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteSpeechSchema, payload);
      const result = await this.executeSpeechUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '发布会稿生成完成' });
    } catch (error) {
      logger.error('发布会稿接口执行失败', { error });
      next(error);
    }
  };

  executeTechPublish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = {
        inputs: req.body.inputs ?? {},
        conversationId: req.body.conversationId ?? req.body.conversation_id,
      };
      const dto = validateDTO(ExecuteTechPublishSchema, payload);
      const result = await this.executeTechPublishUseCase.execute(dto);

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }

      res.json({ success: true, data: result.value, message: '技术发布完成' });
    } catch (error) {
      logger.error('技术发布接口执行失败', { error });
      next(error);
    }
  };
}

