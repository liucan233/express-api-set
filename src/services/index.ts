import { Router } from 'express';
import { logger } from '../logger';
import { commentRouter } from './comment';
import { swustRouter } from './swust';
// import { wxRouter } from './wechat';

export const servicesRouter: Router = Router();

servicesRouter.use('/swust', swustRouter);

servicesRouter.use('/comment', commentRouter);

// servicesRouter.use('/wx', wxRouter);
