/**
 * 从JSON文件导入技术点数据
 * 支持从TPD2项目导出的JSON格式导入技术点及其关联数据
 */

import { DatabaseManager, db } from '../config/database';
import { techPointModel, techCategoryModel, carModelModel } from '../models';
import { CreateTechPointDTO, Status, TechType, Priority, KnowledgeType, DifficultyLevel, CreateKnowledgePointDTO } from '../types/database';
import { KnowledgePointService } from '../services/knowledgePointService';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TPD2TechPoint {
  id?: number;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  parent_id?: number | null;
  level?: number;
  tech_type?: string;
  priority?: string;
  status?: string;
  tags?: string[] | null;
  technical_details?: any;
  benefits?: string[] | null;
  applications?: string[] | null;
  keywords?: string[] | null;
  source_url?: string | null;
  created_by?: string | null;
  tech_principle?: string;
  tech_value?: string;
  tech_boundary?: string;
  highlights?: string[];
  evidence_measured?: string[];
  evidence_certified?: string[];
  evidence_comparison?: string[];
  associated_car_models?: Array<{
    id?: number;
    name: string;
    brand: string;
    type?: string;
    car_model_id?: number;
    relationship?: string;
    notes?: string;
  }>;
  associated_resources?: any[];
}

/**
 * 查找或创建技术分类
 */
async function findOrCreateCategory(
  categoryId: number | undefined,
  categoryName: string | undefined
): Promise<number | null> {
  if (categoryId) {
    const category = await techCategoryModel.findById(categoryId);
    if (category) {
      return category.id;
    }
  }

  if (categoryName) {
    // 通过名称查找
    const allCategories = await techCategoryModel.findAll({ limit: 1000 });
    const found = allCategories.data.find((c: any) => c.name === categoryName);
    if (found) {
      return found.id;
    }

    // 创建新分类
    const newCategory = await techCategoryModel.create({
      name: categoryName,
      level: 1,
      status: Status.ACTIVE,
    });
    console.log(`  ✅ 创建技术分类: ${categoryName} (ID: ${newCategory.id})`);
    return newCategory.id;
  }

  return null;
}

/**
 * 查找或创建品牌
 */
async function findOrCreateBrand(brandName: string): Promise<number> {
  // 查找品牌
  const brandSql = 'SELECT id FROM brands WHERE name = ?';
  const brandResult = await db.query(brandSql, [brandName]);
  
  if (Array.isArray(brandResult) && brandResult.length > 0) {
    return brandResult[0].id;
  }

  // 创建品牌
  const insertBrandSql = 'INSERT INTO brands (name, status) VALUES (?, ?)';
  const insertResult = await db.query(insertBrandSql, [brandName, 'active']);
  const brandId = insertResult.lastID || insertResult.insertId;
  console.log(`  ✅ 创建品牌: ${brandName} (ID: ${brandId})`);
  return brandId;
}

/**
 * 查找或创建车型
 */
async function findOrCreateCarModel(
  brandName: string,
  carModelName: string,
  type?: string
): Promise<number> {
  // 先查找或创建品牌
  const brandId = await findOrCreateBrand(brandName);

  // 查找车型
  const carModelSql = 'SELECT id FROM car_models WHERE brand_id = ? AND name = ?';
  const carModelResult = await db.query(carModelSql, [brandId, carModelName]);
  
  if (Array.isArray(carModelResult) && carModelResult.length > 0) {
    return carModelResult[0].id;
  }

  // 创建车型
  const categoryMap: Record<string, string> = {
    '轿车': 'sedan',
    'SUV': 'suv',
    'MPV': 'mpv',
    '跑车': 'coupe',
    '皮卡': 'pickup',
  };
  
  const category = type ? categoryMap[type] || null : null;
  
  const insertCarModelSql = `
    INSERT INTO car_models (brand_id, name, category, status) 
    VALUES (?, ?, ?, ?)
  `;
  const insertResult = await db.query(insertCarModelSql, [
    brandId,
    carModelName,
    category,
    'active'
  ]);
  const carModelId = insertResult.lastID || insertResult.insertId;
  console.log(`  ✅ 创建车型: ${brandName} ${carModelName} (ID: ${carModelId})`);
  return carModelId;
}

/**
 * 导入单个技术点
 */
