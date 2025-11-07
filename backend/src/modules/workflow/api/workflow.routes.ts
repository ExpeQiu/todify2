import { Router } from 'express';

import { WorkflowController } from './WorkflowController';
import { ExecuteAiSearchUseCase } from '../application/useCases/ExecuteAiSearch.usecase';
import { ExecuteTechPackageUseCase } from '../application/useCases/ExecuteTechPackage.usecase';
import { ExecuteTechStrategyUseCase } from '../application/useCases/ExecuteTechStrategy.usecase';
import { ExecuteTechArticleUseCase } from '../application/useCases/ExecuteTechArticle.usecase';
import { ExecuteCoreDraftUseCase } from '../application/useCases/ExecuteCoreDraft.usecase';
import { ExecuteSpeechUseCase } from '../application/useCases/ExecuteSpeech.usecase';
import { ExecuteTechPublishUseCase } from '../application/useCases/ExecuteTechPublish.usecase';

const router = Router();
const controller = new WorkflowController(
  new ExecuteAiSearchUseCase(),
  new ExecuteTechPackageUseCase(),
  new ExecuteTechStrategyUseCase(),
  new ExecuteTechArticleUseCase(),
  new ExecuteCoreDraftUseCase(),
  new ExecuteSpeechUseCase(),
  new ExecuteTechPublishUseCase(),
);

router.post('/ai-search', controller.executeAiSearch);
router.post('/tech-package', controller.executeTechPackage);
router.post('/tech-strategy', controller.executeTechStrategy);
router.post('/tech-article', controller.executeTechArticle);
router.post('/core-draft', controller.executeCoreDraft);
router.post('/speech-generation', controller.executeSpeech);
router.post('/tech-publish', controller.executeTechPublish);

export default router;

