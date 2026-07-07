const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'cd /root/indolelang && docker compose --env-file .env -f infrastructure/docker/docker-compose.prod.yml up -d api'
];

const conn = new Client();

conn.on('ready', () => {
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('Docker compose up completed.');
      conn.end();
      return;
    }
    console.log(`Executing: ${commands[i]}`);
    conn.exec(commands[i], (err, stream) => {
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
