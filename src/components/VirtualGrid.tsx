import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const GAP = 12;
const TEXT_BLOCK = 116;

function useViewportColumns(): number {
  const calc = () => {
    if (typeof window === "undefined") return 4;
    if (window.matchMedia("(min-width: 1280px)").matches) return 4;
    if (window.matchMedia("(min-width: 640px)").matches) return 3;
    return 2;
  };
  const [cols, setCols] = useState<number>(calc);
  useEffect(() => {
    const mqSm = window.matchMedia("(min-width: 640px)");
    const mqXl = window.matchMedia("(min-width: 1280px)");
    const update = () => setCols(mqXl.matches ? 4 : mqSm.matches ? 3 : 2);
    mqSm.addEventListener("change", update);
    mqXl.addEventListener("change", update);
    update();
    return () => {
      mqSm.removeEventListener("change", update);
      mqXl.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

interface Props<T> {
  items: T[];
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

export default function VirtualGrid<T>({ items, render, className = "" }: Props<T>) {
  const cols = useViewportColumns();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState<ReadonlySet<number>>(() => new Set([0]));

  const rows = useMemo(() => {
    const list: T[][] = [];
    for (let i = 0; i < items.length; i += cols) list.push(items.slice(i, i + cols));
    return list;
  }, [items, cols]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const noIO = typeof IntersectionObserver === "undefined";

  useEffect(() => {
    if (noIO) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.row);
          setVisible((prev) => {
            if (prev.has(idx)) return prev;
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "160px 0px", threshold: 0 }
    );
    const els = containerRef.current?.querySelectorAll<HTMLElement>("[data-row]");
    els?.forEach((el) => {
      const idx = Number(el.dataset.row);
      if (!visible.has(idx)) io.observe(el);
    });
    return () => io.disconnect();
  }, [rows, visible, noIO]);

  const colWidth = width > 0 ? (width - (cols - 1) * GAP) / cols : 0;
  const estimatedRow = colWidth > 0 ? Math.round(colWidth + TEXT_BLOCK) : 320;

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {rows.map((row, r) => {
        const shown = noIO || visible.has(r);
        return (
          <div
            key={r}
            data-row={r}
            className={shown ? "grid gap-3" : undefined}
            style={
              shown
                ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
                : { height: estimatedRow }
            }
          >
            {shown ? row.map((item, j) => render(item, r * cols + j)) : null}
          </div>
        );
      })}
    </div>
  );
}
