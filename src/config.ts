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

export const appPort = 3000;

export const wxAppid = process.env.wx_appid;

export const wxSecret = process.env.wx_secret;
