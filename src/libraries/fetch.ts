import bf from 'node:buffer';
import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { filterInvalidText } from './cookie';

export const fetch = async (url: URL | RequestInfo, init?: RequestInit) => {
  let res: Response;
  // try {
  res = await nodeFetch(url, init);
  // } catch (error) {
  //     console.log(error);
  //     throw error;
  // }
  const resContentType = res.headers.get('content-type');
  let jsonResult: any = null;
  if (resContentType?.includes('json')) {
    jsonResult = await res.json();
  }

  let textResult: any = null;
  if (resContentType?.includes('text')) {
    textResult = await res.text();
  }

  let dataUrlResult: any = null;
  if (resContentType?.includes('image')) {
    const buffer = await res.arrayBuffer();
    const mimeType = resContentType.match(/image\/\w+/);
    if (mimeType?.length) {
      dataUrlResult = `data:${mimeType[0]};base64,` + bf.Buffer.from(buffer).toString('base64');
    }
  }

  const cookie = res.headers.get('set-cookie');
  let cookieText = '';
  if (cookie) {
    cookieText = filterInvalidText(cookie);
    res.headers.set('cookie', cookieText);
  }
  return {
    jsonResult,
    textResult,
    dataUrlResult,
    headers: res.headers,
    status: res.status,
    cookie: cookieText,
  };
};
