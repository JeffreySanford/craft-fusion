module.exports = {
  apps: [
    {
      name: "craft-nest-api-dev",
      script: "./dist/apps/craft-nest/src/main.js",
      instances: 1,
      exec_mode: "fork",
      cwd: __dirname,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        HOST: "localhost",
        LOG_LEVEL: "debug",
      },
      // Use local log files for Windows development
      error_file: "./logs/craft-nest/error.log",
      out_file: "./logs/craft-nest/out.log",
      merge_logs: true,
      time: true,
      max_memory_restart: "1024M",
      autorestart: true,
      min_uptime: "5s",
      max_restarts: 5,
      restart_delay: 2000,
    },
    {
      name: "craft-go-api-dev", 
      script: "./dist/apps/craft-go/main.exe", // Windows executable
      exec_mode: "fork",
      instances: 1,
      cwd: __dirname,
      env: {
        NODE_ENV: "development",
        PORT: 4000,
        HOST: "localhost",
        LOG_LEVEL: "debug",
      },
      // Use local log files for Windows development
      error_file: "./logs/craft-go/error.log",
      out_file: "./logs/craft-go/out.log",
      merge_logs: true,
      time: true,
      max_memory_restart: "100M",
      autorestart: true,
      min_uptime: "5s",
      max_restarts: 5,
      restart_delay: 2000,
    },
  ],
};