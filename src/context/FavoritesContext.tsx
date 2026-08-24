import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FavoritesContext,
  type FavoritesContextValue,
} from "./favoritesCore";

const STORAGE_KEY = "electronica:favorites";

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => loadIds());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage indisponível — ignora */
    }
  }, [ids]);

  const value = useMemo<FavoritesContextValue>(() => {
    return {
      ids,
      count: ids.length,
      isFavorite: (id: string) => ids.includes(id),
      toggle: (id: string) =>
        setIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        ),
    };
  }, [ids]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
