const digits = (v: string) => v.replace(/\D/g, "");

export function maskCPF(v: string): string {
  const d = digits(v).slice(0, 11);
  if (d.length > 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

export function maskPhone(v: string): string {
  const d = digits(v).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCEP(v: string): string {
  const d = digits(v).slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

export function maskCard(v: string): string {
  return digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function maskExpiry(v: string): string {
  const d = digits(v).slice(0, 4);
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

export function luhnValid(raw: string): boolean {
  const d = digits(raw);
  if (d.length < 13 || d.length > 16) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function expiryValid(masked: string): boolean {
  const d = digits(masked);
  if (d.length !== 4) return false;
  const mm = Number(d.slice(0, 2));
  const yy = Number(d.slice(2));
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const cy = now.getFullYear() % 100;
  const cm = now.getMonth() + 1;
  return yy > cy || (yy === cy && mm >= cm);
}

export function cvvValid(raw: string): boolean {
  const d = digits(raw);
  return d.length >= 3 && d.length <= 4;
}

export function cpfValid(raw: string): boolean {
  const d = digits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(d[i]) * (n + 1 - i);
    return (sum * 10) % 11;
  };
  return Number(d[9]) === dv(9) && Number(d[10]) === dv(10);
}
