import { Router } from 'express';
import { logger } from '../logger';
import { swustRouter } from './swust';
// import { wxRouter } from './wechat';

export const servicesRouter: Router = Router();

servicesRouter.use('/swust', swustRouter);

// servicesRouter.use('/wx', wxRouter);
