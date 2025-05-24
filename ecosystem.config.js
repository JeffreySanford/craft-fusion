module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: './dist/apps/craft-nest/main.js',
      instances: 1,              // Simplified: single instance instead of cluster
      exec_mode: 'fork',         // Use fork mode for simplicity
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: 'jeffreysanford.us',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/craft-nest/error.log',
      out_file: './logs/craft-nest/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      min_uptime: '10s',         // Prevent rapid restarts
      max_restarts: 10,          // Limit restart attempts
      restart_delay: 4000        // Delay between restarts
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
        HOST: 'jeffreysanford.us',
        LOG_LEVEL: 'info',
      },
      error_file: './logs/craft-go/error.log',
      out_file: './logs/craft-go/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
