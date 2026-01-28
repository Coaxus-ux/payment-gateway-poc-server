import { Inject, Injectable } from '@nestjs/common';
import { Product } from '@/domain/product/product';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { ProductRepository } from '@/application/ports/product-repository';
import { PRODUCT_REPOSITORY } from '@/application/tokens';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<Result<Product[], ApplicationError>> {
    const products = await this.productRepository.findAll();
    return Result.ok(products);
  }
}
