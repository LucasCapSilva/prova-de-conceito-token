import { read, write } from "./storage";

const KEY = "alerts";

export interface PriceAlert {
  kind: "price";
  productId: string;
  target: number;
  createdAt: string;
}

export interface RestockAlert {
  kind: "restock";
  productId: string;
  variantKey: string | null;
  createdAt: string;
}

export type Alert = PriceAlert | RestockAlert;

function load(): Alert[] {
  const raw = read<unknown>(KEY, []);
  const arr = Array.isArray(raw) ? raw : [];
  const out: Alert[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const createdAt =
      typeof o.createdAt === "string"
        ? o.createdAt
        : new Date().toISOString();
    if (o.kind === "restock" && typeof o.productId === "string") {
      out.push({
        kind: "restock",
        productId: o.productId,
        variantKey: typeof o.variantKey === "string" ? o.variantKey : null,
        createdAt,
      });
    } else if (typeof o.productId === "string" && typeof o.target === "number") {
      out.push({
        kind: "price",
        productId: o.productId,
        target: o.target,
        createdAt,
      });
    }
  }
  return out;
}

function persist(alerts: Alert[]) {
  write(KEY, alerts);
}

/** Todos os alertas persistidos (preço e estoque). */
export function getAlerts(): Alert[] {
  return load();
}

/** Somente os alertas de preço. */
export function getPriceAlerts(): PriceAlert[] {
  return getAlerts().filter((a): a is PriceAlert => a.kind === "price");
}

/** Somente os alertas de estoque. */
export function getRestockAlerts(): RestockAlert[] {
  return getAlerts().filter((a): a is RestockAlert => a.kind === "restock");
}

/** Alerta de preço do produto, se existir. */
export function getAlert(productId: string): PriceAlert | undefined {
  return getPriceAlerts().find((a) => a.productId === productId);
}

/** Cria (ou substitui) o alerta de preço do produto com o preço-alvo. */
export function addAlert(productId: string, target: number): PriceAlert {
  const next: PriceAlert = {
    kind: "price",
    productId,
    target,
    createdAt: new Date().toISOString(),
  };
  persist([
    next,
    ...getAlerts().filter((a) => !(a.kind === "price" && a.productId === productId)),
  ]);
  return next;
}

/** Atualiza apenas o preço-alvo do alerta. */
export function setAlertTarget(productId: string, target: number) {
  persist(
    getAlerts().map((a) =>
      a.kind === "price" && a.productId === productId ? { ...a, target } : a
    )
  );
}

/** Remove o alerta de preço do produto. */
export function removeAlert(productId: string) {
  persist(
    getAlerts().filter((a) => !(a.kind === "price" && a.productId === productId))
  );
}

/** Alerta de estoque do produto para a combinação, se existir. */
export function getRestockAlert(
  productId: string,
  variantKey: string | null
): RestockAlert | undefined {
  const key = variantKey ?? null;
  return getRestockAlerts().find(
    (a) => a.productId === productId && (a.variantKey ?? null) === key
  );
}

/** Cria (ou substitui) o alerta de estoque para a combinação do produto. */
export function addRestockAlert(
  productId: string,
  variantKey: string | null
): RestockAlert {
  const key = variantKey ?? null;
  const next: RestockAlert = {
    kind: "restock",
    productId,
    variantKey: key,
    createdAt: new Date().toISOString(),
  };
  persist([
    next,
    ...getAlerts().filter(
      (a) =>
        !(
          a.kind === "restock" &&
          a.productId === productId &&
          (a.variantKey ?? null) === key
        )
    ),
  ]);
  return next;
}

/** Remove o alerta de estoque do produto para a combinação. */
export function removeRestockAlert(
  productId: string,
  variantKey: string | null
) {
  const key = variantKey ?? null;
  persist(
    getAlerts().filter(
      (a) =>
        !(
          a.kind === "restock" &&
          a.productId === productId &&
          (a.variantKey ?? null) === key
        )
    )
  );
}
