import { read, write } from "./storage.ts";
import type { CatalogState } from "./catalog.ts";

export interface SavedFilter {
  id: string;
  name: string;
  state: CatalogState;
}

const KEY = "savedFilters";

function isValid(e: unknown): e is SavedFilter {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    o.state !== null &&
    typeof o.state === "object"
  );
}

export function getSavedFilters(): SavedFilter[] {
  const list = read<unknown[]>(KEY, []);
  return Array.isArray(list) ? list.filter(isValid) : [];
}

export function saveFilter(name: string, state: CatalogState): SavedFilter[] {
  const list = getSavedFilters();
  const entry: SavedFilter = {
    id: `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    state,
  };
  const next = [...list, entry];
  write(KEY, next);
  return next;
}

export function removeSavedFilter(id: string): SavedFilter[] {
  const next = getSavedFilters().filter((f) => f.id !== id);
  write(KEY, next);
  return next;
}
