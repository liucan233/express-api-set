// import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import express, { Request, Response, NextFunction } from "express";

import "express-async-errors";

import BaseRouter from "./routes/entryRoute";
import logger from "jet-logger";
import { RequestError } from "@shared/errors";
import envVars from "@shared/envVars";

// **** Init express **** //

const app = express();

// **** Set basic express settings **** //

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser(envVars.cookieProps.secret));

// **** Show routes called in console during development **** //
if (envVars.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// **** Security settings **** //
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

// **** CORS settings **** //
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

// **** Add API routes **** //
app.use("/api", BaseRouter);

// **** Error handling **** //
app.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
  logger.err(err);
  if (res.headersSent) {
    // 已经响应了一部分数据发生错误必须交给express终止响应
    next(err);
  }
  return res.json({
    msg: err instanceof Error ? err.message : "服务端发生错误",
    data: null,
    code: err instanceof RequestError ? err.code : 500,
  });
});

// **** Serve front-end content **** //

// Set views directory (html)
const viewsDir = path.join(__dirname, "views");
app.set("views", viewsDir);

// Set static directory (js and css).
const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));

// Nav to login pg by default
app.get("/", (_: Request, res: Response) => {
  res.sendFile("login.html", { root: viewsDir });
});

// Redirect to login if not logged in.
app.get("/users", (req: Request, res: Response) => {
  const jwt = req.signedCookies[envVars.cookieProps.key];
  if (!jwt) {
    res.redirect("/");
  } else {
    res.sendFile("users.html", { root: viewsDir });
  }
});

app.get("/loginCas", (_: Request, res: Response) => {
  res.sendFile("loginCas.html", { root: viewsDir });
});

app.get("/enteredCas", (_: Request, res: Response) => {
  res.sendFile("enteredCas.html", { root: viewsDir });
});

// **** Export default **** //

export default app;
