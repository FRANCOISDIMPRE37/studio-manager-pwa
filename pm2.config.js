module.exports = {
  apps: [{
    name: 'studio-manager',
    script: './dist/index.js',
    cwd: '/home/ubuntu/app',
    env: {
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: 'mysql://76m7R2Y4nhmPHZW.578c789cda17:MplL6ta4fiyP60aQ0Cg7@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/kHAXDDN9mqMmBLtorFtFyT?ssl={rejectUnauthorized:true}',
      JWT_SECRET: '',
    }
  }]
}
