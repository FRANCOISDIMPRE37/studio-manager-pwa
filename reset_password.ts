import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function reset() {
  const hash = await bcrypt.hash('Dimpre2026', 10);
  console.log('Hash:', hash);
  
  const conn = await mysql.createConnection({
    host: 'bo810531-001.eu.clouddb.ovh.net',
    port: 35120,
    user: 'studiomanager',
    password: 'Studio2026',
    database: 'studiomanager'
  });
  
  await conn.execute('UPDATE users SET passwordHash = ? WHERE id = 1', [hash]);
  console.log('✅ Mot de passe mis à jour pour user id=1');
  
  await conn.end();
  process.exit(0);
}

reset();
