import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/product/product';
import { Result } from '../../shared/result';
import { ProductRepository } from '../ports/product-repository';
import { PRODUCT_REPOSITORY } from '../tokens';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute() {
    const products = await this.productRepository.findAll();
    return Result.ok<Product[]>(products);
  }
}
