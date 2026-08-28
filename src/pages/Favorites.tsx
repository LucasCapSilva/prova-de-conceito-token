import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/favoritesCore";
import { useCart } from "../context/cartCore";
import { useToasts } from "../context/toastsCore";
import { getProduct } from "../data/products";
import {
  addProductToList,
  copyProduct,
  createList,
  deleteList,
  getLists,
  moveProduct,
  removeProductFromList,
  renameList,
  type SaveList,
} from "../lib/lists";
import { formatBRL } from "../lib/format";
import { buildShareUrl, copyText } from "../lib/share";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import SmartImage from "../components/SmartImage";

export default function Favorites() {
  const { ids, count } = useFavorites();
  const { addItem } = useCart();
  const { toast } = useToasts();

  const [, setTick] = useState(0);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<SaveList | null>(null);

  const lists = getLists();
  const refresh = () => setTick((t) => t + 1);

  const favorites = useMemo(
    () =>
      ids
        .map((id) => getProduct(id))
        .filter((p): p is NonNullable<ReturnType<typeof getProduct>> =>
          Boolean(p)
        ),
    [ids]
  );

  const addAll = () => favorites.forEach((p) => addItem(p));

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createList(name);
    setNewName("");
    refresh();
    toast.success(`Lista "${name}" criada.`);
  }

  function handleRename(list: SaveList) {
    if (renamingId !== list.id) {
      setRenamingId(list.id);
      setRenameValue(list.name);
      return;
    }
    const name = renameValue.trim();
    if (name && name !== list.name) {
      renameList(list.id, name);
      toast.success("Lista renomeada.");
    }
    setRenamingId(null);
    refresh();
  }

  function handleDelete() {
    if (!deleting) return;
    deleteList(deleting.id);
    toast.success(`Lista "${deleting.name}" excluída.`);
    setDeleting(null);
    refresh();
  }

  async function handleShareList(list: SaveList) {
    const entries = list.productIds.map((id) => ({ id, qty: 1 }));
    if (entries.length === 0) {
      toast.info("A lista está vazia — nada para compartilhar.");
      return;
    }
    const ok = await copyText(buildShareUrl(entries));
    if (ok) toast.success(`Link da lista "${list.name}" copiado.`);
    else toast.error("Não foi possível copiar o link.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 sm:pt-28">
      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Minhas listas
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Crie listas nomeadas, como "presentes" ou "setup novo", e organize
        seus produtos nelas.
      </p>

      <div className="card mt-5 flex flex-col gap-2 rounded-lg p-4 sm:flex-row sm:items-center">
        <label htmlFor="nova-lista" className="text-sm font-semibold text-ink">
          Nova lista
        </label>
        <div className="flex flex-1 gap-2">
          <input
            id="nova-lista"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder='Ex.: Presentes, Setup novo…'
            className="flex-1 rounded-[6px] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold disabled:opacity-60"
          >
            Criar
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {lists.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Você ainda não tem listas"
            message='Crie uma lista acima — por exemplo, "Presentes" — e copie produtos para ela a partir dos favoritos.'
          />
        ) : (
          lists.map((list) => {
            const items = list.productIds
              .map((id) => getProduct(id))
              .filter(
                (p): p is NonNullable<ReturnType<typeof getProduct>> =>
                  Boolean(p)
              );
            const others = lists.filter((l) => l.id !== list.id);
            return (
              <section
                key={list.id}
                className="card rounded-lg p-4 sm:p-5"
                aria-labelledby={`lista-${list.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {renamingId === list.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(list);
                      }}
                    >
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        aria-label="Nome da lista"
                        className="rounded-[6px] border border-brand bg-surface px-2 py-1 text-base font-bold text-ink outline-none"
                      />
                      <button
                        type="submit"
                        className="btn-brand rounded-[6px] px-3 py-1.5 text-sm font-bold"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingId(null)}
                        className="text-sm font-semibold text-ink-soft hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <h2
                      id={`lista-${list.id}`}
                      className="text-lg font-black text-ink"
                    >
                      {list.name}{" "}
                      <span className="text-sm font-semibold text-ink-soft">
                        ({items.length})
                      </span>
                    </h2>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleShareList(list)}
                      aria-label={`Copiar link da lista ${list.name}`}
                      className="text-sm font-semibold text-ink-soft hover:text-brand hover:underline"
                    >
                      Compartilhar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRename(list)}
                      aria-label={`Renomear lista ${list.name}`}
                      className="text-sm font-semibold text-ink-soft hover:text-ink hover:underline"
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(list)}
                      aria-label={`Excluir lista ${list.name}`}
                      className="text-sm font-semibold text-[#D93026] hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-soft">
                    Lista vazia — copie produtos a partir dos favoritos abaixo.{" "}
                    <Link
                      to="/produtos"
                      className="font-semibold text-brand hover:underline"
                    >
                      Explorar produtos
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {items.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-col gap-3 rounded-[6px] border border-line p-3 sm:flex-row sm:items-center"
                      >
                        <Link
                          to={`/produto/${p.id}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <SmartImage
                            src={p.image}
                            alt={p.name}
                            width={56}
                            height={56}
                            className="size-14 shrink-0 rounded-[4px] border border-line object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">
                              {p.name}
                            </p>
                            <p className="text-sm font-bold text-brand">
                              {formatBRL(p.price)}
                            </p>
                          </div>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value=""
                            onChange={(e) => {
                              const value = e.target.value;
                              if (!value) return;
                              const [action, targetId] = value.split(":");
                              if (action === "move") {
                                moveProduct(list.id, targetId, p.id);
                                toast.success(
                                  `${p.name} movido para a lista.`
                                );
                              } else if (action === "copy") {
                                copyProduct(list.id, targetId, p.id);
                                toast.success(
                                  `${p.name} copiado para a lista.`
                                );
                              } else {
                                removeProductFromList(list.id, p.id);
                                toast.success(
                                  `${p.name} removido da lista.`
                                );
                              }
                              refresh();
                            }}
                            aria-label={`Gerenciar ${p.name} na lista ${list.name}`}
                            className="rounded-[6px] border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-brand"
                          >
                            <option value="">Gerenciar…</option>
                            {others.length > 0 && (
                              <optgroup label="Mover para">
                                {others.map((l) => (
                                  <option key={l.id} value={`move:${l.id}`}>
                                    {l.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {others.length > 0 && (
                              <optgroup label="Copiar para">
                                {others.map((l) => (
                                  <option key={l.id} value={`copy:${l.id}`}>
                                    {l.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="remove">Remover da lista</option>
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>

      <div className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-black text-ink">
            Meus favoritos{" "}
            <span className="text-sm font-semibold text-ink-soft">
              ({count})
            </span>
          </h2>
          {favorites.length > 0 && (
            <button
              onClick={addAll}
              className="btn-brand rounded-[6px] px-4 py-2 text-sm font-bold"
            >
              Adicionar todos ao carrinho
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Você ainda não tem favoritos"
            message="Toque no coração de um produto para salvá-lo aqui e acompanhar."
            cta={{ to: "/produtos", label: "Explorar produtos" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {favorites.map((p, i) => (
              <div key={p.id}>
                <ProductCard product={p} index={i} />
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    addProductToList(value, p.id);
                    toast.success(`${p.name} copiado para a lista.`);
                    refresh();
                  }}
                  aria-label={`Copiar ${p.name} para uma lista`}
                  className="mt-1 w-full rounded-[6px] border border-line bg-surface px-2 py-1.5 text-xs text-ink-soft outline-none focus:border-brand"
                >
                  <option value="">
                    {lists.length > 0
                      ? "Copiar para lista…"
                      : "Crie uma lista acima para copiar"}
                  </option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Excluir lista"
      >
        <p className="text-sm text-ink">
          Excluir a lista{" "}
          <strong className="text-ink">
            {deleting?.name ?? ""}
          </strong>
          ? Os produtos não serão removidos dos favoritos.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-[6px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-soft"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-[6px] bg-[#D93026] px-4 py-2 text-sm font-bold text-white hover:bg-[#B3271E]"
          >
            Excluir lista
          </button>
        </div>
      </Modal>
    </div>
  );
}
