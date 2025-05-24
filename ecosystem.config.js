const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  apps: [
    {
      name: 'craft-nest-api',
      script: isDevelopment ? 'npx nx serve craft-nest' : './dist/apps/craft-nest/main.js',
      instances: isDevelopment ? 1 : 'max',
      exec_mode: isDevelopment ? 'fork' : 'cluster',
      cwd: __dirname,
      interpreter: isDevelopment ? 'bash' : 'node',
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
        LOG_LEVEL: 'info',
      },
      error_file: './logs/craft-nest/error.log',
      out_file: './logs/craft-nest/out.log',
      merge_logs: true,
      time: true,
      max_memory_restart: '1G',
      watch: isDevelopment,
      // Development-specific options
      ignore_watch: isDevelopment ? ['node_modules', 'dist', 'logs', '*.log'] : undefined,
      watch_options: isDevelopment ? {
        followSymlinks: false,
        usePolling: false
      } : undefined,
      // Auto restart on file changes in development
      autorestart: true,
      // Enable source maps in development
      source_map_support: isDevelopment,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'craft-go-api',
      script: isDevelopment ? 'npx nx serve craft-go' : './dist/apps/craft-go/main.exe',
      exec_mode: 'fork',
      instances: 1,
      cwd: isDevelopment ? __dirname : './',
      interpreter: isDevelopment ? 'bash' : undefined,
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
      watch: isDevelopment,
      ignore_watch: isDevelopment ? ['node_modules', 'dist', 'logs', '*.log', '*.exe'] : undefined,
      autorestart: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    // Development-only: Angular frontend with live reload
    ...(isDevelopment ? [{
      name: 'craft-web-dev',
      script: 'npx nx serve craft-web',
      exec_mode: 'fork',
      instances: 1,
      cwd: __dirname,
      interpreter: 'bash',
      env: {
        NODE_ENV: 'development',
        PORT: 4200,
        HOST: 'localhost',
      },
      error_file: './logs/craft-web/error.log',
      out_file: './logs/craft-web/out.log',
      merge_logs: true,
      time: true,
      watch: false, // Angular has its own hot reload
      autorestart: false, // Let Angular handle restarts
      kill_timeout: 10000
    }] : [])
  ],
  
  // PM2 Deploy configuration for production
  deploy: {
    production: {
      user: 'deploy',
      host: 'jeffreysanford.us',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/craft-fusion.git',
      path: '/var/www/craft-fusion',
      'post-deploy': 'npm ci && npx nx build craft-nest --configuration=production && npx nx build craft-go && pm2 reload ecosystem.config.js --env production'
    }
  }
};
