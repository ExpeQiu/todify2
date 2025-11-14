import { DatabaseManager } from '../config/database';
import { Status, CarModelStatus, TechType, Priority } from '../types/database';

const db = new DatabaseManager();

// 示例技术分类数据
const techCategories = [
  {
    name: '动力系统',
    description: '发动机、电机、传动系统等动力相关技术',
    sort_order: 1,
    status: Status.ACTIVE
  },
  {
    name: '智能驾驶',
    description: '自动驾驶、辅助驾驶、智能感知等技术',
    sort_order: 2,
    status: Status.ACTIVE
  },
  {
    name: '车身结构',
    description: '车身设计、材料工艺、安全结构等技术',
    sort_order: 3,
    status: Status.ACTIVE
  },
  {
    name: '智能座舱',
    description: '车机系统、人机交互、智能配置等技术',
    sort_order: 4,
    status: Status.ACTIVE
  },
  {
    name: '新能源技术',
    description: '电池技术、充电技术、能源管理等',
    sort_order: 5,
    status: Status.ACTIVE
  }
];

// 示例车型数据
const carModels = [
  {
    brand: '比亚迪',
    series: '汉',
    model: 'EV',
    year: 2024,
    engine_type: '纯电动',
    fuel_type: '电能',
    market_segment: '中大型轿车',
    status: CarModelStatus.ACTIVE,
    metadata: JSON.stringify({
      price_range: '20-30万',
      battery_capacity: '85.4kWh',
      range: '715km',
      acceleration: '3.9s'
    })
  },
  {
    brand: '特斯拉',
    series: 'Model 3',
    model: 'Performance',
    year: 2024,
    engine_type: '纯电动',
    fuel_type: '电能',
    market_segment: '中型轿车',
    status: CarModelStatus.ACTIVE,
    metadata: JSON.stringify({
      price_range: '30-40万',
      battery_capacity: '82kWh',
      range: '675km',
      acceleration: '3.3s'
    })
  },
  {
    brand: '蔚来',
    series: 'ET7',
    model: '100kWh',
    year: 2024,
    engine_type: '纯电动',
    fuel_type: '电能',
    market_segment: '中大型轿车',
    status: CarModelStatus.ACTIVE,
    metadata: JSON.stringify({
      price_range: '40-50万',
      battery_capacity: '100kWh',
      range: '1000km',
      acceleration: '3.8s'
    })
  },
  {
    brand: '小鹏',
    series: 'P7',
    model: '鹏翼版',
    year: 2024,
    engine_type: '纯电动',
    fuel_type: '电能',
    market_segment: '中型轿车',
    status: CarModelStatus.ACTIVE,
    metadata: JSON.stringify({
      price_range: '25-35万',
      battery_capacity: '86.2kWh',
      range: '706km',
      acceleration: '4.3s'
    })
  },
  {
    brand: '理想',
    series: 'L9',
    model: 'Max',
    year: 2024,
    engine_type: '增程式',
    fuel_type: '油电混合',
    market_segment: '大型SUV',
    status: CarModelStatus.ACTIVE,
    metadata: JSON.stringify({
      price_range: '45-50万',
      battery_capacity: '44.5kWh',
      range: '1315km',
      acceleration: '5.3s'
    })
  }
];

