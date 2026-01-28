import { Stock } from './stock';

describe('Stock', () => {
  it('rejects negative units', () => {
    const result = Stock.create(-1);
    expect(result.ok).toBe(false);
  });

  it('decrements when enough units', () => {
    const stock = Stock.create(5);
    expect(stock.ok).toBe(true);
    const updated = stock.ok ? stock.value.decrement(3) : stock;
    expect(updated.ok).toBe(true);
    expect(updated.ok && updated.value.value).toBe(2);
  });

  it('rejects decrement when insufficient', () => {
    const stock = Stock.create(1);
    expect(stock.ok).toBe(true);
    const updated = stock.ok ? stock.value.decrement(2) : stock;
    expect(updated.ok).toBe(false);
  });
});
