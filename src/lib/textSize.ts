import { useEffect, useState } from "react";
import { readRaw, writeRaw } from "./storage";

export type TextSize = "sm" | "md" | "lg";

export const TEXT_SIZES: Record<TextSize, { label: string; px: number }> = {
  sm: { label: "Pequeno", px: 14 },
  md: { label: "Médio", px: 16 },
  lg: { label: "Grande", px: 18 },
};

const KEY = "textSize";

function stored(): TextSize {
  const v = readRaw(KEY);
  return v === "sm" || v === "lg" ? v : "md";
}

function apply(size: TextSize) {
  const px = TEXT_SIZES[size].px;
  if (size === "md") {
    document.documentElement.style.fontSize = "";
  } else {
    document.documentElement.style.fontSize = `${px}px`;
  }
}

export function useTextSize(): [TextSize, (size: TextSize) => void] {
  const [size, setSize] = useState<TextSize>(stored);

  useEffect(() => {
    apply(size);
  }, [size]);

  const set = (s: TextSize) => {
    writeRaw(KEY, s);
    setSize(s);
  };

  return [size, set];
}
