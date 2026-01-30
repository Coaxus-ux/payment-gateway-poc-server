import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetCustomerUseCase } from '@/application/use-cases/get-customer.usecase';
import { GetCustomerProfileUseCase } from '@/application/use-cases/get-customer-profile.usecase';
import { mapErrorToHttp } from '@/presentation/http/error-mapper';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly getCustomer: GetCustomerUseCase,
    private readonly getCustomerProfile: GetCustomerProfileUseCase,
  ) {}

  @Get(':id')
  @ApiOkResponse({ description: 'Get customer by id' })
  async getById(@Param('id') id: string) {
    const result = await this.getCustomer.execute({ id });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Get()
  @ApiOkResponse({ description: 'Get customer by email' })
  async getByEmail(@Query('email') email?: string) {
    const result = await this.getCustomer.execute({ email });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Get('lookup')
  @ApiOkResponse({ description: 'Get customer profile by email' })
  async lookup(@Query('email') email?: string) {
    const result = await this.getCustomerProfile.execute({ email });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }
}
