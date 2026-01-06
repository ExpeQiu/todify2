import { TechArticleAggregationService } from '@/services/TechArticleAggregationService';
import { AiSearchService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';
import { AggregateTechArticleDTO } from '../dto/AggregateTechArticle.dto';

export class AggregateTechArticleUseCase {
  private aggregationService: TechArticleAggregationService;

  constructor(private readonly aiSearchService: AiSearchService) {
    this.aggregationService = new TechArticleAggregationService(aiSearchService);
  }

  async execute(dto: AggregateTechArticleDTO): Promise<Result<any>> {
    try {
      logger.info('开始聚合生成技术通稿', {
        conversationCount: dto.conversationIds.length,
        outputCount: dto.outputIds?.length || 0,
        articleTypes: dto.articleTypes,
      });

      const result = await this.aggregationService.aggregateAndGenerate({
        conversationIds: dto.conversationIds,
        outputIds: dto.outputIds || [],
        articleTypes: dto.articleTypes,
        tone: dto.tone,
        targetAudience: dto.targetAudience,
        workflowId: dto.workflowId,
      });

      return success(result);
    } catch (error) {
      logger.error('聚合生成技术通稿失败', { error, dto });
      return failure({
        code: 'AGGREGATE_TECH_ARTICLE_FAILED',
        message: error instanceof Error ? error.message : '聚合生成技术通稿失败',
        details: error,
      });
    }
  }
}

