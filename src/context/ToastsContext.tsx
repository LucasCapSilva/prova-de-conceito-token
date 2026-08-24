import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ToastsContext,
  type ToastItem,
  type ToastKind,
  type ToastsContextValue,
} from "./toastsCore";

const AUTO_DISMISS_MS = 4000;
const MAX_STACK = 5;

const ICONS: Record<ToastKind, ReactNode> = {
  success: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-emerald-600"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  ),
  error: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-red-600"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  ),
  info: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-sky-600"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </svg>
  ),
};

export function ToastsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++nextId.current;
      setToasts((list) => [...list, { id, kind, message }].slice(-MAX_STACK));
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo<ToastsContextValue>(
    () => ({
      toasts,
      toast: {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
      },
      dismiss,
    }),
    [toasts, push, dismiss]
  );

  return (
    <ToastsContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2 rounded-[4px] border border-line bg-surface px-3 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]"
          >
            {ICONS[t.kind]}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-ink-soft hover:text-ink"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastsContext.Provider>
  );
}

export default ToastsProvider;
