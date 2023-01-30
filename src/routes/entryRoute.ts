import { Router } from "express";

import timetableRouter from "./timetableRoute";
import loginSwustRouter from "./loginRoute";
import matrixDeanRouter from "./matrixRoute";
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
