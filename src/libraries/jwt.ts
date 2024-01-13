import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../logger';
import type { Request, Response, NextFunction } from 'express';
import { ErrCode } from '../constant/errorCode';
import crypto from 'node:crypto';
import { hashSalt } from '../config';

let jwtSecret = process.env.jwt_secret || 'xVXPDzlvCDbRzkzNSiljlUkIagZMgUGo';

if (!process.env.jwt_secret && process.env.NODE_ENV === 'production') {
  logger.error('JWT SECRET未配置');
}

export const jwtSign = (payload: JwtPayload) => {
  return jwt.sign(JSON.stringify(payload), jwtSecret, {
    algorithm: 'HS256',
  });
};

export const jwtDecode = (token: string): JwtPayload | null => {
  const payload = jwt.verify(token, jwtSecret, {
    complete: false,
  });
  if (typeof payload === 'object') {
    return payload;
  }
  return null;
};

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  const decodedToken = token && jwtDecode(token);
  if (token && decodedToken) {
    res.locals.userInfo = decodedToken;
    next();
  } else {
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: 'http请求头authorization无效，身份认证失败',
    });
  }
};

/** 生成哈希密码 */
export const hashPassword = (password: string) => {
  return crypto.pbkdf2Sync(password, hashSalt, 10000, 32, 'sha512').toString('hex');
};

logger.info(`明文密码2333，hash结果：${hashPassword('2333')}`);
