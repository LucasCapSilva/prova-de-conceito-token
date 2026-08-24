const KEY = "electronica:alerts";

export interface PriceAlert {
  productId: string;
  target: number;
  createdAt: string;
}

function read(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (a): a is PriceAlert =>
        Boolean(a) &&
        typeof a === "object" &&
        typeof (a as PriceAlert).productId === "string" &&
        typeof (a as PriceAlert).target === "number"
    );
  } catch {
    return [];
  }
}

function write(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(alerts));
  } catch {
    /* storage indisponível — ignora */
  }
}

/** Todos os alertas de preço persistidos. */
export function getAlerts(): PriceAlert[] {
  return read();
}

/** Alerta do produto, se existir. */
export function getAlert(productId: string): PriceAlert | undefined {
  return read().find((a) => a.productId === productId);
}

/** Cria (ou substitui) o alerta do produto com o preço-alvo informado. */
export function addAlert(productId: string, target: number): PriceAlert {
  const next: PriceAlert = {
    productId,
    target,
    createdAt: new Date().toISOString(),
  };
  write([next, ...read().filter((a) => a.productId !== productId)]);
  return next;
}

/** Atualiza apenas o preço-alvo do alerta. */
export function setAlertTarget(productId: string, target: number) {
  write(
    read().map((a) =>
      a.productId === productId ? { ...a, target } : a
    )
  );
}

/** Remove o alerta do produto. */
export function removeAlert(productId: string) {
  write(read().filter((a) => a.productId !== productId));
}
