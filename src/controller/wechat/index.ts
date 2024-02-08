import { Router, Request } from 'express';
import { wxTokenManager } from '../../libraries/wechat/tokenManager';
import { logger } from '../../logger';

export const wxRouter: Router = Router();

wxRouter.get('/code2session', async (req: Request<{}, any, any, { code: string }>, res) => {
  console.log(req.query.code);
  const session = await wxTokenManager.codeToSession(req.query.code);
  res.type('json');
  res.write(session);
  res.end();
});
