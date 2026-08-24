import { useState } from "react";
import type { ReactNode } from "react";
import { CompareContext } from "./compareCore";

const MAX = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const isIn = (id: string) => ids.includes(id);

  const toggle = (id: string) =>
    setIds((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= MAX
          ? cur
          : [...cur, id]
    );

  const clear = () => setIds([]);

  return (
    <CompareContext.Provider
      value={{ ids, isIn, toggle, clear, count: ids.length }}
    >
      {children}
    </CompareContext.Provider>
  );
}
