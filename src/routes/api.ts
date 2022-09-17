import { Router } from 'express';
import { adminMw } from './middleware';

import authRouter, { p as authPaths } from './auth-router';
import userRouter, { p as userPaths } from './user-router';
import timetableRouter from './timetable'


// Init
const apiRouter = Router();

// Add api routes
apiRouter.use(authPaths.basePath, authRouter);
apiRouter.use(userPaths.basePath, adminMw, userRouter);
apiRouter.use('/timetable',timetableRouter)


// **** Export default **** //

export default apiRouter;
