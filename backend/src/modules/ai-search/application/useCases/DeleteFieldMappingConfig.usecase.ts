import { FieldMappingService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

export class DeleteFieldMappingConfigUseCase {
  constructor(private readonly fieldMappingService: FieldMappingService) {}

  async execute(workflowId: string): Promise<Result<void>> {
    try {
      await this.fieldMappingService.deleteFieldMappingConfig(workflowId);
      return success(undefined);
    } catch (error) {
      logger.error('删除字段映射配置失败', { error });
      return failure({
        code: 'DELETE_FIELD_MAPPING_FAILED',
        message: error instanceof Error ? error.message : '删除字段映射配置失败',
        details: error,
      });
    }
  }
}

