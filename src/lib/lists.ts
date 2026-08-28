import { read, write } from "./storage";

export interface SaveList {
  id: string;
  name: string;
  productIds: string[];
  createdAt: string;
}

const KEY = "lists";

export function getLists(): SaveList[] {
  const parsed = read<unknown>(KEY, null);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (l): l is SaveList =>
      Boolean(l) &&
      typeof l === "object" &&
      typeof (l as SaveList).id === "string" &&
      typeof (l as SaveList).name === "string" &&
      Array.isArray((l as SaveList).productIds)
  );
}

function saveLists(lists: SaveList[]) {
  write(KEY, lists);
}

function patchList(listId: string, patch: (list: SaveList) => SaveList) {
  const lists = getLists();
  const next = lists.map((l) => (l.id === listId ? patch(l) : l));
  saveLists(next);
}

export function createList(name: string): SaveList {
  const list: SaveList = {
    id: `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    productIds: [],
    createdAt: new Date().toISOString(),
  };
  saveLists([...getLists(), list]);
  return list;
}

export function renameList(listId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  patchList(listId, (l) => ({ ...l, name: trimmed }));
}

export function deleteList(listId: string) {
  saveLists(getLists().filter((l) => l.id !== listId));
}

export function addProductToList(listId: string, productId: string) {
  patchList(listId, (l) =>
    l.productIds.includes(productId)
      ? l
      : { ...l, productIds: [...l.productIds, productId] }
  );
}

export function removeProductFromList(listId: string, productId: string) {
  patchList(listId, (l) => ({
    ...l,
    productIds: l.productIds.filter((id) => id !== productId),
  }));
}

export function moveProduct(
  fromListId: string,
  toListId: string,
  productId: string
) {
  if (fromListId === toListId) return;
  const lists = getLists().map((l) =>
    l.id === fromListId
      ? { ...l, productIds: l.productIds.filter((id) => id !== productId) }
      : l
  );
  saveLists(lists);
  addProductToList(toListId, productId);
}

export function copyProduct(
  fromListId: string,
  toListId: string,
  productId: string
) {
  if (fromListId === toListId) return;
  const source = getLists().find((l) => l.id === fromListId);
  if (!source || !source.productIds.includes(productId)) return;
  addProductToList(toListId, productId);
}
