const { spawn } = require("node:child_process");

// 启动生产环境服务器
spawn("node", ["-r", "module-alias/register", "./dist", "--env=production"], {
  stdio: "inherit",
});
