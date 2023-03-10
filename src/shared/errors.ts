import HttpStatusCode from "http-status-codes";

/**服务器遇到错误，向客户端抛错误 */
export class HttpServerError extends Error {
  public readonly code = HttpStatusCode.INTERNAL_SERVER_ERROR;

  constructor(msg: string, code: number) {
    super(msg);
    this.code = code;
  }
}

export class BadRequestError extends HttpServerError {
  constructor(msg: string) {
    super(msg, HttpStatusCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends HttpServerError {
  constructor(msg: string) {
    super(msg, HttpStatusCode.UNAUTHORIZED);
  }
}

export class InternalError extends HttpServerError {
  constructor(msg: string) {
    super(msg, HttpStatusCode.UNAUTHORIZED);
  }
}

export class GatewayError extends HttpServerError {
  constructor(msg: string) {
    super(msg, HttpStatusCode.BAD_GATEWAY);
  }
}

export class UnavailableError extends HttpServerError {
  constructor(msg: string) {
    super(msg, HttpStatusCode.SERVICE_UNAVAILABLE);
  }
}
