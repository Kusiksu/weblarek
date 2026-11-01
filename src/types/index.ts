export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';

export interface IApi {
  get<T extends object>(uri: string): Promise<T>;
  post<T extends object>(
    uri: string,
    data: object,
    method?: ApiPostMethods,
  ): Promise<T>;
}

export interface IProduct {
  id: string;
  description: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
}

export type TPayment = 'card' | 'cash';

export interface IBuyer {
  payment: TPayment | '';
  email: string;
  phone: string;
  address: string;
}

export type BuyerErrors = Partial<Record<keyof IBuyer, string>>;

export interface IApiList<T> {
  total: number;
  items: T[];
}

export type ProductListResponse = IApiList<IProduct>;

export type OrderRequest = Omit<IBuyer, 'payment'> & {
  payment: TPayment;
  total: number;
  items: IProduct['id'][];
};

export interface OrderResponse {
  id: string;
  total: number;
}

export interface IProductCatalog {
  setItems(items: IProduct[]): void;
  getItems(): IProduct[];
  getItem(id: IProduct['id']): IProduct | undefined;
  setSelected(product: IProduct | null): void;
  getSelected(): IProduct | null;
}

export interface ICart {
  getItems(): IProduct[];
  addItem(product: IProduct): void;
  removeItem(product: IProduct): void;
  clear(): void;
  getTotal(): number;
  getCount(): number;
  hasItem(id: IProduct['id']): boolean;
}

export interface IBuyerModel {
  setData(data: Partial<IBuyer>): void;
  getData(): IBuyer;
  clear(): void;
  validate(): BuyerErrors;
}

export interface IShopApi {
  getProducts(): Promise<ProductListResponse>;
  createOrder(order: OrderRequest): Promise<OrderResponse>;
}

export type EventName = string | RegExp;

export type Subscriber = (data: unknown) => void;

export type EmitterEvent = {
  eventName: string;
  data: unknown;
};

export interface IEvents {
  on<T extends object>(
    event: EventName,
    callback: (data: T) => void,
  ): void;

  emit<T extends object>(event: string, data?: T): void;

  trigger<T extends object>(
    event: string,
    context?: Partial<T>,
  ): (data: T) => void;
}

export type SelectorCollection<T> =
  | string
  | NodeListOf<Element>
  | T[];

export type SelectorElement<T> = T | string;
