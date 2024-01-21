import { Headers } from 'node-fetch';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { logger } from './logger';

const mkUploadDir = async () => {
  const arr = await fs.readdir('./', { withFileTypes: true });
  const upload = arr.find(({ name }) => name === 'upload');
  if (upload && upload.isDirectory()) {
    return;
  }
  await fs.mkdir('./upload');
  logger.info('目录upload创建成功');
};
mkUploadDir();

export const saveUploadFile = async (bf: Buffer) => {
  const md5Hash = createHash('md5');
  const hash = md5Hash.update(bf);
  const hashValue = hash.digest('hex');
  hash.destroy();
  const filePath = `./upload/${hashValue}`;
  try {
    const file = await fs.stat(filePath);
    logger.info(`文件${filePath}已经存在`);
  } catch (error) {
    await fs.writeFile(filePath, bf, {});
  }
  return filePath;
};

export const removeUploadFile = (filePath: string) => {
  fs.rm(filePath);
};
