import { Router } from 'express';

import timetableRouter from './timetable'
import loginSwustRouter from './loginSwust'


// Init
const apiRouter = Router();

// Add api routes
apiRouter.use('/timetable',timetableRouter)
apiRouter.use('/swust',loginSwustRouter)

// **** Export default **** //

export default apiRouter;
