import { Router } from "express";
import { logger } from "../logger";
import { swustRouter } from "./swust";

export const servicesRouter = Router()

servicesRouter.use('/swust', swustRouter);