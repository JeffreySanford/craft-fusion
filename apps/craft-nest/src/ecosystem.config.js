// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'craft-nest-api',
    script: 'dist/apps/craft-nest/src/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    cwd: '/home/jeffrey/repos/craft-fusion',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: 'localhost',
    },
    error_file: '/home/jeffrey/logs/craft-nest/error.log',
    out_file: '/home/jeffrey/logs/craft-nest/out.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
