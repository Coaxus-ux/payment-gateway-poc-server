import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { ProductEntity } from './entities/product.entity';
import { initialProducts } from './seeds/product.seed';

async function runSeeds() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ProductEntity);
  const count = await repo.count();
  if (count === 0) {
    await repo.insert(initialProducts);
  }
  await AppDataSource.destroy();
}

runSeeds().catch((error) => {
  console.error('Seed runner failed', error);
  process.exit(1);
});
