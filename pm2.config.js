module.exports = {
  apps: [{
    name: 'studio-manager',
    script: './dist/index.js',
    cwd: '/home/ubuntu/app',
    env: {
      NODE_ENV: 'production',
      PORT: '8080',
    }
  }]
}
