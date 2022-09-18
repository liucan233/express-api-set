# 西科大一站式服务大厅登陆服务

## 主要API

获取http://cas.swust.edu.cn/authserver/login页面的验证码图片和验证码图片对应的cookie

获取http://cas.swust.edu.cn/authserver/login页面的已被识别的验证码和验证码对应的cookie

提交账号、密码、验证码和cookie进行登陆登陆，获得http://cas.swust.edu.cn/authserver/login页面的新cookie，此时用户已经登陆成功

提交新cookie、需要执行的操作枚举值和目标子系统url，返回对应操作结果，操作可能是获取ticket、返回页面数据等。


## 开发项目

使用`npm i`安装依赖，`npm run dev`即可。

## 部署项目

使用`npm i`安装依赖，`npm run build`构建，`pm2 start dist/index.js`即可。