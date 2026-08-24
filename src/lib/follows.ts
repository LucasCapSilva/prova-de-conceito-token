const KEY = "electronica:follows";

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* sem persistência */
  }
}

export function getFollows(): string[] {
  return load();
}

export function isFollowing(sellerId: string): boolean {
  return load().includes(sellerId);
}

export function followSeller(sellerId: string) {
  const current = load();
  if (!current.includes(sellerId)) {
    persist([...current, sellerId]);
  }
}

export function unfollowSeller(sellerId: string) {
  persist(load().filter((id) => id !== sellerId));
}

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function baseFollowers(sellerId: string): number {
  return 1200 + (hashSeed(sellerId) % 48000);
}

export function followerCount(sellerId: string): number {
  return baseFollowers(sellerId) + (isFollowing(sellerId) ? 1 : 0);
}
