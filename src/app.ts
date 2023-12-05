import { appPort } from './config';
import express from 'express';
import { logError, logger } from './logger';
import { servicesRouter } from './services';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-method', '*');
    res.setHeader('access-control-headers', '*');
  }
  next();
});

app.use('/api', servicesRouter);

app.use((req, res) => {
  if (!res.writableEnded) {
    res.json({
      code: 404,
      msg: '接口不存在',
    });
  }
});

app.listen(appPort, 'localhost', () => {
  logger.info('应用启动成功localhost:' + appPort);
});

export default app;

process.on('uncaughtException', reason => {
  logError(reason);
});

// process.on('SIGINT', () => {
//   app.
// });
