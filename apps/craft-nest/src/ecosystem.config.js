// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'craft-nest',
    script: 'dist/apps/craft-nest/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 443,
      HOST: 'jeffreysanford.us',
      KEY_PATH: '/etc/letsencrypt/live/jeffreysanford.us/privkey.pem',
      CERT_PATH: '/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: 'localhost',
      KEY_PATH: './apps/craft-nest/src/cert/server.key',
      CERT_PATH: './apps/craft-nest/src/cert/server.crt'
    },
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/craft-nest/error.log',
    out_file: '/var/log/craft-nest/out.log',
    merge_logs: true,
    time: true
  }]
};