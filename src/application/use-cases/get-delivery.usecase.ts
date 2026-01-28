import { Inject, Injectable } from '@nestjs/common';
import { Delivery } from '@/domain/delivery/delivery';
import { Result } from '@/shared/result';
import { ApplicationError } from '@/application/errors';
import { DeliveryRepository } from '@/application/ports/delivery-repository';
import { DELIVERY_REPOSITORY } from '@/application/tokens';

@Injectable()
export class GetDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepository,
  ) {}

  async execute(id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      return Result.err<ApplicationError>({ type: 'DELIVERY_NOT_FOUND' });
    }
    return Result.ok<Delivery>(delivery);
  }
}
