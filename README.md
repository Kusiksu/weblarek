https://github.com/Kusiksu/weblarek

# «Веб-ларёк»: первая часть проектной работы

Интернет-магазин товаров для веб-разработчиков. Проект выполнен на предоставленном стартовом наборе с HTML, SCSS, TypeScript и Vite. В этой части реализованы три независимые модели данных, коммуникационный слой, проверки всех методов моделей в консоли и получение каталога с сервера.

Карточки товаров, модальные окна, формы и полный презентер относятся ко второй части задания. Сейчас страница использует стартовую вёрстку, а результаты работы моделей доступны в консоли браузера.

## Запуск и сборка

Требуется Node.js 20.19+ или 22.12+ и npm.

Все команды выполняются из корня проекта — папки, содержащей `package.json`.

Установите зависимости:

```bash
npm ci
```

Создайте в корне проекта файл `.env`, скопировав `.env.example`:

```dotenv
VITE_API_ORIGIN=https://larek.ffapi.ru
```

Адрес указывается без завершающего слеша. `.env` исключён из Git и создаётся заново после клонирования. После изменения переменных окружения перезапустите Vite.

Запустите сервер разработки:

```bash
npm run dev
```

Откройте адрес из терминала и Console в инструментах разработчика браузера. После групп проверок моделей появится каталог с сервера, сохранённый в модели.

Проверка TypeScript и production-сборка:

```bash
npm run build
```

Просмотр собранной версии:

```bash
npm run preview
```

