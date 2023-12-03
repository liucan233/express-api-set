import { wxAppid, wxSecret } from '../../config';
import { fetch } from '../fetch';

const wxServer = 'https://api.weixin.qq.com';

class WXTokenManager {
  stableToken = '';

  async initStableToken() {
    const res = await fetch(wxServer + '/cgi-bin/stable_token', {
      method: 'post',
      body: JSON.stringify({
        grant_type: 'client_credential',
        appid: wxAppid,
        secret: wxSecret,
      }),
    });
    this.stableToken = res.jsonResult.access_token;
    console.log(this.stableToken);
  }

  async codeToSession(code: string) {
    const res = await fetch(
      wxServer +
        `/sns/jscode2session?appid=${wxAppid}&secret=${wxSecret}&js_code=${code}&grant_type=authorization_code`,
    );
    return res.textResult;
  }

  loopGetToken() {
    this.initStableToken();
    setTimeout(() => {
      return this.loopGetToken();
    }, 7000000);
  }
}

export const wxTokenManager = new WXTokenManager();
