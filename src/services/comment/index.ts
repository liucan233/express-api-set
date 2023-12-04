import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';
import { logger } from '../../logger';

export const commentRouter: Router = Router();

commentRouter.post('/new', async (req, res) => {
  const { body } = req;
  let findRes = await prismaClient.commentSource.findFirst({
    where: {
      externalId: body.id,
    },
  });
  if (!findRes) {
    findRes = await prismaClient.commentSource.create({
      data: {
        desc: 'express_created',
        externalId: body.id,
        userId: 1
      },
    });
  }
  const newComment = await prismaClient.comment.create({
    data: {
      sourceId: findRes.id,
      userId: 1,
      content: body.content,
    },
  });
  res.json(newComment);
});

commentRouter.get('/list', async (req, res) => {
  const findRes = await prismaClient.commentSource.findFirst({
    where: {
      externalId: req.query.id as string,
    },
    include: {
      commentArr: {
        include: {
          replyArr: {
            take: 5
          }
        }
      },
    },
  });
  // if(!findRes){
  res.json({
    msg: '',
    code: 0,
    data: findRes || [],
  });
  //   return;
  // }
});
