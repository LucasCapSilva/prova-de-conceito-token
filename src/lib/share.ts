export interface ShareEntry {
  id: string;
  qty: number;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function encodeSharePayload(items: ShareEntry[]): string {
  const clean = items
    .filter((e) => Boolean(e.id))
    .map((e) => ({ id: e.id, qty: Math.max(1, Math.floor(e.qty)) }));
  const bytes = new TextEncoder().encode(JSON.stringify(clean));
  return toBase64Url(bytes);
}

export function decodeSharePayload(code: string): ShareEntry[] {
  if (!code) return [];
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed)) return [];
    const out: ShareEntry[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== "object") continue;
      const entry = raw as ShareEntry;
      if (typeof entry.id !== "string" || typeof entry.qty !== "number") continue;
      out.push({ id: entry.id, qty: Math.max(1, Math.floor(entry.qty)) });
    }
    return out;
  } catch {
    return [];
  }
}

export function buildShareUrl(items: ShareEntry[]): string {
  return `${window.location.origin}/lista?d=${encodeSharePayload(items)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // tenta o fallback abaixo
  }
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
