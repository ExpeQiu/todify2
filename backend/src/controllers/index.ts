import { TechCategoryController } from './TechCategoryController';
import { TechPointController } from './TechPointController';
import { ProjectController } from './ProjectController';
import { TechPackagingController } from './TechPackagingController';
import { TechPromotionController } from './TechPromotionController';
import { TechPressController } from './TechPressController';

// 导出控制器类
export { TechCategoryController } from './TechCategoryController';
export { TechPointController } from './TechPointController';
export { ProjectController } from './ProjectController';
export { TechPackagingController } from './TechPackagingController';
export { TechPromotionController } from './TechPromotionController';
export { TechPressController } from './TechPressController';
export { PublicKnowledgeController, publicKnowledgeController } from './PublicKnowledgeController';

// 创建控制器实例
export const techCategoryController = new TechCategoryController();
export const techPointController = new TechPointController();
export const projectController = new ProjectController();
export const techPackagingController = new TechPackagingController();
export const techPromotionController = new TechPromotionController();
export const techPressController = new TechPressController();