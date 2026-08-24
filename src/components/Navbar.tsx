import { useState, useMemo, useRef, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartCore";
import { useFavorites } from "../context/favoritesCore";
import { useAuth } from "../context/authCore";
import { PRODUCTS, CATEGORIES } from "../data/products";
import { formatBRL } from "../lib/format";
import {
  getNotifPrefs,
  NOTIF_PREFS_EVENT,
  type NotifKind,
} from "../lib/notifs";
import {
  clearSearchHistory,
  getSearchHistory,
  pushSearchHistory,
  removeSearchHistory,
} from "../lib/searchHistory";
import { useTheme } from "../lib/theme";
import SmartImage from "./SmartImage";
import ShortcutsHelp from "./ShortcutsHelp";
import MegaMenu from "./MegaMenu";

const TOP_LINKS = [
  { to: "/produtos", label: "Vender" },
  { to: "/ajuda", label: "Central de Ajuda" },
  { to: "/pedidos", label: "Meus pedidos" },
  { to: "/favoritos", label: "Favoritos" },
];

const NOTIFS: {
  id: number;
  icon: string;
  title: string;
  body: string;
  to: string;
  kind: NotifKind;
}[] = [
  {
    id: 1,
    icon: "🎉",
    title: "Bem-vindo à Electronica Store!",
    body: "Use o cupom BEMVINDO10 para 10% off na primeira compra.",
    to: "/produtos",
    kind: "promocoes",
  },
  {
    id: 2,
    icon: "🔥",
    title: "Ofertas relâmpago do dia",
    body: "Descontos em smartphones e áudio hoje até 21h.",
    to: "/categoria/smartphones",
    kind: "promocoes",
  },
  {
    id: 3,
    icon: "🚚",
    title: "Frete grátis",
    body: "Pedidos acima de R$ 999 têm frete grátis para todo o Brasil.",
    to: "/produtos",
    kind: "pedidos",
  },
  {
    id: 4,
    icon: "📩",
    title: "Nova mensagem do vendedor",
    body: "VoltTech Oficial respondeu à sua pergunta no chat.",
    to: "/loja/seller-volttech",
    kind: "mensagens",
  },
];

const NOTIFS_KEY = "electronica:notifs:seen";

interface Item {
  key: string;
  kind: "product" | "category" | "search";
  label: string;
  to: string;
  price?: string;
  image?: string;
}

export default function Navbar() {
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const [prefs, setPrefs] = useState(() => getNotifPrefs());
  const [seen, setSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NOTIFS_KEY) !== null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const on = () => setPrefs(getNotifPrefs());
    window.addEventListener(NOTIF_PREFS_EVENT, on);
    return () => window.removeEventListener(NOTIF_PREFS_EVENT, on);
  }, []);

  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const [theme, toggleTheme] = useTheme();

  const visibleNotifs = NOTIFS.filter((n) => prefs[n.kind]);
  const unread = seen ? 0 : visibleNotifs.length;

  const openNotifs = () => {
    setNotifOpen(true);
    if (!seen) {
      setSeen(true);
      try {
        localStorage.setItem(NOTIFS_KEY, "1");
      } catch {
        /* sem storage */
      }
    }
  };

  const suggestions = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const prods = PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(term)
    ).slice(0, 5);
    const cats = CATEGORIES.filter(
      (c) => c.key !== "todos" && c.label.toLowerCase().includes(term)
    ).slice(0, 2);
    return [
      ...prods.map<Item>((p) => ({
        key: `p-${p.id}`,
        kind: "product",
        label: p.name,
        to: `/produto/${p.id}`,
        price: formatBRL(p.price),
        image: p.image,
      })),
      ...cats.map<Item>((c) => ({
        key: `c-${c.key}`,
        kind: "category",
        label: c.label,
        to: `/categoria/${c.key}`,
      })),
      {
        key: "s",
        kind: "search",
        label: `Buscar por "${q.trim()}"`,
        to: `/busca?q=${encodeURIComponent(q.trim())}`,
      },
    ];
  }, [q]);

  const shown = open && suggestions.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current && !boxRef.current.contains(t)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(t))
        setNotifOpen(false);
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(t)
      )
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (notifOpen) {
        setNotifOpen(false);
        notifBtnRef.current?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
        menuBtnRef.current?.focus();
      } else if (open) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen, menuOpen, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      if (typing) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) setHistory(pushSearchHistory(term));
    navigate(term ? `/busca?q=${encodeURIComponent(term)}` : "/produtos");
    setOpen(false);
  };

  const chooseHistory = (term: string) => {
    setHistory(pushSearchHistory(term));
    setQ(term);
    setOpen(false);
    navigate(`/busca?q=${encodeURIComponent(term)}`);
  };

  const historyShown = open && q.trim() === "" && history.length > 0;

  const choose = (item: Item) => {
    setOpen(false);
    if (item.kind !== "search") setQ(item.label);
    navigate(item.to);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shown) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" && q.trim() && suggestions.length) {
        e.preventDefault();
        setOpen(true);
        setActive(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) choose(suggestions[active]);
      else submit(e);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-header-from to-header-to">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hidden items-center justify-end gap-5 py-1.5 text-xs text-white/85 sm:flex">
          {TOP_LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 py-2.5 sm:flex-nowrap sm:gap-6 sm:py-3">
          <Link
            to="/"
            className="order-1 flex shrink-0 items-center gap-1.5 text-white"
            aria-label="electronica"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            <span className="text-xl font-bold tracking-tight">
              electronica
            </span>
          </Link>

          <MegaMenu />

          <div ref={boxRef} className="relative order-3 w-full sm:order-2 sm:flex-1 sm:max-w-2xl">
            <form onSubmit={submit} className="relative">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  const has = e.target.value.trim().length > 0;
                  setOpen(has);
                  setActive(0);
                }}
                onKeyDown={onKey}
                onFocus={() => {
                  setOpen(true);
                  setActive(0);
                }}
                placeholder="Buscar produtos, marcas e muito mais..."
                aria-label="Buscar"
                role="combobox"
                aria-expanded={shown || historyShown}
                aria-autocomplete="list"
                aria-controls="busca-listbox"
                className="h-11 w-full rounded-[4px] bg-white pl-4 pr-14 text-sm text-ink outline-none placeholder:text-ink-soft/70"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-[2px] bg-brand text-white transition-colors hover:bg-brand-dark"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>

            {shown && (
              <ul
                id="busca-listbox"
                role="listbox"
                aria-label="Sugestões"
                className="absolute top-full z-50 mt-1 max-h-80 w-full overflow-auto rounded-[4px] bg-surface py-1 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
              >
                {suggestions.map((item, i) => (
                  <li key={item.key} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                        i === active
                          ? "bg-brand-soft"
                          : "hover:bg-brand-soft"
                      }`}
                    >
                      {item.kind === "product" && item.image ? (
                        <SmartImage
                          src={item.image}
                          alt=""
                          className="size-8 shrink-0 rounded-[3px] object-cover"
                        />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-[3px] bg-ink-soft/10 text-base">
                          {item.kind === "category" ? "🗂" : "🔎"}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ink">
                          {item.label}
                        </span>
                        {item.kind === "category" && (
                          <span className="block text-[11px] text-ink-soft">
                            Categoria
                          </span>
                        )}
                      </span>
                      {item.price && (
                        <span className="shrink-0 text-xs font-semibold text-brand">
                          {item.price}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {historyShown && (
              <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-[4px] bg-surface shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between border-b border-line px-3 py-2">
                  <span className="text-xs font-bold text-ink">
                    Buscas recentes
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistory(clearSearchHistory())}
                    className="text-[11px] font-semibold text-ink-soft hover:text-brand"
                  >
                    Limpar tudo
                  </button>
                </div>
                <ul>
                  {history.map((term) => (
                    <li
                      key={term}
                      className="flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => chooseHistory(term)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left text-ink hover:text-brand"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-ink-soft"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                        <span className="truncate">{term}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${term} do histórico`}
                        onClick={() => setHistory(removeSearchHistory(term))}
                        className="shrink-0 text-ink-soft hover:text-brand"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 6 18 18" />
                          <path d="M18 6 6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="order-2 ml-auto flex items-center gap-1 sm:order-3 sm:gap-2">
            <button
              type="button"
              ref={menuBtnRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="menu-movel"
              className="grid size-11 place-items-center text-white"
            >
              {menuOpen ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>

            <Link
              to="/favoritos"
              aria-label="Favoritos"
              className="relative grid size-11 shrink-0 place-items-center text-white"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={favCount > 0 ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20.5 4.6 13a4.7 4.7 0 0 1 6.6-6.6L12 6l.8-.6A4.7 4.7 0 0 1 19.4 13L12 20.5z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -right-1 top-0 grid min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold leading-5 text-brand ring-1 ring-white/40">
                  {favCount}
                </span>
              )}
            </Link>

            <div ref={notifRef} className="relative">
              <button
                type="button"
                ref={notifBtnRef}
                onClick={() => (notifOpen ? setNotifOpen(false) : openNotifs())}
                aria-label="Notificações"
                aria-expanded={notifOpen}
                aria-controls={notifOpen ? "painel-notif" : undefined}
                className="relative grid size-11 place-items-center text-white"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -right-1 top-0 grid min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold leading-5 text-brand ring-1 ring-white/40">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  id="painel-notif"
                  role="region"
                  aria-label="Notificações"
                  className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-[6px] bg-surface text-left shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex items-center justify-between border-b border-line px-3 py-2">
                    <span className="text-sm font-bold text-ink">
                      Notificações
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      {visibleNotifs.length} avisos
                    </span>
                  </div>
                  {visibleNotifs.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-ink-soft">
                      Nenhuma notificação ativa. Ajuste suas preferências.
                    </p>
                  )}
                  <ul>
                    {visibleNotifs.map((n) => (
                      <li key={n.id}>
                        <Link
                          to={n.to}
                          onClick={() => setNotifOpen(false)}
                          className="flex gap-3 px-3 py-2.5 text-sm hover:bg-brand-soft"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-soft/10 text-lg">
                            {n.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-ink">
                              {n.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-soft">
                              {n.body}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
              className="grid size-11 place-items-center text-white"
            >
              {theme === "light" ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              )}
            </button>

            {user ? (
              <Link
                to="/entrar"
                aria-label="Minha conta"
                className="hidden items-center gap-1.5 pl-1 text-sm text-white md:flex"
              >
                <span className="grid size-8 place-items-center rounded-full bg-white/25 text-base">
                  👤
                </span>
                <span className="max-w-28 truncate font-semibold">
                  {user.name}
                </span>
              </Link>
            ) : (
              <Link
                to="/entrar"
                aria-label="Entrar"
                className="grid size-11 place-items-center text-white"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </Link>
            )}

            <Link
              to="/carrinho"
              aria-label="Carrinho"
              className="relative grid size-11 shrink-0 place-items-center text-white"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1.4" />
                <circle cx="19" cy="21" r="1.4" />
                <path d="M2.5 3h2l2.2 12.5a1.5 1.5 0 0 0 1.5 1.2h9.7a1.5 1.5 0 0 0 1.5-1.2L19.5 7H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 top-0 grid min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold leading-5 text-brand ring-1 ring-white/40">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="menu-movel"
          ref={menuRef}
          aria-label="Menu principal"
          className="absolute inset-x-0 top-full border-t border-white/15 bg-header-from shadow-lg sm:hidden"
        >
          <ul className="mx-auto max-w-7xl px-4 py-1 sm:px-6">
            {TOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-white/10 px-1 py-3 text-sm text-white transition-colors last:border-0 hover:bg-white/10"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/produtos"
                onClick={() => setMenuOpen(false)}
                className="block px-1 py-3 text-sm text-white transition-colors hover:bg-white/10"
              >
                Todas as categorias
              </Link>
            </li>
          </ul>
        </nav>
      )}

      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
