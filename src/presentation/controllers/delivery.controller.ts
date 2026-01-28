import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetDeliveryUseCase } from '@/application/use-cases/get-delivery.usecase';
import { UpdateDeliveryUseCase } from '@/application/use-cases/update-delivery.usecase';
import { UpdateDeliveryDto } from '@/presentation/dto/update-delivery.dto';
import { mapErrorToHttp } from '@/presentation/http/error-mapper';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveryController {
  constructor(
    private readonly getDelivery: GetDeliveryUseCase,
    private readonly updateDelivery: UpdateDeliveryUseCase,
  ) {}

  @Get(':id')
  @ApiOkResponse({ description: 'Get delivery by id' })
  async get(@Param('id') id: string) {
    const result = await this.getDelivery.execute(id);
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Update delivery while transaction pending' })
  async update(@Param('id') id: string, @Body() body: UpdateDeliveryDto) {
    const result = await this.updateDelivery.execute({
      transactionId: body.transactionId,
      deliveryId: id,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      country: body.country,
      postalCode: body.postalCode,
    });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }
}
