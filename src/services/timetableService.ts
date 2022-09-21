import got from "got-cjs";
import { StatusCodes } from "http-status-codes";
import logger from "jet-logger";
import cookieUtil from "cookie";
import { load } from "cheerio";

const { OK, MOVED_TEMPORARILY, MOVED_PERMANENTLY } = StatusCodes;

const LAB_URL = "http://202.115.175.175",
  LAB_HOME = "/aexp/stuTop.jsp",
  LAB_TABLE = "/teachn/teachnAction/index.action";

/**获取实验系统指定路径内容 */
export const fetchContext = async (
  path: string,
  cookie: string,
  referer: string
) => {
  // cookie = cookieUtil.parse(cookie)["JSESSIONID"];
  if (!cookie) {
    throw new TypeError("实验系统cookie不正确");
  }
  const res = await got.get(LAB_URL + path, {
    headers: {
      cookie,
      referer,
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: "202.115.175.175",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    followRedirect: false,
  });

  if (res.statusCode < 200 || res.statusCode > 299 || !res.body) {
    throw new Error("访问实验系统发生错误");
  }
  return res.body;
};

/**通过cookie获取学期数和周数 */
export const fetchTermAndWeeks = async (cookie: string) => {
  const body = await fetchContext(LAB_HOME, cookie, "");
  const matchClassReg = /class="top/g;
  if (!matchClassReg.test(body)) {
    throw new Error("未找到包含学期的div标签");
  }
  const timeReg = /(\d+-\d+)(?=学年第)/g;
  timeReg.lastIndex = matchClassReg.lastIndex;
  const time = (timeReg.exec(body) as string[])[0];
  const termReg = /\d+(?=学期)/g;
  termReg.lastIndex = timeReg.lastIndex;
  const term = (termReg.exec(body) as string[])[0];
  const weeksReg = /\d+(?=教学周)/g;
  weeksReg.lastIndex = termReg.lastIndex;
  const weeks = (weeksReg.exec(body) as string[])[0];
  return {
    time,
    term,
    weeks,
  };
};

/**绑定aexpsid，实验系统部分页面实验aexpsid，值与cookie一致 */
export const bindAexpsIdWithCookie = async (cookie: string) => {
  let value = cookieUtil.parse(cookie)["JSESSIONID"];

  const res = await got.get(LAB_URL + "/swust/;jsessionid=" + value, {
    headers: {
      cookie,
      referer: "http://localhost:3000/",
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: "202.115.175.175",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    followRedirect: false,
  });
};

/**课程具体信息 */
interface ICourse {
  day: number;
  week: number;
  start: number;
  end: number;
  name: string;
  task: string;
  place: string;
  teacher: string;
  cancelable: boolean;
}

/**获取指定学期的实验课表 */
export const fetchLabTimeTable = async (cookie: string) => {
  let prePageUrl = new URL(LAB_URL + "/aexp/stuLeft.jsp"),
    curPageUrl = new URL(LAB_URL + LAB_TABLE),
    cookieValue = cookieUtil.parse(cookie)["JSESSIONID"],
    newCookie = cookie + "; " + cookieUtil.serialize("jsessionid", cookieValue);

  const courseList: ICourse[] = [];
  for (let i = 0; i < 50; i++) {
    // 获取课表html文本
    let body = await fetchContext(
      curPageUrl.pathname + curPageUrl.hash,
      newCookie,
      prePageUrl.toString()
    );
    body = body.replace(/(?:\n|\t)+/g, "");

    // 解析html
    const $html = load(body),
      $table = $html("tbody", ".tablelist").eq(1);

    if (!$table.is("tbody")) {
      throw new Error("定位课程表table时出错");
    }

    // 获取到表格行
    const $tr = $table.children("tr");

    if ($tr.length < 1) {
      throw new RangeError(`解析第${i + 1}页课表行数小于2行`);
    }
    // 表格标题
    // const $th = $tr.eq(0).children("th"),
    //   thText: string[] = [];
    // for (let j = 0; j < $th.length; j++) {
    //   thText.push($th.eq(j).text());
    // }

    const tableRowText: string[][] = [];

    for (let j = 1; j < $tr.length; j++) {
      const $td = $tr.eq(j).children("td"),
        curText: string[] = [];
      tableRowText.push(curText);
      for (let k = 0; k < $td.length; k++) {
        curText.push($td.eq(k).text().replace(/\s+/g, ""));
      }
    }

    //按课程名建立课程对象
    for (let j = 0; j < tableRowText.length; j++) {
      const courseArr = tableRowText[j],
        courseObj: ICourse = {} as ICourse,
        courseTime = courseArr[2]
          .replace(/^(\d+).+?(\d+)-(\d+).+/, "$1 $2 $3")
          .split(" ");
      courseObj["week"] = Number(courseTime[0]) || -1;
      courseObj["start"] = Number(courseTime[1]) || -1;
      courseObj["end"] = Number(courseTime[2]) || -1;
      courseObj["name"] = courseArr[0];
      courseObj["task"] = courseArr[1];
      courseObj["place"] = courseArr[3];
      courseObj["teacher"] = courseArr[4];
      courseObj["cancelable"] = courseArr[10] !== "不可取消";
      courseList.push(courseObj);
    }

    // 匹配下一页url
    const nxtReg = /href="(\S+)">下一页\<\/a>/g;
    // nxtReg.lastIndex = tableEndReg.lastIndex;
    const nxt = nxtReg.exec(body);
    if (nxt) {
      const nxtPage = nxt[0].replace(nxtReg, "$1");
      //下一页如果存在
      const nxtPageUrl = new URL(
        /^http:/.test(nxtPage) ? nxtPage : LAB_URL + nxtPage
      );
      if (
        nxtPageUrl.searchParams.get("page.pageNum") ===
        curPageUrl.searchParams.get("page.pageNum")
      ) {
        //如果页数和当前相等，证明已经到最后一页
        break;
      } else {
        prePageUrl = curPageUrl;
        curPageUrl = nxtPageUrl;
      }
    } else {
      //如果不存在
      throw new TypeError("未获取到下一页url");
    }
  }
  return courseList;
};
