import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import Loader from './components/Loader';
import ResultsTable from './components/ResultsTable';
import CommunityAnalysis from './components/CommunityAnalysis';
import { getRecipientAddresses } from './services/alchemyService';
import { getRipFunProfiles } from './services/ripfunService';
import { getCommunityAnalysis } from './services/geminiService';
import { getLeaderboardFromBackend } from './services/leaderboardService';

export interface UserRecord {
  walletAddress: string;
  username: string | null;
  avatar: string | null;
  profileUrl: string | null;
  transferCount: number;
}

interface CachePayload {
  timestamp: number;
  users: UserRecord[];
}

const CACHE_KEY = 'ripfunLeaderboardCache';
const NFT_CONTRACT_ADDRESS = '0x6292bf78996e189bAd8f9CF3e3Cb31017bb70540';
const MINT_FROM_ADDRESS = '0xeBeA10BCd609d3F6fb2Ea104baB638396C037388';

export default function App() {
  const [users, setUsers] = useState<UserRecord[] | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  /** Loads cached results if < 1h old */
  useEffect(() => {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (cacheStr) {
      try {
        const cache: CachePayload = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 1000 * 60 * 60) {
          setUsers(cache.users);
        }
      } catch (_) {
        /* ignore bad cache */
      }
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading('Fetching transfers…');
    setError(null);
    setAnalysis(null);
    try {
      // 1. Try backend first
      let addressCounts: Map<string, number>;
      const backendResp = await getLeaderboardFromBackend();
      if (backendResp && backendResp.data.length) {
        addressCounts = new Map(
          backendResp.data.map((e) => [e.walletAddress, e.transferCount] as const)
        );
      } else {
        // Fallback to client-side aggregation
        addressCounts = await getRecipientAddresses({
          contractAddress: NFT_CONTRACT_ADDRESS,
          fromAddress: MINT_FROM_ADDRESS
        });
      }

      // 2. Sort addresses by count desc
      const sortedAddrs = Array.from(addressCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([address]) => address);

      // 3. Batch enrich profiles (20 at a time)
      const batchSize = 20;
      const enriched: UserRecord[] = [];
      for (let i = 0; i < sortedAddrs.length; i += batchSize) {
        setLoading(`Enriching profiles ${i} / ${sortedAddrs.length}`);
        const slice = sortedAddrs.slice(i, i + batchSize);
        const profiles = await getRipFunProfiles(slice);
        slice.forEach((addr) => {
          const profile = profiles.get(addr);
          enriched.push({
            walletAddress: addr,
            username: profile?.username || null,
            avatar: profile?.avatar || null,
            profileUrl: profile?.profileUrl || null,
            transferCount: addressCounts.get(addr) || 0
          });
        });
      }

      // 4. Sort enriched list
      enriched.sort((a, b) => b.transferCount - a.transferCount);
      setUsers(enriched);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), users: enriched } satisfies CachePayload)
      );

      // 5. Optional AI analysis
      setLoading('Generating community vibe …');
      const maybeAnalysis = await getCommunityAnalysis(enriched.map((u) => u.username).filter(Boolean) as string[]);
      setAnalysis(maybeAnalysis);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(null);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 md:px-8">
      <Header onRefresh={fetchLeaderboard} />
      {loading && <Loader message={loading} />}
      {error && (
        <div className="bg-red-600/20 border border-red-600 text-red-300 p-4 rounded mt-4">
          {error}
        </div>
      )}
      {users && <ResultsTable users={users} />}
      {analysis && <CommunityAnalysis text={analysis} />}
      {!users && !loading && (
        <button onClick={fetchLeaderboard} className="self-center bg-rip-green text-black font-bold px-4 py-2 mt-8 rounded shadow hover:scale-105 transition">
          Fetch Community Members
        </button>
      )}
    </div>
  );
}
