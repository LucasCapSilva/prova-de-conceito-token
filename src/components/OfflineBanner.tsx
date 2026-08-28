import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[118px] z-40 border-b border-line bg-surface px-4 py-2 text-center text-xs text-ink sm:top-[96px]"
    >
      <span className="font-semibold text-brand">Você está offline.</span>{" "}
      Carrinho e favoritos continuam acessíveis:{" "}
      <Link to="/carrinho" className="font-semibold text-brand underline">
        carrinho
      </Link>{" "}
      ·{" "}
      <Link to="/favoritos" className="font-semibold text-brand underline">
        favoritos
      </Link>
    </div>
  );
}
