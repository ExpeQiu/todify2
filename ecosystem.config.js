module.exports = {
  apps: [{
    name: 'todify4',
    script: 'dist/index.js',
    cwd: '/Volumes/Lexar/git/03T/GeelyTPD2/todify4/backend',
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8113,
      DB_TYPE: 'sqlite',
      SQLITE_DB_PATH: './data/todify4.db'
    },
    instances: 1,
    autorestart: false,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/tmp/todify4-error.log',
    out_file: '/tmp/todify4-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    kill_timeout: 60000,
    listen_timeout: 1800000
  }]
};
