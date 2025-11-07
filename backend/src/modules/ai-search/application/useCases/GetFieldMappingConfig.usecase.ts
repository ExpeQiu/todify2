import { FieldMappingService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

export class GetFieldMappingConfigUseCase {
  constructor(private readonly fieldMappingService: FieldMappingService) {}

  async execute(workflowId: string): Promise<Result<any>> {
    try {
      const config = await this.fieldMappingService.getFieldMappingConfig(workflowId);

      if (!config) {
        return failure({
          code: 'FIELD_MAPPING_NOT_FOUND',
          message: '字段映射配置不存在',
        });
      }

      return success(config);
    } catch (error) {
      logger.error('获取字段映射配置失败', { error });
      return failure({
        code: 'GET_FIELD_MAPPING_FAILED',
        message: error instanceof Error ? error.message : '获取字段映射配置失败',
        details: error,
      });
    }
  }
}

