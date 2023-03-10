import {
  fetchCaptchaImage,
  fetchCasLoginCookie,
  fetchEnteredCasCookie,
  fetchTicketByCasCookie,
  getTextFromBase64Image,
  IUserInfo,
} from "@services/casService";
import { BadRequestError } from "@shared/errors";
import { IReq, IRes } from "@shared/types";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";

const router = Router();
const { OK } = StatusCodes;

router.get("/login", async (_, res: IRes) => {
  const responseText = {
    msg: "获取cookie和验证码成功",
    code: OK,
    data: {
      cookie: "",
      captcha: "",
      captchaText: ""
    },
  };
  responseText.data.cookie = await fetchCasLoginCookie();
  responseText.data.captcha = await fetchCaptchaImage(responseText.data.cookie);
  try {
    responseText.data.captchaText=await getTextFromBase64Image(responseText.data.captcha);
  } catch (error) {
    logger.err(error, true);
  }
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
    throw new BadRequestError('账号、密码、验证码或cas系统cookie为空');
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
    throw new BadRequestError('cas系统cookie为空或者target不正确');
  }
  if (!cookie.includes("TGC=")) {
    throw new BadRequestError('cas系统cookie不正确，请确保包含TGC=xxx');
  }
  responseText.data.ticket = await fetchTicketByCasCookie(
    cookie,
    targetToUrl[target]
  );
  res.json(responseText);
});

export default router;
