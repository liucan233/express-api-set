import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';
import { logger } from '../../logger';
import { hashPassword, jwtMiddleware, jwtSign } from '../../libraries/jwt';
import { ErrCode } from '../../constant/errorCode';

export const userRouter: Router = Router();

userRouter.post('/signin', async (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: '请求参数不正确',
    });
    return;
  }
  const user = await prismaClient.user.findFirst({
    where: {
      email: req.body.email,
    },
  });
  if (!user) {
    res.json({
      code: ErrCode.NoUserErr,
      msg: '用户不存在',
    });
    return;
  }
  const hashPasswd = hashPassword(req.body.password);
  if (hashPasswd === user.password) {
    res.json({
      code: ErrCode.NoError,
      msg: '',
      data: jwtSign({
        id: user.id,
        email: user.email,
      }),
    });
  } else {
    res.json({
      code: ErrCode.UserPasswordErr,
      msg: '密码不正确',
    });
  }
});

userRouter.post('/signout', jwtMiddleware, async (req, res) => {});
