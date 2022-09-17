import StatusCodes from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';

import { IUser, UserRoles } from '@models/user-model';
import envVars from 'src/shared/env-vars';
import jwtUtil from '@util/jwt-util';


// **** Variables **** //

const { UNAUTHORIZED } = StatusCodes;
const jwtNotPresentErr = 'JWT not present in signed cookie.';


// **** Types **** //

export interface ISessionUser extends JwtPayload {
  id: number;
  email: string;
  name: string;
  role: IUser['role'];
}


// **** Functions **** //

/**
 * Middleware to verify if user logged in.
 */
export async function adminMw(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract the token
    const cookieName = envVars.cookieProps.key,
      jwt = req.signedCookies[cookieName];
    if (!jwt) {
      throw Error(jwtNotPresentErr);
    }
    // Make sure user role is an admin
    const clientData = await jwtUtil.decode<ISessionUser>(jwt);
    if (typeof clientData === 'object' && clientData.role === UserRoles.Admin) {
      res.locals.sessionUser = clientData;
      next();
    } else {
      throw Error(jwtNotPresentErr);
    }
  } catch (err: unknown) {
    let error;
    if (typeof err === 'string') {
      error = err;
    } else if (err instanceof Error) {
      error = err.message;
    }
    return res.status(UNAUTHORIZED).json({ error });
  }
}

