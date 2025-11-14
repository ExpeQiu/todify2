// Agent配置迁移服务
// 负责将旧的配置系统迁移到AI角色管理系统

import { AIRoleConfig } from '../types/aiRole';
import { SmartWorkflowNodeConfig, IndependentPageConfig } from './configService';
import aiRoleService from './aiRoleService';
import configService from './configService';
import {
  convertSmartWorkflowConfigs,
  convertIndependentPageConfigs,
  generateMigratedRoleId
} from '../utils/migrateAgents';

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCount: number;
  errors?: string[];
}

export interface MigrationStatus {
  hasSmartWorkflowConfigs: boolean;
  hasIndependentPageConfigs: boolean;
  smartWorkflowCount: number;
  independentPageCount: number;
}

/**
 * Agent配置迁移服务
 */
class MigrationService {
  /**
   * 获取localStorage中的Agent配置（不依赖后端API）
   */
  getLocalStorageConfigs(): {
    smartWorkflowConfigs: SmartWorkflowNodeConfig[];
    independentPageConfigs: IndependentPageConfig[];
  } {
    let smartWorkflowConfigs: SmartWorkflowNodeConfig[] = [];
    let independentPageConfigs: IndependentPageConfig[] = [];

    try {
      const storedSmart = localStorage.getItem('smartWorkflowConfigs');
      if (storedSmart) {
        smartWorkflowConfigs = JSON.parse(storedSmart);
      }
    } catch (error: any) {
      console.warn('读取智能工作流配置失败:', error);
    }

    try {
      const storedIndependent = localStorage.getItem('independentPageConfigs');
      if (storedIndependent) {
        independentPageConfigs = JSON.parse(storedIndependent);
      }
    } catch (error: any) {
      console.warn('读取独立页面配置失败:', error);
    }

    return {
      smartWorkflowConfigs,
      independentPageConfigs
    };
  }

  /**
   * 检查是否有需要迁移的配置
   * 即使后端API失败，也能返回localStorage中的配置信息
   */
  async checkMigrationStatus(existingRoles?: AIRoleConfig[]): Promise<MigrationStatus & { backendAvailable: boolean; errorMessage?: string }> {
    // 首先从localStorage读取配置（不依赖后端）
    const { smartWorkflowConfigs, independentPageConfigs } = this.getLocalStorageConfigs();

    let existingRoleIds = new Set<string>();
    let backendAvailable = false;
    let errorMessage: string | undefined;

    // 如果提供了已加载的角色列表，直接使用；否则尝试从后端获取
    if (existingRoles !== undefined && existingRoles.length >= 0) {
      existingRoleIds = new Set(existingRoles.map(r => r.id));
      backendAvailable = true;
    } else {
      // 尝试从后端获取现有角色（用于判断是否已迁移）
      try {
        const roles = await aiRoleService.getAIRoles();
        existingRoleIds = new Set(roles.map(r => r.id));
        backendAvailable = true;
      } catch (error: any) {
        // 后端API失败，但不影响显示localStorage中的配置
        backendAvailable = false;
        const errorStatus = error?.response?.status || 'N/A';
        
        if (errorStatus === 404) {
          errorMessage = '后端API未找到，请检查后端服务器是否运行';
        } else {
          errorMessage = error?.response?.data?.message || error?.message || '无法连接后端服务';
        }
        
        // 对于404错误（后端未运行），静默处理，不输出任何日志
        // 这是正常情况，不需要记录
        if (errorStatus !== 404) {
          // 非404错误才输出警告
          console.warn('🟡 [migrationService] 无法连接后端API，但可以从localStorage读取配置');
          console.warn('错误状态:', errorStatus);
          console.warn('错误消息:', errorMessage);
        }
        
        // 如果后端不可用，假设所有localStorage中的配置都需要迁移
        // 返回localStorage中的所有配置
        return {
          hasSmartWorkflowConfigs: smartWorkflowConfigs.length > 0,
          hasIndependentPageConfigs: independentPageConfigs.length > 0,
          smartWorkflowCount: smartWorkflowConfigs.length,
          independentPageCount: independentPageConfigs.length,
          backendAvailable: false,
          errorMessage
        };
      }
    }

    // 过滤掉已经迁移的配置
    const unmigratedSmartWorkflow = smartWorkflowConfigs.filter(
      config => !existingRoleIds.has(config.id)
    );
    const unmigratedIndependentPage = independentPageConfigs.filter(
      config => !existingRoleIds.has(config.id)
    );

    return {
      hasSmartWorkflowConfigs: unmigratedSmartWorkflow.length > 0,
      hasIndependentPageConfigs: unmigratedIndependentPage.length > 0,
      smartWorkflowCount: unmigratedSmartWorkflow.length,
      independentPageCount: unmigratedIndependentPage.length,
      backendAvailable: true
    };
  }

