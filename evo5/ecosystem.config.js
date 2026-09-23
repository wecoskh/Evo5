module.exports = {
  apps: [
    {
      name: 'evo5-api',
      script: 'src/index.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        API_HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        API_HOST: '0.0.0.0',
      },
      error_file: '/var/log/evo5/api-error.log',
      out_file: '/var/log/evo5/api-out.log',
      log_file: '/var/log/evo5/api-combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};