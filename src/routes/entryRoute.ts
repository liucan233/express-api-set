import { Router } from "express";

import timetableRouter from "./timetable";
import loginSwustRouter from "./loginSwust";
import matrixDeanRouter from "./matrixDean";
import casRouter from "./casRoute";

// Init
const apiRouter = Router();

// Add api routes
apiRouter.use("/timetable", timetableRouter);
apiRouter.use("/swust", loginSwustRouter);
apiRouter.use("/dean", matrixDeanRouter);
apiRouter.use("/cas", casRouter);

// **** Export default **** //

export default apiRouter;
