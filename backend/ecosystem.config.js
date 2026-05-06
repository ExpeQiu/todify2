module.exports = {
  apps: [{
    name: 'todify4',
    script: 'dist/index.js',
    cwd: '/Volumes/Lexar/git/03T/GeelyTPD2/todify4/backend',
    env: {
      PORT: 8113,
      NODE_ENV: 'development'
    }
  }]
};
