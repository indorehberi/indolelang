const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const commands = [
  'cd indolelang && docker compose -f infrastructure/docker/docker-compose.prod.yml stop nginx',
  'docker run --rm -v "docker_certbot_etc:/etc/letsencrypt" -v "docker_certbot_var:/var/lib/letsencrypt" -p 80:80 certbot/certbot certonly --standalone -d bidku.co.id -d www.bidku.co.id --non-interactive --agree-tos -m indorehberi@gmail.com',
  'cd indolelang && docker compose -f infrastructure/docker/docker-compose.prod.yml start nginx',
  'rm -f scripts/ssh-certbot.js'
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
    console.log(`Executing: ${cmd}...`);
    console.log(`============================\n`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`\n[Process exited with code ${code}]`);
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
