module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: './dist/apps/craft-nest/main.js', // Corrected path
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: 'jeffreysanford.us',
        LOG_LEVEL: 'debug',
      },
      error_file: './logs/craft-nest/error.log',
      out_file: './logs/craft-nest/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      watch: process.env.NODE_ENV === 'development'
    },
    {
      name: 'craft-go-api',
      script: './dist/apps/craft-go/main.exe', // Ensure this path is correct for Windows
      exec_mode: 'fork', // Use fork mode for Go binary
      instances: 1, // No clustering for Go binary
      cwd: './',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
        HOST: 'localhost',
        LOG_LEVEL: 'debug',
      },
      env_production: {
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
      watch: process.env.NODE_ENV === 'development'
    }
  ]
};
