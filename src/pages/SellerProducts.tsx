import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { getSeller } from "../data/sellers";
import { PRODUCTS, type Product } from "../data/products";
import { formatBRL } from "../lib/format";
import { saveOverride, type SellerOverride } from "../lib/sellerOverrides";
import { useToasts } from "../context/toastsCore";
import SellerGate from "../components/SellerGate";

type SortKey = "name" | "price-desc" | "price-asc" | "stock-desc";

function EditProductForm({
  product,
  onDone,
  onCancel,
}: {
  product: Product;
  onDone: (productId: string, patch: SellerOverride) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [featured, setFeatured] = useState(Boolean(product.featured));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = Number(price.replace(",", "."));
    const s = Number(stock);
    if (!Number.isFinite(p) || p <= 0 || !Number.isInteger(s) || s < 0) return;
    onDone(product.id, { price: p, stock: s, featured });
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-md border border-line bg-page p-4">
      <p className="text-sm font-bold text-ink">
        Editar produto
        <span className="ml-2 font-normal text-ink-soft">{product.name}</span>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-[11px] font-semibold text-ink-soft">
          Preço (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="text-[11px] font-semibold text-ink-soft">
          Estoque (unidades)
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            className="mt-1 w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="size-4 accent-(--brand)"
          />
          Exibir como destaque
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
        >
          Salvar alterações
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[6px] border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-page"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function statusOf(p: Product) {
  if (p.stock === 0) return { label: "Esgotado", cls: "bg-line text-ink-soft" };
  if (p.oldPrice)
    return { label: "Em promoção", cls: "bg-brand-soft text-brand" };
  return { label: "Ativo", cls: "bg-ship/15 text-ship" };
}

export default function SellerProducts() {
  const { user } = useAuth();
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [editId, setEditId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkKind, setBulkKind] = useState<"stock" | "price">("stock");
  const [bulkDir, setBulkDir] = useState<"up" | "down">("up");
  const [bulkPct, setBulkPct] = useState("");
  const { toast } = useToasts();

  function toggleSelected(id: string) {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id],
    );
  }

  function toggleAll() {
    setSelected(
      rows.every((r) => selected.includes(r.id)) ? [] : rows.map((r) => r.id),
    );
  }

  function applyBulk() {
    const val = Number(bulkPct.replace(",", "."));
    if (!Number.isFinite(val) || val <= 0 || val > 100) return;
    const factor = bulkDir === "up" ? 1 + val / 100 : 1 - val / 100;
    for (const id of selected) {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) continue;
      if (bulkKind === "stock") {
        saveOverride(id, { stock: Math.max(0, Math.round(p.stock * factor)) });
      } else {
        saveOverride(id, {
          price: Math.max(0.01, Math.round(p.price * factor * 100) / 100),
        });
      }
    }
    const n = selected.length;
    setSelected([]);
    setBulkPct("");
    setTick((t) => t + 1);
    toast.success(
      `${n} produto(s) ajustado(s): ${bulkKind === "stock" ? "estoque" : "preço"} ${bulkDir === "up" ? "aumentado" : "reduzido"} em ${val}%.`,
    );
  }

  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;

  const rows: Product[] = !seller
    ? []
    : (() => {
        const t = term.trim().toLowerCase();
        const list = PRODUCTS.filter(
          (p) =>
            p.sellerId === seller.id &&
            (!t ||
              p.name.toLowerCase().includes(t) ||
              p.brand.toLowerCase().includes(t)),
        );
        list.sort((a, b) => {
          switch (sort) {
            case "price-desc":
              return b.price - a.price;
            case "price-asc":
              return a.price - b.price;
            case "stock-desc":
              return b.stock - a.stock;
            default:
              return a.name.localeCompare(b.name, "pt-BR");
          }
        });
        return list;
      })();

  const editProduct = editId
    ? PRODUCTS.find((p) => p.id === editId)
    : undefined;

  if (!user?.sellerId || !seller) {
    return (
      <SellerGate
        icon="🏪"
        title="Meus produtos"
        description="Veja e gerencie os produtos da sua loja."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <header className="mb-6">
        <p className="text-xs font-semibold text-ink-soft">
          Painel do vendedor
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          Meus produtos
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {rows.length} produto(s) de {seller.name}
        </p>
        <nav className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/vendedor"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Painel
          </Link>
          <Link
            to="/vendedor/pedidos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Pedidos
          </Link>
          <Link
            to="/vendedor/perguntas"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Perguntas
          </Link>
          <Link
            to="/vendedor/promos"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Promoções
          </Link>
          <Link
            to="/vendedor/cupons"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Cupons
          </Link>
          <Link
            to="/vendedor/avaliacoes"
            className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Avaliações
          </Link>
        </nav>
        <Link
          to="/vendedor/produtos/novo"
          className="mt-3 inline-flex items-center gap-1 rounded-[6px] bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          <span aria-hidden="true">＋</span> Cadastrar novo produto
        </Link>
      </header>

      <div className="card rounded-lg p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="sr-only">Buscar produto</span>
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar por nome ou marca"
              className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="sm:w-48">
            <span className="sr-only">Ordenar por</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-[6px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
            >
              <option value="name">Nome (A–Z)</option>
              <option value="price-desc">Preço (maior)</option>
              <option value="price-asc">Preço (menor)</option>
              <option value="stock-desc">Estoque (maior)</option>
            </select>
          </label>
        </div>

        {selected.length > 0 && (
          <div className="mt-3 rounded-md border border-brand/40 bg-brand-soft p-3">
            <p className="text-xs font-bold text-ink">
              {selected.length} produto(s) selecionado(s) — ajuste em lote
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-semibold text-ink-soft">
                <span className="sr-only">Campo a ajustar</span>
                <select
                  value={bulkKind}
                  onChange={(e) =>
                    setBulkKind(e.target.value as "stock" | "price")
                  }
                  className="rounded-[6px] border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-brand"
                >
                  <option value="stock">Estoque</option>
                  <option value="price">Preço</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-ink-soft">
                <span className="sr-only">Direção do ajuste</span>
                <select
                  value={bulkDir}
                  onChange={(e) => setBulkDir(e.target.value as "up" | "down")}
                  className="rounded-[6px] border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-brand"
                >
                  <option value="up">Aumentar (+)</option>
                  <option value="down">Reduzir (−)</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-ink-soft">
                <span className="sr-only">Porcentagem</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={bulkPct}
                  onChange={(e) => setBulkPct(e.target.value)}
                  placeholder="Ex.: 10"
                  className="w-20 rounded-[6px] border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none focus:border-brand"
                />
                <span className="ml-1">%</span>
              </label>
              <button
                type="button"
                onClick={applyBulk}
                className="rounded-[6px] bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                Aplicar a todos
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-page"
              >
                Limpar seleção
              </button>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="mt-6 grid place-items-center gap-2 rounded-md border border-dashed border-line bg-page p-8 text-center text-sm text-ink-soft">
            <span className="text-2xl" aria-hidden>
              🔍
            </span>
            Nenhum produto encontrado para “{term}”.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold text-ink-soft">
                  <th className="py-2 pr-3">
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 && rows.every((r) => selected.includes(r.id))
                      }
                      onChange={toggleAll}
                      aria-label="Selecionar todos os produtos"
                      className="size-4 accent-(--brand)"
                    />
                  </th>
                  <th className="py-2 pr-3">Produto</th>
                  <th className="py-2 pr-3">Marca</th>
                  <th className="py-2 pr-3">Preço</th>
                  <th className="py-2 pr-3">Estoque</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Editar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = statusOf(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line/70 last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelected(p.id)}
                          aria-label={`Selecionar ${p.name}`}
                          className="size-4 accent-(--brand)"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          to={`/produto/${p.id}`}
                          className="flex items-center gap-3 text-ink"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="size-10 shrink-0 rounded-md border border-line object-cover"
                          />
                          <span className="line-clamp-2 max-w-56 font-semibold">
                            {p.name}
                            {p.featured && (
                              <span className="ml-1 rounded-[3px] bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                                Destaque
                              </span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">{p.brand}</td>
                      <td className="py-3 pr-3 font-bold text-brand">
                        {formatBRL(p.price)}
                      </td>
                      <td className="py-3 pr-3 text-ink-soft">
                        {p.stock} un.
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-[3px] px-2 py-1 text-[11px] font-bold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setEditId(editId === p.id ? null : p.id)
                          }
                          className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                        >
                          {editId === p.id ? "Fechar" : "Editar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editId && editProduct && (
          <EditProductForm
            key={editProduct.id}
            product={editProduct}
            onDone={(pid, patch) => {
              saveOverride(pid, patch);
              setEditId(null);
              setTick((t) => t + 1);
            }}
            onCancel={() => setEditId(null)}
          />
        )}
      </div>
    </div>
  );
}
