/**模拟浏览器请求头 */

/**模拟mac谷歌浏览器的请求头 */
export const fakeChromeHeaders = (cookie:string,referer:string) => {
  return {
    cookie,
    referer,
    "accept-encoding": "gzip, deflate, br",
    Accept: "text/html,application/xhtml+xml;application/json;v=b3;q=0.9",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",

  };
};
