export enum CrawlerError {
  NoError,
  OpenCasSystemErr,
  GetCasSysCaptchaErr,
  CasSysUnstable,
  AccPsdCpaMismatch,
  UnexpectedErr,
  CasSysTGCExpired,
  CasRedirectUnexpected,
}
