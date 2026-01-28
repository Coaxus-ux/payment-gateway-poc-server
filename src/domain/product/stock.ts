import { Result } from '@/shared/result';

export class Stock {
  private constructor(private readonly units: number) {}

  static create(units: number) {
    if (!Number.isInteger(units) || units < 0) {
      return Result.err('STOCK_INVALID');
    }
    return Result.ok(new Stock(units));
  }

  get value() {
    return this.units;
  }

  canDecrement(by: number) {
    return Number.isInteger(by) && by > 0 && this.units >= by;
  }

  decrement(by: number) {
    if (!this.canDecrement(by)) {
      return Result.err('STOCK_INSUFFICIENT');
    }
    return Result.ok(new Stock(this.units - by));
  }
}
