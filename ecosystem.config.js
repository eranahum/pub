module.exports = {
  apps: [{
    name: 'pub-tubal',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3005,
      USE_HTTPS: 'true',        // ← Add this
      HTTPS_PORT: 3443          // ← Add this (or use 3005 if you prefer)
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
