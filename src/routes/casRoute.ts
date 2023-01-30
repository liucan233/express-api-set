import {
  fetchCaptchaImage,
  fetchCasLoginCookie,
  fetchEnteredCasCookie,
  fetchTicketByCasCookie,
  IUserInfo,
} from "@services/casService";
import { IReq, IRes } from "@shared/types";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

const router = Router();
const { OK, BAD_REQUEST } = StatusCodes;

router.get("/login", async (_, res: IRes) => {
  const responseText = {
    msg: "获取cookie和验证码成功",
    code: OK,
    data: {
      cookie: "",
      captcha: "",
    },
  };
  responseText.data.cookie = await fetchCasLoginCookie();
  responseText.data.captcha = await fetchCaptchaImage(responseText.data.cookie);
  res.json(responseText);
});

router.post("/login", async (req: IReq<IUserInfo>, res: IRes) => {
  const responseText = {
    msg: "登陆成功",
    code: OK,
    data: {
      cookie: "",
    },
  };
  const { user, passwd, captcha, cookie } = req.body;
  if (!user || !passwd || !captcha || !cookie) {
    responseText.code = BAD_REQUEST;
    responseText.msg = "请求参数错误";
    res.json(responseText);
    return;
  }
  responseText.data.cookie = await fetchEnteredCasCookie(req.body);
  res.json(responseText);
});

/**根据target枚举映射实际系统url */
const targetToUrl = {
  matrix:
    "https://matrix.dean.swust.edu.cn/acadmicManager/index.cfm?event=studentPortal:DEFAULT_EVENT",
  soa: "http://soa.swust.edu.cn/",
  lab: "http://202.115.175.175/swust/",
  reader: "http://202.115.162.45:8080/reader/hwthau.php",
};

/**接口请求类型，根据cas系统cookie获取进入其他系统的ticket */
type TGetTicketReq = {
  /**cas系统cookie */
  cookie: string;
  target: keyof typeof targetToUrl;
};
router.post("/ticket", async (req: IReq<TGetTicketReq>, res: IRes) => {
  const responseText = {
    code: OK,
    msg: "获取成功",
    data: {
      ticket: "",
    },
  };
  const { cookie, target } = req.body;
  if (!cookie || !target || !targetToUrl[target]) {
    throw new TypeError("请求参数不正确");
  }
  if (!cookie.includes("TGC=")) {
    throw new TypeError("请确保cookie为登陆Cas页面后的cookie");
  }
  responseText.data.ticket = await fetchTicketByCasCookie(
    cookie,
    targetToUrl[target]
  );
  res.json(responseText);
});

export default router;
