import { Delivery } from '../../../domain/delivery/delivery';
import { DeliveryEntity } from '../entities/delivery.entity';

export const DeliveryMapper = {
  toDomain(entity: DeliveryEntity): Delivery {
    const deliveryResult = Delivery.create({
      id: entity.id,
      addressLine1: entity.addressLine1,
      addressLine2: entity.addressLine2,
      city: entity.city,
      country: entity.country,
      postalCode: entity.postalCode,
    });
    if (!deliveryResult.ok) {
      throw new Error('Invalid delivery entity');
    }
    return deliveryResult.value;
  },
  toEntity(domain: Delivery): DeliveryEntity {
    const entity = new DeliveryEntity();
    entity.id = domain.id;
    entity.addressLine1 = domain.addressLine1;
    entity.addressLine2 = domain.addressLine2;
    entity.city = domain.city;
    entity.country = domain.country;
    entity.postalCode = domain.postalCode;
    return entity;
  },
};
