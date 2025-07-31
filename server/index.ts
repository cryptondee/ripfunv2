import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PublicClient, http, createPublicClient, getAddress } from 'viem';
import { base } from 'viem/chains';

/**
 * Simple in-memory cache record.
 */
interface CacheRecord<T> {
  timestamp: number;
  data: T;
}

interface LeaderboardEntry {
  walletAddress: string;
  transferCount: number;
}

interface GetRecipientParams {
  contractAddress: string;
  fromAddress: string;
}

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------
const {
  PORT = 8080,
  NFT_CONTRACT_ADDRESS = '0x6292bf78996e189bAd8f9CF3e3Cb31017bb70540',
  MINT_FROM_ADDRESS = '0xeBeA10BCd609d3F6fb2Ea104baB638396C037388',
  ALCHEMY_API_KEY,
  CACHE_TTL_MINUTES = '60'
} = process.env;

if (!ALCHEMY_API_KEY) {
  throw new Error('Missing ALCHEMY_API_KEY environment variable');
}

const CACHE_TTL_MS = Number(CACHE_TTL_MINUTES) * 60 * 1000;

// -----------------------------------------------------------------------------
// Utilities – fetch transfers via Alchemy RPC
// -----------------------------------------------------------------------------
async function getRecipientAddresses({
  contractAddress,
  fromAddress
}: GetRecipientParams): Promise<Map<string, number>> {
  const client: PublicClient = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  });

  let allTransfers: any[] = [];
  let pageKey: string | undefined;

  const baseParams = {
    fromBlock: '0x0',
    fromAddress,
    contractAddresses: [contractAddress],
    category: ['erc721', 'erc1155'],
    withMetadata: false,
    maxCount: '0x3e8',
    excludeZeroValue: true
  } as const;

  do {
    const params: any = { ...baseParams };
    if (pageKey) params.pageKey = pageKey;

    const pageResult = (await client.request({
      method: 'alchemy_getAssetTransfers',
      params: [params]
    })) as { transfers?: any[]; pageKey?: string };

    if (pageResult?.transfers) {
      allTransfers.push(...pageResult.transfers);
    }
    pageKey = pageResult?.pageKey;
  } while (pageKey);

  const counts = new Map<string, number>();
  for (const tx of allTransfers) {
    const to = (tx as any).to as string | undefined;
    if (!to || to === '0x0000000000000000000000000000000000000000') continue;
    try {
      const checksum = getAddress(to);
      counts.set(checksum, (counts.get(checksum) || 0) + 1);
    } catch {
      /* ignore invalid */
    }
  }
  return counts;
}

function mapToSortedArray(counts: Map<string, number>): LeaderboardEntry[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([walletAddress, transferCount]) => ({ walletAddress, transferCount }));
}

// -----------------------------------------------------------------------------
// Express app
// -----------------------------------------------------------------------------
const app = express();
app.use(cors());

let cache: CacheRecord<LeaderboardEntry[]> | null = null;

app.get('/leaderboard', async (_req, res) => {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return res.json({ cached: true, updatedAt: cache.timestamp, data: cache.data });
    }
    const counts = await getRecipientAddresses({
      contractAddress: NFT_CONTRACT_ADDRESS,
      fromAddress: MINT_FROM_ADDRESS
    });
    const data = mapToSortedArray(counts);
    cache = { timestamp: Date.now(), data };
    res.json({ cached: false, updatedAt: cache.timestamp, data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
});

app.get('/', (_req, res) => {
  res.send('Rip.fun Leaderboard backend running');
});

app.listen(Number(PORT), () => {
  console.log(`Server listening on :${PORT}`);
});
