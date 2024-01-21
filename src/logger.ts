import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.timestamp({
    format: 'YYYY-MM-DD hh:mm:ss',
  }),
});

export const logError = (err: unknown) => {
  let msg = '';
  if (err instanceof Error && err.stack) {
    logger.error(err.stack);
    msg = err.message;
  } else {
    msg = JSON.stringify(err);
    logger.error(msg);
  }
  return msg;
};

logger.add(
  new winston.transports.Console({
    format: winston.format.printf(info => {
      return `[${info.level} ${info.timestamp}] ${info.message}`;
    }),
  }),
);
