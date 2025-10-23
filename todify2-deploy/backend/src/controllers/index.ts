import { TechCategoryController } from './TechCategoryController';
import { TechPointController } from './TechPointController';
import { BrandController } from './BrandController';
import { CarModelController } from './CarModelController';
import { CarSeriesController } from './CarSeriesController';

// 导出控制器类
export { TechCategoryController } from './TechCategoryController';
export { TechPointController } from './TechPointController';
export { BrandController } from './BrandController';
export { CarModelController } from './CarModelController';
export { CarSeriesController } from './CarSeriesController';

// 创建控制器实例
export const techCategoryController = new TechCategoryController();
export const techPointController = new TechPointController();
export const brandController = new BrandController();
export const carModelController = new CarModelController();
export const carSeriesController = new CarSeriesController();