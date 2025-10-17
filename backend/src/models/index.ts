import { DatabaseManager, db } from '../config/database';
import { TechCategoryModel } from './TechCategory';
import { TechPointModel } from './TechPoint';
import { CarModelModel } from './CarModel';

// 使用已存在的数据库管理器实例
// 创建模型实例
export const techCategoryModel = new TechCategoryModel(db);
export const techPointModel = new TechPointModel(db);
export const carModelModel = new CarModelModel();

// 导出模型类
export { TechCategoryModel } from './TechCategory';
export { TechPointModel } from './TechPoint';
export { CarModelModel } from './CarModel';

// 导出数据库管理器
export { DatabaseManager } from '../config/database';