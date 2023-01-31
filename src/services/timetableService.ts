import got from "got-cjs";
import cookieUtil from "cookie";
import { load } from "cheerio";
import {
  covertJwCourse,
  covertLabCourse,
  IJWCourse,
  ILabCourse,
} from "@util/timetable";

const LAB_URL = "http://202.115.175.175",
  LAB_HOME = "/aexp/stuTop.jsp",
  LAB_TABLE = "/teachn/teachnAction/index.action",
  COMMON_TABLE = "/teachn/stutool";

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
    timeout: {
      request: 1000,
      response: 1000
    },
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
  const value = cookieUtil.parse(cookie)["JSESSIONID"];

  await got.get(LAB_URL + "/swust/;jsessionid=" + value, {
    headers: {
      cookie,
      referer: LAB_URL,
      Accept: "text/html,application/xhtml+xml;v=b3;q=0.9",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      Host: "202.115.175.175",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel) Chrome/104",
    },
    timeout: {
      request: 1000,
      response: 1000
    },
    followRedirect: false,
  });
};

/**获取当前学期的实验课表 */
export const fetchLabTimeTable = async (cookie: string) => {
  let prePageUrl = new URL(LAB_URL + LAB_TABLE),
    curPageUrl = new URL(LAB_URL + LAB_TABLE);
  const cookieValue = cookieUtil.parse(cookie)["JSESSIONID"],
    newCookie = cookie + "; " + cookieUtil.serialize("aexpsid", cookieValue);

  const courseList: ILabCourse[] = [];
  for (let i = 0; i < 50; i++) {
    // 获取课表html文本
    let body = await fetchContext(
      curPageUrl.pathname + curPageUrl.search,
      newCookie,
      prePageUrl.toString()
    );
    body = body.replace(/\s+/g, " ");

    // 解析html
    const $html = load(body),
      $tbody = $html("tbody", ".tablelist");

    let $table = $tbody.eq(1);
    if (!$table.is("tbody")) {
      $table = $tbody.eq(0);
    }

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
      const courseArr = tableRowText[j];
      const courseObj: ILabCourse = {
        name: courseArr[0],
        task: courseArr[1],
        time: courseArr[2],
        place: courseArr[3],
        teacher: courseArr[4],
        type: courseArr[5],
        seat: courseArr[6],
        status: courseArr[7],
        selected: Number(courseArr[8]),
        min: Number(courseArr[9]),
        cancel: courseArr[10],
      };
      courseList.push(courseObj);
    }

    // 列表下面的上一页、下一页和末页按钮
    const $btnList = $html("ul li a", "#myPage"),
      $nextBtn = $btnList.eq(2),
      $endBtn = $btnList.eq(3),
      endPageHref = $endBtn.attr("href"),
      nextPageHref = $nextBtn.attr("href");
    if (
      $endBtn.text() !== "末页" ||
      !endPageHref ||
      $nextBtn.text() !== "下一页" ||
      !nextPageHref
    ) {
      throw new Error("查找课表下一页位置出错");
    }

    const nxtPageUrl = new URL(LAB_URL + nextPageHref);

    const nxtPageNum = Number(
        nxtPageUrl.searchParams.get("page.pageNum") ?? 99
      ),
      endPageNum = Number(
        new URL(LAB_URL + endPageHref).searchParams.get("page.pageNum") ?? -1
      );

    if (nxtPageNum > endPageNum) {
      //如果页数和当前相等，证明已经到最后一页
      break;
    } else {
      prePageUrl = curPageUrl;
      curPageUrl = nxtPageUrl;
    }
  }
  return covertLabCourse(courseList);
};

/**获取当前学期的非实验课 */
export const fetchCommonTimetable = async (cookie: string) => {
  const cookieValue = cookieUtil.parse(cookie)["JSESSIONID"],
    newCookie = cookieUtil.serialize("aexpsid", cookieValue) + "; " + cookie;

  try {
    const body = await fetchContext(LAB_TABLE, newCookie, LAB_URL);
    if (!body.match('class="tablelist">')) {
      throw new Error("访问实验系统课表页面失败");
    }
  } catch (e) {
    throw new Error("向教务系统绑定当前实验系统cookie失败");
  }
  const res = await got.post(LAB_URL + COMMON_TABLE, {
    headers: {
      cookie: newCookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "op=getJwTimeTable",
    timeout: {
      request: 1000,
      response: 1000
    }
  });

  const resJson = JSON.parse(res.body) as IJWCourse[];
  return covertJwCourse(resJson);
};
