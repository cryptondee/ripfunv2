import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { Alchemy, AssetTransfersCategory, Network } from 'alchemy-sdk';
import { getAddress } from 'viem';

/**
 * Minimal backend that aggregates NFT transfers and enriches them with rip.fun profile data.
 * The goal is to keep the code as short and readable as possible while matching existing functionality.
 */

// -----------------------------------------------------------------------------
// Environment variables
// -----------------------------------------------------------------------------
const {
  PORT = 8080,
  ALCHEMY_API_KEY,
  NFT_CONTRACT_ADDRESS = '0x6292bf78996e189bAd8f9CF3e3Cb31017bb70540',
  MINT_FROM_ADDRESS = '0xeBeA10BCd609d3F6fb2Ea104baB638396C037388',
  CACHE_TTL_MINUTES = '60'
} = process.env as Record<string, string | undefined>;

if (!ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY env var');
}

const CACHE_TTL_MS = Number(CACHE_TTL_MINUTES) * 60 * 1000;

// -----------------------------------------------------------------------------
// Alchemy client setup
// -----------------------------------------------------------------------------
const alchemy = new Alchemy({ apiKey: ALCHEMY_API_KEY, network: Network.BASE_MAINNET });

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface LeaderboardEntry {
  walletAddress: string;
  transferCount: number;
  username: string | null;
  avatar: string | null;
  profileUrl: string | null;
}

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------
/** Fetch all NFT transfers from `MINT_FROM_ADDRESS` to recipients of `NFT_CONTRACT_ADDRESS`. */
async function getRecipientCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  let pageKey: string | undefined;
  do {
    const { transfers, pageKey: nextKey } = await alchemy.core.getAssetTransfers({
      fromAddress: MINT_FROM_ADDRESS,
      contractAddresses: [NFT_CONTRACT_ADDRESS],
      category: [AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
      withMetadata: false,
      maxCount: 1000,
      excludeZeroValue: true,
      pageKey
    });

    transfers.forEach((tx) => {
      const to = tx.to;
      if (!to || to === '0x0000000000000000000000000000000000000000') return;
      try {
        const checksumAddress = getAddress(to);
        counts.set(checksumAddress, (counts.get(checksumAddress) || 0) + 1);
      } catch {
        // Skip invalid addresses
      }
    });
    pageKey = nextKey;
  } while (pageKey);
  return counts;
}

/**
 * Fetch profile data for a set of wallet addresses.
 * rip.fun API: https://www.rip.fun/api/auth/<address>
 */
async function fetchRipProfiles(addresses: string[]): Promise<Map<string, Partial<LeaderboardEntry>>> {
  const apiBase = 'https://www.rip.fun/api/auth/';
  const result = new Map<string, Partial<LeaderboardEntry>>();

  await Promise.all(
    addresses.map(async (addr) => {
      try {
        const res = await fetch(`${apiBase}${addr}`);
        if (!res.ok) return;
        const json = (await res.json()) as any;
        result.set(addr, {
          username: json.username ?? null,
          avatar: json.avatar ?? null,
          profileUrl: `https://www.rip.fun/profile/${json.username ?? addr}`
        });
      } catch {
        /* ignore */
      }
    })
  );
  return result;
}

function mapToSortedArray(counts: Map<string, number>): LeaderboardEntry[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([walletAddress, transferCount]) => ({
      walletAddress,
      transferCount,
      username: null,
      avatar: null,
      profileUrl: null
    }));
}

// -----------------------------------------------------------------------------
// Express setup
// -----------------------------------------------------------------------------
const app = express();
app.use(cors());

let cache: { timestamp: number; data: LeaderboardEntry[] } | null = null;

app.get('/leaderboard', async (_req, res) => {
  try {
    // Serve cache if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return res.json({ cached: true, updatedAt: cache.timestamp, data: cache.data });
    }

    // 1. Fetch transfer counts
    const counts = await getRecipientCounts();
    let data = mapToSortedArray(counts);

    // 2. Enrich with rip.fun profiles (batch of first 200 to limit backend time)
    const enrichCount = 200;
    const slice = data.slice(0, enrichCount);
    const profiles = await fetchRipProfiles(slice.map((e) => e.walletAddress));
    slice.forEach((entry) => {
      const profile = profiles.get(entry.walletAddress);
      if (profile) Object.assign(entry, profile);
    });

    cache = { timestamp: Date.now(), data };
    res.json({ cached: false, updatedAt: cache.timestamp, data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
});

app.get('/', (_req, res) => {
  res.send('Rip.fun Leaderboard backend running (simple version)');
});

app.listen(Number(PORT), () => {
  console.log(`Backend listening on :${PORT}`);
});
