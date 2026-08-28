import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProduct, type Product } from "../data/products";
import { useCart } from "../context/cartCore";
import { useToasts } from "../context/toastsCore";
import { decodeSharePayload } from "../lib/share";
import { getLists, addProductToList, type SaveList } from "../lib/lists";
import { formatBRL } from "../lib/format";
import SmartImage from "../components/SmartImage";
import EmptyState from "../components/EmptyState";
import type { ShareEntry } from "../lib/share";

interface ResolvedItem {
  product: Product;
  qty: number;
}

export default function SharedList() {
  const [params] = useSearchParams();
  const code = params.get("d") ?? "";
  const { addItem } = useCart();
  const { toast } = useToasts();
  const [, setTick] = useState(0);
  const [lists, setLists] = useState<SaveList[]>(() => getLists());
  const refresh = () => {
    setLists(getLists());
    setTick((t) => t + 1);
  };

  const payload = useMemo<ShareEntry[]>(() => decodeSharePayload(code), [code]);

  const resolved = useMemo<ResolvedItem[]>(
    () =>
      payload
        .map((e) => ({ product: getProduct(e.id), qty: e.qty }))
        .filter((x): x is ResolvedItem => Boolean(x.product)),
    [payload]
  );
  const missingCount = payload.length - resolved.length;
  const total = resolved.reduce((acc, r) => acc + r.qty * r.product.price, 0);
  const unitTotal = resolved.reduce((acc, r) => acc + r.qty, 0);

  const addToCart = () => {
    resolved.forEach((r) => addItem(r.product, r.qty));
    toast.success(`${resolved.length} item(ns) adicionados ao carrinho.`);
  };

  const copyToList = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    resolved.forEach((r) => addProductToList(listId, r.product.id));
    toast.success(`${resolved.length} item(ns) copiados para "${list.name}".`);
    refresh();
  };

  if (!code) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <EmptyState
          icon="heart"
          title="Nada para ver por aqui"
          message="Este link não contém nenhuma lista compartilhada. Confira o catálogo e encontre seus próximos produtos."
          cta={{ to: "/produtos", label: "Explorar produtos" }}
        />
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
        <EmptyState
          icon="search"
          title="Não encontramos produtos neste link"
          message={
            "Os itens compartilhados não existem mais (ou o link está incompleto). Explore o catálogo para encontrar algo similar."
          }
          cta={{ to: "/produtos", label: "Explorar produtos" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Lista compartilhada
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Alguém compartilhou {resolved.length}{" "}
        {resolved.length === 1 ? "produto" : "produtos"} com você.
      </p>

      {missingCount > 0 && (
        <div
          role="alert"
          className="mt-5 rounded-[6px] border border-[#D93026]/30 bg-brand-soft px-4 py-3 text-sm font-semibold text-[#D93026]"
        >
          {missingCount}{" "}
          {missingCount === 1
            ? "item desta lista não existe mais"
            : "itens desta lista não existem mais"}{" "}
          e não pôde ser mostrado.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {resolved.map((r) => (
          <li
            key={r.product.id}
            className="card flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:p-4"
          >
            <Link
              to={`/produto/${r.product.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <SmartImage
                src={r.product.image}
                alt={r.product.name}
                width={72}
                height={72}
                className="size-16 shrink-0 rounded-[4px] border border-line object-cover sm:size-[72px]"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink sm:text-base">
                  {r.product.name}
                </p>
                <p className="mt-0.5 text-sm font-bold text-brand">
                  {formatBRL(r.product.price)}
                </p>
              </div>
            </Link>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-sm font-semibold text-ink-soft">
                {r.qty} un
              </span>
              <span className="text-sm font-bold text-ink">
                {formatBRL(r.qty * r.product.price)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-ink-soft">
            Total ({unitTotal} {unitTotal === 1 ? "unidade" : "unidades"})
          </p>
          <p className="text-2xl font-black text-brand">
            {formatBRL(total)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {lists.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                copyToList(e.target.value);
              }}
              aria-label="Copiar produtos para uma das minhas listas"
              className="rounded-[6px] border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
            >
              <option value="">Copiar para lista…</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={addToCart}
            className="btn-brand rounded-[6px] px-5 py-2.5 text-sm font-bold"
          >
            Adicionar tudo ao carrinho
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        Preços e estoque podem ter mudado desde o compartilhamento.{" "}
        <Link to="/produtos" className="font-semibold text-brand hover:underline">
          Ver catálogo
        </Link>
      </p>
    </div>
  );
}
