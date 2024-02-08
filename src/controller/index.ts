import { Router } from 'express';
import { logger } from '../logger';
import { commentRouter } from './comment';
import { swustRouter } from './swust';
import { jwtMiddleware } from '../libraries/jwt';
import { userRouter } from './user';
import { uploadRouter } from './upload';
// import { wxRouter } from './wechat';

export const apiRouter: Router = Router();

apiRouter.use('/swust', swustRouter);

apiRouter.use('/comment', commentRouter);

apiRouter.use('/user', userRouter);

apiRouter.use('/upload', uploadRouter);

// servicesRouter.use('/wx', wxRouter);
