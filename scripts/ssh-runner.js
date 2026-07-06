const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'apt-get update',
  'DEBIAN_FRONTEND=noninteractive apt-get upgrade -y',
  'curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh',
  'usermod -aG docker root',
  'apt-get install -y git',
  'git --version',
  'docker --version'
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
    console.log(`Executing: ${cmd}`);
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
