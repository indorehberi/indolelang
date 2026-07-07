const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "" >> /root/indolelang/.env
    echo "CORS_ORIGIN=https://bidku.co.id,http://localhost:3000,http://localhost:3001" >> /root/indolelang/.env
    cd /root/indolelang/infrastructure/docker
    docker compose -f docker-compose.prod.yml up -d api
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
       conn.end();
    }).on('data', (data) => {
      console.log('OUT: \n' + data);
    }).stderr.on('data', (d) => console.log('ERR: ' + d));
  });
}).connect({
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
});
