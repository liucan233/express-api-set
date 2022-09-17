import { rsaUtils } from "@util/security";
import got from "got-cjs";

const SOA_URL = "http://cas.swust.edu.cn/authserver/login";
const REDIRECT_QUERY = "?service=https://matrix.dean.swust.edu.cn/acadmicManager/index.cfm?event=studentPortal:DEFAULT_EVENT";
const CAPTCHA_URL = "http://cas.swust.edu.cn/authserver/captcha";
const KEY_URL = "http://cas.swust.edu.cn/authserver/getKey";

export const getPublicKey = (exponent: string, modulus: string) => {
  return rsaUtils.getKeyPair(exponent, "", modulus);
};

export const getEncodedPasswd = (
  passwd: string,
  exponent: string,
  modulus: string
) => {
  const publicKey = getPublicKey(exponent, modulus);
  return rsaUtils.encryptedString(
    publicKey,
    Array.from(passwd).reverse().join("")
  );
};

export const fetchCaptchaAndExecution = async () => {
  const html = await got.get(SOA_URL+REDIRECT_QUERY);
  // TODO 如何更好地解析cookie
  const tmp = html.headers["set-cookie"]?.join(";").split(";"),
    cookie = tmp ? tmp[0] + "; " + tmp[2] : "";
  const req = await got.get(CAPTCHA_URL, {
    headers: {
      cookie,
    },
  });

  const captcha = req.rawBody.toString("base64");
  return {
    cookie,
    // TODO 更好地解析MIME
    captcha: "data:image/jpeg;base64," + captcha,
  };
};

interface IRSAParams {
  exponent: string;
  modulus: string;
}
export const getSOACookie = async (
  user: string,
  passwd: string,
  captcha: string,
  cookie: string
) => {
  const key = await got
    .get(KEY_URL, {
      headers: { cookie },
    })
    .then<IRSAParams>((res) => {
      return JSON.parse(res.body);
    });
  const params = new URLSearchParams();
  params.set("execution", "e1s1");
  params.set("_eventId", "submit");
  params.set("geolocation", "");
  params.set("username", user);
  params.set("lm", "usernameLogin");
  params.set("password", getEncodedPasswd(passwd, key.exponent, key.modulus));
  params.set("captcha", captcha);

  const req = await got.post(SOA_URL+REDIRECT_QUERY, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
      Host: "cas.swust.edu.cn",
      "Upgrade-Insecure-Requests": "1",
      Origin: "http://cas.swust.edu.cn",
      Referer: SOA_URL+REDIRECT_QUERY,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36 Edg/104.0.1293.54",
    },
    body: params.toString(),
    followRedirect: false,
  });
  console.log('code',req.statusCode,req.headers)
  const soa=await got.get(req.headers['location'] as string,{
    headers: {
      Referer: 'http://cas.swust.edu.cn/',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36 Edg/104.0.1293.54',
      'upgrade-insecure-requests': '1',
      
    },
    followRedirect: false,
    https: {
      rejectUnauthorized: false
    }
  });
  return soa.headers['set-cookie'] || null
};

export const fetSOAPage=async (cookie:string)=>{
  const req=await got.get('https://matrix.dean.swust.edu.cn/acadmicManager/index.cfm?event=chooseCourse:courseTable',{
    headers: {
      cookie,
      Referer: "http://cas.swust.edu.cn"
    },
    https: {
      rejectUnauthorized:false
    }
  });
  return req.body;
}
