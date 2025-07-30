export interface RipFunProfile {
  username: string;
  avatar: string;
  profileUrl: string;
}

const API_ROOT = 'https://www.rip.fun/api/auth/';
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetch profile data for a list of addresses in parallel with retries.
 */
export async function getRipFunProfiles(addresses: string[]): Promise<Map<string, RipFunProfile>> {
  const out = new Map<string, RipFunProfile>();
  const promises = addresses.map((addr) => fetchWithRetry(`${CORS_PROXY}${API_ROOT}${addr}`));
  const results = await Promise.all(promises);
  results.forEach((data, idx) => {
    if (!data) return;
    const addr = addresses[idx];
    out.set(addr, {
      username: data.username,
      avatar: data.avatar ?? null,
      profileUrl: `https://www.rip.fun/profile/${data.username ?? addr}`
    });
  });
  return out;
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 400): Promise<any | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } catch (e: any) {
      const code = Number(e.message);
      if (attempt < retries - 1 && (code === 429 || code >= 500)) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
      } else {
        return null;
      }
    }
  }
  return null;
}
