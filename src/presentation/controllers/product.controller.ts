import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetProductUseCase } from '../../application/use-cases/get-product.usecase';
import { ListProductsUseCase } from '../../application/use-cases/list-products.usecase';
import { mapErrorToHttp } from '../http/error-mapper';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'List products' })
  async list() {
    const result = await this.listProducts.execute();
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get product by id' })
  async get(@Param('id') id: string) {
    const result = await this.getProduct.execute(id);
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }
}
