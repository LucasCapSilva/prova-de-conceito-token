import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-soft">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && (
              <span aria-hidden className="shrink-0">
                ›
              </span>
            )}
            {item.to ? (
              <Link to={item.to} className="hover:text-brand hover:underline">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="max-w-60 truncate font-semibold text-ink"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
