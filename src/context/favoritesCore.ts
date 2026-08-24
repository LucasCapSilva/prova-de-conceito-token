import { createContext, useContext } from "react";

export interface FavoritesContextValue {
  ids: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
