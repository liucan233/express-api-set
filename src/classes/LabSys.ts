import { logger } from '../logger';
import { JSDOM, CookieJar } from 'jsdom';
import { ErrCode } from '../constant/errorCode';

const labSysUrl = 'http://sjjx.swust.edu.cn';

export class LabSysCrawler {
  cookie = '';
  jd: JSDOM = {} as any;

  errorCode = ErrCode.UnexpectedErr;
  errorMsg = '';

  async loadPage(url: string, referrer?: string) {
    logger.info(`加载${url}`);
    const ckJar = new CookieJar();
    ckJar.setCookieSync(this.cookie, labSysUrl);
    this.jd = await JSDOM.fromURL(url, {
      cookieJar: ckJar,
      referrer,
    });
    this.checkJdUrlIsInclude(labSysUrl);
  }

  async loadLabSysHomePage() {
    await this.loadPage(labSysUrl + '/swust/');
  }

  async loadLabCoursePage(url?: string): Promise<void> {
    const pageUrl = 'http://sjjx.swust.edu.cn/teachn/teachnAction/index.action';
    const referrer = 'http://sjjx.swust.edu.cn/aexp/stuLeft.jsp';
    await this.loadPage(url || pageUrl, referrer);
  }

  checkJdUrlIsInclude(url: string) {
    const curUrl = this.jd.window.location.href;
    if (curUrl.includes('login') || !this.jd.window.location.href.includes(url)) {
      this.errorCode = ErrCode.OpenLabSysErr;
      this.errorMsg = `被重定向至${this.jd.window.location.href}`;
      throw new Error(this.errorMsg);
    }
    if (this.jd.serialize().includes(`self.location='/aexp'`)) {
      this.errorCode = ErrCode.LabSysCookieExpired;
      this.errorMsg = `实验系统打开失败，cookie过期`;
    }
  }

  parseLabCourseRow(rowEl: HTMLTableRowElement) {
    const tdElArr = rowEl.querySelectorAll('td');
    if (tdElArr.length !== 11) {
      this.errorCode = ErrCode.LabCourseRowParseErr;
      this.errorMsg = `解析实验课表格行出差, ${rowEl.outerText}`;
      throw new Error(this.errorMsg);
    }
    return Array.from(tdElArr).map(td => td.textContent?.trim() || '');
  }

  async parseLabCourse() {
    const document = this.jd.window.document;
    const pageElArr = document.querySelectorAll<HTMLAnchorElement>('#myPage a');
    let maxPageNum = 1,
      endPageUrl = pageElArr[3].href || '';
    const regResult = endPageUrl.match(/page.pageNum=(\d+)/);
    if (!regResult || regResult.length !== 2) {
      this.errorCode = ErrCode.LabCoursePageParseErr;
      this.errorMsg = `实验课翻页解析错误，${endPageUrl}`;
      throw new Error(this.errorMsg);
    }
    maxPageNum = Number(regResult[1]) || 1;
    if (maxPageNum > 10) {
      maxPageNum = 10; // 页数太多暂时不遍历
    }
    const resultArr: Array<string[]> = [];
    for (let i = 1; i <= maxPageNum; i++) {
      if (i > 1) {
        const curPageUrl = endPageUrl.replace(/page.pageNum=\d+/, `page.pageNum=${i}`);
        await this.loadLabCoursePage(curPageUrl);
      }
      const tableEl = document.querySelectorAll<HTMLTableRowElement>('#tab2 > .tablelist > tbody > tr');
      for (let j = 1; j < tableEl.length; j++) {
        resultArr.push(this.parseLabCourseRow(tableEl[j]));
      }
    }
    this.errorCode = ErrCode.NoError;
    return resultArr;
  }
}
