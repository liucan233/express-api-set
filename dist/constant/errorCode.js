export let CrawlerError = /*#__PURE__*/function (CrawlerError) {
  CrawlerError[CrawlerError["NoError"] = 0] = "NoError";
  CrawlerError[CrawlerError["OpenCasSystemErr"] = 1] = "OpenCasSystemErr";
  CrawlerError[CrawlerError["GetCasSysCaptchaErr"] = 2] = "GetCasSysCaptchaErr";
  CrawlerError[CrawlerError["CasSysUnstable"] = 3] = "CasSysUnstable";
  CrawlerError[CrawlerError["AccPsdCpaMismatch"] = 4] = "AccPsdCpaMismatch";
  CrawlerError[CrawlerError["UnexpectedErr"] = 5] = "UnexpectedErr";
  return CrawlerError;
}({});