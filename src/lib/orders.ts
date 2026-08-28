import { formatDate } from "./format.ts";
import { read, write } from "./storage.ts";
import type { PickupSelection } from "./pickup.ts";
import type { DeliverySchedule } from "./schedule.ts";

export interface Address {
  name: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood?: string;
  city: string;
  state: string;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  qty: number;
  price: number;
  seller: string;
  variantKey?: string | null;
}

export type OrderStatus =
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface GiftWrap {
  fee: number;
  message: string;
}

/** Taxa fixa do embrulho para presente. */
export const GIFT_WRAP_FEE = 19.9;

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string;
  accountId?: string;
  address: Address;
  deliveryDays: number;
  tracking: string;
  estimatedDate: string;
  pickup?: PickupSelection;
  gift?: GiftWrap;
  schedule?: DeliverySchedule;
}

export interface NewOrderInput {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string;
  accountId?: string;
  address: Address;
  deliveryDays: number;
  pickup?: PickupSelection;
  gift?: GiftWrap;
  schedule?: DeliverySchedule;
}

const ORDERS_KEY = "orders";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Garante formato ISO completo (UTC) para o carimbo de criação. */
function normalizeCreatedAt(value: string): string {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : value;
}

/** Garante o formato canônico de data (YYYY-MM-DD) para a previsão. */
function normalizeEstimatedDate(value: string): string {
  if (DATE_ONLY_RE.test(value)) return value;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normaliza as datas de um pedido lido do storage. O `JSON.stringify` grava
 * `Date` como texto e o `JSON.parse` devolve string, então as comparações de
 * status e a linha do tempo precisam de datas em formato previsível.
 */
export function normalizeOrder(raw: Order): Order {
  return {
    ...raw,
    createdAt: normalizeCreatedAt(raw.createdAt),
    estimatedDate: normalizeEstimatedDate(raw.estimatedDate),
  };
}

export function getOrders(): Order[] {
  const raw = read<unknown>(ORDERS_KEY, []);
  return (Array.isArray(raw) ? (raw as Order[]) : []).map(normalizeOrder);
}

export function getOrder(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export function createOrder(input: NewOrderInput): Order {
  const id =
    "ped-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const tracking =
    "EL" + String(Math.floor(1000000 + Math.random() * 9000000));
  const created = new Date();
  const eta = new Date(created.getTime() + input.deliveryDays * 86400000);
  const order: Order = {
    id,
    createdAt: created.toISOString(),
    status: "confirmed",
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    shipping: input.shipping,
    total: input.total,
    payment: input.payment,
    ...(input.accountId ? { accountId: input.accountId } : {}),
    address: input.address,
    deliveryDays: input.deliveryDays,
    tracking,
    estimatedDate: input.schedule
      ? input.schedule.date
      : eta.toISOString().slice(0, 10),
    ...(input.pickup ? { pickup: input.pickup } : {}),
    ...(input.gift ? { gift: input.gift } : {}),
    ...(input.schedule ? { schedule: input.schedule } : {}),
  };
  const orders = getOrders();
  orders.unshift(order);
  write(ORDERS_KEY, orders);
  return order;
}

/** Vincula um pedido feito como visitante a uma conta criada depois. */
export function linkOrderToAccount(
  orderId: string,
  accountId: string,
): Order | undefined {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;
  if (orders[idx].accountId === accountId) return orders[idx];
  orders[idx] = { ...orders[idx], accountId };
  saveOrders(orders);
  return orders[idx];
}

function saveOrders(orders: Order[]) {
  write(ORDERS_KEY, orders);
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
};

export function nextStatusOf(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function advanceOrderStatus(id: string): Order | undefined {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  const next = NEXT_STATUS[orders[idx].status];
  if (!next) return orders[idx];
  orders[idx] = { ...orders[idx], status: next };
  saveOrders(orders);
  return orders[idx];
}

function csvField(value: string | number): string {
  const s = String(value);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Gera o CSV dos pedidos do vendedor, uma linha por item da loja. */
export function sellerOrdersCsv(sellerName: string, orders: Order[]): string {
  const header = [
    "Pedido",
    "Data",
    "Status",
    "Cliente",
    "Rua",
    "Bairro",
    "Cidade",
    "UF",
    "Item",
    "Variação",
    "Qtd",
    "Preço unit.",
    "Total item",
    "Total pedido",
    "Pagamento",
  ];
  const lines = orders.flatMap((o) =>
    o.items
      .filter((it) => it.seller === sellerName)
      .map((it) =>
        [
          o.id,
          formatDate(o.createdAt),
          o.status,
          o.address.name,
          o.address.street ?? "",
          o.address.neighborhood ?? "",
          o.address.city,
          o.address.state,
          it.name,
          it.variantKey ?? "",
          it.qty,
          it.price.toFixed(2),
          (it.price * it.qty).toFixed(2),
          o.total.toFixed(2),
          o.payment,
        ]
          .map(csvField)
          .join(";"),
      ),
  );
  return [header.join(";"), ...lines].join("\r\n") + "\r\n";
}

export function cancelOrder(id: string): Order | undefined {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  const o = orders[idx];
  if (o.status !== "confirmed" && o.status !== "processing") return o;
  o.status = "cancelled";
  orders[idx] = { ...o };
  saveOrders(orders);
  return orders[idx];
}
