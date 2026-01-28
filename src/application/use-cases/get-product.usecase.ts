import { Inject, Injectable } from '@nestjs/common';
import { Product } from '@/domain/product/product';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { ProductRepository } from '@/application/ports/product-repository';
import { PRODUCT_REPOSITORY } from '@/application/tokens';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return Result.err<ApplicationError>({ type: 'PRODUCT_NOT_FOUND' });
    }
    return Result.ok<Product>(product);
  }
}
