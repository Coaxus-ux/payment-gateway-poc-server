import { Delivery } from '@/domain/delivery/delivery';

export interface DeliveryRepository {
  findById(id: string): Promise<Delivery | null>;
  create(delivery: Delivery): Promise<Delivery>;
  update(delivery: Delivery): Promise<Delivery>;
}
