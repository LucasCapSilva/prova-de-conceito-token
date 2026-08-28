import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeOrder,
  getOrder,
  getOrders,
  createOrder,
  sellerOrdersCsv,
} from "./orders.ts";
import { write } from "./storage.ts";
import type { Order, NewOrderInput } from "./orders.ts";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const FULL_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function baseOrder(): Order {
  return {
    id: "ped-test",
    createdAt: "2026-08-25T12:00:00.000Z",
    status: "confirmed",
    items: [],
    subtotal: 1000,
    discount: 0,
    shipping: 0,
    total: 1000,
    payment: "Pix",
    address: {
      name: "Teste",
      cpf: "12345678901",
      cep: "01000-000",
      street: "Rua A",
      number: "1",
      complement: "",
      city: "São Paulo",
      state: "SP",
    },
    deliveryDays: 5,
    tracking: "EL123456",
    estimatedDate: "2026-08-30",
  };
}

test("normalizeOrder: createdAt já em ISO completo permanece canônico", () => {
  const order = normalizeOrder(baseOrder());
  assert.equal(order.createdAt, "2026-08-25T12:00:00.000Z");
  assert.match(order.createdAt, FULL_ISO_RE);
});

test("normalizeOrder: createdAt em data só (sem hora) vira ISO completo UTC", () => {
  const order = normalizeOrder({ ...baseOrder(), createdAt: "2026-08-25" });
  assert.equal(order.createdAt, "2026-08-25T00:00:00.000Z");
});

test("normalizeOrder: createdAt inválido é mantido como estava", () => {
  const order = normalizeOrder({ ...baseOrder(), createdAt: "não-é-data" });
  assert.equal(order.createdAt, "não-é-data");
});

test("normalizeOrder: estimatedDate já em formato data permanece igual", () => {
  const order = normalizeOrder({ ...baseOrder(), estimatedDate: "2026-08-30" });
  assert.equal(order.estimatedDate, "2026-08-30");
});

test("normalizeOrder: estimatedDate em ISO completo vira data (YYYY-MM-DD)", () => {
  const order = normalizeOrder({
    ...baseOrder(),
    estimatedDate: "2026-08-30T12:00:00.000Z",
  });
  assert.match(order.estimatedDate, DATE_ONLY_RE);
  // O que o OrderConfirmation/OrderDetail dependem: a concatenação precisa
  // continuar produzindo uma data válida.
  assert.ok(Number.isFinite(new Date(order.estimatedDate + "T12:00:00").getTime()));
});

test("normalizeOrder: estimatedDate inválido é mantido como estava", () => {
  const order = normalizeOrder({ ...baseOrder(), estimatedDate: "????" });
  assert.equal(order.estimatedDate, "????" );
});

test("getOrders normaliza datas de pedidos legados gravados como texto", () => {
  // Simula dado antigo: o JSON.stringify de um Date devolve ISO completo, e um
  // estimatedDate gravado como Date quebra a leitura em texto.
  const legacy: Order[] = [
    {
      ...baseOrder(),
      id: "ped-legacy",
      createdAt: "2026-08-20T08:30:00.000Z",
      estimatedDate: "2026-08-25T12:00:00.000Z",
    },
  ];
  write("orders", legacy);

  const orders = getOrders();
  const found = getOrder("ped-legacy");
  assert.ok(found);
  assert.ok(orders.length >= 1);
  assert.match(found.createdAt, FULL_ISO_RE);
  assert.match(found.estimatedDate, DATE_ONLY_RE);
  assert.ok(Number.isFinite(new Date(found.estimatedDate + "T12:00:00").getTime()));
});

test("sellerOrdersCsv: um header, uma linha por item do vendedor, com escape", () => {
  const order: Order = {
    ...baseOrder(),
    id: "ped-csv",
    status: "shipped",
    items: [
      {
        id: "a",
        name: "Fone; \"Premium\"",
        image: "x",
        qty: 2,
        price: 500,
        seller: "Loja Um",
        variantKey: "cor-preto",
      },
      {
        id: "b",
        name: "Item de outro vendedor",
        image: "y",
        qty: 1,
        price: 99,
        seller: "Outra Loja",
      },
    ],
  };
  const csv = sellerOrdersCsv("Loja Um", [order]);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0], "Pedido;Data;Status;Cliente;Rua;Bairro;Cidade;UF;Item;Variação;Qtd;Preço unit.;Total item;Total pedido;Pagamento");
  // O nome com ; e aspas vem citado entre aspas, com aspas dobradas; o ;
  // dentro das aspas é parte do campo, então não dá para split(";") na linha.
  assert.ok(lines[1].startsWith("ped-csv;"));
  assert.ok(lines[1].includes('"Fone; ""Premium"""'));
  assert.ok(lines[1].includes("cor-preto;2;500.00;1000.00"));
});

test("sellerOrdersCsv: sem itens do vendedor devolve só o header", () => {
  const order: Order = {
    ...baseOrder(),
    items: [
      { id: "b", name: "Outro", image: "y", qty: 1, price: 1, seller: "Outra" },
    ],
  };
  const csv = sellerOrdersCsv("Loja Um", [order]);
  assert.equal(csv.trim().split("\r\n").length, 1);
});

test("criar e ler um pedido devolve datas canônicas (round-trip)", () => {
  const input: NewOrderInput = {
    items: [
      {
        id: "headphone-pro-max",
        name: "Fone de Ouvido Pro Max",
        image: "x",
        qty: 1,
        price: 1000,
        seller: "TechStore",
      },
    ],
    subtotal: 1000,
    discount: 0,
    shipping: 0,
    total: 1000,
    payment: "Pix",
    address: {
      name: "Teste",
      cpf: "12345678901",
      cep: "01000-000",
      street: "Rua A",
      number: "1",
      complement: "",
      city: "São Paulo",
      state: "SP",
    },
    deliveryDays: 5,
  };
  const created = createOrder(input);
  const fetched = getOrder(created.id);
  assert.ok(fetched);
  assert.match(fetched.createdAt, FULL_ISO_RE);
  assert.match(fetched.estimatedDate, DATE_ONLY_RE);
  // O prazo estimado deve ser ~deliveryDays depois da criação.
  const createdMs = new Date(fetched.createdAt).getTime();
  const etaMs = new Date(fetched.estimatedDate + "T00:00:00").getTime();
  const diffDays = Math.round((etaMs - createdMs) / 86400000);
  assert.ok(diffDays >= 4 && diffDays <= 6, `diffDays=${diffDays}`);
});
