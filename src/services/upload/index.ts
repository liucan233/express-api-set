import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';
import { logError, logger } from '../../logger';
import { jwtMiddleware } from '../../libraries/jwt';
import { ErrCode } from '../../constant/errorCode';
import { saveUploadFile } from '../../utils';
import path from 'node:path';
import { lookup } from 'mime-types';

export const uploadRouter: Router = Router();

const maxUplaodSize = 1024 * 1024 * 20;

uploadRouter.post('/', jwtMiddleware, async (req, res) => {
  const fileName = req.headers['x-custom-filename'];
  if (typeof fileName !== 'string') {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: '缺少x-file-name header，值为文件名',
    });
    return;
  }

  const saveTask = new Promise<string>(resolve => {
    const bufferArr: Buffer[] = [];
    let curSize = 0;
    req.on('data', (bf: Buffer) => {
      curSize += bf.length;
      if (curSize > maxUplaodSize) {
        throw new Error('上传文件过大');
      }
      bufferArr.push(bf);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(bufferArr);
      saveUploadFile(buffer).then(resolve);
    });
  });

  try {
    const savePath = await saveTask;
    let sqlRow = await prismaClient.upload.findFirst({
      where: {
        fileName,
        savePath,
        uploadUserId: res.locals.userInfo.id,
      },
    });
    if (!sqlRow) {
      sqlRow = await prismaClient.upload.create({
        data: {
          fileName,
          savePath,
          uploadUserId: res.locals.userInfo.id,
        },
      });
    }

    res.json({
      code: ErrCode.NoError,
      msg: '上传成功',
      data: sqlRow,
    });
  } catch (error) {
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: logError(error),
    });
  }
});

uploadRouter.get('/', async (req, res) => {
  const { uri } = req.query;
  if (typeof uri !== 'string') {
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: '缺少uri参数',
    });
    return;
  }
  try {
    const sqlRow = await prismaClient.upload.findFirst({
      where: {
        id: uri,
      },
    });
    if (sqlRow) {
      const mime = lookup(sqlRow.fileName);
      mime && res.setHeader('content-type', mime);
      res.sendFile(path.resolve(sqlRow.savePath));
      return;
    }
    res.status(404).json({
      code: ErrCode.BadReqParamErr,
      msg: '文件不存在',
    });
  } catch (err) {
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: logError(err),
    });
  }
});
