import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PAYMENT_PROVIDER } from '@/application/tokens';
import { initialProducts } from '@/infrastructure/database/seeds/product.seed';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';
import { TestDataSource } from './test-data-source';

describe('Checkout flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.POSTGRES_HOST = 'localhost';
    process.env.POSTGRES_PORT = '5433';
    process.env.POSTGRES_USER = 'postgres';
    process.env.POSTGRES_PASSWORD = 'postgres';
    process.env.POSTGRES_DB = 'checkout_test';
    process.env.PAYMENT_BASE_URL = 'https://sandbox.payment.co';
    process.env.PAYMENT_PUBLIC_KEY = 'test';
    process.env.PAYMENT_PRIVATE_KEY = 'test';

    await TestDataSource.initialize();
    await TestDataSource.runMigrations();
    const repo = TestDataSource.getRepository(ProductEntity);
    await repo.insert(initialProducts);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PAYMENT_PROVIDER)
      .useValue({
        charge: async () => ({ status: 'SUCCESS', providerRef: 'mock-ref' }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (TestDataSource.isInitialized) {
      await TestDataSource.dropDatabase();
      await TestDataSource.destroy();
    }
  });

  it('creates and pays a transaction', async () => {
    const productsRes = await request(app.getHttpServer()).get('/products');
    expect(productsRes.status).toBe(200);
    const product = productsRes.body[0];

    const createRes = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: product.id,
        amount: product.priceAmount,
        currency: product.currency,
        customer: { email: 'user@example.com', fullName: 'User Example' },
        delivery: {
          addressLine1: 'Main St 123',
          city: 'Bogota',
          country: 'CO',
        },
      });

    expect(createRes.status).toBe(201);
    const transaction = createRes.body;

    const payRes = await request(app.getHttpServer())
      .post(`/transactions/${transaction.id}/pay`)
      .send({
        cardNumber: '4242424242424242',
        expMonth: 12,
        expYear: 2030,
        cvc: '123',
      });

    expect(payRes.status).toBe(200);
    expect(payRes.body.status).toBe('SUCCESS');
  });
});
