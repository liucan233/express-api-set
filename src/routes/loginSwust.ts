import { Router } from "express";
import { IReq, IRes } from "@shared/types";
import {
  fetchCaptchaImage,
  fetchCasLoginCookie,
  fetchEnteredCasCookie,
  fetchTicket,
  ITicketReqBody,
  IUserInfo,
} from "@services/swustCasService";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";

const router = Router(),
  { INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED, BAD_REQUEST } = StatusCodes;

router.get("/loginCas", async (_, res: IRes) => {
  let responseText = {
      msg: "获取cookie和验证码成功",
      code: INTERNAL_SERVER_ERROR,
      data: {
        cookie: "",
        captcha: "",
      },
    },
    cookie = "";
  try {
    responseText.data.cookie = await fetchCasLoginCookie();
    cookie = responseText.data.cookie;
  } catch (err) {
    responseText.msg = "获取cookie失败";
    res.json(responseText);
    logger.err(err);
    return;
  }
  try {
    responseText.data.captcha = await fetchCaptchaImage(cookie);
  } catch (error) {
    responseText.msg = "获取验证码失败";
    res.json(responseText);
    logger.err(error);
    return;
  }
  responseText.code = OK;
  res.json(responseText);
});

router.post("/loginCas", async (req: IReq<IUserInfo>, res: IRes) => {
  
  let responseText = {
    msg: "登陆成功",
    code: INTERNAL_SERVER_ERROR,
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
  try {
    responseText.data.cookie = await fetchEnteredCasCookie(req.body);
  } catch (error) {
    responseText.msg = error.message || "使用提交的信息登陆时出现未知错误";
    responseText.code = UNAUTHORIZED;
    res.json(responseText);
    logger.err(error);
    return;
  }
  responseText.code = OK;
  res.json(responseText);
});


router.post('/ticket',async (req: IReq<ITicketReqBody>, res: IRes)=>{
  let responseText={
    code: OK,
    msg: '获取成功',
    data: {
      tickets: [] as string[]
    }
  }
  const {cookie,targets}=req.body;
  try {
    if(!cookie || !Array.isArray(targets)){
      throw new TypeError('请求参数不正确');
    }
    if(!/TGC=TGT/.test(req.body.cookie)){
      throw new TypeError('请确保cookie为登陆Cas页面后的cookie')
    }
    responseText.data.tickets=await fetchTicket(req.body);
    res.json(responseText)
  } catch (error) {
    responseText.code=BAD_REQUEST;
    responseText.msg=error.message||'发生未知错误，可能是提供的cookie不正确';
    res.json(responseText);
  }
})

export default router;
