import { Router } from "express";
import { IReq, IRes } from "@shared/types";
import {
  fetchCaptchaImage,
  fetchCasLoginCookie,
  fetchEnteredCasCookie,
  IUserInfo,
} from "@services/swustCasService";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";

const router = Router(),
  { INTERNAL_SERVER_ERROR, OK,UNAUTHORIZED,BAD_REQUEST } = StatusCodes;

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
    console.log(err)
    return
  }
  try {
    responseText.data.captcha = await fetchCaptchaImage(cookie);
  } catch (error) {
    responseText.msg = "获取验证码失败";
    res.json(responseText);
    console.log(error)
    return
  }
  responseText.code = OK;
  res.json(responseText);
});

router.post('/loginCas',async (req:IReq<IUserInfo>, res: IRes) =>{
  let responseText = {
    msg: "登陆成功",
    code: INTERNAL_SERVER_ERROR,
    data: {
      cookie: "",
    },
  };
  const {user,passwd,captcha,cookie}=req.body
  if(!user||!passwd||!captcha||!cookie){
    responseText.code=BAD_REQUEST;
    responseText.msg='请求参数错误'
    res.json(responseText);
    return
  }
  try {
    responseText.data.cookie=await fetchEnteredCasCookie(req.body);
  } catch (error) {
    responseText.msg=error.message || '使用给的多信息登陆时出现未知错误';
    responseText.code=UNAUTHORIZED
    res.json(responseText);
    console.log(error)
    return
  }
  responseText.code=OK;
  res.json(responseText);
});

export default router;
