import HttpStatusCode from "http-status-codes";

export abstract class RequestError extends Error {
  public readonly code = HttpStatusCode.BAD_REQUEST;

  constructor(msg: string, code: number) {
    super(msg);
    this.code = code;
  }
}

export class ParamInvalidError extends RequestError {
  public static readonly Msg =
    "One or more of the required was missing or invalid.";
  public static readonly code = HttpStatusCode.BAD_REQUEST;

  constructor(msg?: string) {
    super(msg||ParamInvalidError.Msg, ParamInvalidError.code);
  }
}

export class UnauthorizedError extends RequestError {
  public static readonly Msg = "Login failed";
  public static readonly code = HttpStatusCode.UNAUTHORIZED;

  constructor(msg?: string) {
    super(msg||UnauthorizedError.Msg, UnauthorizedError.code);
  }
}

export class ServerError extends RequestError {
  public static readonly Msg = "internal server error";
  public static readonly code = HttpStatusCode.INTERNAL_SERVER_ERROR;

  constructor(msg?: string) {
    super(msg||ServerError.Msg, ServerError.code);
  }
}
