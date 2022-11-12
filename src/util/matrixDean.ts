import { Cheerio, Element, load } from "cheerio";

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
