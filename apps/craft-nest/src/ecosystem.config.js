// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'craft-nest-api',
    script: 'dist/apps/craft-nest/src/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 443,
      HOST: 'jeffreysanford.us',
      KEY_PATH: '/etc/letsencrypt/live/jeffreysanford.us/privkey.pem',
      CERT_PATH: '/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem',
      error_file: '~/logs/craft-nest/error.log',
      out_file: '~/logs/craft-nest/out.log'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: 'localhost',
      KEY_PATH: 'apps/craft-nest/src/cert/server.key',
      CERT_PATH: 'apps/craft-nest/src/cert/server.crt',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log'
    },
    watch: false,
    max_memory_restart: '1G',
    merge_logs: true,
    time: true
  }]
};