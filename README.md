# API 服务

## 简介

空闲时间写的 api 接口，全部放这个仓库了。

## 主要 API

参见https://www.apifox.cn/apidoc/shared-a5193ab2-870b-454a-8dc2-683f95680172

## 开发项目

先修改 prisma 和 env 目录的环境变量，然后使用`pnpm i`安装依赖，再执行`npx prisma generate`生成数据库类型定义，最后`pnpm start`即可。

## 部署项目

需要先同步数据库变更，然后安装依赖，执行`npm run build:x`，然后再运行产物目录的`app.js`，例如`node dist/app.js`。
