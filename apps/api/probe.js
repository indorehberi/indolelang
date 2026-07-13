const { Client } = require('pg');

async function findData() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: 'postgrespassword', // default from docker-compose
    port: 5432,
  });
  
  await client.connect();
  
  const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
  const dbs = res.rows.map(r => r.datname);
  console.log('Databases:', dbs);
  
  for (const db of dbs) {
    if (db === 'postgres') continue;
    try {
      const dbClient = new Client({
        user: 'postgres',
        host: 'localhost',
        password: 'postgrespassword',
        database: db,
        port: 5432,
      });
      await dbClient.connect();
      const result = await dbClient.query('SELECT count(*) FROM lots');
      console.log(`Database ${db} has ${result.rows[0].count} lots.`);
      await dbClient.end();
    } catch (e) {
      // ignore
    }
  }
  
  await client.end();
}

findData().catch(console.error);
