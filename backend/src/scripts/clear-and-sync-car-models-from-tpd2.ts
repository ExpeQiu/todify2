/**
 * 清除所有技术点的车辆关联，并从TPD2同步最新的车辆关联信息
 */

import axios from 'axios';
import { DatabaseManager, db } from '../config/database';
import { techPointModel, techCategoryModel, carModelModel } from '../models';
import { CreateTechPointDTO, Status, TechType, Priority } from '../types/database';

const TPD_API_BASE_URL = process.env.TPD_API_BASE_URL || 'http://localhost:3004/api/external/v1';

interface TPD2TechPoint {
  id?: number;
  name: string;
  associated_car_models?: Array<{
    id?: number;
    name: string;
    brand: string;
    type?: string;
    car_model_id?: number;
    relationship?: string;
    notes?: string;
  }>;
}

/**
 * 查找或创建品牌
 */
async function findOrCreateBrand(brandName: string): Promise<number> {
  const trimmedBrandName = brandName.trim();
  
  // 查找品牌
  const brandSql = 'SELECT id FROM brands WHERE name = ?';
  const brandResult = await db.query(brandSql, [trimmedBrandName]);
  
  if (Array.isArray(brandResult) && brandResult.length > 0) {
    return brandResult[0].id;
  }

  // 创建品牌
  const insertBrandSql = 'INSERT INTO brands (name, status) VALUES (?, ?)';
  const insertResult = await db.query(insertBrandSql, [trimmedBrandName, 'active']);
  const brandId = insertResult.lastID || insertResult.insertId;
  console.log(`  ✅ 创建品牌: ${trimmedBrandName} (ID: ${brandId})`);
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
  if (!brandName || brandName.trim() === '') {
    throw new Error('品牌名称不能为空');
  }
  if (!carModelName || carModelName.trim() === '') {
    throw new Error('车型名称不能为空');
  }
  
  const trimmedBrandName = brandName.trim();
  const trimmedCarModelName = carModelName.trim();
  
  // 先查找或创建品牌
  const brandId = await findOrCreateBrand(trimmedBrandName);

  // 查找车型
  const carModelSql = 'SELECT id FROM car_models WHERE brand_id = ? AND name = ?';
  const carModelResult = await db.query(carModelSql, [brandId, trimmedCarModelName]);
  
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
    trimmedCarModelName,
    category,
    'active'
  ]);
  const carModelId = insertResult.lastID || insertResult.insertId;
  console.log(`  ✅ 创建车型: ${trimmedBrandName} ${trimmedCarModelName} (ID: ${carModelId})`);
  return carModelId;
}

/**
 * 清除所有技术点的车辆关联
 */
async function clearAllCarModelAssociations(): Promise<number> {
  console.log('🗑️  开始清除所有技术点的车辆关联...\n');
  
  const deleteSql = 'DELETE FROM tech_point_car_models';
  const result = await db.query(deleteSql);
  
  // 获取删除的行数
  const countSql = 'SELECT COUNT(*) as count FROM tech_point_car_models';
  const countResult = await db.query(countSql);
  const remainingCount = Array.isArray(countResult) && countResult.length > 0 
    ? countResult[0].count 
    : 0;
  
  console.log(`✅ 已清除所有车辆关联，剩余关联数: ${remainingCount}\n`);
  return remainingCount;
}

/**
 * 从TPD2获取所有技术点
 */
