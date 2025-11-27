
const { testConnection, closePool } = require('../db/db_APIconnection');

async function main() {
  console.log('=== Datenbankverbindungstest ===\n');
  
  // Verbindungsparameter anzeigen (ohne Passwort)
  console.log('Verbindungsparameter:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  Port:', process.env.DB_PORT);
  console.log('  Datenbank:', process.env.DB_NAME);
  console.log('  Benutzer:', process.env.DB_USER);
  console.log('  Passwort: ********');
  console.log('');
  
  // Verbindung testen
  const connected = await testConnection();
  
  // Verbindungen schließen
  await closePool();
  
  process.exit(connected ? 0 : 1);
}

main().catch(error => {
  console.error('Fehler:', error);
  process.exit(1);
});
