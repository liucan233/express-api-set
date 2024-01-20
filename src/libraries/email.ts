import { createTransport } from 'nodemailer';
import { logger } from '../logger';
import { emailUser, emailPassword } from '../config';
import validator from 'validator';

const transporter = createTransport({
  host: 'smtp.zoho.com.cn',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export const sendMail = async (targetEmail: string, subject: string, html: string) => {
  if (!validator.isEmail(targetEmail)) {
    throw new Error(`目标邮箱${targetEmail}地址不正确`);
  }
  const info = await transporter.sendMail({
    from: 'lc@front.lc', // sender address
    to: targetEmail, // list of receivers
    subject, // Subject line
    html, // html body
  });
  logger.info(`邮件发送结果：${info.response}`);
};