В PowerShell при блокировке `npm.ps1` используйте `npm.cmd` вместо `npm`, например:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run dev
```

Команда `build` выполняет проверку `tsc`, затем production-сборку Vite в `dist/`. Команда `preview` показывает собранную версию. Отдельный линтер в стартере не настроен. Строгие настройки TypeScript сохранены.

## Структура проекта

| Путь | Назначение |
| --- | --- |
| `index.html` | Главная страница и шаблоны стартового набора |
| `public/` | Статические ресурсы |
| `src/main.ts` | Создание экземпляров, проверка моделей и загрузка каталога |
| `src/types/index.ts` | Единый файл общих типов и интерфейсов |
| `src/components/models/ProductCatalog.ts` | Модель каталога |
| `src/components/models/Cart.ts` | Модель корзины |
| `src/components/models/Buyer.ts` | Модель покупателя |
| `src/components/api/ShopApi.ts` | Коммуникационный слой |
| `src/components/base/Api.ts` | Общий HTTP-клиент |
| `src/components/base/Component.ts` | Абстрактный компонент представления |
| `src/components/base/Events.ts` | Брокер событий |
| `src/utils/data.ts` | Тестовый объект `apiProducts` из стартера |
| `src/utils/constants.ts` | URL API и изображений, соответствие категорий CSS-классам |
| `src/utils/utils.ts` | Общие функции работы с DOM и объектами |
| `src/scss/`, `src/common.blocks/` | Стили |
| `src/images/`, `src/vendor/` | Изображения, шрифты и сторонние стили |
| `src/vite-env.d.ts` | Декларации окружения Vite |
| `.env.example` | Образец адреса сервера |

## Архитектура MVP

MVP (Model–View–Presenter) разделяет данные, отображение и управление пользовательскими сценариями.

- **Model**: `ProductCatalog`, `Cart`, `Buyer` хранят и изменяют данные. Они не зависят друг от друга, DOM, API или брокера событий.
- **View**: будущие карточки, корзина, формы и модальные окна будут наследовать `Component<T>`. Их задача — отображать переданные данные и сообщать о действиях пользователя.
- **Presenter**: во второй части свяжет представление, модели и коммуникационный слой: обработает действия, изменит модели и обновит интерфейс.

`ShopApi` отвечает только за запросы. Он не сохраняет состояние моделей и использует композицию с клиентом `IApi`.

В `main.ts` создаются конкретные объекты, дальнейшая работа ведётся через `IProductCatalog`, `ICart`, `IBuyerModel`, `IApi`, `IShopApi`. HTTP-клиент можно заменить объектом, реализующим `IApi`, без изменения `ShopApi`.

Текущий поток данных:

`main.ts` → `ShopApi.getProducts()` → `IApi.get()` → сервер → `response.items` → `ProductCatalog.setItems()` → `ProductCatalog.getItems()` → консоль.

Обмен событиями между представлением и моделями появится во второй части; текущие модели не генерируют событий. Брокер событий предоставлен стартером.

Сумма и количество корзины вычисляются из массива и не дублируются в полях. Каталог и корзина по заданию хранят массивы разного назначения: корзина содержит ссылки на выбранные товары, а не копию каталога. Выбранный товар также хранится по ссылке.

Массивы выдаются как поверхностные копии: их состав можно менять без изменения массива модели; сами объекты товаров считаются неизменяемыми данными сервера. `Buyer.getData()` возвращает новый объект.

## Базовый код

### Api

Общий JSON HTTP-клиент, реализует `IApi`.

Конструктор:

`constructor(baseUrl: string, options: RequestInit = {})`

Сохраняет адрес и формирует заголовки `Content-Type: application/json`, дополненные `options.headers`. Остальные опции конструктора в реализации стартера не копируются.

Поля:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `readonly baseUrl` | `string` | Базовый адрес сервера |
| `protected options` | `RequestInit` | Настройки заголовков запросов |

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `get<T extends object>(uri: string): Promise<T>` | GET по `baseUrl + uri`, обработка ответа через `handleResponse` |
| `post<T extends object>(uri: string, data: object, method: ApiPostMethods = 'POST'): Promise<T>` | Отправка JSON выбранным методом по `baseUrl + uri` |
| `protected handleResponse<T>(response: Response): Promise<T>` | При успешном статусе разбирает JSON; иначе отклоняет промис с `data.error` или `response.statusText` |

### Component<T>

Абстрактная основа представления, не создаётся напрямую. `T` задаёт тип данных отображения.

Защищённый конструктор:

`constructor(container: HTMLElement)`

Принимает корневой DOM-элемент и сохраняет его в поле `protected readonly container: HTMLElement`.

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `render(data?: Partial<T>): HTMLElement` | Присваивает данные экземпляру, вызывая сеттеры потомка, если они есть, и возвращает корневой элемент |
| `protected setImage(element: HTMLImageElement, src: string, alt?: string): void` | Устанавливает `src` и при непустом `alt` — альтернативный текст |

### EventEmitter

Брокер событий, реализует `IEvents`.

Конструктор `constructor()` без параметров создаёт коллекцию подписок.

Поле `_events: Map<EventName, Set<Subscriber>>` сопоставляет имена или шаблоны событий наборам обработчиков.

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `on<T extends object>(eventName: EventName, callback: (event: T) => void): void` | Подписывает обработчик на имя или шаблон |
| `off<T extends object>(eventName: EventName, callback: (event: T) => void): void` | Удаляет обработчик и пустой набор подписок |
| `emit<T extends object>(eventName: string, data?: T): void` | Вызывает обработчики совпавших имён или шаблонов. Слушатели `'*'` получают имя и данные события |
| `onAll(callback: (event: EmitterEvent) => void): void` | Подписывает на все события |
| `offAll(): void` | Удаляет все подписки |
| `trigger<T extends object>(eventName: string, context?: Partial<T>): (event?: object) => void` | Возвращает функцию отправки события; объединяет данные и контекст с приоритетом контекста |

Контракт `IEvents.trigger` использует совместимую сигнатуру `(data: T) => void`; реализация стартера дополнительно допускает вызов без аргумента.

## Данные

Общие объявления собраны в `src/types/index.ts`.

Интерфейсы экземпляров отделены от реализаций. Конструкторы классов как параметры не передаются, поэтому отдельные интерфейсы конструкторов не требуются. `ImportMetaEnv` и `ImportMeta` остаются в специальном декларационном файле Vite.

### Данные товара

```ts
interface IProduct {
  id: string;
  description: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
}
```

| Поле | Назначение |
| --- | --- |
| `id` | Идентификатор товара |
| `description` | Описание товара |
| `image` | Путь изображения |
| `title` | Название товара |
| `category` | Категория |
| `price` | Цена в синапсах; `null` означает отсутствие доступной цены |

### Данные покупателя

```ts
type TPayment = 'card' | 'cash';

