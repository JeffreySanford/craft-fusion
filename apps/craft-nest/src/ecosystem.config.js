// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'craft-nest-api',
    script: 'dist/apps/craft-nest/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    cwd: '/home/jeffrey/repos/craft-fushion',
    env: {  // Changed from env_production
      NODE_ENV: 'production',
      PORT: 3000,  // Force port 3000
      HOST: 'localhost',  // Use localhost since nginx handles external
    },
    error_file: '/home/jeffrey/logs/craft-nest/error.log',
    out_file: '/home/jeffrey/logs/craft-nest/out.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
