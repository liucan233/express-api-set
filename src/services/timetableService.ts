import got from "got-cjs";
import { StatusCodes } from "http-status-codes";

const { OK, MOVED_TEMPORARILY, MOVED_PERMANENTLY } = StatusCodes;

const LAB_URL = "http://202.115.175.175/aexp",
  LAB_HOME = "/stuTop.jsp";

/**获取实验系统指定路径内容 */
export const fetchContext = async (
  path: string,
  cookie: string,
  referer: string
) => {
  const res = await got.get(LAB_URL + path, {
    headers: { cookie, referer },
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
