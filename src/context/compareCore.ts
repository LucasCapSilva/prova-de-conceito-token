import { createContext, useContext } from "react";

export interface CompareContextValue {
  ids: string[];
  isIn: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  count: number;
}

export const CompareContext = createContext<CompareContextValue>({
  ids: [],
  isIn: () => false,
  toggle: () => {},
  clear: () => {},
  count: 0,
});

export function useCompare() {
  return useContext(CompareContext);
}
