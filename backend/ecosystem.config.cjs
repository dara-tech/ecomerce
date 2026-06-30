module.exports = {
  apps: [
    {
      name: 'ecomerce-api',
      script: 'server.js',
      cwd: '/var/www/ecomerce/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
