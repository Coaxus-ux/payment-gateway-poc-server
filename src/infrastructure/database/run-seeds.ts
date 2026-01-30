import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { ProductEntity } from './entities/product.entity';
import { initialProducts } from './seeds/product.seed';
import { AdminUserEntity } from './entities/admin-user.entity';

async function runSeeds() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ProductEntity);
  const count = await repo.count();
  if (count === 0) {
    await repo.insert(initialProducts);
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME ?? 'Admin';
  if (adminEmail) {
    const adminRepo = AppDataSource.getRepository(AdminUserEntity);
    const existing = await adminRepo.findOne({ where: { email: adminEmail } });
    if (!existing) {
      await adminRepo.insert({ email: adminEmail, fullName: adminName, role: 'ADMIN' });
    }
  }
  await AppDataSource.destroy();
}

runSeeds().catch((error) => {
  console.error('Seed runner failed', error);
  process.exit(1);
});
