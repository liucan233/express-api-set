export enum ErrCode {
  NoError = 0,
  OpenCasSystemErr,
  GetCasSysCaptchaErr,
  CasSysUnstable,
  AccPsdCpaMismatch,
  UnexpectedErr,
  CasSysTGCExpired,
  CasRedirectUnexpected,

  OpenLabSysErr,
  LabCoursePageParseErr,
  LabCourseRowParseErr,
  LabSysCookieExpired,
  UserAuthErr,
  BadReqParamErr,
  NoUserErr,
  UserPasswordErr,

  OutOfTimeErr,
}
