import { Link, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  PRODUCTS,
  getProduct,
  CATEGORIES,
  installmentsFor,
  type Product,
} from "../data/products";
import {
  isSelectionComplete,
  missingGroups,
  selectionPriceDelta,
  stockForSelection,
  variantKeyFromSelection,
  type VariantSelection,
} from "../lib/variants";
import { useCart } from "../context/cartCore";
import { useFavorites } from "../context/favoritesCore";
import { formatBRL, formatInstallments } from "../lib/format";
import ProductCard from "../components/ProductCard";
import SellerBlock from "../components/SellerBlock";
import ProductReviews from "../components/ProductReviews";
import Questions from "../components/Questions";
import RecentlyViewed from "../components/RecentlyViewed";
import Breadcrumbs from "../components/Breadcrumbs";
import ShareButton from "../components/ShareButton";
import { ProductDetailSkeleton } from "../components/Skeleton";
import { addViewed } from "../lib/recent";
import { useSimulatedLoading } from "../lib/useLoading";
import {
  addAlert,
  getAlert,
  removeAlert,
  setAlertTarget,
  type PriceAlert,
} from "../lib/alerts";

export default function ProductDetail() {
  const { id } = useParams();
  return <Detail key={id ?? ""} id={id ?? ""} />;
}

function Detail({ id }: { id: string }) {
  const product = getProduct(id);
  const { addItem, count } = useCart();
  const { isFavorite, toggle: toggleFav } = useFavorites();
  const fav = isFavorite(id);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [selection, setSelection] = useState<VariantSelection>({});
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [alert, setAlert] = useState<PriceAlert | null>(() => getAlert(id) ?? null);
  const [targetDraft, setTargetDraft] = useState<string>(() => {
    const a = getAlert(id);
    return a ? String(a.target) : "";
  });
  const loading = useSimulatedLoading(600);

  const related = useMemo<Product[]>(
    () =>
      product
        ? PRODUCTS.filter(
            (p) => p.category === product.category && p.id !== product.id
          ).slice(0, 8)
        : [],
    [product]
  );

  useEffect(() => {
    if (product) addViewed(product.id);
  }, [product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-32 pb-12 text-center">
        <p className="text-2xl font-semibold text-ink">
          Produto não encontrado.
        </p>
        <Link to="/produtos" className="mt-4 inline-block text-brand hover:underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  if (loading) return <ProductDetailSkeleton />;

  const gallery = [
    product.image,
    ...product.gallery.filter((g) => g !== product.image),
  ];
  const catLabel =
    CATEGORIES.find((c) => c.key === product.category)?.label ?? "Todos";

  const hasVariants = (product.variants?.length ?? 0) > 0;
  const complete = isSelectionComplete(product, selection);
  const unitPrice =
    Math.round((product.price + selectionPriceDelta(product, selection)) * 100) / 100;
  const stock = stockForSelection(product, selection);
  const missing = missingGroups(product, selection);
  const maxQty = Math.max(1, stock);
  const unitInstallments = installmentsFor(unitPrice);

  const pickOption = (groupId: string, optionId: string) => {
    const next = { ...selection, [groupId]: optionId };
    setSelection(next);
    const max = Math.max(1, stockForSelection(product, next));
    setQty((q) => Math.max(1, Math.min(q, max)));
  };

  const createAlert = () => {
    const target = Math.round(product.price * 0.9);
    setAlert(addAlert(product.id, target));
    setTargetDraft(String(target));
  };

  const saveTarget = () => {
    const n = Number(targetDraft.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    const t = Math.round(n * 100) / 100;
    setAlertTarget(product.id, t);
    const a = getAlert(product.id);
    if (a) setAlert(a);
  };

  const removeA = () => {
    removeAlert(product.id);
    setAlert(null);
  };

  const onZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ox = ((e.clientX - r.left) / r.width) * 100;
    const oy = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${ox.toFixed(1)}% ${oy.toFixed(1)}%`);
  };

  const add = () => {
    addItem(product, qty, variantKeyFromSelection(product, selection));
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 sm:pt-28">
      <Breadcrumbs
        items={[
          { label: "Início", to: "/" },
          { label: catLabel, to: `/categoria/${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Galeria */}
        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-start">
          <div className="relative w-full sm:flex-1">
            <div
              className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface"
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={onZoomMove}
            >
              <div
                className="size-full"
                style={{
                  transform: zoom ? "scale(1.8)" : undefined,
                  transformOrigin: origin,
                  transition: "transform 0.25s ease",
                }}
              >
                <img
                  src={gallery[imgIdx]}
                  alt={product.name}
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.dataset.f) return;
                    t.dataset.f = "1";
                    t.src =
                      FALLBACK_PRODUCT_IMAGE(product.category);
                  }}
                  className="size-full object-cover"
                />
              </div>
              {product.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:w-20 sm:flex-col">
            {gallery.map((g, i) => (
              <button
                key={g + i}
                type="button"
                onClick={() => setImgIdx(i)}
                aria-label={`Ver imagem ${i + 1}`}
                className={`size-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === imgIdx
                    ? "border-brand"
                    : "border-line hover:border-ink-soft"
                }`}
              >
                <img
                  src={g}
                  alt=""
                  className="size-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    if (t.dataset.f) return;
                    t.dataset.f = "1";
                    t.src = FALLBACK_PRODUCT_IMAGE(product.category);
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.badge && (
            <span className="mb-2 inline-block rounded bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
              {product.badge}
            </span>
          )}
          <h1 className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-star">★</span>
            <span className="font-semibold text-ink">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-ink-soft">
              · {product.reviews} avaliações · {product.sold} vendidos
            </span>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            {product.oldPrice && (
              <span className="text-sm text-ink-soft line-through">
                {formatBRL(product.oldPrice)}
              </span>
            )}
            <div className="text-3xl font-bold text-ink">
              {formatBRL(unitPrice)}
              {discount > 0 && (
                <span className="ml-2 align-middle text-sm font-semibold text-brand">
                  -{discount}%
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink">
              {formatInstallments(unitInstallments)}
            </p>
          </div>

          <div className="mt-3 border-t border-line pt-3">
            {alert === null ? (
              <button
                type="button"
                onClick={createAlert}
                className="text-sm font-semibold text-brand hover:underline"
              >
                🔔 Avisar quando o preço baixar
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="font-semibold text-ink">🔔 Aviso ativo</span>
                <label className="flex items-center gap-1 text-ink-soft">
                  ≤
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={targetDraft}
                    onChange={(e) => setTargetDraft(e.target.value)}
                    aria-label="Preço-alvo do alerta"
                    className="h-8 w-24 rounded-[4px] border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-brand"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveTarget}
                  className="font-semibold text-brand hover:underline"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={removeA}
                  className="font-semibold text-ink-soft hover:text-brand hover:underline"
                >
                  Remover
                </button>
                {product.price <= alert.target && (
                  <span className="rounded-[4px] bg-ship/15 px-2 py-0.5 text-xs font-bold text-ship">
                    ✓ Preço-alvo alcançado
                  </span>
                )}
              </div>
            )}
          </div>

          {hasVariants && product.variants && (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              {product.variants.map((g) => {
                const isColor = g.options.some((o) => o.hex);
                const chosen = g.options.find((o) => o.id === selection[g.id]);
                return (
                  <div key={g.id}>
                    <p className="mb-2 text-sm font-semibold text-ink">
                      {g.label}
                      {chosen && (
                        <span className="ml-2 font-normal text-ink-soft">
                          {chosen.name}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {g.options.map((o) => {
                        const active = selection[g.id] === o.id;
                        const soldOut = o.stock === 0;
                        if (isColor) {
                          return (
                            <button
                              key={o.id}
                              type="button"
                              disabled={soldOut}
                              onClick={() => pickOption(g.id, o.id)}
                              aria-label={`Cor ${o.name}${soldOut ? " (esgotada)" : ""}`}
                              title={soldOut ? `${o.name} — esgotado` : o.name}
                              className={`relative size-10 shrink-0 rounded-full border-2 transition ${
                                active
                                  ? "border-brand ring-2 ring-brand/30"
                                  : "border-line hover:border-ink-soft"
                              } ${soldOut ? "cursor-not-allowed opacity-40" : ""}`}
                              style={{ backgroundColor: o.hex ?? "#DDD" }}
                            >
                              {soldOut && (
                                <span className="absolute inset-0 grid place-items-center text-sm text-white">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        }
                        return (
                          <button
                            key={o.id}
                            type="button"
                            disabled={soldOut}
                            onClick={() => pickOption(g.id, o.id)}
                            className={`rounded-[4px] border px-3 py-1.5 text-sm transition ${
                              active
                                ? "border-brand bg-brand-soft font-semibold text-brand"
                                : "border-line bg-surface text-ink hover:border-brand hover:text-brand"
                            } ${soldOut ? "cursor-not-allowed line-through text-ink-soft opacity-60" : ""}`}
                          >
                            {o.name}
                            {typeof o.priceDelta === "number" && o.priceDelta > 0
                              ? ` (+${formatBRL(o.priceDelta)})`
                              : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <ul className="mt-4 grid grid-cols-2 gap-1.5 text-sm text-ink">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-center gap-1.5">
                <span className="text-ship">✓</span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {stock === 0 ? (
              <span className="font-semibold text-ink">
                Esgotado na combinação selecionada
              </span>
            ) : stock <= 15 ? (
              <span className="font-semibold text-brand">
                🔥 Últimas {stock} unidades!
              </span>
            ) : (
              <span className="font-medium text-ship">✓ Em estoque</span>
            )}
            <span className="text-ink-soft">
              · {product.sold.toLocaleString("pt-BR")} vendidos
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-soft">Quantidade:</span>
            <div className="flex items-center rounded border border-line">
              <button
                type="button"
                aria-label="Diminuir"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 text-lg text-ink"
              >
                −
              </button>
              <span className="w-8 text-center text-ink">{qty}</span>
              <button
                type="button"
                aria-label="Aumentar"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="px-3 text-lg text-ink"
              >
                +
              </button>
            </div>
            {qty >= maxQty && stock > 0 && (
              <span className="text-xs text-ink-soft">
                Máx. {stock} unidades disponíveis
              </span>
            )}
          </div>

          {stock === 0 ? (
            <p className="mt-3 text-sm font-semibold text-ink">
              Variação esgotada — escolha outra opção
            </p>
          ) : !complete ? (
            <p className="mt-3 text-sm text-ink-soft">
              Selecione: {missing.join(", ")}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={add}
              disabled={added || stock === 0 || !complete}
              className="btn-brand rounded px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {added
                ? `Adicionado (${count} no carrinho)`
                : "Adicionar ao carrinho"}
            </button>
            <Link
              to="/carrinho"
              className="flex items-center justify-center rounded border border-brand px-5 py-3 font-semibold text-brand hover:bg-brand-soft"
            >
              Ver carrinho
            </Link>
            <button
              type="button"
              onClick={() => toggleFav(id)}
              aria-pressed={fav}
              aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"}
              className={`grid size-12 place-items-center rounded-[6px] border text-xl font-bold transition ${
                fav
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              {fav ? "♥" : "♡"}
            </button>
            <ShareButton />
          </div>
        </div>
      </div>

      <SellerBlock product={product} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-ink">
            Você também pode gostar
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {related.map((p, i) => (
              <div key={p.id} className="w-44 shrink-0 sm:w-52">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      <Questions product={product} />

      <ProductReviews productId={product.id} />

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}

function FALLBACK_PRODUCT_IMAGE(category: Product["category"]) {
  const kws: Record<Product["category"], string> = {
    audio: "headphones",
    mobile: "iphone",
    computadores: "laptop",
    wearables: "smartwatch",
    gamer: "gaming-setup",
    casa: "smart-speaker",
  };
  return `https://loremflickr.com/900/900/${kws[category] ?? "electronics"}`;
}
