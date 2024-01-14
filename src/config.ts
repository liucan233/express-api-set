import { configDotenv } from 'dotenv';
import { logger } from './logger';
import path from 'node:path';

if (!process.env.NODE_ENV) {
  const result = configDotenv({ debug: true, path: path.resolve('env/app.env') });
  if (result.error) {
    logger.error('本地环境变量初始化失败');
  }
}

logger.info(`${process.env.NODE_ENV}环境`);

const envKeyArr = ['jwt_secret', 'hash_salt', 'email_user', 'email_passwd'];

for (const k of envKeyArr) {
  if (!process.env[k]) {
    logger.error(`未配置process.env.${k}`);
  }
}

export const jwtSecret = process.env.jwt_secret || 'xVXPDzlvCDbRzkzNSiljlUkIagZMgUGo';

export const appPort = 3000;

export const wxAppid = process.env.wx_appid;

export const wxSecret = process.env.wx_secret;

export const hashSalt = process.env.hash_salt || 'DeOoarMi85X3AvW1';

export const emailUser = process.env.email_user || '';

export const emailPassword = process.env.email_passwd || '';
