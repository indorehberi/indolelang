const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'docker exec indolelang_landing_prod sh -c "grep -r \\"googleusercontent.com\\" /app/apps/landing-web/.next/server || echo \\"Not found\\""'
];

const conn = new Client();

conn.on('ready', () => {
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      conn.end();
      return;
    }
    const cmd = commands[i];
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        i++;
        executeNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  executeNext();
}).connect(sshConfig);
