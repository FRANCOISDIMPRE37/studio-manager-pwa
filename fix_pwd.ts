import mysql from 'mysql2/promise';

async function reset() {
  const hash = '$2b$10$hH.g4pfjri.tlUUoX4iIPuP8aSKE/2AIZdtuRWzw3yLeXzQLLhDo.';
  
  const conn = await mysql.createConnection({
    host: 'bo810531-001.eu.clouddb.ovh.net',
    port: 35120,
    user: 'studiomanager',
    password: 'Studio2026',
    database: 'studiomanager'
  });
  
  await conn.execute('UPDATE users SET passwordHash = ? WHERE id = 1', [hash]);
  console.log('✅ Hash réel mis à jour !');
  await conn.end();
  process.exit(0);
}
reset();
