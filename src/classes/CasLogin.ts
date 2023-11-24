import { logger } from "../logger";
import { CrawlerError } from "../constant/errorCode";
import { fetch } from "../libraries/fetch";
import { securityJs } from "../libraries/securityJs";
import { headersToString } from "../utils";
import { JSDOM } from 'jsdom';

const casUrl = "//cas.swust.edu.cn/authserver/login?service=http%3A%2F%2Fsoa.swust.edu.cn%2F"

export class CasLogin {
    errorCode = CrawlerError.NoError
    errorMsg = ''
    url = casUrl
    session = ''

    httpProtocol = 'https:'

    captcha = ''

    rasPublicKey: any

    tgcCookie = ''

    async init() {
        try {
            const res = await fetch(this.httpProtocol + this.url);
            if (res.status < 300 && res.status > 199) {
                this.url = this.httpProtocol + this.url;
                return;
            }
        } catch (error) {
            logger.info('尝试cas系统使用https失败')
        }
        try {
            this.httpProtocol = 'http:'
            const res = await fetch(this.httpProtocol + this.url);
            if (res.status < 300 && res.status > 199) {
                this.url = this.httpProtocol + this.url;
                return;
            }
        } catch (error) {
            logger.info('尝试cas系统使用http失败')
        }
        this.errorCode = CrawlerError.OpenCasSystemErr;
        this.errorMsg = `尝试判断cas系统协议失败`;
        throw new Error(this.errorMsg);
    }

    async initSession() {
        let res = await fetch(this.url);
        if (res.status === 200 && res.cookie) {
            this.session = res.cookie;
            return;
        }
        this.errorCode = CrawlerError.OpenCasSystemErr;
        this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
        throw new Error(this.errorMsg);
    }

    async loadCaptcha() {
        let res = await fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/captcha', {
            headers: {
                cookie: this.session
            }
        });
        if (res.dataUrlResult && !res.cookie && res.status < 300 && res.status > 199) {
            this.captcha = res.dataUrlResult;
            return;
        }
        this.errorCode = CrawlerError.OpenCasSystemErr;
        this.errorMsg = `响应状态码${res.status}，cookie为${res.cookie}`;
        throw new Error(this.errorMsg);
    }

    async loadRSAPublicKey() {
        let res = await fetch(this.httpProtocol + '//cas.swust.edu.cn/authserver/getKey', {
            headers: {
                cookie: this.session
            }
        });
        if (!res.jsonResult || res.status > 299 || res.status < 200) {
            this.errorCode = CrawlerError.OpenCasSystemErr;
            this.errorMsg = '预期获得ras参数，实际为空';
        }
        if (res.cookie) {
            this.errorCode = CrawlerError.OpenCasSystemErr;
            this.errorMsg = `请求携带${this.session}，被重新设置为${res.cookie}`;
            throw new Error(this.errorMsg);
        }
        this.rasPublicKey = securityJs.getKeyPair(res.jsonResult.exponent, '', res.jsonResult.modulus)
    }

    async tryLoginIn(acc: string, psd: string, captcha: string) {
        const encryptedPsd = securityJs.encryptedString(
            this.rasPublicKey,
            Array.from(psd).reverse().join('')
        )
        const res = await fetch(this.url, {
            method: 'post',
            redirect: 'manual',
            headers: {
                cookie: this.session,
                'accept-language': 'zh-CN,zh;q=0.9',
                "content-type": "application/x-www-form-urlencoded"
            },
            body: `execution=e1s1&_eventId=submit&geolocation=` +
                `&username=${acc}&lm=usernameLogin&password=${encryptedPsd}&captcha=${captcha}`
        });

        if (res.cookie.includes('TGC')) {
            this.tgcCookie = res.cookie;
            return;
        }

        if (!res.textResult?.includes('pwdError') || (res.status > 299 && res.status < 309)) {
            this.errorCode = CrawlerError.CasSysUnstable;
            this.errorMsg = `session可能已失效，响应状态码${res.status}，页面内容为${res.textResult}`;
            throw new Error(this.errorMsg);
        }

        if (res.status === 401) {
            this.errorCode = CrawlerError.AccPsdCpaMismatch;
            console.log(res.textResult)
            if (res.textResult.includes('密码错误')) {
                this.errorMsg = '用户名或密码错误'
            } else {
                this.errorMsg = '验证码错误'
            }
            throw new Error(this.errorMsg);
        }

        this.errorCode = CrawlerError.UnexpectedErr;
        this.errorMsg = `未知错误，请联系开发者排查错误`;
        throw new Error(this.errorMsg);
    }

    async renewBySession(session: string, httpProtocol: string) {
        this.session = session;
        this.httpProtocol = httpProtocol;
        this.url = this.httpProtocol + this.url;
        await this.loadRSAPublicKey()
    }

    async parseErrorText(html: string) {
        const { window } = new JSDOM(html);
        const { document } = window;
        console.log(html)
        const ele = document.querySelector('.pwdError');

        console.log(ele)

        const textContent = ele?.textContent
        return textContent;
    }
}
