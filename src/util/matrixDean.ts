// 提供一些工具函数，用于解析https://matrix.dean.swust.edu.cn/的内容

import { Cheerio, Element, load } from "cheerio";

/**课程成绩结构 */
type TCourseScore = {
  /**课程名 */
  name: string;
  /**课程号 */
  code: string;
  /**学分 */
  credit: string;
  /**必修课 */
  compulsory: boolean;
  /**正考分数 */
  score: string;
  /**补考分数 */
  resit: string;
};
/**一年两个学期的课程成绩 */
type TYearCourseScore = {
  /**学年信息，例如2020-2021 */
  time: string;
  /**上半学期成绩 */
  spring: TCourseScore[];
  /**下半学期成绩 */
  autumn: TCourseScore[];
  /**学年总共课程数量 */
  totalNum: number
};
/**解析课程成绩 */
export const parseCourseScore = (htmlText: string): TYearCourseScore[] => {
  const $html = load(htmlText);
  const $trArr = $html("#Plan tbody tr");
  const trArr = $trArr.toArray();
  const result: TYearCourseScore[] = [];
  let curYearScore: TYearCourseScore = {} as TYearCourseScore;
  let curScoreArr: TCourseScore[] = [];
  /**下一个tr内容，0是学年信息，1是春/秋学期，2是表头，3是课程成绩或平均绩点 */
  let nextTrContentType = 0;
  for (const tr of trArr) {
    const $tr = load(tr, null, false);
    const $tdArr = $tr("td");

    const tdLength = $tdArr.length;
    const text = $tr.text().trim();

    if (tdLength === 7 && nextTrContentType === 3) {
      const compulsoryText = $tdArr.eq(3).text().trim();
      if (!"必修限选".includes(compulsoryText)) {
        throw new Error("解析成绩table出错，当前tr不为课程行");
      }
      curScoreArr.push({
        name: $tdArr.eq(0).text(),
        code: $tdArr.eq(1).text(),
        credit: $tdArr.eq(2).text(),
        compulsory: compulsoryText === "必修",
        score: $tdArr.eq(4).text(),
        resit: $tdArr.eq(5).text(),
      });
    } else if (tdLength === 1 && nextTrContentType === 3) {
      if (!text.includes("平均学分绩点")) {
        throw new Error("解析成绩table出错，当前tr不为平均绩点行");
      }
      nextTrContentType = curScoreArr === curYearScore.autumn ? 0 : 1;
    } else if (tdLength === 1 && nextTrContentType === 0) {
      if (!text.includes("学年")) {
        throw new Error("解析成绩table出错，当前tr不为学年行");
      }
      nextTrContentType = 1;
      // 处理学年信息，例如2019-2020学年，共20门课程
      const $spanArr = $tdArr.first().children();
      if ($spanArr.length > 1) {
        const timeText = $spanArr.eq(0).text(),
          totalNum = Number($spanArr.eq(1).text());
        if (!timeText.includes("-") || totalNum < 1 || totalNum > 200) {
          throw new Error("解析成绩table出错，学年获课程总数不正确");
        }
        // 遇到新学期了，保存前一个学期的成绩
        result.push(curYearScore);
        // 记录新学期信息
        curYearScore = { time: timeText, spring: [], autumn: [],totalNum};
      } else {
        throw new RangeError("解析成绩table出错，学期信息抓取失败：" + text);
      }
    } else if (tdLength === 7 && nextTrContentType === 2) {
      if (!text.includes("课程 课程号 学分")) {
        throw new Error("解析成绩table出错，当前tr不为表头行");
      }
      nextTrContentType = 3;
    } else if (tdLength === 1 && text === "春" && nextTrContentType === 1) {
      curScoreArr = curYearScore.spring;
      nextTrContentType = 2;
    } else if (tdLength === 1 && text === "秋" && nextTrContentType === 1) {
      curScoreArr = curYearScore.autumn;
      nextTrContentType = 2;
    } else {
      throw new Error("解析成绩table出错，未知表格行");
    }
  }
  result.push(curYearScore);
  result.shift();
  return result;
};

/**考试信息结构 */
export interface IExamInfo {
  /**课程名 */
  name: string;
  /**周次 */
  week: string;
  /**周几 */
  day: string;
  /**日期 */
  date: string;
  /**时间 */
  time: string;
  /**地点 */
  place: string;
  /**座位号 */
  seat: string;
  /**考试类型，1期末，2期中和3补考 */
  type: 1 | 2 | 3;
}
/**解析table内的考试信息 */
export const parseExamFromTable = (
  $tbody: Cheerio<Element>,
  type: IExamInfo["type"]
) => {
  const trArr = $tbody.children("tr").get(),
    result: IExamInfo[] = [];
  if (trArr.length < 1) {
    throw new Error("解析考试表格失败");
  }
  for (let i = 0; i < trArr.length; i++) {
    const tdArr = load(trArr[i])("td").get(),
      textArr: string[] = [];
    for (let j = 0; j < tdArr.length; j++) {
      textArr.push(load(tdArr[j]).text().trim());
    }
    result.push({
      name: textArr[1],
      week: textArr[2],
      day: textArr[3],
      date: textArr[4],
      time: textArr[5],
      place: textArr[6],
      seat: textArr[7],
      type
    });
  }
  return result;
};
