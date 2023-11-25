import { Router } from 'express';
import { logError, logger } from '../../logger';
import { CasLogin } from '../../classes/CasLogin';
import { swustServices } from '../../constant/swustServices';

export const loginCasRouter: Router = Router();

loginCasRouter.get('/loginCas', async (req, res, next) => {
  const crawler = new CasLogin();
  try {
    logger.info('开始获取cas系统凭证');
    await crawler.init();
    logger.info('初始化crawler成功');
    await crawler.initSession();
    logger.info('获取session成功');
    await crawler.loadCaptcha();
    logger.info('获取验证码成功');
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
      data: {
        session: crawler.session,
        captcha: crawler.captcha,
        casHttpProtocol: crawler.httpProtocol,
      },
    });
  } catch (error) {
    logError(error);
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
    });
  }
});

loginCasRouter.post('/loginCas', async (req, res, next) => {
  const crawler = new CasLogin();
  try {
    logger.info('开始登录cas系统');
    await crawler.renewBySession(req.body.session, req.body.casHttpProtocol);
    logger.info('恢复crawler成功');
    await crawler.tryLoginIn(req.body.account, req.body.password, req.body.captcha);
    logger.info('登录cas系统成功');
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
      data: {
        tgcCookie: crawler.tgcCookie,
      },
    });
  } catch (error) {
    logError(error);
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
    });
  }
});

loginCasRouter.post('/loginService', async (req, res) => {
  const crawler = new CasLogin();
  try {
    const service = swustServices[req.body.serviceIndex];
    const tgc = req.body.tgcCookie;
    logger.info(`开始登录${service}系统`);
    const setCookie = await crawler.tryLoginServiceByTGC(tgc, service, req.body.casHttpProtocol);
    logger.info('登录系统成功');
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
      data: {
        serviceCookie: setCookie,
      },
    });
  } catch (error) {
    logError(error);
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
    });
  }
});
