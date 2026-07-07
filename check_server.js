const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready, attempting git pull and rebuild landing...');
  conn.exec('cd /root/indolelang && git pull origin main && cd infrastructure/docker && docker compose --env-file ../../.env -f docker-compose.prod.yml build --no-cache landing && docker compose --env-file ../../.env -f docker-compose.prod.yml up -d', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
       conn.end();
    }).on('data', (data) => {
      console.log('BUILD OUT: \n' + data);
    }).stderr.on('data', (d) => console.log('BUILD ERR: ' + d));
  });
}).connect({
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
});
