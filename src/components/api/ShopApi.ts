import type {
  IApi,
  IShopApi,
  OrderRequest,
  OrderResponse,
  ProductListResponse,
} from '../../types';

export class ShopApi implements IShopApi {
  private readonly api: IApi;

  constructor(api: IApi) {
    this.api = api;
  }

  getProducts(): Promise<ProductListResponse> {
    return this.api.get<ProductListResponse>('/product/');
  }

  createOrder(order: OrderRequest): Promise<OrderResponse> {
    return this.api.post<OrderResponse>('/order/', order);
  }
}