interface IBuyer {
  payment: TPayment | '';
  email: string;
  phone: string;
  address: string;
}
```

| Поле | Назначение |
| --- | --- |
| `payment` | Карта, наличные или ещё не выбранный способ оплаты |
| `email` | Электронная почта |
| `phone` | Телефон |
| `address` | Адрес доставки |

### Дополнительные типы

| Тип | Структура и назначение |
| --- | --- |
| `BuyerErrors` | `Partial<Record<keyof IBuyer, string>>` — тексты ошибок по полям покупателя; отсутствие ключа означает отсутствие ошибки |
| `IApiList<T>` | `{ total: number; items: T[] }` — общее число записей и полученный массив |
| `ProductListResponse` | `IApiList<IProduct>` — ответ списка товаров |
| `OrderRequest` | `Omit<IBuyer, 'payment'> & { payment: TPayment; total: number; items: IProduct['id'][] }` — данные покупателя, выбранная оплата, сумма и id товаров. Пустая оплата исключена |
| `OrderResponse` | `{ id: string; total: number }` — идентификатор заказа и сумма покупки |
| `ApiPostMethods` | `'POST' \| 'PUT' \| 'DELETE'` — методы HTTP-записи |
| `EventName` | `string \| RegExp` — имя или шаблон события; строка `'*'` означает все события |
| `Subscriber` | `(data: unknown) => void` — общий внутренний обработчик брокера |
| `EmitterEvent` | `{ eventName: string; data: unknown }` — данные универсального слушателя |
| `SelectorCollection<T>` | `string \| NodeListOf<Element> \| T[]` — селектор или коллекция элементов |
| `SelectorElement<T>` | `T \| string` — элемент или селектор |

`total` ответа списка не вычисляется по длине `items`: сервер может вернуть часть списка. В тестовом объекте стартера эти значения также различаются.

Типы заказа производятся из существующих типов, а не повторяют поля покупателя и товара.

### Контракты экземпляров

| Интерфейс | Методы |
| --- | --- |
| `IApi` | `get<T extends object>(uri: string): Promise<T>`; `post<T extends object>(uri: string, data: object, method?: ApiPostMethods): Promise<T>` |
| `IProductCatalog` | `setItems`, `getItems`, `getItem`, `setSelected`, `getSelected`; сигнатуры в описании `ProductCatalog` |
| `ICart` | `getItems`, `addItem`, `removeItem`, `clear`, `getTotal`, `getCount`, `hasItem`; сигнатуры в описании `Cart` |
| `IBuyerModel` | `setData`, `getData`, `clear`, `validate`; сигнатуры в описании `Buyer` |
| `IShopApi` | `getProducts(): Promise<ProductListResponse>`; `createOrder(order: OrderRequest): Promise<OrderResponse>` |
| `IEvents` | `on<T extends object>(event: EventName, callback: (data: T) => void): void`; `emit<T extends object>(event: string, data?: T): void`; `trigger<T extends object>(event: string, context?: Partial<T>): (data: T) => void` |

`IEvents` переэкспортируется из `Events.ts`, а типы селекторов — из `utils.ts` для совместимости стартового кода.

Публичная подписка брокера типизируется параметром `T`; при сохранении обработчика во внутреннюю коллекцию используется приведение к общему `Subscriber`.

## Модели данных

### ProductCatalog

Хранит каталог и товар для подробного просмотра. Реализует `IProductCatalog`.

Конструктор `new ProductCatalog()` без параметров создаёт пустой массив и сбрасывает выбор в `null`.

Поля:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `private items` | `IProduct[]` | Все загруженные товары |
| `private selected` | `IProduct \| null` | Выбранный товар или отсутствие выбора |

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `setItems(items: IProduct[]): void` | Заменяет каталог поверхностной копией массива. При существующем выборе обновляет ссылку по id или сбрасывает выбор, если товар исчез |
| `getItems(): IProduct[]` | Возвращает поверхностную копию массива |
| `getItem(id: IProduct['id']): IProduct \| undefined` | Находит товар по id; при отсутствии возвращает `undefined` |
| `setSelected(product: IProduct \| null): void` | Сохраняет переданный товар; `null` сбрасывает выбор |
| `getSelected(): IProduct \| null` | Возвращает выбранный товар |

### Cart

Хранит выбранные для покупки товары. Реализует `ICart`.

Конструктор `new Cart()` без параметров создаёт пустую корзину.

Поле `private items: IProduct[]` — массив выбранных товаров.

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `getItems(): IProduct[]` | Возвращает поверхностную копию массива |
| `addItem(product: IProduct): void` | Добавляет товар, если его id ещё нет и `price !== null`. Нулевая цена допускается |
| `removeItem(product: IProduct): void` | Удаляет товар по id; отсутствие товара безопасно |
| `clear(): void` | Очищает массив |
| `getTotal(): number` | Вычисляет сумму цен; для пустой корзины — `0` |
| `getCount(): number` | Возвращает длину массива |
| `hasItem(id: IProduct['id']): boolean` | Проверяет наличие по id |

### Buyer

Хранит данные покупателя, поддерживает частичные изменения и проверяет обязательность полей. Реализует `IBuyerModel`.

Конструктор `new Buyer()` без параметров. Все поля изначально равны `''`.

Поля:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `private payment` | `TPayment | ''` | Способ оплаты |
| `private address` | `string` | Адрес доставки |
| `private email` | `string` | Электронная почта |
| `private phone` | `string` | Телефон |

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `setData(data: Partial<IBuyer>): void` | Изменяет только переданные поля. Пропуски и `undefined` игнорируются; `''` явно очищает поле |
| `getData(): IBuyer` | Возвращает новый объект всех данных |
| `clear(): void` | Сбрасывает все поля в `''` |
| `validate(): BuyerErrors` | Проверяет выбор оплаты и непустые текстовые поля после `trim()`, не меняя данные. Возвращает тексты ошибок или `{}`, если ошибок нет |

Формат email и телефона дополнительно не ограничивается: по заданию достаточно непустого значения.

Первый шаг формы использует ошибки `payment`, `address`; второй — `email`, `phone`.

Сообщения об ошибках:

- `payment`: «Не выбран способ оплаты»;
- `address`: «Укажите адрес доставки»;
- `email`: «Укажите email»;
- `phone`: «Укажите телефон».

## Слой коммуникации

### ShopApi

Получает товары и отправляет заказы. Реализует `IShopApi`.

Использует композицию с `IApi`, не наследует `Api`, не обращается к моделям.

Конструктор:

`constructor(api: IApi)`

Сохраняет клиент в поле `private readonly api: IApi`.

Методы:

| Сигнатура | Назначение |
| --- | --- |
| `getProducts(): Promise<ProductListResponse>` | Вызывает `api.get<ProductListResponse>('/product/')`, возвращает весь объект `{ total, items }` |
| `createOrder(order: OrderRequest): Promise<OrderResponse>` | Вызывает `api.post<OrderResponse>('/order/', order)`, возвращает `{ id, total }` |

`API_URL` берётся из `src/utils/constants.ts`:

```ts
`${import.meta.env.VITE_API_ORIGIN}/api/weblarek`
```

`CDN_URL` используется для формирования адресов изображений:

```ts
`${import.meta.env.VITE_API_ORIGIN}/content/weblarek`
```

К нему добавляется путь из `IProduct.image`.

`categoryMap` сопоставляет категории CSS-классам; `settings` — пустые настройки стартера.

Ошибки клиента передаются вызывающему коду. `loadCatalog()` перехватывает их и выводит сообщение. При ошибке загрузки ранее записанный тестовый каталог остаётся в модели.

Заказ автоматически не отправляется: его сборка и сценарий оплаты относятся ко второй части.

## Утилиты

Общие функции `src/utils/utils.ts` используют `unknown` для универсальных проверок. Отключений проверки TypeScript нет.

| Сигнатура | Назначение |
| --- | --- |
| `pascalToKebab(value: string): string` | Преобразует PascalCase в kebab-case |
| `isSelector(x: unknown): x is string` | Проверяет строку длиной больше одного символа |
| `isEmpty(value: unknown): boolean` | Проверяет `null` и `undefined` |
| `ensureAllElements<T extends HTMLElement>(selectorElement: SelectorCollection<T>, context?: HTMLElement): T[]` | Получает массив из селектора, NodeList или массива; по умолчанию ищет в документе |
| `ensureElement<T extends HTMLElement>(selectorElement: SelectorElement<T>, context?: HTMLElement): T` | Возвращает элемент; при отсутствии — ошибка, при нескольких совпадениях — предупреждение и последний элемент |
| `cloneTemplate<T extends HTMLElement>(query: string \| HTMLTemplateElement): T` | Клонирует первый корневой элемент шаблона; пустой шаблон вызывает ошибку |
| `bem(block: string, element?: string, modifier?: string): { name: string; class: string }` | Формирует имя БЭМ и CSS-селектор |
| `getObjectProperties(obj: object, filter?: (name: string, prop: PropertyDescriptor) => boolean): string[]` | Имена свойств непосредственного прототипа с необязательным фильтром |
| `setElementData<T extends Record<string, unknown> \| object>(el: HTMLElement, data: T): void` | Записывает строковые значения в dataset |
| `getElementData<T extends Record<string, unknown>>(el: HTMLElement, scheme: Record<string, (value: string \| undefined) => unknown>): T` | Читает dataset с преобразованием по схеме; вызывающий код обеспечивает конвертер для каждого ключа |
| `isPlainObject(obj: unknown): obj is object` | Проверяет обычный или нулевой прототип; `null` и примитивы возвращают `false` |
| `isBoolean(v: unknown): v is boolean` | Проверяет логический тип |
| `createElement<T extends HTMLElement>(tagName: keyof HTMLElementTagNameMap, props?: Partial<Record<keyof T, string \| boolean \| object>>, children?: HTMLElement \| HTMLElement[]): T` | Создаёт элемент, назначает свойства и добавляет детей |

## Проверка работоспособности

`main.ts` создаёт экземпляры:

- `ProductCatalog`;
- `Cart`;
- `Buyer`;
- `Api`;
- `ShopApi`.

Функция `checkModels(): void` вызывает все методы трёх моделей.

Вспомогательная функция `checkResult(label: string, condition: boolean, result: unknown): void` печатает подпись с результатом и вызывает `console.assert`.

Данные для вывода получаются через методы моделей. Эти логи оставлены по заданию.

### Проверки каталога

- Пустое начальное состояние.
- Сохранение и получение массива товаров.
- Поиск существующего товара по id.
- Поиск отсутствующего товара.
- Сохранение товара для подробного просмотра.
- Получение выбранного товара.
- Сброс выбора.
- Независимость состава массива, полученного через `getItems()`.

### Проверки корзины

- Пустое начальное состояние.
- Добавление товара.
- Проверка наличия товара по id.
- Защита от повторного добавления.
- Запрет добавления товара без цены.
- Расчёт общей стоимости.
- Получение количества товаров.
- Удаление товара.
- Повторное удаление отсутствующего товара.
- Полная очистка корзины.

### Проверки покупателя

- Получение исходных пустых данных.
- Ошибки всех обязательных полей.
- Заполнение первого шага.
- Частичная запись контактов с сохранением остальных полей.
- Успешная валидация заполненных данных.
- Использование обоих способов оплаты.
- Проверка строки из пробелов.
- Явная очистка одного поля.
- Полная очистка данных.

### Получение каталога с сервера

После проверок вызывается `loadCatalog(): Promise<void>`.

Функция получает ответ через `ShopApi`, сохраняет `response.items` в ту же модель каталога и выводит сохранённый массив через `getItems()`.

Результат появляется после проверок моделей. При сетевой ошибке выводится сообщение с пояснением.

Реальная отправка заказа при открытии страницы не производится.
