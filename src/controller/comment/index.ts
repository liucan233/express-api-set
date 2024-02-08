import { Router } from 'express';
import { prismaClient } from '../../libraries/prisma';
import { ErrCode } from '../../constant/errorCode';
import { jwtMiddleware } from '../../libraries/jwt';
import { catchError } from 'src/middleware/catchError';

export const commentRouter: Router = Router();

interface INewCommentBody {
  externalId: string;
  content: string;
  desc?: string;
}
commentRouter.post<string, any, any, INewCommentBody>('/newComment', jwtMiddleware, async (req, res, next) => {
  const { externalId, content, desc } = req.body;
  if (!externalId || !content) {
    res.json({
      code: ErrCode.BadReqParamErr,
      msg: 'body必须包含externalId和content',
    });
  }
  try {
    const { id: userId } = res.locals.userInfo;
    let findRes = await prismaClient.commentSource.findFirst({
      where: {
        externalId,
      },
    });
    if (!findRes) {
      findRes = await prismaClient.commentSource.create({
        data: {
          desc,
          externalId,
          userId,
        },
      });
    }
    const newComment = await prismaClient.comment.create({
      data: {
        sourceId: findRes.id,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            id: true,
          },
        },
      },
    });
    res.json({
      code: ErrCode.NoError,
      data: newComment,
    });
  } catch (err) {
    next(err);
  }
});

interface IGetListQuery {
  externalId: string;
  pageSize: string;
  lastCommentId?: string;
}

commentRouter.get<string, any, any, null, IGetListQuery>(
  '/list',
  catchError(async (req, res, next) => {
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
        avatar: true,
      },
    };
    const commentArrCursor =
      lastCommentIdNum == -1
        ? undefined
        : {
            id: lastCommentIdNum,
          };
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    res.json({
      msg: '',
      code: 0,
      data: findRes || { commentArr: [] },
    });
  }),
);

interface IReplyCommentReq {
  content: string;
  replyCommentId: number;
  replyUserId?: number;
}
commentRouter.post<string, any, any, IReplyCommentReq>('/replyComment', jwtMiddleware, async (req, res, next) => {
  const { content, replyCommentId, replyUserId } = req.body;
  const queryUser = {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  };
  try {
    const { id: userId } = res.locals.userInfo;
    const newComment = await prismaClient.commentReply.create({
      data: {
        sourceId: replyCommentId,
        userId: userId,
        content: content,
        replyUserId,
      },
      include: {
        reply: queryUser,
        user: queryUser,
      },
    });
    res.json({
      code: ErrCode.NoError,
      data: newComment,
    });
  } catch (err) {
    next(err);
  }
});