async function importTechPoint(tpdTechPoint: TPD2TechPoint): Promise<{
  success: boolean;
  techPointId?: number;
  message: string;
}> {
  try {
    // 1. 处理技术分类
    const categoryId = await findOrCreateCategory(
      tpdTechPoint.category_id,
      tpdTechPoint.category_name
    );

    // 2. 映射技术点类型
    const techTypeMap: Record<string, TechType> = {
      feature: TechType.FEATURE,
      technology: TechType.TECHNOLOGY,
      innovation: TechType.INNOVATION,
      improvement: TechType.IMPROVEMENT,
    };
    const techType = techTypeMap[tpdTechPoint.tech_type || 'feature'] || TechType.FEATURE;

    // 3. 映射优先级
    const priorityMap: Record<string, Priority> = {
      low: Priority.LOW,
      medium: Priority.MEDIUM,
      high: Priority.HIGH,
      critical: Priority.CRITICAL,
    };
    const priority = priorityMap[tpdTechPoint.priority || 'medium'] || Priority.MEDIUM;

    // 4. 映射状态
    const statusMap: Record<string, Status> = {
      active: Status.ACTIVE,
      inactive: Status.INACTIVE,
      draft: Status.DRAFT,
      archived: Status.ARCHIVED,
    };
    const status = statusMap[tpdTechPoint.status || 'draft'] || Status.DRAFT;

    // 5. 准备技术点数据（不合并技术知识点字段）
    const techPointData: CreateTechPointDTO = {
      name: tpdTechPoint.name,
      description: tpdTechPoint.description || null,
      category_id: categoryId || null,
      parent_id: tpdTechPoint.parent_id || null,
      level: tpdTechPoint.level || 1,
      tech_type: techType,
      priority: priority,
      status: status,
      tags: tpdTechPoint.tags || null,
      technical_details: tpdTechPoint.technical_details || null,
      benefits: tpdTechPoint.benefits || null,
      applications: tpdTechPoint.applications || null,
      keywords: tpdTechPoint.keywords || null,
      source_url: tpdTechPoint.source_url || null,
      created_by: tpdTechPoint.created_by || null,
    };

    // 7. 检查技术点是否已存在（通过名称）
    const allTechPoints = await techPointModel.findAll({ limit: 10000 });
    const existing = allTechPoints.data.find((tp: any) => tp.name === tpdTechPoint.name);

    let techPointId: number;
    if (existing) {
      // 更新现有技术点
      await techPointModel.update(existing.id, techPointData);
      techPointId = existing.id;
      console.log(`  ✅ 更新技术点: ${tpdTechPoint.name} (ID: ${techPointId})`);
    } else {
      // 创建新技术点
      const newTechPoint = await techPointModel.create(techPointData);
      techPointId = newTechPoint.id;
      console.log(`  ✅ 创建技术点: ${tpdTechPoint.name} (ID: ${techPointId})`);
    }

    // 8. 处理关联车型
    if (tpdTechPoint.associated_car_models && tpdTechPoint.associated_car_models.length > 0) {
      for (const carModelData of tpdTechPoint.associated_car_models) {
        try {
          // 如果已有car_model_id，直接使用
          let carModelId: number;
          if (carModelData.car_model_id) {
            const existingCarModel = await carModelModel.findById(carModelData.car_model_id);
            if (existingCarModel) {
              carModelId = existingCarModel.id;
            } else {
              // 如果ID不存在，通过品牌和名称查找或创建
              carModelId = await findOrCreateCarModel(
                carModelData.brand,
                carModelData.name,
                carModelData.type
              );
            }
          } else {
            // 通过品牌和名称查找或创建
            carModelId = await findOrCreateCarModel(
              carModelData.brand,
              carModelData.name,
              carModelData.type
            );
          }

          // 关联车型到技术点
          try {
            await techPointModel.associateCarModel(
              techPointId,
              carModelId,
              'planned', // 默认状态
              null,
              carModelData.notes || carModelData.relationship || null
            );
            console.log(`    ✅ 关联车型: ${carModelData.brand} ${carModelData.name}`);
          } catch (error: any) {
            // 如果已存在关联，忽略错误
            if (!error.message?.includes('已关联') && !error.message?.includes('UNIQUE')) {
              console.warn(`    ⚠️  关联车型失败: ${carModelData.brand} ${carModelData.name} - ${error.message}`);
            }
          }
        } catch (error: any) {
          console.warn(`    ⚠️  处理车型失败: ${carModelData.name} - ${error.message}`);
        }
      }
    }

    // 9. 处理技术知识点（创建独立的知识点记录）
    const knowledgePointService = new KnowledgePointService();
    let knowledgePointCount = 0;

    // 技术原理
    if (tpdTechPoint.tech_principle) {
      try {
        await knowledgePointService.createKnowledgePoint({
          tech_point_id: techPointId,
          title: '技术原理',
          content: tpdTechPoint.tech_principle,
          knowledge_type: KnowledgeType.PRINCIPLE,
          difficulty_level: DifficultyLevel.MEDIUM,
          status: Status.ACTIVE,
          created_by: tpdTechPoint.created_by || null,
        });
        knowledgePointCount++;
        console.log(`    ✅ 创建知识点: 技术原理`);
      } catch (error: any) {
        console.warn(`    ⚠️  创建知识点"技术原理"失败: ${error.message}`);
      }
    }

    // 价值
    if (tpdTechPoint.tech_value) {
      try {
        await knowledgePointService.createKnowledgePoint({
          tech_point_id: techPointId,
          title: '价值',
          content: tpdTechPoint.tech_value,
          knowledge_type: KnowledgeType.APPLICATION,
          difficulty_level: DifficultyLevel.MEDIUM,
          status: Status.ACTIVE,
          created_by: tpdTechPoint.created_by || null,
        });
        knowledgePointCount++;
        console.log(`    ✅ 创建知识点: 价值`);
      } catch (error: any) {
        console.warn(`    ⚠️  创建知识点"价值"失败: ${error.message}`);
      }
    }

    // 适用边界
    if (tpdTechPoint.tech_boundary) {
      try {
        await knowledgePointService.createKnowledgePoint({
          tech_point_id: techPointId,
          title: '适用边界',
          content: tpdTechPoint.tech_boundary,
          knowledge_type: KnowledgeType.CONCEPT,
          difficulty_level: DifficultyLevel.MEDIUM,
          status: Status.ACTIVE,
          created_by: tpdTechPoint.created_by || null,
        });
        knowledgePointCount++;
        console.log(`    ✅ 创建知识点: 适用边界`);
      } catch (error: any) {
        console.warn(`    ⚠️  创建知识点"适用边界"失败: ${error.message}`);
      }
    }

    // 技术亮点（数组，每个亮点创建一个知识点）
    if (tpdTechPoint.highlights && tpdTechPoint.highlights.length > 0) {
      for (let i = 0; i < tpdTechPoint.highlights.length; i++) {
        try {
          await knowledgePointService.createKnowledgePoint({
            tech_point_id: techPointId,
            title: `技术亮点${tpdTechPoint.highlights.length > 1 ? ` ${i + 1}` : ''}`,
            content: tpdTechPoint.highlights[i],
            knowledge_type: KnowledgeType.BEST_PRACTICE,
            difficulty_level: DifficultyLevel.MEDIUM,
            status: Status.ACTIVE,
            created_by: tpdTechPoint.created_by || null,
          });
          knowledgePointCount++;
        } catch (error: any) {
          console.warn(`    ⚠️  创建知识点"技术亮点${i + 1}"失败: ${error.message}`);
        }
      }
      if (tpdTechPoint.highlights.length > 0) {
        console.log(`    ✅ 创建 ${tpdTechPoint.highlights.length} 个技术亮点知识点`);
      }
    }

    // 实测证据（数组，每个证据创建一个知识点）
    if (tpdTechPoint.evidence_measured && tpdTechPoint.evidence_measured.length > 0) {
      for (let i = 0; i < tpdTechPoint.evidence_measured.length; i++) {
        try {
          await knowledgePointService.createKnowledgePoint({
            tech_point_id: techPointId,
            title: `实测证据${tpdTechPoint.evidence_measured.length > 1 ? ` ${i + 1}` : ''}`,
            content: tpdTechPoint.evidence_measured[i],
            knowledge_type: KnowledgeType.CASE_STUDY,
            difficulty_level: DifficultyLevel.MEDIUM,
            status: Status.ACTIVE,
            created_by: tpdTechPoint.created_by || null,
          });
          knowledgePointCount++;
        } catch (error: any) {
          console.warn(`    ⚠️  创建知识点"实测证据${i + 1}"失败: ${error.message}`);
        }
      }
      if (tpdTechPoint.evidence_measured.length > 0) {
        console.log(`    ✅ 创建 ${tpdTechPoint.evidence_measured.length} 个实测证据知识点`);
      }
    }

    // 认证证据（数组，每个证据创建一个知识点）
    if (tpdTechPoint.evidence_certified && tpdTechPoint.evidence_certified.length > 0) {
      for (let i = 0; i < tpdTechPoint.evidence_certified.length; i++) {
        try {
          await knowledgePointService.createKnowledgePoint({
            tech_point_id: techPointId,
            title: `认证证据${tpdTechPoint.evidence_certified.length > 1 ? ` ${i + 1}` : ''}`,
            content: tpdTechPoint.evidence_certified[i],
            knowledge_type: KnowledgeType.CASE_STUDY,
            difficulty_level: DifficultyLevel.MEDIUM,
            status: Status.ACTIVE,
            created_by: tpdTechPoint.created_by || null,
          });
          knowledgePointCount++;
        } catch (error: any) {
          console.warn(`    ⚠️  创建知识点"认证证据${i + 1}"失败: ${error.message}`);
        }
      }
      if (tpdTechPoint.evidence_certified.length > 0) {
        console.log(`    ✅ 创建 ${tpdTechPoint.evidence_certified.length} 个认证证据知识点`);
      }
    }

    // 对比证据（数组，每个对比创建一个知识点）
    if (tpdTechPoint.evidence_comparison && tpdTechPoint.evidence_comparison.length > 0) {
      for (let i = 0; i < tpdTechPoint.evidence_comparison.length; i++) {
        try {
          await knowledgePointService.createKnowledgePoint({
            tech_point_id: techPointId,
            title: `对比证据${tpdTechPoint.evidence_comparison.length > 1 ? ` ${i + 1}` : ''}`,
            content: tpdTechPoint.evidence_comparison[i],
            knowledge_type: KnowledgeType.CASE_STUDY,
            difficulty_level: DifficultyLevel.MEDIUM,
            status: Status.ACTIVE,
            created_by: tpdTechPoint.created_by || null,
          });
          knowledgePointCount++;
        } catch (error: any) {
          console.warn(`    ⚠️  创建知识点"对比证据${i + 1}"失败: ${error.message}`);
        }
      }
      if (tpdTechPoint.evidence_comparison.length > 0) {
        console.log(`    ✅ 创建 ${tpdTechPoint.evidence_comparison.length} 个对比证据知识点`);
      }
    }

    if (knowledgePointCount > 0) {
      console.log(`    📚 共创建 ${knowledgePointCount} 个知识点`);
    }

    // 10. 处理关联资料（如果有）
    if (tpdTechPoint.associated_resources && tpdTechPoint.associated_resources.length > 0) {
      console.log(`    ℹ️  发现 ${tpdTechPoint.associated_resources.length} 个关联资料（暂未处理）`);
    }

    return {
      success: true,
      techPointId,
      message: '导入成功',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '导入失败',
    };
  }
}

