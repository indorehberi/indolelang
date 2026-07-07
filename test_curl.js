const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    docker exec indolelang_api_prod wget -qO- http://localhost:8000/api/uploads/kyc/a6a32411-33c2-4d0c-8ab5-576fc27709aa.jpeg > /dev/null && echo "200 OK /api/uploads" || echo "Failed /api/uploads"
    docker exec indolelang_api_prod wget -qO- http://localhost:8000/uploads/kyc/a6a32411-33c2-4d0c-8ab5-576fc27709aa.jpeg > /dev/null && echo "200 OK /uploads" || echo "Failed /uploads"
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
