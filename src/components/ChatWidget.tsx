import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SELLERS, type Seller } from "../data/sellers";
import {
  appendChat,
  autoReplyFor,
  chatFor,
  type ChatMessage,
} from "../lib/chat";
import SmartImage from "./SmartImage";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lastOf(msgs: ChatMessage[]) {
  return msgs[msgs.length - 1];
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const onCart = pathname === "/carrinho";
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const seller: Seller | undefined = active
    ? SELLERS.find((s) => s.id === active)
    : undefined;
  const messages: ChatMessage[] = active ? chatFor(active) : [];

  const pickSeller = (id: string) => {
    setDraft("");
    setTyping(false);
    setActive(id);
  };

  const backToList = () => {
    setDraft("");
    setTyping(false);
    setActive(null);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, typing, active]);

  const send = () => {
    const text = draft.trim();
    if (!active || !text) return;
    const prev = chatFor(active);
    const userCount = prev.filter((m) => m.from === "user").length;
    appendChat(active, { from: "user", text });
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      appendChat(active, {
        from: "seller",
        text: autoReplyFor(userCount),
      });
      setTyping(false);
    }, 1500);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface pb-[env(safe-area-inset-bottom)] sm:inset-auto sm:bottom-20 sm:right-4 sm:h-auto sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:overflow-hidden sm:rounded-lg sm:shadow-lg sm:pb-0">
          {active && seller ? (
            <>
              <header className="flex items-center gap-2 border-b border-line bg-brand-soft px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:py-2.5 sm:pt-2.5">
                <button
                  type="button"
                  onClick={backToList}
                  aria-label="Voltar para a lista de vendedores"
                  className="text-sm font-bold text-ink hover:text-brand"
                >
                  ←
                </button>
                <SmartImage
                  src={seller.logo}
                  alt=""
                  className="size-8 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {seller.name}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {typing ? "digitando…" : "online"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar chat"
                  className="text-lg font-bold text-ink-soft hover:text-ink sm:hidden"
                >
                  ✕
                </button>
              </header>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto bg-surface px-3 py-3 sm:h-72 sm:flex-none"
              >
                {messages.length === 0 && !typing ? (
                  <p className="py-6 text-center text-xs text-ink-soft">
                    Envie a primeira mensagem para {seller.name}.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={
                          m.from === "user"
                            ? "flex justify-end"
                            : "flex justify-start"
                        }
                      >
                        <span
                          className={
                            m.from === "user"
                              ? "max-w-[85%] rounded-[6px] bg-brand px-3 py-1.5 text-xs text-white"
                              : "max-w-[85%] rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs text-ink"
                          }
                        >
                          {m.text}
                          <span
                            className={
                              m.from === "user"
                                ? "ml-1 text-[10px] text-white/70"
                                : "ml-1 text-[10px] text-ink-soft"
                            }
                          >
                            {timeOf(m.at)}
                          </span>
                        </span>
                      </li>
                    ))}
                    {typing && (
                      <li className="flex justify-start">
                        <span className="rounded-[6px] border border-line bg-white px-3 py-1.5 text-xs text-ink-soft">
                          {seller.name} está digitando…
                        </span>
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <form
                className="flex items-center gap-2 border-t border-line bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:py-2.5 sm:pb-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <label className="sr-only" htmlFor="chat-draft">
                  Mensagem para {seller.name}
                </label>
                <input
                  id="chat-draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Digite sua mensagem…"
                  className="min-w-0 flex-1 rounded-[6px] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand sm:py-1.5 sm:text-xs"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold disabled:opacity-40 sm:px-3 sm:py-1.5 sm:text-xs"
                >
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-line bg-brand-soft px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:py-2.5 sm:pt-2.5">
                <div>
                  <p className="text-sm font-bold text-ink">
                    Chat com vendedores
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    Escolha uma loja para conversar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar chat"
                  className="text-lg font-bold text-ink-soft hover:text-ink sm:hidden"
                >
                  ✕
                </button>
              </header>
              <ul className="min-h-0 flex-1 overflow-y-auto sm:max-h-80 sm:flex-none">
                {SELLERS.map((s) => {
                  const last = lastOf(chatFor(s.id));
                  return (
                    <li
                      key={s.id}
                      className="border-b border-line last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => pickSeller(s.id)}
                        className="flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-brand-soft sm:py-2"
                      >
                        <SmartImage
                          src={s.logo}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover sm:size-9"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink sm:text-xs">
                            {s.name}
                          </span>
                          <span className="block truncate text-xs text-ink-soft sm:text-[11px]">
                            {last ? last.text : "Iniciar conversa…"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chat" : "Abrir chat com vendedores"}
        aria-expanded={open}
        className={`fixed right-4 z-40 h-12 w-12 items-center justify-center rounded-full bg-brand text-xl text-white shadow-lg transition hover:bg-brand-dark ${
          open ? "hidden sm:flex" : "flex"
        } ${onCart ? "bottom-20 lg:bottom-4" : "bottom-4"}`}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
