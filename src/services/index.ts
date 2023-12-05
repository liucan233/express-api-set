import { Router } from 'express';
import { logger } from '../logger';
import { commentRouter } from './comment';
import { swustRouter } from './swust';
import { jwtMiddleware } from '../libraries/jwt';
import { userRouter } from './user';
// import { wxRouter } from './wechat';

export const servicesRouter: Router = Router();

servicesRouter.use('/swust', swustRouter);

servicesRouter.use('/comment', jwtMiddleware, commentRouter);

servicesRouter.use('/user', userRouter);

// servicesRouter.use('/wx', wxRouter);
