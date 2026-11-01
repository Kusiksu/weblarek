import type { IProduct, IProductCatalog } from '../../types';

export class ProductCatalog implements IProductCatalog {
  private items: IProduct[] = [];
  private selected: IProduct | null = null;

  setItems(items: IProduct[]): void {
    this.items = [...items];

    if (this.selected) {
      this.selected = this.getItem(this.selected.id) ?? null;
    }
  }

  getItems(): IProduct[] {
    return [...this.items];
  }

  getItem(id: IProduct['id']): IProduct | undefined {
    return this.items.find((product) => product.id === id);
  }

  setSelected(product: IProduct | null): void {
    this.selected = product;
  }

  getSelected(): IProduct | null {
    return this.selected;
  }
}
