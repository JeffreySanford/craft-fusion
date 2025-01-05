// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: 'dist/apps/craft-nest/src/main.js',
      instances: 1,  // Set to a single instance
      exec_mode: 'fork',  // Use fork mode for a single instance
      cwd: 'C:/repos/craft-fusion',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: 'localhost',
      },
      error_file: 'C:/repos/craft-fusion/logs/craft-nest/error.log',
      out_file: 'C:/repos/craft-fusion/logs/craft-nest/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      watch: false,
      windowsHide: true
    },
    {
      name: 'craft-go-api',
      script: 'apps/craft-go/dist/apps/craft-go/main',
      instances: 1,
      exec_mode: 'fork',
      cwd: 'C:/repos/craft-fusion',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: 'localhost',
      },
      error_file: 'C:/repos/craft-fusion/logs/craft-go/error.log',
      out_file: 'C:/repos/craft-fusion/logs/craft-go/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      watch: false,
      windowsHide: true
    }
  ]
};
