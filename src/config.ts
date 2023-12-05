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

if (!process.env.hash_salt || !process.env.wx_appid || !process.env.wx_secret) {
  throw new Error('未设置环境变量');
}

export const appPort = 3000;

export const wxAppid = process.env.wx_appid;

export const wxSecret = process.env.wx_secret;

export const hashSalt = process.env.hash_salt;
