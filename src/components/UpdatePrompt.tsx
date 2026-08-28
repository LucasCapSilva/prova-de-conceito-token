import { useEffect, useRef } from "react";
import { useToasts } from "../context/toastsCore";

export default function UpdatePrompt() {
  const { toast } = useToasts();
  const info = toast.info;
  const shown = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

    const prompt = () => {
      if (shown.current) return;
      shown.current = true;
      info("Nova versão disponível", {
        label: "Recarregar",
        onClick: () => window.location.reload(),
      });
    };

    let cancelled = false;

    navigator.serviceWorker
      .ready.then((reg) => {
        if (cancelled) return;

        // Já existe uma atualização instalada aguardando (ex.: visita anterior).
        if (reg.waiting && reg.active) {
          prompt();
          return;
        }

        // Detecta uma atualização encontrada agora.
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            // Só é "nova versão" se já havia um service worker controlando a aba.
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              prompt();
            }
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [info]);

  return null;
}
