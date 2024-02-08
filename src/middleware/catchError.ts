import { ErrCode } from 'src/constant/errorCode';
import { logError } from 'src/logger';

export const catchError = <T>(handler: T): T => {
  // @ts-expect-error
  return async (req, res, next) => {
    try {
      // @ts-expect-error
      await handler(req, res, next);
    } catch (error) {
      res.json({
        code: ErrCode.UnexpectedErr,
        msg: logError(error),
      });
    }
  };
};
