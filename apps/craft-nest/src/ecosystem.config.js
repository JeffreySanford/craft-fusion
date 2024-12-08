// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'craft-nest-api',
    script: '/home/jeffrey/repos/craft-fushion/dist/apps/craft-nest/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 443,
      HOST: 'jeffreysanford.us',
      KEY_PATH: '/etc/letsencrypt/live/jeffreysanford.us/privkey.pem',
      CERT_PATH: '/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem'
    },
    error_file: '/home/jeffrey/logs/craft-nest/error.log',
    out_file: '/home/jeffrey/logs/craft-nest/out.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
