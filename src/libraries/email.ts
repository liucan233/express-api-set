import { createTransport } from 'nodemailer';
import { logger } from '../logger';
import { emailUser, emailPassword } from '../config';

const transporter = createTransport({
  host: 'smtp.zoho.com.cn',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export const sendMail = async () => {
  const info = await transporter.sendMail({
    from: 'lc@front.lc', // sender address
    to: '313720186@qq.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    html: '<b>Hello world?</b>', // html body
  });
  logger.info(`邮件发送结果：${info.response}`);
};
