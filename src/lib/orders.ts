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
  address: Address;
  deliveryDays: number;
  tracking: string;
  estimatedDate: string;
}

export interface NewOrderInput {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string;
  address: Address;
  deliveryDays: number;
}

const ORDERS_KEY = "electronica:orders";

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
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
    address: input.address,
    deliveryDays: input.deliveryDays,
    tracking,
    estimatedDate: eta.toISOString().slice(0, 10),
  };
  const orders = getOrders();
  orders.unshift(order);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* storage indisponível — ignora */
  }
  return order;
}

function saveOrders(orders: Order[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* storage indisponível — ignora */
  }
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
