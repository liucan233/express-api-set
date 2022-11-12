import { Router } from "express";
import { IReq, IReqQuery, IRes } from "@shared/types";
import { fetchJwExamList, getCookieFromTicket } from "@services/deanService";
import { ParamInvalidError } from "@shared/errors";
import { responseReq } from "@shared/functions";

const router = Router();

/**查询考试信息返回结构 */
/**从教务处抓取考试信息，包括期末考试、期中考试和补考 */
router.get(
  "/exam",
  async (req: IReqQuery<{ cookie?: string; ticket?: string }>, res: IRes) => {
    if (!req.query.cookie && !req.query.ticket) {
      throw new ParamInvalidError("未携带cookie或ticket");
    }
    let cookie = req.query.cookie;
    if (!cookie) {
      cookie = await getCookieFromTicket(req.query.ticket as string);
    }

    responseReq(res, {
      list: await fetchJwExamList(cookie),
      cookie: req.query.cookie ? "" : cookie,
    });
  }
);

export default router;
