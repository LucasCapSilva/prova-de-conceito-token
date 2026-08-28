type Loader = () => Promise<{ default: unknown }>;

const loaders: Record<string, Loader> = {
  "/produto": () => import("../pages/ProductDetail"),
  "/categoria": () => import("../pages/Category"),
};

const inflight = new Set<string>();

export function preloadPath(path: string) {
  const seg = "/" + (path.split("/")[1] ?? "");
  const load = loaders[seg];
  if (!load || inflight.has(seg)) return;
  inflight.add(seg);
  load().catch(() => {
    inflight.delete(seg);
  });
}
