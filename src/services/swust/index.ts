import { Router } from "express";
import { logger } from "../../logger";
import { loginCasRouter } from "./loginCas";

export const swustRouter:Router = Router()

swustRouter.use(loginCasRouter);

swustRouter.use( (req, res) => {
    if (!res.writableEnded) {
        res.json({
            code: -1,
            msg: "抓取出错，请联系开发者"
        })
        logger.error(`${req.method} ${req.path}接口失败`)
    }
})