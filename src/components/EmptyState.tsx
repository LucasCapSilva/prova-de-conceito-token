import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type EmptyIcon =
  | "heart"
  | "bell"
  | "package"
  | "return"
  | "store"
  | "search"
  | "ticket";

function Illustration({ icon }: { icon: EmptyIcon }) {
  const paths: Record<EmptyIcon, ReactNode> = {
    heart: (
      <>
        <path d="M12 20.5c-.4 0-.8-.15-1.1-.45C7.5 17.2 4 14.2 4 10.7c0-2.5 1.9-4.4 4.2-4.4 1.4 0 2.7.7 3.8 1.9 1.1-1.2 2.4-1.9 3.8-1.9 2.3 0 4.2 1.9 4.2 4.4 0 3.5-3.5 6.5-6.9 9.35-.3.3-.7.45-1.1.45Z" />
        <path d="M9 10.5h2l1-2 1.6 4 1.2-2H15" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M10 19a2 2 0 0 0 4 0" />
        <circle cx="12" cy="4" r="1" />
      </>
    ),
    package: (
      <>
        <path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z" />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      </>
    ),
    return: (
      <>
        <path d="M4 9h12a5 5 0 0 1 0 10H8" />
        <path d="m7 6-3 3 3 3" />
      </>
    ),
    store: (
      <>
        <path d="M4 9V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4" />
        <path d="M4 9h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
        <path d="M9 18v-4h6v4M4 4l-1 5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0l-1-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
        <path d="m8 10.5 2 2 4-4" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        <path d="M13 6v2M13 11v2M13 16v2" />
      </>
    ),
  };
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-auto text-brand"
    >
      {paths[icon]}
    </svg>
  );
}

interface Props {
  icon: EmptyIcon;
  title: string;
  message: string;
  cta?: { to: string; label: string };
}

export default function EmptyState({ icon, title, message, cta }: Props) {
  return (
    <div className="card grid place-items-center gap-3 rounded-lg p-12 text-center">
      <Illustration icon={icon} />
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-soft">{message}</p>
      {cta && (
        <Link
          to={cta.to}
          className="btn-brand mt-1 rounded-[6px] px-4 py-2 text-sm font-bold"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
