import logger from "jet-logger";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServerError } from "./errors";

/**向客户端返回数据 */
export const responseReq = (res: Response, data: unknown) => {
  res.json({
    msg: "",
    data,
    code: StatusCodes.OK,
  });
};

/**根据状态码判断是否是正常响应 */
export const throwResponseCodeError = (code: number) => {
  if (code < 200 || (code > 299 && code !== 304)) {
    throw new ServerError(`学校服务返回状态码为${code}`);
  }
};

/**模拟mac谷歌浏览器的请求头 */
export const fakeChromeHeaders = (cookie:string,referer:string) => {
  return {
    cookie,
    referer,
    "accept-encoding": "gzip, deflate, br",
    Accept: "text/html,application/xhtml+xml;application/json;v=b3;q=0.9",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
  };
};
