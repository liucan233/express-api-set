import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.timestamp({
    format: 'YYYY-MM-DD hh:mm:ss',
  }),
});

export const logError = (err: unknown) => {
  if (err instanceof Error && err.stack) {
    logger.error(err.stack);
  } else {
    logger.error(JSON.stringify(err));
  }
};

logger.add(
  new winston.transports.Console({
    format: winston.format.printf(info => {
      return `[${info.level} ${info.timestamp}] ${info.message}`;
    }),
  }),
);
