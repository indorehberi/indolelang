const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'sed -i \'s|CORS_ORIGIN=https://bidku.co.id|CORS_ORIGIN=https://bidku.co.id,https://www.bidku.co.id|g\' /root/indolelang/.env',
  'docker restart indolelang_api_prod'
];

const conn = new Client();

conn.on('ready', () => {
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('CORS update and API restart completed.');
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