// 示例技术点数据
const techPoints = [
  {
    category_id: 1, // 动力系统
    title: '刀片电池技术',
    description: '比亚迪自主研发的磷酸铁锂刀片电池，具有高安全性、长寿命、快充等特点',
    content: '刀片电池采用长条形设计，提高了电池包的空间利用率和结构强度。通过优化电芯结构和热管理系统，实现了更高的安全性和能量密度。',
    tech_type: TechType.FEATURE,
    priority: Priority.HIGH,
    tags: JSON.stringify(['电池技术', '安全性', '磷酸铁锂', '比亚迪']),
    technical_details: JSON.stringify({
      energy_density: '140Wh/kg',
      cycle_life: '3000+次',
      safety_features: ['针刺不起火', '高温稳定', '结构安全']
    }),
    advantages: JSON.stringify([
      '安全性极高，通过针刺测试',
      '循环寿命长，超过3000次',
      '空间利用率高，续航里程长',
      '成本相对较低'
    ]),
    applications: JSON.stringify([
      '纯电动乘用车',
      '商用车',
      '储能系统'
    ]),
    status: Status.ACTIVE
  },
  {
    category_id: 2, // 智能驾驶
    title: 'FSD全自动驾驶',
    description: '特斯拉的全自动驾驶系统，基于纯视觉方案实现L4级自动驾驶',
    content: 'FSD系统采用8个摄像头和强大的神经网络处理器，通过深度学习实现对道路环境的理解和决策。',
    tech_type: TechType.INNOVATION,
    priority: Priority.HIGH,
    tags: JSON.stringify(['自动驾驶', '人工智能', '计算机视觉', '特斯拉']),
    technical_details: JSON.stringify({
      sensors: '8个摄像头',
      processor: 'FSD芯片',
      computing_power: '144TOPS',
      neural_networks: '多个专用神经网络'
    }),
    advantages: JSON.stringify([
      '纯视觉方案，成本较低',
      '持续OTA升级',
      '大数据训练优势',
      '用户体验良好'
    ]),
    applications: JSON.stringify([
      '城市道路自动驾驶',
      '高速公路自动驾驶',
      '自动泊车',
      '召唤功能'
    ]),
    status: Status.ACTIVE
  },
  {
    category_id: 3, // 车身结构
    title: '笼式车身结构',
    description: '高强度钢材打造的笼式安全车身，提供全方位碰撞保护',
    content: '采用高强度钢材和铝合金材料，通过优化的结构设计，在碰撞时能够有效吸收和分散冲击力。',
    tech_type: TechType.TECHNOLOGY,
    priority: Priority.MEDIUM,
    tags: JSON.stringify(['车身安全', '材料工程', '碰撞保护', '结构设计']),
    technical_details: JSON.stringify({
      materials: ['高强度钢', '铝合金', '碳纤维'],
      strength: '1500MPa+',
      weight_reduction: '15%',
      safety_rating: '5星'
    }),
    advantages: JSON.stringify([
      '碰撞安全性优异',
      '重量轻，提升续航',
      '制造成本可控',
      '维修便利性好'
    ]),
    applications: JSON.stringify([
      '乘用车车身',
      '商用车驾驶室',
      '新能源车电池保护'
    ]),
    status: Status.ACTIVE
  },
  {
    category_id: 4, // 智能座舱
    title: 'HiCar智能座舱',
    description: '华为HiCar生态的智能座舱解决方案，实现手机与车机无缝连接',
    content: 'HiCar通过分布式技术，将手机的应用和服务延伸到汽车，提供统一的用户体验。',
    tech_type: TechType.IMPROVEMENT,
    priority: Priority.MEDIUM,
    tags: JSON.stringify(['智能座舱', '车机互联', '华为', '生态系统']),
    technical_details: JSON.stringify({
      connectivity: ['WiFi', '蓝牙', 'USB'],
      os_support: ['HarmonyOS', 'Android', 'iOS'],
      apps: '1000+',
      voice_control: '自然语言处理'
    }),
    advantages: JSON.stringify([
      '生态丰富，应用众多',
      '连接稳定，响应快速',
      '语音交互自然',
      '持续更新升级'
    ]),
    applications: JSON.stringify([
      '导航服务',
      '娱乐系统',
      '智能家居控制',
      '办公应用'
    ]),
    status: Status.ACTIVE
  },
  {
    category_id: 5, // 新能源技术
    title: '800V高压快充',
    description: '800V高压平台快充技术，大幅缩短充电时间',
    content: '通过提升充电电压到800V，在相同功率下降低充电电流，减少发热和能量损失，实现更快的充电速度。',
    tech_type: TechType.TECHNOLOGY,
    priority: Priority.HIGH,
    tags: JSON.stringify(['快充技术', '高压平台', '充电效率', '新能源']),
    technical_details: JSON.stringify({
      voltage: '800V',
      max_power: '350kW',
      charging_time: '10-80% 18分钟',
      efficiency: '95%+'
    }),
    advantages: JSON.stringify([
      '充电速度极快',
      '充电效率高',
      '发热量小',
      '兼容性好'
    ]),
    applications: JSON.stringify([
      '高端电动车',
      '超级充电站',
      '商用车快充',
      '储能系统'
    ]),
    status: Status.ACTIVE
  }
];

async function seedData() {
  try {
    console.log('开始连接数据库...');
    await db.connect();
    console.log('数据库连接成功');

    console.log('开始清理现有数据...');
    // 清理现有数据（按依赖关系顺序）
    await db.query('DELETE FROM tech_points');
    await db.query('DELETE FROM car_models');
    await db.query('DELETE FROM tech_categories');
    console.log('现有数据清理完成');

    console.log('开始插入技术分类数据...');
    // 插入技术分类
    for (const category of techCategories) {
      await db.query(`
        INSERT INTO tech_categories (name, description, level, sort_order, status)
        VALUES (?, ?, 1, ?, ?)
      `, [category.name, category.description, category.sort_order, category.status]);
    }
    console.log('技术分类数据插入完成');

    console.log('开始插入车型数据...');
    // 插入车型数据
    for (const carModel of carModels) {
      await db.query(`
        INSERT INTO car_models (brand, series, model, year, engine_type, fuel_type, market_segment, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        carModel.brand,
        carModel.series,
        carModel.model,
        carModel.year,
        carModel.engine_type,
        carModel.fuel_type,
        carModel.market_segment,
        carModel.status,
        carModel.metadata
      ]);
    }
    console.log('车型数据插入完成');

    console.log('开始插入技术点数据...');
    // 插入技术点数据
    for (const techPoint of techPoints) {
      await db.query(`
        INSERT INTO tech_points (name, description, category_id, level, tech_type, priority, status, tags, technical_details, benefits, applications)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
      `, [
        techPoint.title,
        techPoint.description,
        techPoint.category_id,
        techPoint.tech_type,
        techPoint.priority,
        techPoint.status,
        techPoint.tags,
        techPoint.technical_details,
        techPoint.advantages,
        techPoint.applications
      ]);
    }
    console.log('技术点数据插入完成');

    console.log('种子数据插入成功！');
  } catch (error) {
    console.error('种子数据插入失败:', error);
    throw error;
  } finally {
    await db.close();
    console.log('数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedData().catch(console.error);
}

export { seedData };