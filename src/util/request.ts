/**
 * nodejs环境发起网络请求
 */

import g from "got-cjs";

export const got = g.extend({
  timeout: {
    request: 1000,
  },
  retry: {
    limit: 0,
  },
});