/**
 * 从JSON文件导入技术点
 */
async function importFromJson(jsonFilePath: string): Promise<void> {
  try {
    console.log('🔗 正在连接数据库...');
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    // 读取JSON文件
    if (!existsSync(jsonFilePath)) {
      throw new Error(`文件不存在: ${jsonFilePath}`);
    }

    console.log(`📂 读取JSON文件: ${jsonFilePath}`);
    const fileContent = readFileSync(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // 处理单个对象或数组
    const techPoints: TPD2TechPoint[] = Array.isArray(jsonData) ? jsonData : [jsonData];

    console.log(`\n📊 准备导入 ${techPoints.length} 个技术点\n`);

    const stats = {
      total: techPoints.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 导入每个技术点
    for (let i = 0; i < techPoints.length; i++) {
      const techPoint = techPoints[i];
      console.log(`\n[${i + 1}/${techPoints.length}] 处理技术点: ${techPoint.name}`);
      
      const result = await importTechPoint(techPoint);
      
      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
        stats.errors.push(`${techPoint.name}: ${result.message}`);
        console.error(`  ❌ 导入失败: ${result.message}`);
      }
    }

    // 输出统计信息
    console.log('\n' + '='.repeat(60));
    console.log('📊 导入完成统计');
    console.log('='.repeat(60));
    console.log(`总计: ${stats.total} 个技术点`);
    console.log(`成功: ${stats.success} 个`);
    console.log(`失败: ${stats.failed} 个`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ 错误列表:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ 导入完成！');
  } catch (error: any) {
    console.error('\n❌ 导入失败:', error.message);
    throw error;
  } finally {
    await db.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行导入
if (require.main === module) {
  const jsonFilePath = process.argv[2];
  
  if (!jsonFilePath) {
    console.error('❌ 请提供JSON文件路径');
    console.log('\n使用方法:');
    console.log('  npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-json.ts <json-file-path>');
    console.log('\n示例:');
    console.log('  npx ts-node -r tsconfig-paths/register src/scripts/import-tech-points-from-json.ts ./data/tech-points.json');
    process.exit(1);
  }

  importFromJson(jsonFilePath)
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { importFromJson, importTechPoint };
