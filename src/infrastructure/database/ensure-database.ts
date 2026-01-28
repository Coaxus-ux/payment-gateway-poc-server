import { Client } from 'pg';

async function ensureDatabase() {
  const host = process.env.POSTGRES_HOST;
  const port = Number(process.env.POSTGRES_PORT ?? 5432);
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  await client.connect();
  const result = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [database],
  );
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${database}"`);
  }
  await client.end();
}

ensureDatabase().catch((error) => {
  console.error('Database bootstrap failed', error);
  process.exit(1);
});
