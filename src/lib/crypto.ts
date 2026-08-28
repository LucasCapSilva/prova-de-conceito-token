export const PBKDF2_ITERATIONS = 100_000;

const SALT_BYTES = 16;
const KEY_BYTES = 32;

function subtle(): SubtleCrypto {
  const sub = globalThis.crypto?.subtle;
  if (!sub) throw new Error("Web Crypto indisponível neste navegador");
  return sub;
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const clean = hex.replace(/\s+/g, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("hex inválido");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function generateSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function deriveBits(password: string, saltHex: string): Promise<Uint8Array<ArrayBuffer>> {
  const sub = subtle();
  const encoder = new TextEncoder();
  const keyMaterial = await sub.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await sub.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits.slice(0, KEY_BYTES));
}

export async function hashPassword(
  password: string,
  saltHex: string
): Promise<string> {
  return bytesToHex(await deriveBits(password, saltHex));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  hashHex: string
): Promise<boolean> {
  let expected: Uint8Array<ArrayBuffer>;
  try {
    expected = hexToBytes(hashHex);
  } catch {
    return false;
  }
  const actual = await deriveBits(password, saltHex);
  return constantTimeEqual(actual, expected);
}
