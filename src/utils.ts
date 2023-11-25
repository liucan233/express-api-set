import { Headers } from 'node-fetch';

export const headersToString = (h: Headers) => {
  const rec = {} as Record<string, string>;
  for (const [k, v] of h.entries()) {
    rec[k] = v;
  }
  return JSON.stringify(rec);
};
