import { Product } from '@/domain/product/product';
import { Stock } from '@/domain/product/stock';
import { ProductEntity } from '@/infrastructure/database/entities/product.entity';

export const ProductMapper = {
  toDomain(entity: ProductEntity): Product {
    const stockResult = Stock.create(entity.stockUnits);
    if (!stockResult.ok) {
      throw new Error('Invalid stock units');
    }
    const productResult = Product.create({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      imageUrl: entity.imageUrl,
      priceAmount: entity.priceAmount,
      currency: entity.currency,
      stock: stockResult.value,
    });
    if (!productResult.ok) {
      throw new Error('Invalid product entity');
    }
    return productResult.value;
  },
};
