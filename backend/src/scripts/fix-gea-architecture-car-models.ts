/**
 * 修复"吉利GEA架构"技术点的关联车型
 * 删除错误的关联，创建正确的车型并关联
 */

import { DatabaseManager, db } from '../config/database';
import { techPointModel, carModelModel } from '../models';

const TECH_POINT_NAME = '吉利GEA架构';
const CORRECT_CAR_MODELS = [
  { name: '星舰7', brand: '吉利' },
  { name: '银河E5', brand: '吉利' },
  { name: '银河L6', brand: '吉利' },
  { name: '银河L7', brand: '吉利' },
  { name: '领克07', brand: '领克' },
];

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

async function findOrCreateCarModel(brandName: string, carModelName: string): Promise<number> {
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
  const insertCarModelSql = `
    INSERT INTO car_models (brand_id, name, category, status) 
    VALUES (?, ?, ?, ?)
  `;
  const insertResult = await db.query(insertCarModelSql, [
    brandId,
    trimmedCarModelName,
    'suv', // 默认类别
    'active'
  ]);
  const carModelId = insertResult.lastID || insertResult.insertId;
  console.log(`  ✅ 创建车型: ${trimmedBrandName} ${trimmedCarModelName} (ID: ${carModelId})`);
  return carModelId;
}

async function fixGEAArchitectureCarModels() {
  await db.connect();
  
  try {
    console.log('🔧 开始修复"吉利GEA架构"技术点的关联车型...\n');
    
    // 1. 查找技术点
    const tpSql = 'SELECT id, name FROM tech_points WHERE name = ?';
    const techPoints = await db.query(tpSql, [TECH_POINT_NAME]) as any[];
    
    if (!techPoints || techPoints.length === 0) {
      console.error(`❌ 未找到技术点: ${TECH_POINT_NAME}`);
      return;
    }
    
    const techPointId = techPoints[0].id;
    console.log(`✅ 找到技术点: ${TECH_POINT_NAME} (ID: ${techPointId})\n`);
    
    // 2. 检查当前关联的车型
    const currentAssociationsSql = `
      SELECT 
        tcm.id as association_id,
        tcm.car_model_id,
        cm.name as car_model_name,
        b.name as brand_name
      FROM tech_point_car_models tcm
      JOIN car_models cm ON tcm.car_model_id = cm.id
      LEFT JOIN brands b ON cm.brand_id = b.id
      WHERE tcm.tech_point_id = ?
    `;
    const currentAssociations = await db.query(currentAssociationsSql, [techPointId]) as any[];
    
    console.log(`📋 当前关联的车型 (${currentAssociations.length} 条):`);
    currentAssociations.forEach(assoc => {
      console.log(`  - ${assoc.brand_name || '无品牌'} ${assoc.car_model_name} (关联ID: ${assoc.association_id})`);
    });
    console.log();
    
    // 3. 删除所有现有关联
    if (currentAssociations.length > 0) {
      console.log('🗑️  删除现有关联...');
      for (const assoc of currentAssociations) {
        try {
          await techPointModel.disassociateCarModel(techPointId, assoc.car_model_id);
          console.log(`  ✅ 已删除关联: ${assoc.brand_name || '无品牌'} ${assoc.car_model_name}`);
        } catch (error: any) {
          console.warn(`  ⚠️  删除关联失败: ${assoc.car_model_name} - ${error.message}`);
        }
      }
      console.log();
    }
    
    // 4. 创建或查找正确的车型
    console.log('🚗 创建或查找正确的车型...');
    const carModelIds: number[] = [];
    
    for (const carModel of CORRECT_CAR_MODELS) {
      try {
        const carModelId = await findOrCreateCarModel(carModel.brand, carModel.name);
        carModelIds.push(carModelId);
      } catch (error: any) {
        console.error(`  ❌ 处理车型失败: ${carModel.brand} ${carModel.name} - ${error.message}`);
      }
    }
    console.log();
    
    // 5. 关联正确的车型到技术点
    console.log('🔗 关联车型到技术点...');
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < CORRECT_CAR_MODELS.length; i++) {
      const carModel = CORRECT_CAR_MODELS[i];
      const carModelId = carModelIds[i];
      
      if (!carModelId) {
        console.warn(`  ⚠️  跳过: ${carModel.brand} ${carModel.name} (未找到车型ID)`);
        failCount++;
        continue;
      }
      
      try {
        await techPointModel.associateCarModel(
          techPointId,
          carModelId,
          'planned',
          undefined,
          '关联方式：标配'
        );
        console.log(`  ✅ 关联成功: ${carModel.brand} ${carModel.name}`);
        successCount++;
      } catch (error: any) {
        if (error.message?.includes('已关联')) {
          console.log(`  ℹ️  已存在关联: ${carModel.brand} ${carModel.name}`);
          successCount++;
        } else {
          console.error(`  ❌ 关联失败: ${carModel.brand} ${carModel.name} - ${error.message}`);
          failCount++;
        }
      }
    }
    
    console.log();
    console.log('📊 修复结果:');
    console.log(`  成功关联: ${successCount} 个车型`);
    console.log(`  失败: ${failCount} 个车型`);
    console.log();
    
    // 6. 验证最终结果
    const finalAssociations = await db.query(currentAssociationsSql, [techPointId]) as any[];
    console.log(`✅ 最终关联的车型 (${finalAssociations.length} 条):`);
    finalAssociations.forEach(assoc => {
      console.log(`  - ${assoc.brand_name || '无品牌'} ${assoc.car_model_name}`);
    });
    
    console.log('\n✅ 修复完成！');
    
  } catch (error: any) {
    console.error('❌ 修复失败:', error.message);
    console.error(error.stack);
  } finally {
    await db.close();
  }
}

// 运行修复
fixGEAArchitectureCarModels().catch(console.error);
