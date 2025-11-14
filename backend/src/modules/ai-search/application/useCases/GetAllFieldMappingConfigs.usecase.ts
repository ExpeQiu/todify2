import { FieldMappingService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

export class GetAllFieldMappingConfigsUseCase {
  constructor(private readonly fieldMappingService: FieldMappingService) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const configs = await this.fieldMappingService.getAllFieldMappingConfigs();
      return success(configs);
    } catch (error) {
      logger.error('获取所有字段映射配置失败', { error });
      return failure({
        code: 'GET_ALL_FIELD_MAPPINGS_FAILED',
        message: error instanceof Error ? error.message : '获取所有字段映射配置失败',
        details: error,
      });
    }
  }
}

