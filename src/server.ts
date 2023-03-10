// import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import ApiRouter from "./routes/apiRoute";
import logger from "jet-logger";
import { HttpServerError } from "@shared/errors";
import envVars from "@shared/envVars";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser(envVars.cookieProps.secret));

if (envVars.nodeEnv === "development") {
  app.use(morgan("dev"));
}

if (envVars.nodeEnv === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
    })
  );
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  if (req.method == "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

app.use("/api", ApiRouter);

app.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    // 已经响应了一部分数据发生错误必须交给express终止响应
    next(err);
    return;
  }
  if(err instanceof Error){
    if(err instanceof HttpServerError){
      res.json({
        msg: err.message,
        data: null,
        code: err.code,
      });
    } else {
      res.json({
        msg: err.message,
        data: null,
        code: 500,
      });
    }
    return;
  }
  logger.err(err, true);
  res.json({
    msg: "服务端发生错误",
    data: null,
    code: 500
  });
});

const viewsDir = path.join(__dirname, "views");
app.set("views", viewsDir);

const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));

app.get("/loginCas", (_: Request, res: Response) => {
  res.sendFile("loginCas.html", { root: viewsDir });
});

app.get("/enteredCas", (_: Request, res: Response) => {
  res.sendFile("enteredCas.html", { root: viewsDir });
});

export default app;
