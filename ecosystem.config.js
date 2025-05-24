module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: './dist/apps/craft-nest/src/main.js',  // FIXED: Correct path to compiled JS
      instances: 1,
      exec_mode: 'fork',
      cwd: __dirname,
      node_args: '--max-old-space-size=200',  // Memory optimization for 2GB VPS
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',  // FIXED: Bind to all interfaces for server access
        LOG_LEVEL: 'info',
      },
      error_file: './logs/craft-nest/error.log',
      out_file: './logs/craft-nest/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '150M',  // FIXED: Appropriate limit for 2GB VPS
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'craft-go-api',
      script: './dist/apps/craft-go/main',
      exec_mode: 'fork',
      instances: 1,
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0',  // FIXED: Bind to all interfaces for server access
        LOG_LEVEL: 'info',
      },
      error_file: './logs/craft-go/error.log',
      out_file: './logs/craft-go/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '100M',  // FIXED: Appropriate limit for 2GB VPS
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