async function fetchAllTechPointsFromTPD2(): Promise<TPD2TechPoint[]> {
  console.log('📡 开始从TPD2获取技术点数据...\n');
  
  const allTechPoints: TPD2TechPoint[] = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(`${TPD_API_BASE_URL}/tech-points`, {
        params: {
          page,
          pageSize,
          orderBy: 'created_at',
          orderDirection: 'ASC',
        },
        timeout: 30000,
      });

      if (response.data.code !== 200 || !response.data.data) {
        console.error('TPD2 API 返回错误:', response.data);
        break;
      }

      const paginatedData = response.data.data;
      const techPoints = paginatedData.data || [];

      if (techPoints.length === 0) {
        hasMore = false;
        break;
      }

      // 获取每个技术点的详细信息（包含关联车型）
      for (const techPoint of techPoints) {
        try {
          const detailResponse = await axios.get(
            `${TPD_API_BASE_URL}/tech-points/${techPoint.id}`,
            {
              params: {
                includeAssociations: true,
              },
              timeout: 30000,
            }
          );

          if (detailResponse.data.code === 200 && detailResponse.data.data) {
            const detail = detailResponse.data.data;
            // 转换车型数据格式
            if (detail.carModels && Array.isArray(detail.carModels)) {
              detail.associated_car_models = detail.carModels.map((cm: any) => ({
                id: cm.id,
                name: cm.name || cm.model_name,
                brand: cm.brand || cm.brand_name,
                type: cm.type || cm.category,
                car_model_id: cm.car_model_id || cm.id,
                relationship: cm.relationship,
                notes: cm.notes,
              }));
            }
            allTechPoints.push(detail);
          } else {
            // 如果没有详细信息，使用基本信息
            allTechPoints.push(techPoint);
          }
      } catch (error: any) {
        console.warn(`  ⚠️  获取技术点 ${techPoint.id} 详情失败: ${error.message || error}`);
        if (error.response) {
          console.warn(`    API响应状态: ${error.response.status}`);
        }
        // 即使获取详情失败，也添加基本信息
        allTechPoints.push(techPoint);
      }
      }

      console.log(`  📄 已获取第 ${page} 页，共 ${techPoints.length} 条技术点`);

      if (techPoints.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error: any) {
      console.error(`获取第 ${page} 页数据失败:`);
      console.error(`  错误信息: ${error.message || error}`);
      if (error.response) {
        console.error(`  API响应状态: ${error.response.status}`);
        console.error(`  API响应数据:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.code) {
        console.error(`  错误代码: ${error.code}`);
      }
      if (error.config) {
        console.error(`  请求URL: ${error.config.url}`);
      }
      hasMore = false;
    }
  }

  console.log(`✅ 从TPD2获取完成，共 ${allTechPoints.length} 条技术点\n`);
  return allTechPoints;
}

/**
 * 同步单个技术点的车辆关联
 */
async function syncTechPointCarModels(tpdTechPoint: TPD2TechPoint): Promise<{
  success: boolean;
  techPointId?: number;
  carModelCount: number;
  message: string;
}> {
  try {
    // 查找技术点（通过tpd_id或名称）
    let techPoint = null;
    
    if (tpdTechPoint.id) {
      // 先通过tpd_id查找
      const allTechPoints = await techPointModel.findAll({ limit: 10000 });
      techPoint = allTechPoints.data.find((tp: any) => tp.tpd_id === tpdTechPoint.id?.toString());
      
      // 如果找不到，通过ID查找
      if (!techPoint) {
        techPoint = await techPointModel.findById(tpdTechPoint.id);
      }
    }
    
    // 如果还是找不到，通过名称查找
    if (!techPoint) {
      const allTechPoints = await techPointModel.findAll({ limit: 10000 });
      techPoint = allTechPoints.data.find((tp: any) => tp.name === tpdTechPoint.name);
    }

    if (!techPoint) {
      return {
        success: false,
        carModelCount: 0,
        message: `未找到技术点: ${tpdTechPoint.name}`
      };
    }

    const techPointId = techPoint.id;
    let carModelCount = 0;

    // 处理关联车型
    if (tpdTechPoint.associated_car_models && tpdTechPoint.associated_car_models.length > 0) {
      for (const carModelData of tpdTechPoint.associated_car_models) {
        try {
          // 验证车型数据
          if (!carModelData.name || carModelData.name.trim() === '') {
            continue;
          }

          const brandName = carModelData.brand?.trim();
          if (!brandName || brandName === '') {
            continue;
          }

          // 查找或创建车型
          let carModelId: number;
          if (carModelData.car_model_id) {
            const existingCarModel = await carModelModel.findById(carModelData.car_model_id);
            if (existingCarModel) {
              carModelId = existingCarModel.id;
            } else {
              carModelId = await findOrCreateCarModel(
                brandName,
                carModelData.name.trim(),
                carModelData.type
              );
            }
          } else {
            carModelId = await findOrCreateCarModel(
              brandName,
              carModelData.name.trim(),
              carModelData.type
            );
          }

          // 关联车型到技术点
          try {
            await techPointModel.associateCarModel(
              techPointId,
              carModelId,
              'planned',
              undefined,
              carModelData.notes || carModelData.relationship || undefined
            );
            carModelCount++;
          } catch (error: any) {
            // 如果已存在关联，忽略错误
            if (error.message?.includes('已关联') || error.message?.includes('UNIQUE')) {
              carModelCount++;
            }
          }
        } catch (error: any) {
          console.warn(`    ⚠️  处理车型失败: ${carModelData.name} - ${error.message}`);
        }
      }
    }

    return {
      success: true,
      techPointId,
      carModelCount,
      message: `成功同步 ${carModelCount} 个车型关联`
    };
  } catch (error: any) {
    return {
      success: false,
      carModelCount: 0,
      message: error.message || '同步失败'
    };
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🚀 开始清除并同步技术点车辆关联...\n');
    
    // 连接数据库
    await db.connect();
    console.log('✅ 数据库连接成功\n');

    // 1. 清除所有现有关联
    await clearAllCarModelAssociations();

    // 2. 从TPD2获取所有技术点
    const tpdTechPoints = await fetchAllTechPointsFromTPD2();

    if (tpdTechPoints.length === 0) {
      console.log('⚠️  未获取到技术点数据，退出');
      return;
    }

    // 3. 同步每个技术点的车辆关联
    console.log('🔄 开始同步车辆关联...\n');
    
    let totalCarModels = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const tpdTechPoint of tpdTechPoints) {
      try {
        const result = await syncTechPointCarModels(tpdTechPoint);
        if (result.success) {
          successCount++;
          totalCarModels += result.carModelCount;
          if (result.carModelCount > 0) {
            console.log(`  ✅ ${tpdTechPoint.name}: ${result.carModelCount} 个车型关联`);
          }
        } else {
          errorCount++;
          console.warn(`  ⚠️  ${tpdTechPoint.name}: ${result.message}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`  ❌ ${tpdTechPoint.name}: ${error.message}`);
      }
    }

    console.log('\n📊 同步完成统计:');
    console.log(`  - 成功同步: ${successCount} 个技术点`);
    console.log(`  - 失败: ${errorCount} 个技术点`);
    console.log(`  - 总计关联: ${totalCarModels} 个车型\n`);

    console.log('✅ 所有操作完成！\n');
  } catch (error: any) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

export { main };

