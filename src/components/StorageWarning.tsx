import { useState } from "react";
import { isPersistent } from "../lib/storage";

export default function StorageWarning() {
  const [show] = useState(() => !isPersistent());

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-[118px] z-40 border-b border-amber-200 bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 sm:top-[96px]"
    >
      Storage indisponível neste navegador — suas alterações não serão
      mantidas.
    </div>
  );
}
