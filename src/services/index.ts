import { Router } from "express";
import { logger } from "../logger";
import { swustRouter } from "./swust";

export const servicesRouter:Router = Router()

servicesRouter.use('/swust', swustRouter);