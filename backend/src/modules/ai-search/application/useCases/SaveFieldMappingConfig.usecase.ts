import { FieldMappingService } from '@/services/AiSearchService';
import { logger } from '@/shared/lib/logger';
import { Result, failure, success } from '@/shared/lib/result';

import { SaveFieldMappingDTO } from '../dto/SaveFieldMapping.dto';

export class SaveFieldMappingConfigUseCase {
  constructor(private readonly fieldMappingService: FieldMappingService) {}

  async execute(pathWorkflowId: string, dto: SaveFieldMappingDTO): Promise<Result<any>> {
    try {
      if (dto.workflowId !== pathWorkflowId) {
        return failure({
          code: 'WORKFLOW_ID_MISMATCH',
          message: '请求路径和请求体的 workflowId 不一致',
        });
      }

      await this.fieldMappingService.saveFieldMappingConfig(dto.workflowId, dto);
      return success(dto);
    } catch (error) {
      logger.error('保存字段映射配置失败', { error });
      return failure({
        code: 'SAVE_FIELD_MAPPING_FAILED',
        message: error instanceof Error ? error.message : '保存字段映射配置失败',
        details: error,
      });
    }
  }
}

