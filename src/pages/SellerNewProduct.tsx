import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authCore";
import { useToasts } from "../context/toastsCore";
import { getSeller } from "../data/sellers";
import SellerGate from "../components/SellerGate";
import { BRANDS, CATEGORIES, type Category } from "../data/products";
import { createSellerProduct } from "../lib/sellerOverrides";

const CATS = CATEGORIES.filter((c) => c.key !== "todos");

const inputCls =
  "w-full rounded-[3px] border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default function SellerNewProduct() {
  const { user } = useAuth();
  const seller = user?.sellerId ? getSeller(user.sellerId) : undefined;
  const navigate = useNavigate();
  const { toast } = useToasts();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("audio");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [imagesText, setImagesText] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user || !user.sellerId || !seller) {
    return (
      <SellerGate
        icon="🏪"
        title="Área do vendedor"
        description="Cadastre produtos novos na sua loja."
      />
    );
  }

  const sellerId = user.sellerId;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 3)
      errs.name = "Informe um nome com pelo menos 3 caracteres.";
    if (brand.trim() === "") errs.brand = "Informe a marca do produto.";
    const priceNum = Number(price.replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      errs.price = "Informe um preço válido maior que zero.";
    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0)
      errs.stock = "Informe uma quantidade inteira, zero ou maior.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const images = imagesText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    const highlights = highlightsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "")
      .slice(0, 5);

    const product = createSellerProduct(sellerId, {
      name: n,
      category,
      brand: brand.trim(),
      price: priceNum,
      stock: stockNum,
      images,
      highlights,
    });
    toast.success(`Produto "${product.name}" cadastrado com sucesso.`);
    navigate("/vendedor/produtos");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6">
      <nav aria-label="Trilha de navegação" className="mb-4 text-xs">
        <Link to="/vendedor/produtos" className="hover:text-[var(--brand)]">
          Meus produtos
        </Link>
        <span aria-hidden="true" className="mx-2 text-[var(--ink-soft)]">
          /
        </span>
        <span aria-current="page">Novo produto</span>
      </nav>

      <section className="card max-w-2xl p-6 sm:p-8">
        <h1 className="text-xl font-bold">Cadastrar novo produto</h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          O anúncio entra no catálogo da loja{" "}
          <span className="font-medium text-[var(--ink)]">{seller.name}</span>{" "}
          assim que você concluir.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <div>
            <label htmlFor="np-name" className="mb-1 block text-sm font-medium">
              Nome do produto
            </label>
            <input
              id="np-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Fone Bluetooth X200 com cancelamento de ruído"
            />
            {errors.name && (
              <p role="alert" className="mt-1 text-xs text-[#D73211]">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="np-category"
                className="mb-1 block text-sm font-medium"
              >
                Categoria
              </label>
              <select
                id="np-category"
                className={inputCls}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="np-brand"
                className="mb-1 block text-sm font-medium"
              >
                Marca
              </label>
              <input
                id="np-brand"
                list="np-brands"
                className={inputCls}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex.: TecnoMax"
              />
              <datalist id="np-brands">
                {BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.brand && (
                <p role="alert" className="mt-1 text-xs text-[#D73211]">
                  {errors.brand}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="np-price"
                className="mb-1 block text-sm font-medium"
              >
                Preço (R$)
              </label>
              <input
                id="np-price"
                type="number"
                min="0.01"
                step="0.01"
                className={inputCls}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
              />
              {errors.price && (
                <p role="alert" className="mt-1 text-xs text-[#D73211]">
                  {errors.price}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="np-stock"
                className="mb-1 block text-sm font-medium"
              >
                Estoque
              </label>
              <input
                id="np-stock"
                type="number"
                min="0"
                step="1"
                className={inputCls}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
              {errors.stock && (
                <p role="alert" className="mt-1 text-xs text-[#D73211]">
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="np-images"
              className="mb-1 block text-sm font-medium"
            >
              Imagens (uma URL por linha)
            </label>
            <textarea
              id="np-images"
              className={`${inputCls} min-h-20 resize-y`}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://…/foto-1.jpg\nhttps://…/foto-2.jpg"}
            />
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              A primeira linha vira a imagem principal. Deixe vazio para usarmos
              uma imagem de exemplo.
            </p>
          </div>

          <div>
            <label
              htmlFor="np-highlights"
              className="mb-1 block text-sm font-medium"
            >
              Destaques (um por linha, até 5)
            </label>
            <textarea
              id="np-highlights"
              className={`${inputCls} min-h-20 resize-y`}
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              placeholder={"Bateria de 40 h\nResistente à água (IPX7)"}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-brand px-6 py-2.5 text-sm">
              Cadastrar produto
            </button>
            <Link
              to="/vendedor/produtos"
              className="text-sm text-[var(--ink-soft)] hover:text-[var(--brand)]"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
