import type { ICart, IProduct } from '../../types';

export class Cart implements ICart {
  private items: IProduct[] = [];

  getItems(): IProduct[] {
    return [...this.items];
  }

  addItem(product: IProduct): void {
    if (product.price === null || this.hasItem(product.id)) return;

    this.items.push(product);
  }

  removeItem(product: IProduct): void {
    this.items = this.items.filter(
      (item) => item.id !== product.id,
    );
  }

  clear(): void {
    this.items = [];
  }

  getTotal(): number {
    return this.items.reduce(
      (total, product) => total + (product.price ?? 0),
      0,
    );
  }

  getCount(): number {
    return this.items.length;
  }

  hasItem(id: IProduct['id']): boolean {
    return this.items.some((product) => product.id === id);
  }
}
