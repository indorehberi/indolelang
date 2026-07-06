const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'cd indolelang && git pull origin main',
  'cd indolelang && bash infrastructure/scripts/deploy.sh',
  'docker exec indolelang_api_prod npx prisma db push --accept-data-loss',
  'docker exec indolelang_api_prod npx ts-node scripts/seed-content.ts'
];

const conn = new Client();

conn.on('ready', () => {
  console.log('Client :: ready');
  
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('All commands executed successfully! Production updated.');
      conn.end();
      return;
    }
    
    const cmd = commands[i];
    console.log(`\n============================`);
    console.log(`Executing: ${cmd.split('\n')[0]}`);
    console.log(`============================\n`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Execution error:', err);
        conn.end();
        return;
      }
      
      stream.on('close', (code, signal) => {
        console.log(`\n[Process exited with code ${code}]`);
        if (code !== 0) {
          console.error(`Command failed: ${cmd}`);
          // We can continue even if one fails, or stop. We'll stop if deploy fails, but if seed fails it might be okay.
          if (i === 1) {
             conn.end();
             process.exit(1);
          }
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
