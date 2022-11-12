import {Request,Response} from 'express';
import { Query } from 'express-serve-static-core';


// **** Express **** //

export interface IReq<T = void> extends Request {
  body: T;
}

export interface IReqQuery<T extends Query, U = void> extends Request {
  query: T;
  body: U;
}

export interface IReqQuery<T extends Query, U = void> extends Request {
  query: T;
  body: U;
}

export type IRes = Response;