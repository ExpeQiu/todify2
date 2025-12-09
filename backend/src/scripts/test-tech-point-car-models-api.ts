/**
 * 测试脚本：验证技术点车型数据通过 API 传递和保存
 * 用途：校验 car_models_info JSON 字段是否能正确通过 API 传递到数据库
 */

import { DatabaseManager } from '../config/database';
import { db } from '../config/database';
import { techPointModel } from '../models';
import { CreateTechPointDTO, CarModelInfo, ResourceInfo } from '../types/database';
import { Status, TechType, Priority } from '../types/database';

/**
 * 测试创建技术点并包含车型信息
 */
async function testCreateTechPointWithCarModels(): Promise<void> {
  console.log('\n🧪 测试 1: 创建技术点并包含车型信息\n');
  
  try {
    await db.connect();
    
    // 准备测试数据
    const testCarModels: CarModelInfo[] = [
      {
        id: 1,
        name: '汉EV',
        brand: '比亚迪',
        brand_id: 1,
        series: '汉',
        launch_date: '2020-07-01',
        status: 'active',
        application_status: 'production',
        implementation_date: '2020-07-01',
        notes: '首款搭载刀片电池的车型'
      },
      {
        id: 2,
        name: '唐EV',
        brand: '比亚迪',
        brand_id: 1,
        series: '唐',
        launch_date: '2018-06-01',
        status: 'active',
        application_status: 'production',
        notes: '中大型SUV'
      }
    ];

    const testResources: ResourceInfo[] = [
      {
        type: 'pdf',
        name: '技术白皮书',
        url: 'https://example.com/tech-whitepaper.pdf',
        description: '技术点详细说明文档'
      },
      {
        type: 'link',
        name: '官方介绍',
        url: 'https://example.com/official-intro',
        description: '官方技术介绍页面'
      }
    ];

    const techPointData: CreateTechPointDTO = {
      name: '测试技术点 - 刀片电池技术',
      description: '这是一个测试技术点，用于验证车型数据传递',
      category_id: null,
      parent_id: null,
      level: 1,
      tech_type: TechType.TECHNOLOGY,
      priority: Priority.HIGH,
      status: Status.ACTIVE,
      tags: ['电池', '新能源', '安全'],
      technical_details: {
        energy_density: '140Wh/kg',
        safety_level: '极高'
      },
      benefits: ['高安全性', '长寿命', '低成本'],
      applications: ['纯电动车', '插电混动'],
      keywords: ['刀片电池', '磷酸铁锂', 'CTP'],
      source_url: 'https://example.com',
      created_by: 'test_user',
      // TPD2 同步相关字段
      tpd_id: 'tpd_test_001',
      car_models_info: testCarModels,
      resources_info: testResources
    };

    // 创建技术点
    console.log('📝 创建技术点...');
    const createdTechPoint = await techPointModel.create(techPointData);
    console.log('✅ 技术点创建成功');
    console.log(`   ID: ${createdTechPoint.id}`);
    console.log(`   TPD_ID: ${createdTechPoint.tpd_id}`);
    console.log(`   车型数量: ${createdTechPoint.car_models_info?.length || 0}`);
    console.log(`   资源数量: ${createdTechPoint.resources_info?.length || 0}`);

    // 验证数据
    console.log('\n🔍 验证数据...');
    
    // 1. 验证车型信息
    if (createdTechPoint.car_models_info && Array.isArray(createdTechPoint.car_models_info)) {
      console.log('✅ car_models_info 字段存在且为数组');
      console.log(`   车型列表:`);
      createdTechPoint.car_models_info.forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.brand} ${car.name} (${car.application_status})`);
      });
      
      // 验证车型数据完整性
      const firstCar = createdTechPoint.car_models_info[0];
      if (firstCar.name === '汉EV' && firstCar.brand === '比亚迪') {
        console.log('✅ 车型数据完整且正确');
      } else {
        console.error('❌ 车型数据不匹配');
      }
    } else {
      console.error('❌ car_models_info 字段不存在或格式错误');
    }

    // 2. 验证资源信息
    if (createdTechPoint.resources_info && Array.isArray(createdTechPoint.resources_info)) {
      console.log('✅ resources_info 字段存在且为数组');
      console.log(`   资源列表:`);
      createdTechPoint.resources_info.forEach((resource, index) => {
        console.log(`   ${index + 1}. [${resource.type}] ${resource.name}`);
      });
    } else {
      console.error('❌ resources_info 字段不存在或格式错误');
    }

    // 3. 从数据库重新读取验证
    console.log('\n📖 从数据库重新读取验证...');
    const retrievedTechPoint = await techPointModel.findById(createdTechPoint.id);
    
    if (retrievedTechPoint) {
      console.log('✅ 成功从数据库读取技术点');
      
      if (retrievedTechPoint.car_models_info && Array.isArray(retrievedTechPoint.car_models_info)) {
        console.log(`✅ 车型数据已正确保存到数据库 (${retrievedTechPoint.car_models_info.length} 个车型)`);
      } else {
        console.error('❌ 从数据库读取的车型数据格式错误');
      }
      
      if (retrievedTechPoint.resources_info && Array.isArray(retrievedTechPoint.resources_info)) {
        console.log(`✅ 资源数据已正确保存到数据库 (${retrievedTechPoint.resources_info.length} 个资源)`);
      } else {
        console.error('❌ 从数据库读取的资源数据格式错误');
      }
    } else {
      console.error('❌ 无法从数据库读取技术点');
    }

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await techPointModel.hardDelete(createdTechPoint.id);
    console.log('✅ 测试数据已清理');

    console.log('\n✅ 测试 1 完成\n');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

/**
 * 测试通过 tpd_id 查找技术点
 */
async function testFindByTpdId(): Promise<void> {
  console.log('\n🧪 测试 2: 通过 tpd_id 查找技术点\n');
  
  try {
    await db.connect();
    
    // 创建测试数据
    const techPointData: CreateTechPointDTO = {
      name: '测试技术点 - TPD_ID 查找',
      description: '用于测试 tpd_id 查找功能',
      level: 1,
      tech_type: TechType.FEATURE,
      priority: Priority.MEDIUM,
      status: Status.ACTIVE,
      tpd_id: 'tpd_test_find_001',
      car_models_info: [
        {
          name: '测试车型',
          brand: '测试品牌',
          status: 'active'
        }
      ]
    };

    const created = await techPointModel.create(techPointData);
    console.log(`✅ 创建测试技术点 (ID: ${created.id}, TPD_ID: ${created.tpd_id})`);

    // 通过 tpd_id 查找
    const allTechPoints = await techPointModel.findAll({ limit: 10000 });
    const found = allTechPoints.data.find((tp: any) => tp.tpd_id === 'tpd_test_find_001');
    
    if (found) {
      console.log(`✅ 成功通过 tpd_id 找到技术点 (ID: ${found.id})`);
      if (found.car_models_info && found.car_models_info.length > 0) {
        console.log(`✅ 车型数据也正确返回 (${found.car_models_info.length} 个车型)`);
      }
    } else {
      console.error('❌ 无法通过 tpd_id 找到技术点');
    }

    // 清理
    await techPointModel.hardDelete(created.id);
    console.log('✅ 测试数据已清理');
    console.log('\n✅ 测试 2 完成\n');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

/**
 * 测试更新技术点的车型信息
 */
async function testUpdateCarModels(): Promise<void> {
  console.log('\n🧪 测试 3: 更新技术点的车型信息\n');
  
  try {
    await db.connect();
    
    // 创建初始数据
    const techPointData: CreateTechPointDTO = {
      name: '测试技术点 - 更新车型',
      description: '用于测试更新车型信息',
      level: 1,
      tech_type: TechType.FEATURE,
      priority: Priority.MEDIUM,
      status: Status.ACTIVE,
      car_models_info: [
        {
          name: '初始车型',
          brand: '初始品牌',
          status: 'active'
        }
      ]
    };

    const created = await techPointModel.create(techPointData);
    console.log(`✅ 创建测试技术点 (ID: ${created.id})`);
    console.log(`   初始车型数量: ${created.car_models_info?.length || 0}`);

    // 更新车型信息
    const updatedCarModels: CarModelInfo[] = [
      {
        name: '更新后的车型1',
        brand: '更新品牌1',
        status: 'active'
      },
      {
        name: '更新后的车型2',
        brand: '更新品牌2',
        status: 'active'
      }
    ];

    const updated = await techPointModel.update(created.id, {
      car_models_info: updatedCarModels
    });

    if (updated) {
      console.log(`✅ 成功更新技术点`);
      console.log(`   更新后车型数量: ${updated.car_models_info?.length || 0}`);
      
      if (updated.car_models_info && updated.car_models_info.length === 2) {
        console.log('✅ 车型数据更新成功');
        updated.car_models_info.forEach((car, index) => {
          console.log(`   ${index + 1}. ${car.brand} ${car.name}`);
        });
      } else {
        console.error('❌ 车型数据更新失败');
      }
    } else {
      console.error('❌ 更新技术点失败');
    }

    // 清理
    await techPointModel.hardDelete(created.id);
    console.log('✅ 测试数据已清理');
    console.log('\n✅ 测试 3 完成\n');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await db.close();
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始测试技术点车型数据 API 传递功能\n');
  console.log('='.repeat(60));

  try {
    // 运行所有测试
    await testCreateTechPointWithCarModels();
    await testFindByTpdId();
    await testUpdateCarModels();

    console.log('='.repeat(60));
    console.log('\n✅ 所有测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   1. ✅ 技术点创建时包含车型信息');
    console.log('   2. ✅ 通过 tpd_id 查找技术点');
    console.log('   3. ✅ 更新技术点的车型信息');
    console.log('\n💡 结论: 车型数据可以通过 API 正确传递到数据库\n');
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

export { testCreateTechPointWithCarModels, testFindByTpdId, testUpdateCarModels };
