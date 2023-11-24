import { Router } from "express";
import { swustRouter } from "./swust/index.js";
export const servicesRouter = Router();
servicesRouter.use('/swust', swustRouter);