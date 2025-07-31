import type { UserRecord } from '../App';

const API_BASE = import.meta.env.VITE_API_BASE as string | undefined;

if (!API_BASE) {
  console.warn('VITE_API_BASE not defined – frontend will aggregate client-side.');
}

interface BackendResponse {
  cached: boolean;
  updatedAt: number;
  data: Array<{ walletAddress: string; transferCount: number }>;
}

/**
 * Fetch leaderboard data from backend (Railway) and return as UserRecord[] with wallet + count only.
 * Profile enrichment still happens client-side to keep backend lightweight.
 */
export async function getLeaderboardFromBackend(): Promise<BackendResponse | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error(`${res.status}`);
    return (await res.json()) as BackendResponse;
  } catch (e) {
    console.error(e);
    return null;
  }
}
