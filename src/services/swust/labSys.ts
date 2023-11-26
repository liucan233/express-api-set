import { Router } from 'express';
import { logError } from '../../logger';
import { LabSysCrawler } from '../../classes/LabSys';

export default 1;

export const labSysRouter: Router = Router();

labSysRouter.post('/allCourse', async (req, res) => {
  const crawler = new LabSysCrawler();
  crawler.cookie = req.body.cookie || 'foo=1';
  try {
    await crawler.loadLabCoursePage();
    const arr = await crawler.parseLabCourse();
    res.json({
      code: crawler.errorCode,
      msg: '',
      data: arr,
    });
  } catch (error) {
    logError(error);
    res.json({
      code: crawler.errorCode,
      msg: crawler.errorMsg,
    });
  }
});
