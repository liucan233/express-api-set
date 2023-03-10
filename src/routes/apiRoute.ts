import { Router } from "express";

import timetableRouter from "./labRoute";
import loginSwustRouter from "./loginRoute";
import matrixDeanRouter from "./matrixRoute";
import casRouter from "./casRoute";

// Init
const apiRouter = Router();

// Add api routes
apiRouter.use("/timetable", timetableRouter);
apiRouter.use("/swust", loginSwustRouter); // 即将废弃
apiRouter.use("/dean", matrixDeanRouter);
apiRouter.use("/cas", casRouter);

// Export default
export default apiRouter;