  /**
   * 执行迁移
   */
  async migrateAgents(): Promise<MigrationResult> {
    const errors: string[] = [];
    let migratedCount = 0;

    try {
      // 获取现有角色，用于ID冲突检查
      const existingRoles = await aiRoleService.getAIRoles();
      const existingRoleIds = existingRoles.map(r => r.id);

      // 1. 迁移智能工作流配置（直接从localStorage读取）
      try {
        let smartWorkflowConfigs: SmartWorkflowNodeConfig[] = [];
        const storedSmart = localStorage.getItem('smartWorkflowConfigs');
        if (storedSmart) {
          smartWorkflowConfigs = JSON.parse(storedSmart);
        }

        const smartWorkflowRoles = convertSmartWorkflowConfigs(smartWorkflowConfigs);
        
        for (let i = 0; i < smartWorkflowRoles.length; i++) {
          const roleData = smartWorkflowRoles[i];
          const originalId = smartWorkflowConfigs[i].id;

          // 检查是否已存在
          if (existingRoleIds.includes(originalId)) {
            console.log(`智能工作流配置 ${originalId} 已存在，跳过迁移`);
            continue;
          }

          try {
            // 创建角色（后端会自动生成ID，但我们需要确保使用原始ID）
            // 由于后端自动生成ID，我们创建后需要更新ID（如果后端支持）
            // 或者直接创建，然后在迁移映射中记录ID关系
            const result = await aiRoleService.createAIRole(roleData);
            
            if (result.success && result.data) {
              migratedCount++;
              // 如果创建的ID与原始ID不同，我们可以选择更新或保留新的ID
              // 为了保持兼容性，我们使用后端生成的ID
              existingRoleIds.push(result.data.id || originalId);
            } else {
              throw new Error(result.error || '创建失败');
            }
          } catch (error) {
            const errorMsg = `迁移智能工作流配置 ${originalId} 失败: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `迁移智能工作流配置失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      // 2. 迁移独立页面配置（直接从localStorage读取）
      try {
        let independentPageConfigs: IndependentPageConfig[] = [];
        const storedIndependent = localStorage.getItem('independentPageConfigs');
        if (storedIndependent) {
          independentPageConfigs = JSON.parse(storedIndependent);
        }

        const independentPageRoles = convertIndependentPageConfigs(independentPageConfigs);
        
        for (let i = 0; i < independentPageRoles.length; i++) {
          const roleData = independentPageRoles[i];
          const originalId = independentPageConfigs[i].id;

          // 检查是否已存在
          if (existingRoleIds.includes(originalId)) {
            console.log(`独立页面配置 ${originalId} 已存在，跳过迁移`);
            continue;
          }

          try {
            // 创建角色（后端会自动生成ID）
            const result = await aiRoleService.createAIRole(roleData);
            
            if (result.success && result.data) {
              migratedCount++;
              // 记录新创建的ID
              existingRoleIds.push(result.data.id || originalId);
            } else {
              throw new Error(result.error || '创建失败');
            }
          } catch (error) {
            const errorMsg = `迁移独立页面配置 ${originalId} 失败: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      } catch (error) {
        const errorMsg = `迁移独立页面配置失败: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }

      // 3. 迁移成功后，删除旧配置
      if (migratedCount > 0) {
        try {
          localStorage.removeItem('smartWorkflowConfigs');
          localStorage.removeItem('independentPageConfigs');
          console.log('已删除旧配置数据');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          console.warn('删除旧配置失败:', {
            message: errorMessage,
            error
          });
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `成功迁移 ${migratedCount} 个Agent配置` 
          : `部分成功：迁移 ${migratedCount} 个，失败 ${errors.length} 个`,
        migratedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `迁移失败: ${error instanceof Error ? error.message : String(error)}`,
        migratedCount,
        errors: [...errors, error instanceof Error ? error.message : String(error)]
      };
    }
  }
}

export default new MigrationService();

