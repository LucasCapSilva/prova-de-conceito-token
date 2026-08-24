import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Fronteira de erro capturou:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-page p-4">
          <div className="card w-full max-w-md rounded-lg p-6 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-brand"
            >
              <path d="M12 9v4M12 17v.5" />
              <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <h1 className="mt-3 text-lg font-black text-ink">
              Algo deu errado
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Não foi possível carregar esta página. Recarregue para continuar
              sua navegação.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-brand mt-5 w-full rounded-[6px] py-2.5 text-sm font-bold"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
