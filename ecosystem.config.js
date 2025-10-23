module.exports = {
  apps: [
    {
      name: 'mipc-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/app-error.log',
      out_file: 'logs/app-out.log',
      time: true,
    },
  ],
};
