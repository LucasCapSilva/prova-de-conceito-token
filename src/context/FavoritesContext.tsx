import { useEffect, useMemo, useState, type ReactNode } from "react";
import { read, write } from "../lib/storage";
import {
  FavoritesContext,
  type FavoritesContextValue,
} from "./favoritesCore";

const STORAGE_KEY = "favorites";

function loadIds(): string[] {
  const parsed = read<unknown>(STORAGE_KEY, null);
  return Array.isArray(parsed) ? (parsed as string[]) : [];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => loadIds());
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    write(STORAGE_KEY, ids);
  }, [ids]);

  const value = useMemo<FavoritesContextValue>(() => {
    return {
      ids,
      count: ids.length,
      isFavorite: (id: string) => ids.includes(id),
      toggle: (id: string) => {
        setAnnouncement(
          ids.includes(id) ? "Removido dos favoritos" : "Adicionado aos favoritos"
        );
        setIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
      },
    };
  }, [ids]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </FavoritesContext.Provider>
  );
}
