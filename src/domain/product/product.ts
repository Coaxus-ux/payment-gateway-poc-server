import { Result } from '@/shared/result';
import { Stock } from './stock';

export type ProductSnapshot = {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  priceAmount: number;
  currency: string;
};

export class Product {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | null,
    readonly imageUrls: string[],
    readonly priceAmount: number,
    readonly currency: string,
    readonly stock: Stock,
  ) {}

  static create(props: {
    id: string;
    name: string;
    description?: string | null;
    imageUrls?: string[];
    priceAmount: number;
    currency: string;
    stock: Stock;
  }) {
    if (!props.id || !props.name) {
      return Result.err('PRODUCT_INVALID');
    }
    if (!Number.isInteger(props.priceAmount) || props.priceAmount <= 0) {
      return Result.err('PRODUCT_PRICE_INVALID');
    }
    return Result.ok(
      new Product(
        props.id,
        props.name,
        props.description ?? null,
        props.imageUrls ?? [],
        props.priceAmount,
        props.currency,
        props.stock,
      ),
    );
  }

  snapshot(): ProductSnapshot {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrls: this.imageUrls,
      priceAmount: this.priceAmount,
      currency: this.currency,
    };
  }
}
