const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready...');
  
  // 1. Append API_URL to .env
  // 2. Restart API container
  // 3. Update existing records in PostgreSQL
  
  const cmd = `
    echo "" >> /root/indolelang/.env
    echo "API_URL=https://bidku.co.id/api" >> /root/indolelang/.env
    cd /root/indolelang/infrastructure/docker
    docker compose -f docker-compose.prod.yml restart api
    
    docker exec indolelang_postgres_prod psql -U postgres -d indolelang_prod -c "UPDATE kyc_documents SET ktp_url = REPLACE(ktp_url, 'http://localhost:8000', 'https://bidku.co.id/api');"
    docker exec indolelang_postgres_prod psql -U postgres -d indolelang_prod -c "UPDATE kyc_documents SET selfie_url = REPLACE(selfie_url, 'http://localhost:8000', 'https://bidku.co.id/api');"
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
