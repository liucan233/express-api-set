export enum CrawlerError {
  NoError,
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
}
