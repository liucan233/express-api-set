import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';
import { logError, logger } from '../../logger';
import { hashPassword, jwtMiddleware, jwtSign } from '../../libraries/jwt';
import { ErrCode } from '../../constant/errorCode';
import { sendMail } from '../../libraries/email';
import validator from 'validator';
import dayjs from 'dayjs';

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

userRouter.post('/captcha', async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !validator.isEmail(email)) {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: '邮箱格式不正确',
    });
    return;
  }
  let registeredUser = false;
  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email,
      },
    });
    if (user) {
      registeredUser = true;
    }
  } catch (error) {
    logError(error);
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: '查找用户失败，请重试',
    });
  }
  const captcha = `${Math.floor(Math.random() * 10000)}`;
  const sendTask = sendMail(email, '验证码', `登陆验证码：${captcha}，30分钟内有效。`);

  const createdAt = dayjs().toISOString();
  const sqlTask = prismaClient.emailVerification.upsert({
    where: {
      email,
    },
    create: {
      email,
      captcha,
      createdAt,
    },
    update: {
      captcha,
      createdAt,
    },
  });
  try {
    await Promise.all([sendTask, sqlTask]);
    res.json({
      code: ErrCode.NoError,
      msg: '发送成功',
      data: {
        registeredUser,
      },
    });
  } catch (error) {
    logError(error);
    res.json({
      code: ErrCode.UnexpectedErr,
      msg: '获取验证码失败，请重试',
    });
  }
});

userRouter.post('/signinByCaptcha', async (req, res) => {
  const { email, captcha } = req.body;
  if (typeof email !== 'string' || typeof captcha !== 'string') {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: '请求参数不正确',
    });
    return;
  }
  const authInfo = await prismaClient.emailVerification.findFirst({
    where: {
      email,
    },
  });
  if (!authInfo || authInfo.captcha !== captcha) {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: '验证码不正确',
    });
    return;
  }

  const deleteTask = prismaClient.emailVerification.delete({
    where: {
      email,
    },
  });

  let { name, avatar, password } = req.body;
  if (typeof name !== 'string') {
    name = '新用户';
  }
  if (typeof avatar !== 'string') {
    avatar = '';
  }
  if (typeof password !== 'string') {
    password = '';
  }
  const addUserTask = prismaClient.user.upsert({
    where: {
      email,
    },
    create: {
      email,
      name,
      avatar,
      password,
    },
    update: {},
  });
  try {
    const [deletedRow, newUser] = await prismaClient.$transaction([deleteTask, addUserTask]);

    const duration = dayjs().diff(deletedRow.createdAt, 'm');
    if (duration > 30) {
      res.json({
        code: ErrCode.OutOfTimeErr,
        msg: '验证码已过期',
      });
    }
    res.json({
      code: ErrCode.NoError,
      data: jwtSign({
        email,
        id: newUser.id,
      }),
    });
  } catch (error) {
    logError(error);
    res.json({
      code: ErrCode.UnexpectedErr,
    });
  }
});
