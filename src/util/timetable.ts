import logger from "jet-logger";

/**教务系统返回的课表结构 */
export interface IJWCourse {
  jw_course_code: string;
  base_teacher_name: string;
  base_room_name: string;
  week: string;
  jw_task_book_no: string;
  jw_course_name: string;
  section_end: string;
  week_day: string;
  section: string;
  base_teacher_no: string;
  section_start: string;
}
/**实验系统抓取的课表结构 */
export interface ILabCourse {
  /**课程名称 */
  name: string;
  /**项目名称 */
  task: string;
  /**上课时间 */
  time: string;
  /**上课地点 */
  place: string;
  /**指导老师 */
  teacher: string;
  /**类型 */
  type: string;
  /**座位号	 */
  seat: string;
  /**状态	 */
  status: string;
  /**已选 */
  selected: number;
  /**下限 */
  min: number;
  /**取消 */
  cancel: string;
}

/**本系统使用的课表DTO */
interface ICommonCourse {
  code: string;
  name: string;
  teacher: string;
  place: string[];
  week: string[];
  section: string[];
  day: string[];
  tasks?: string[];
}

/**每周的天数 */
const DAYS_OF_WEEK = 7;
/**每天课程的讲数 */
const SECTIONS_OF_DAY = 12;
/**每周最多多课程数 */
const MAX_COURSES_OF_WEEK = DAYS_OF_WEEK * SECTIONS_OF_DAY;

/**将教务处返回的课表转换格式 */
export const covertJwCourse = (jwArr: IJWCourse[]): ICommonCourse[] => {
  const map = new Map<string, number>(),
    ansArr: ICommonCourse[] = [];
  for (const c of jwArr) {
    /**唯一的标识一门课 */
    const unique = c.jw_course_code + c.base_teacher_name+c.week_day;
    const index = map.get(unique);
    const time = `${c.section_start}-${c.section_end}`;
    if (index === undefined) {
      map.set(unique, ansArr.length);
      ansArr.push({
        code: c.jw_course_code,
        name: c.jw_course_name,
        teacher: c.base_teacher_name,
        place: [c.base_room_name],
        week: [c.week],
        section: [time],
        day: [c.week_day]
      });
    } else {
      const { place, week, section,day } = ansArr[index];
      place.push(c.base_room_name);
      week.push(c.week);
      section.push(time);
      day.push(c.week_day)
    }
  }
  return ansArr;
};

interface IParsedText {
  week: string;
  day: string;
  start: string;
  end: string;
}
/**将2周星期二1-4节转换为{week:2, day:2, start:1, end:4} */
export const parseTimeText = (t: string): IParsedText => {
  const numArr = t.match(/\d+/g),
    ans = { week: "", day: "", start: "", end: "" };
  if (numArr?.length === 3) {
    ans.week = numArr[0];
    ans.start = numArr[1];
    ans.end = numArr[2];
  } else {
    logger.err("解析实验课上课时间出错，输入为" + t);
  }
  const weekText = ["一", "二", "三", "四", "五", "六", "日"];
  for (let i = 0; i < weekText.length; i++) {
    if (t.includes(weekText[i])) {
      ans.day = String(i + 1);
    }
  }
  return ans;
};

/**转换抓取到的实验课表格式 */
export const covertLabCourse = (labArr: ILabCourse[]): ICommonCourse[] => {
  const map = new Map<string, number>(),
    ansArr: ICommonCourse[] = [];
  for (const c of labArr) {
    const parsedTime = parseTimeText(c.time);
    /**唯一的标识一门课 */
    const unique = c.name + c.teacher;
    const index = map.get(unique);
    const time = `${parsedTime.start}-${parsedTime.end}`;
    if (index === undefined) {
      map.set(unique, ansArr.length);
      ansArr.push({
        code: "",
        name: c.name,
        teacher: c.teacher,
        place: [c.place],
        week: [parsedTime.week],
        section: [time],
        tasks: [c.task],
        day: [parsedTime.day]
      });
    } else {
      const { place, week, section, tasks,day } = ansArr[index];
      place.push(c.place);
      week.push(parsedTime.week);
      section.push(time);
      tasks?.push(c.task);
      day.push(parsedTime.day)
    }
  }
  return ansArr;
};
