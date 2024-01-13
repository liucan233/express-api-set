import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';

export const commentRouter: Router = Router();

commentRouter.post('/newComment', async (req, res, next) => {
  const { body } = req;
  try {
    const { id } = res.locals.userInfo;
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
          userId: id,
        },
      });
    }
    const newComment = await prismaClient.comment.create({
      data: {
        sourceId: findRes.id,
        userId: id,
        content: body.content,
      },
    });
    res.json(newComment);
  } catch (err) {
    next(err);
  }
});

interface IGetListQuery {
  externalId: string;
  pageSize: string;
  lastCommentId?: string;
}

commentRouter.get<'/list', any, any, null, IGetListQuery>('/list', async (req, res, next) => {
  const { externalId, pageSize, lastCommentId } = req.query;
  // 处理分页大小
  let pageSizeNum = Number(pageSize);
  if (!pageSizeNum) {
    pageSizeNum = 20;
  }
  // 处理游标
  let lastCommentIdNum = Number(lastCommentId);
  if (Number.isNaN(lastCommentIdNum)) {
    lastCommentIdNum = -1;
  }
  const queryUser = {
    select: {
      id: true,
      name: true,
    },
  };
  const commentArrCursor =
    lastCommentIdNum == -1
      ? undefined
      : {
          id: lastCommentIdNum,
        };
  try {
    const findRes = await prismaClient.commentSource.findFirst({
      where: {
        externalId,
      },
      include: {
        commentArr: {
          include: {
            replyArr: {
              include: {
                user: queryUser,
                reply: queryUser,
              },
            },
            user: queryUser,
          },
          take: pageSizeNum,
          skip: commentArrCursor ? 1 : undefined,
          cursor: commentArrCursor,
        },
      },
    });
    res.json({
      msg: '',
      code: 0,
      data: findRes || [],
    });
  } catch (err) {
    next(err);
  }
});

interface IReplyCommentReq {
  content: string;
  replyCommentId: number;
  replyUserId?: number;
}
commentRouter.post<string, any, any, IReplyCommentReq>('/replyComment', async (req, res, next) => {
  const { content, replyCommentId, replyUserId } = req.body;
  try {
    const { id: userId } = res.locals.userInfo;
    const newComment = await prismaClient.commentReply.create({
      data: {
        sourceId: replyCommentId,
        userId: userId,
        content: content,
        replyUserId,
      },
    });
    res.json(newComment);
  } catch (err) {
    next(err);
  }
});
