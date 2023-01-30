import { Router } from "express";
import { IReqQuery, IRes } from "@shared/types";
import {
  fetchJwExamList,
  getCookieFromTicket,
  DEAN_URL,
} from "@services/deanService";
import { ParamInvalidError } from "@shared/errors";
import { responseReq } from "@shared/functions";
import { fetchTicketByCasCookie } from "@services/casService";

const router = Router();

/**教务系统地址 */
const DEAN_TARGET =
  "/acadmicManager/index.cfm?event=studentPortal:DEFAULT_EVENT";

/**从教务处抓取考试信息，包括期末考试、期中考试和补考 */
router.get(
  "/exam",
  async (req: IReqQuery<{ cookie?: string; cas?: string }>, res: IRes) => {
    if (!req.query.cookie && !req.query.cas) {
      throw new ParamInvalidError("未携带cookie或ticket");
    }
    let cookie = req.query.cookie;
    if (!cookie) {
      // 根据cas页面的cookie获取教务系统ticket
      cookie = await fetchTicketByCasCookie(
        req.query.cas as string,
        DEAN_URL + DEAN_TARGET,
      );
      // 根据教务系统ticket拿cookie
      cookie = await getCookieFromTicket(cookie);
    }

    responseReq(res, {
      list: await fetchJwExamList(cookie),
      cookie: req.query.cookie ? "" : cookie,
    });
  }
);

export default router;