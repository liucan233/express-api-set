import { Router } from "express";

import timetableRouter from "./timetable";
import loginSwustRouter from "./loginSwust";
import matrixDeanRouter from "./matrixDean";

// Init
const apiRouter = Router();

// Add api routes
apiRouter.use("/timetable", timetableRouter);
apiRouter.use("/swust", loginSwustRouter);
apiRouter.use("/dean", matrixDeanRouter);

// **** Export default **** //

export default apiRouter;
