import mysql from 'mysql2/promise';

async function reset() {
  // Hash pré-calculé pour "Dimpre2026"
  const hash = '$2b$10$vYpEHs5fZ0J9K8X7Y6W5qOYZ8X7Y6W5qOYZ8X7Y6W5qOYZ8X7Y6W5u';
  
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
