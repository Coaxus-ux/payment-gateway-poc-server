import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function runMigrations() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}

runMigrations().catch((error) => {
  console.error('Migration runner failed', error);
  process.exit(1);
});
