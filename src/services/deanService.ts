import { ParamInvalidError } from "@shared/errors";
import { throwResponseCodeError, responseReq } from "@shared/functions";
import { fakeChromeHeaders } from "@util/userAgent";
import got from "got-cjs";
import { load } from "cheerio";
import cookieUtil from "cookie";
import { IExamInfo, parseExamFromTable } from "@util/matrixDean";
import { parseCourseScore } from "@util/casUtil";

export const EXAM_PATH =
    "/acadmicManager/index.cfm?event=studentPortal:examTable",
  DEAN_URL = "https://matrix.dean.swust.edu.cn",
  SCORE_PATH = "/acadmicManager/index.cfm?event=studentProfile:courseMark";

/**获取教务处的考试安排 */
export const fetchJwExamList = async (cookie: string): Promise<IExamInfo[]> => {
  const res = await got.get(DEAN_URL + EXAM_PATH, {
    headers: fakeChromeHeaders(cookie, DEAN_URL),
    followRedirect: false,
    throwHttpErrors: false,
    timeout: {
      request: 1000,
    },
    retry: {
      limit: 0
    }
  });
  throwResponseCodeError(res.statusCode);
  const $body = load(res.body.replace(/\s+/g, "")),
    $finalTable = $body("tbody", "#finalExamTable"),
    $middleTable = $body("tbody", "#midExamTable"),
    $resitTable = $body("tbody", "#resitExamTable");

  let result: IExamInfo[] = [];
  if ($finalTable.length) {
    result = parseExamFromTable($finalTable, 1);
  }
  if ($middleTable.length) {
    result = parseExamFromTable($middleTable, 2).concat(result);
  }
  if ($resitTable.length) {
    result = parseExamFromTable($resitTable, 3).concat(result);
  }
  return result;
};

/**将教务处ticket转换为cookie */
export const getCookieFromTicket = async (ticket: string) => {
  if (ticket.indexOf(DEAN_URL) !== 0) {
    throw new ParamInvalidError("ticket必须以" + DEAN_URL + "开头");
  }
  const res = await got.get(ticket, {
    throwHttpErrors: false,
    followRedirect: false,
    headers: fakeChromeHeaders("", ""),
    timeout: {
      request: 1000,
    },
    retry: {
      limit: 0
    }
  });
  throwResponseCodeError(res.statusCode);
  if (!res.headers["set-cookie"]) {
    throw Error("使用ticket访问教务处set-cookie为空");
  }
  const cookie = cookieUtil.parse(res.headers["set-cookie"][0])["SSO"];
  if (cookie) {
    return "SSO=" + cookie;
  }
  throw Error("根据ticket获取cookie失败");
};

/**根据教务处cookie获取课程成绩 */
export const fetchJwScoreList = async (cookie: string) => {
  const res = await got.get(DEAN_URL + SCORE_PATH, {
    headers: fakeChromeHeaders(cookie, DEAN_URL),
    followRedirect: false,
    throwHttpErrors: false,
    timeout: {
      request: 1000,
    },
    retry: {
      limit: 0
    }
  });
  return parseCourseScore(res.body.replace(/\s+/g,' '));
};
