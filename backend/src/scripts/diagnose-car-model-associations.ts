/**
 * 诊断和修复技术点关联车型的问题
 * 检查是否存在品牌不匹配的关联
 */

import { DatabaseManager, db } from '../config/database';

interface CarModelAssociation {
  id: number;
  tech_point_id: number;
  tech_point_name: string;
  car_model_id: number;
  car_model_name: string;
  brand_id: number;
  brand_name: string | null;
  notes: string | null;
  created_at: string;
}

async function diagnoseCarModelAssociations() {
  await db.connect();
  
  try {
    console.log('🔍 开始诊断技术点关联车型数据...\n');
    
    // 获取所有技术点关联车型的数据
    const sql = `
      SELECT 
        tcm.id,
        tcm.tech_point_id,
        tp.name as tech_point_name,
        tcm.car_model_id,
        cm.name as car_model_name,
        cm.brand_id,
        b.name as brand_name,
        tcm.notes,
        tcm.created_at
      FROM tech_point_car_models tcm
      JOIN tech_points tp ON tcm.tech_point_id = tp.id
      JOIN car_models cm ON tcm.car_model_id = cm.id
      LEFT JOIN brands b ON cm.brand_id = b.id
      ORDER BY tcm.tech_point_id, tcm.car_model_id
    `;
    
    const associations = await db.query(sql, []) as CarModelAssociation[];
    
    console.log(`📊 共找到 ${associations.length} 条关联记录\n`);
    
    // 统计信息
    const stats = {
      total: associations.length,
      withBrand: 0,
      withoutBrand: 0,
      byTechPoint: {} as Record<number, number>,
      byBrand: {} as Record<string, number>,
    };
    
    associations.forEach(assoc => {
      if (assoc.brand_name) {
        stats.withBrand++;
        stats.byBrand[assoc.brand_name] = (stats.byBrand[assoc.brand_name] || 0) + 1;
      } else {
        stats.withoutBrand++;
      }
      stats.byTechPoint[assoc.tech_point_id] = (stats.byTechPoint[assoc.tech_point_id] || 0) + 1;
    });
    
    console.log('📈 统计信息:');
    console.log(`  总关联数: ${stats.total}`);
    console.log(`  有品牌信息: ${stats.withBrand}`);
    console.log(`  无品牌信息: ${stats.withoutBrand}`);
    console.log(`\n  品牌分布:`);
    Object.entries(stats.byBrand).forEach(([brand, count]) => {
      console.log(`    ${brand}: ${count} 条`);
    });
    
    // 检查技术点153的关联
    console.log(`\n🔎 技术点153的关联详情:`);
    const tp153Associations = associations.filter(a => a.tech_point_id === 153);
    if (tp153Associations.length > 0) {
      tp153Associations.forEach(assoc => {
        console.log(`  车型ID ${assoc.car_model_id}: ${assoc.brand_name || '无品牌'} ${assoc.car_model_name}`);
        console.log(`    关联记录ID: ${assoc.id}`);
        console.log(`    创建时间: ${assoc.created_at}`);
        console.log(`    备注: ${assoc.notes || '无'}`);
      });
    } else {
      console.log('  无关联记录');
    }
    
    // 检查是否有品牌为空的关联
    const withoutBrandAssociations = associations.filter(a => !a.brand_name);
    if (withoutBrandAssociations.length > 0) {
      console.log(`\n⚠️  发现 ${withoutBrandAssociations.length} 条无品牌信息的关联:`);
      withoutBrandAssociations.forEach(assoc => {
        console.log(`  技术点 ${assoc.tech_point_id} (${assoc.tech_point_name}) -> 车型 ${assoc.car_model_id} (${assoc.car_model_name})`);
      });
    }
    
    // 检查是否有品牌ID为1（特斯拉）的关联
    const teslaAssociations = associations.filter(a => a.brand_id === 1);
    if (teslaAssociations.length > 0) {
      console.log(`\n🔍 发现 ${teslaAssociations.length} 条关联到"特斯拉"品牌的记录:`);
      teslaAssociations.forEach(assoc => {
        console.log(`  技术点 ${assoc.tech_point_id} (${assoc.tech_point_name}) -> ${assoc.brand_name} ${assoc.car_model_name}`);
      });
    }
    
    console.log('\n✅ 诊断完成');
    
  } catch (error: any) {
    console.error('❌ 诊断失败:', error.message);
    console.error(error.stack);
  } finally {
    await db.close();
  }
}

// 运行诊断
diagnoseCarModelAssociations().catch(console.error);
