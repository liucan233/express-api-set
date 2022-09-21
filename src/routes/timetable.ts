import { Router } from "express";
import StatusCodes from "http-status-codes";
import { IReq, IRes, IReqQuery } from "@shared/types";
import {
  bindAexpsIdWithCookie,
  fetchCommonTimetable,
  fetchLabTimeTable,
  fetchTermAndWeeks,
} from "@services/timetableService";
import { getCookieByTicketAndRedirection } from "@services/swustCasService";
import cookieUtil from "cookie";

const router = Router();

// Status codes
const { OK, INTERNAL_SERVER_ERROR, BAD_REQUEST } = StatusCodes;

interface ITicket {
  ticket: string;
  [key: string]: string;
}
router.get("/cookie", async (req: IReqQuery<ITicket>, res: IRes) => {
  const responseText = {
    code: OK,
    msg: "获取成功",
    data: {
      cookie: "",
    },
  };
  if (!req.query.ticket) {
    responseText.code = BAD_REQUEST;
    responseText.msg = "请求参数不正确";
    res.json(responseText);
    return;
  }
  try {
    responseText.data.cookie = await getCookieByTicketAndRedirection(
      req.query.ticket
    );
    res.json(responseText);
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = error.message || "获取cookie发生未知错误";
    res.json(responseText);
  }
});

interface ICookie {
  cookie: string;
  [key: string]: string;
}
router.get("/time", async (req: IReqQuery<ICookie>, res: IRes) => {
  const responseText = {
    code: OK,
    msg: "获取成功",
    data: {
      time: "",
      weeks: "",
      term: "",
    },
  };
  if (!req.query.cookie) {
    responseText.code = BAD_REQUEST;
    responseText.msg = "请求参数不正确";
    res.json(responseText);
    return;
  }
  try {
    responseText.data = await fetchTermAndWeeks(req.query.cookie);
    res.json(responseText);
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = error.message || "获取学期和周数时发生未知错误";
    res.json(responseText);
  }
});

router.get("/labTimeTable", async (req: IReqQuery<ICookie>, res: IRes) => {
  const responseText = {
    code: OK,
    msg: "获取成功",
    data: {
      courses: [] as any,
    },
  };

  let cookie = cookieUtil.parse(req.query.cookie)["JSESSIONID"];
  cookie = cookieUtil.serialize("JSESSIONID", cookie);

  if (!cookie) {
    responseText.code = BAD_REQUEST;
    responseText.msg = "请求参数不正确，cookie应该包含JSESSIONID=xxxx";
    res.json(responseText);
    return;
  }

  try {
    await bindAexpsIdWithCookie(cookie);
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = "绑定aexpsid为JSESSIONID时出错";
    res.json(responseText);
    return;
  }
  try {
    responseText.data.courses = await fetchLabTimeTable(cookie);
    res.json(responseText);
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = error.message || "获取实验课表时发生未知错误";
    res.json(responseText);
  }
});

router.get("/commonTimetable", async (req: IReqQuery<ICookie>, res: IRes) => {
  const responseText = {
    code: OK,
    msg: "获取成功",
    data: {
      courses: [] as any,
    },
  };

  let parsedCookie = cookieUtil.parse(req.query.cookie),
    cookie = parsedCookie["JSESSIONID"];
  cookie = cookieUtil.serialize("JSESSIONID", cookie);

  /**是否进行过cookie绑定 */
  const needBindIdFlag = !parsedCookie["jsessionid"];

  if (!cookie) {
    responseText.code = BAD_REQUEST;
    responseText.msg = "请求参数不正确，cookie应该包含JSESSIONID=xxxx";
    res.json(responseText);
    return;
  }

  try {
    if (needBindIdFlag) {
      await bindAexpsIdWithCookie(cookie);
    }
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = "绑定aexpsid为JSESSIONID时出错";
    res.json(responseText);
    return;
  }
  try {
    responseText.data.courses = await fetchCommonTimetable(cookie);
    res.json(responseText);
  } catch (error) {
    responseText.code = INTERNAL_SERVER_ERROR;
    responseText.msg = error.message || "获取教务处课表时发生未知错误";
    res.json(responseText);
  }
});
export default router;
