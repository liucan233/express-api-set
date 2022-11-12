import logger from "jet-logger";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServerError } from "./errors";

// **** Functions **** //

/**
 * Print an error object if it's truthy. Useful for testing.
 */
export function pErr(err?: Error): void {
  if (!!err) {
    logger.err(err);
  }
}

/**
 * Get a random number between 1 and 1,000,000,000,000
 */
export function getRandomInt(): number {
  return Math.floor(Math.random() * 1_000_000_000_000);
}

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
