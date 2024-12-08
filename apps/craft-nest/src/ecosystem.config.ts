// ecosystem.config.ts

// Custom PM2 type definitions
interface EnvConfig {
  NODE_ENV: 'development' | 'production';
  PORT: number;
  HOST: string;
  KEY_PATH: string;
  CERT_PATH: string;
}

interface AppConfig {
  name: string;
  script: string;
  instances: number | 'max';
  exec_mode: 'cluster' | 'fork';
  env?: Partial<EnvConfig>;
  env_production?: EnvConfig;
  env_development?: EnvConfig;
  watch?: boolean | string[];
  max_memory_restart?: string;
  error_file?: string;
  out_file?: string;
  merge_logs?: boolean;
  time?: boolean;
}

interface EcosystemConfig {
  apps: AppConfig[];
}

const config: EcosystemConfig = {
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
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/craft-nest/error.log',
    out_file: '/var/log/craft-nest/out.log',
    merge_logs: true,
    time: true
  }]
};

export default config;