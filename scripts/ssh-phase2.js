const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'rm -rf indolelang',
  'git clone https://github.com/indorehberi/indolelang.git',
  `cat << 'EOF' > indolelang/.env
# Database PostgreSQL Credentials
DB_USER=postgres
DB_PASSWORD=production_db_secret_key_2026
DB_NAME=indolelang_prod

# Security Keys
JWT_SECRET=f7b494632a5a544c45b78b0db3a137b01d9f0f9b6b907409c2a6881c1c738be7
JWT_REFRESH_SECRET=a80c9e6c2d1b4a4f89d5f96e47b38b2d189f7f4c3a5b67109d9f5a7c2b3e8c9d

# Public URLs
CORS_ORIGIN=https://bidku.co.id
PUBLIC_API_URL=https://bidku.co.id/api/v1
PUBLIC_ADMIN_URL=https://bidku.co.id/admin
EOF`,
  'cd indolelang && cat .env',
  'rm -f scripts/ssh-runner.js scripts/ssh-phase2.js'
];

const conn = new Client();

conn.on('ready', () => {
  console.log('Client :: ready');
  
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('All commands executed successfully!');
      conn.end();
      return;
    }
    
    const cmd = commands[i];
    console.log(`\n============================`);
    console.log(`Executing: ${cmd.split('\n')[0]}...`);
    console.log(`============================\n`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Execution error:', err);
        conn.end();
        return;
      }
      
      stream.on('close', (code, signal) => {
        console.log(`\n[Process exited with code ${code}]`);
        if (code !== 0 && !cmd.startsWith('rm -rf indolelang')) {
          console.error(`Command failed: ${cmd}`);
          conn.end();
          process.exit(1);
        }
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
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect(sshConfig);
