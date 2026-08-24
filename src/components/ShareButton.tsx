import { useRef, useState } from "react";

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  async function onShare() {
    const url = window.location.href;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      } else {
        ok = legacyCopy(url);
      }
    } catch {
      ok = legacyCopy(url);
    }
    setCopied(ok);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Copiar link do produto"
      className={`flex items-center justify-center rounded border px-4 py-3 text-sm font-semibold transition ${
        copied
          ? "border-ship bg-page text-ship"
          : "border-line bg-surface text-ink-soft hover:border-brand hover:text-brand"
      }`}
    >
      {copied ? "✓ Link copiado!" : "↗ Compartilhar"}
    </button>
  );
}
