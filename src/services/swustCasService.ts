import { rsaUtils } from "@util/security";
import got from "got-cjs";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";

const { OK, MOVED_TEMPORARILY } = StatusCodes;

/**CAS页面地址 */
const CAS_URL = "http://cas.swust.edu.cn",
  /**登陆页面路径 */
  LOGIN_PATH = "/authserver/login",
  /**官方登陆验证码接口路径，用于获取验证码图片 */
  CAPTCHA_PATH = "/authserver/captcha",
  /**官方RAS指数和模数接口路径，用于生成RAS公钥 */
  KEY_PATH = "/authserver/getKey";

/**获取CAS登陆页面的cookie */
export const fetchCasLoginCookie = () => {
  return got.get(CAS_URL + LOGIN_PATH).then((res) => {
    if (res.headers["set-cookie"]) {
      return res.headers["set-cookie"].join(";");
    }
    throw new TypeError("cookie获取失败，返回的cookie为空");
  });
};

/**官方RAS指数和模数接口返回结构 */
interface IRSAParams {
  exponent: string;
  modulus: string;
}
/**加密密码，使用cookie生成的RSA公钥加密 */
export const getEncodedPasswd = async (passwd: string, cookie: string) => {
  const { exponent, modulus } = await got
    .get(CAS_URL + KEY_PATH, {
      headers: { cookie },
    })
    .then<IRSAParams>((res) => {
      return JSON.parse(res.body);
    });
  if (!exponent || !modulus) {
    throw new TypeError(`指数为${exponent}，模数为${modulus}`);
  }
  const publicKey = rsaUtils.getKeyPair(exponent, "", modulus);
  return rsaUtils.encryptedString(
    publicKey,
    Array.from(passwd).reverse().join("")
  );
};

/**根据cookie获取验证码图片 */
export const fetchCaptchaImage = async (cookie: string) => {
  const res = await got.get(CAS_URL + CAPTCHA_PATH, {
    headers: { cookie },
  });
  const mime = (
    /image\/\w+/.exec(res.headers["content-type"] as string) as RegExpExecArray
  )[0];
  return `data:${mime};base64,` + res.rawBody.toString("base64");
};

/**用户登录所需要的数据 */
export interface IUserInfo {
  user: string;
  passwd: string;
  captcha: string;
  cookie: string;
}
/**根据用户、密码、验证码和cookie，获取登陆成功后的CAS登陆页面的cookie */
export const fetchEnteredCasCookie = async (user: IUserInfo) => {
  const params = new URLSearchParams(),
    passwd = await getEncodedPasswd(user.passwd, user.cookie);
  params.set("execution", "e1s1");
  params.set("_eventId", "submit");
  params.set("geolocation", "");
  params.set("username", user.user);
  params.set("lm", "usernameLogin");
  params.set("password", passwd);
  params.set("captcha", user.captcha);
  const res = await got.post(CAS_URL + LOGIN_PATH, {
    headers: {
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      Cookie: user.cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      Host: "cas.swust.edu.cn",
      "Upgrade-Insecure-Requests": "1",
      Origin: CAS_URL,
      Referer: CAS_URL,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36 Edg/104.0.1293.54",
    },
    followRedirect: false,
    body: params.toString(),
    throwHttpErrors: false
  });
  if(/soa/.test(res.headers['location']||'')){
    return (res.headers['set-cookie'] as string[]).join(';')
  }
  const reason=/<b>\S+<\/b>/.exec(res.body);
  console.log(res.body)
  if(reason && reason[0].length>8){
    throw new Error(reason[0].substring(3,reason[0].length-4));
  } else {
    throw new Error('登陆CAS页面时发生未知错误');
  }
};
