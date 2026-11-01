import './scss/styles.scss';

import { Api } from './components/base/Api';
import { ShopApi } from './components/api/ShopApi';
import { Buyer } from './components/models/Buyer';
import { Cart } from './components/models/Cart';
import { ProductCatalog } from './components/models/ProductCatalog';

import type {
  IApi,
  IBuyerModel,
  ICart,
  IProductCatalog,
  IShopApi,
} from './types';

import { API_URL } from './utils/constants';
import { apiProducts } from './utils/data';

const catalog: IProductCatalog = new ProductCatalog();
const cart: ICart = new Cart();
const buyer: IBuyerModel = new Buyer();

const api: IApi = new Api(API_URL);
const shopApi: IShopApi = new ShopApi(api);

function checkResult(
  label: string,
  condition: boolean,
  result: unknown,
): void {
  console.log(`${condition ? '✓' : '✗'} ${label}`, result);

  console.assert(
    condition,
    `Проверка не пройдена: ${label}`,
  );
}

function checkModels(): void {
  console.group('Проверка каталога товаров');

  checkResult(
    'Исходный каталог пуст',
    catalog.getItems().length === 0,
    catalog.getItems(),
  );

  checkResult(
    'Товар для просмотра не выбран',
    catalog.getSelected() === null,
    catalog.getSelected(),
  );

  catalog.setItems(apiProducts.items);

  checkResult(
    'setItems / getItems: сохранены тестовые товары',
    catalog.getItems().length === apiProducts.items.length,
    catalog.getItems(),
  );

  const product = apiProducts.items[0];
  const secondProduct = apiProducts.items[1];

  const unavailableProduct = apiProducts.items.find(
    (item) => item.price === null,
  );

  if (!product || !secondProduct || !unavailableProduct) {
    throw new Error(
      'В тестовых данных нужны два доступных товара и товар без цены',
    );
  }

  checkResult(
    'getItem: поиск по id',
    catalog.getItem(product.id)?.id === product.id,
    catalog.getItem(product.id),
  );

  const missingProductId = 'missing-product';

  checkResult(
    'getItem: неизвестный id возвращает undefined',
    catalog.getItem(missingProductId) === undefined,
    catalog.getItem(missingProductId),
  );

  catalog.setSelected(product);

  checkResult(
    'setSelected / getSelected: выбран товар',
    catalog.getSelected()?.id === product.id,
    catalog.getSelected(),
  );

  catalog.setSelected(null);

  checkResult(
    'setSelected(null): выбор сброшен',
    catalog.getSelected() === null,
    catalog.getSelected(),
  );

  const receivedItems = catalog.getItems();

  receivedItems.pop();

  checkResult(
    'Изменение полученного массива не меняет каталог',
    catalog.getItems().length === apiProducts.items.length,
    catalog.getItems(),
  );

  console.groupEnd();

  console.group('Проверка корзины');

  checkResult(
    'Пустая корзина: список / количество / сумма',
    cart.getItems().length === 0 &&
      cart.getCount() === 0 &&
      cart.getTotal() === 0,
    {
      items: cart.getItems(),
      count: cart.getCount(),
      total: cart.getTotal(),
    },
  );

  cart.addItem(product);

  checkResult(
    'addItem / hasItem: товар добавлен',
    cart.hasItem(product.id),
    cart.getItems(),
  );

  cart.addItem(product);

  checkResult(
    'Повторное добавление не создаёт дубликат',
    cart.getCount() === 1,
    cart.getCount(),
  );

  cart.addItem(unavailableProduct);

  checkResult(
    'Товар без цены не добавляется',
    !cart.hasItem(unavailableProduct.id),
    cart.getItems(),
  );

  cart.addItem(secondProduct);

  const expectedTotal =
    (product.price ?? 0) + (secondProduct.price ?? 0);

  checkResult(
    'getTotal: сумма двух товаров',
    cart.getTotal() === expectedTotal,
    cart.getTotal(),
  );

  checkResult(
    'getCount: количество двух товаров',
    cart.getCount() === 2,
    cart.getCount(),
  );

  cart.removeItem(product);

  checkResult(
    'removeItem: товар удалён по id',
    !cart.hasItem(product.id) && cart.getCount() === 1,
    cart.getItems(),
  );

  cart.removeItem(product);

  checkResult(
    'Удаление отсутствующего товара безопасно',
    cart.getCount() === 1,
    cart.getItems(),
  );

  cart.clear();

  checkResult(
    'clear: список, сумма и количество обнулены',
    cart.getItems().length === 0 &&
      cart.getTotal() === 0 &&
      cart.getCount() === 0,
    {
      items: cart.getItems(),
      total: cart.getTotal(),
      count: cart.getCount(),
    },
  );

  console.groupEnd();

  console.group('Проверка данных покупателя');

  checkResult(
    'getData: исходные данные пусты',
    Object.values(buyer.getData()).every(
      (value) => value === '',
    ),
    buyer.getData(),
  );

  checkResult(
    'validate: четыре ошибки незаполненной формы',
    Object.keys(buyer.validate()).length === 4,
    buyer.validate(),
  );

  buyer.setData({
    payment: 'card',
    address: 'Москва, улица Примерная, дом 1',
  });

  checkResult(
    'setData: заполнен первый шаг, ошибки только в контактах',
    !buyer.validate().payment &&
      !buyer.validate().address &&
      Boolean(buyer.validate().email) &&
      Boolean(buyer.validate().phone),
    buyer.validate(),
  );

  const savedAddress = buyer.getData().address;

  buyer.setData({ email: 'buyer@example.com' });

  checkResult(
    'Частичная запись email сохраняет адрес и оплату',
    buyer.getData().address === savedAddress &&
      buyer.getData().payment === 'card' &&
      buyer.getData().email === 'buyer@example.com',
    buyer.getData(),
  );

  buyer.setData({ phone: '+79990000000' });

  checkResult(
    'validate: заполненные данные валидны',
    Object.keys(buyer.validate()).length === 0,
    buyer.validate(),
  );

  buyer.setData({ payment: 'cash' });

  checkResult(
    'Способ оплаты можно изменить на cash',
    buyer.getData().payment === 'cash',
    buyer.getData(),
  );

  buyer.setData({ address: '   ' });

  checkResult(
    'Пробелы не считаются заполненным адресом',
    Boolean(buyer.validate().address),
    buyer.validate(),
  );

  buyer.setData({ email: '' });

  checkResult(
    'Поле можно явно очистить без удаления телефона',
    Boolean(buyer.validate().email) &&
      buyer.getData().phone === '+79990000000',
    buyer.getData(),
  );

  buyer.clear();

  checkResult(
    'clear: данные очищены, обязательные поля снова невалидны',
    Object.values(buyer.getData()).every(
      (value) => value === '',
    ) && Object.keys(buyer.validate()).length === 4,
    {
      data: buyer.getData(),
      errors: buyer.validate(),
    },
  );

  console.groupEnd();
}

async function loadCatalog(): Promise<void> {
  try {
    const response = await shopApi.getProducts();

    catalog.setItems(response.items);

    console.log(
      'Каталог, полученный с сервера и сохранённый в модели:',
      catalog.getItems(),
    );
  } catch (error: unknown) {
    console.error(
      'Не удалось загрузить каталог с сервера. Проверьте .env и доступность API:',
      error,
    );
  }
}

checkModels();

void loadCatalog();
