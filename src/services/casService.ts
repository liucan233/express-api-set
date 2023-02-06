import { rsaUtils } from "@util/security";
import got from "got-cjs";
// import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";
// import cookieUtil from "cookie";

// const { OK, MOVED_TEMPORARILY, MOVED_PERMANENTLY } = StatusCodes;

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
    .then((res) => {
      return JSON.parse(res.body) as IRSAParams;
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
  const contentType = res.headers["content-type"];

  let imageMime = "image/jpeg";
  if (contentType) {
    const mimeResult = /image\/\w+/.exec(contentType);
    if (mimeResult?.length) {
      imageMime = mimeResult[0];
    }
  } else {
    logger.warn(`${CAPTCHA_PATH}接口返回的验证码图片无MIME`);
  }
  return `data:${imageMime};base64,` + res.rawBody.toString("base64");
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
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: new URL(CAS_URL).hostname,
      "Upgrade-Insecure-Requests": "1",
      Origin: CAS_URL,
      Referer: CAS_URL,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    followRedirect: false,
    body: params.toString(),
    throwHttpErrors: false,
  });
  if (
    res.headers["location"] &&
    res.headers["set-cookie"] &&
    /soa/.test(res.headers["location"])
  ) {
    return res.headers["set-cookie"].join(";");
  }
  const reason = /<b>\S+<\/b>/.exec(res.body);
  if (reason && reason[0].length > 8) {
    throw new Error(reason[0].substring(3, reason[0].length - 4));
  } else {
    throw new Error("登陆CAS页面时发生未知错误");
  }
};

/**获取ticket需要的数据 */
export interface ITicketReqBody {
  cookie: string;
  targets: string[];
}
/**根据cookie和目标系统url，获取到目标系统的ticket */
export const fetchTicket = async ({ targets, cookie }: ITicketReqBody) => {
  const tickets: string[] = [];
  for (const target of targets) {
    const { hostname, protocol } = new URL(target);
    const res = await got.get(CAS_URL + LOGIN_PATH + "?service=" + target, {
      headers: {
        cookie,
        Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        Host: new URL(CAS_URL).hostname,
        "Upgrade-Insecure-Requests": "1",
        Referer: protocol + "//" + hostname,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
      },
      followRedirect: false,
      throwHttpErrors: false,
    });
    const location = res.headers["location"];
    if (!location) {
      throw new TypeError(
        `未被CAS系统重定向，CAS系统返回状态码为${res.statusCode}`
      );
    }
    if (new RegExp(hostname).test(location)) {
      tickets.push(location);
    } else {
      throw new Error("被重定向到" + location + "，不符合target");
    }
  }
  return tickets;
};

/**根据cookie和目标系统url，获取到目标系统的ticket */
export const fetchTicketByCasCookie = async (
  cookie: string,
  target: string
) => {
  const { hostname, protocol } = new URL(target);
  const res = await got.get(CAS_URL + LOGIN_PATH + "?service=" + target, {
    headers: {
      cookie,
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: new URL(CAS_URL).hostname,
      "Upgrade-Insecure-Requests": "1",
      Referer: protocol + "//" + hostname,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    followRedirect: false,
    throwHttpErrors: false,
    timeout: {
      request: 1000,
    },
    retry: {
      limit: 0
    }
  });
  const location = res.headers["location"];
  if (!location) {
    throw new TypeError(
      `未被CAS系统重定向，CAS系统返回状态码为${res.statusCode}`
    );
  }
  if (location.includes(hostname)) {
    return location;
  } else {
    throw new Error("被重定向到" + location + "，不符合target");
  }
};

/**根据ticket获取cookie */
export const getCookieByTicketAndRedirection = async (ticket: string) => {
  const { host } = new URL(ticket);
  const res = await got.get(ticket, {
    followRedirect: false,
    headers: {
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: host,
      "Upgrade-Insecure-Requests": "1",
      Referer: CAS_URL,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    timeout: {
      request: 1000,
    },
    retry: {
      limit: 0
    }
  });
  const { location } = res.headers;
  // if (res.statusCode < 300 || res.statusCode > 307) {
  //   throw new RangeError("目标系统返回到状态码为" + res.statusCode+'，未被重定向');
  // }
  if (!location || !location.match(host) || location.match("login")) {
    throw new Error(`被重定向到${location as string}，与预期不符`);
  }
  if (res.headers["set-cookie"]) {
    return res.headers["set-cookie"].join(";");
  } else {
    throw new Error("使用ticket获取cookie时发生未知错误");
  }
};
