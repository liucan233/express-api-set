import { Router } from "express";
import StatusCodes from "http-status-codes";
import { IReq, IRes } from "@shared/types";
import {
  fetchCaptchaAndExecution,
  fetSOAPage,
  getSOACookie,
} from "@services/timetableService";

const router = Router();

// Status codes
const { OK, SEE_OTHER,BAD_REQUEST } = StatusCodes;

router.get("/login", async (req: IReq, res: IRes) => {
  const fetched = await fetchCaptchaAndExecution();
  return res.status(OK).end(JSON.stringify(fetched));
});

interface ILoginForm {
  user: string;
  passwd: string;
  captcha: string;
  cookie: string;
}

router.post("/login", async (req: IReq<ILoginForm>, res: IRes) => {
  const { user, passwd, captcha, cookie } = req.body;
  if (user && passwd && captcha && cookie) {

    await getSOACookie(user, passwd, captcha, cookie)
    .then(result=>{
        if(result===null){
            return Promise.reject(new TypeError('cookie为null'))
        }
        return fetSOAPage(result.join());
    })
    .then(page=>{
        res.status(OK).end(page)
    })
    .catch(e=>{
        console.log('catch',e.message)
        res.status(BAD_REQUEST).end('user, passwd or captcha error')
    });
  }
  return res.status(BAD_REQUEST).end()
});

router.get('/',async (req: IReq, res: IRes)=>{

})

export default router;
