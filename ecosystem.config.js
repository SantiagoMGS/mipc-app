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
      // Configuración de auto-restart mejorada
      max_memory_restart: '500M',     // Reiniciar si usa más de 500MB
      restart_delay: 4000,            // Esperar 4 segundos entre reinicios
      max_restarts: 10,               // Máximo 10 reinicios en ventana
      min_uptime: '10s',              // Considerar estable después de 10s
      watch: false,                   // No vigilar cambios en producción
      autorestart: true,              // Auto reiniciar si crashea
      exp_backoff_restart_delay: 100, // Incrementar delay exponencialmente
    },
  ],
};
