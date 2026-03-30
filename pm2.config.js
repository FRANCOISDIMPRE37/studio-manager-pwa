module.exports = {
  apps: [{
    name: 'studio-manager',
    script: './dist/index.js',
    cwd: '/home/ubuntu/app',
    env: {
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: 'mysql://studiomanager:StudioOvh2026!@bo810531-001.eu.clouddb.ovh.net:35120/studiomanager?ssl={"rejectUnauthorized":false}',
      JWT_SECRET: '',
    }
  }]
}
