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
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  /** Loads cached results if < 1h old, or fetches from server */
  useEffect(() => {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (cacheStr) {
      try {
        const cache: CachePayload = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 1000 * 60 * 60) {
          setUsers(cache.users);
          setLastFetchTime(cache.timestamp);
          return;
        }
      } catch (_) {
        /* ignore bad cache */
      }
    }
    // No valid cache, fetch from server immediately
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Update current time every second for countdown timer */
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    // Check cooldown period
    if (lastFetchTime && Date.now() - lastFetchTime < 1000 * 60 * 60) {
      const remainingMinutes = Math.ceil((1000 * 60 * 60 - (Date.now() - lastFetchTime)) / (1000 * 60));
      setError(`Please wait ${remainingMinutes} more minute(s) before refreshing.`);
      return;
    }

    setLoading('Fetching transfers…');
    setError(null);
    setAnalysis(null);
    try {
      // 1. Try backend first (with profiles already enriched)
      const backendResp = await getLeaderboardFromBackend();
      let enriched: UserRecord[];
      
      if (backendResp && backendResp.data.length) {
        // Use backend data directly (already enriched)
        setLoading('Loading from server…');
        enriched = backendResp.data.map(entry => ({
          walletAddress: entry.walletAddress,
          username: entry.username,
          avatar: entry.avatar,
          profileUrl: entry.profileUrl,
          transferCount: entry.transferCount
        }));
      } else {
        // Fallback to client-side aggregation + enrichment
        setLoading('Fetching transfers…');
        const addressCounts = await getRecipientAddresses({
          contractAddress: NFT_CONTRACT_ADDRESS,
          fromAddress: MINT_FROM_ADDRESS
        });

        // Sort addresses by count desc
        const sortedAddrs = Array.from(addressCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([address]) => address);

        // Batch enrich profiles (20 at a time)
        const batchSize = 20;
        enriched = [];
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

        // Sort enriched list
        enriched.sort((a, b) => b.transferCount - a.transferCount);
      }
      const fetchTime = Date.now();
      setUsers(enriched);
      setLastFetchTime(fetchTime);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: fetchTime, users: enriched } satisfies CachePayload)
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
  }, [lastFetchTime]);

  // Helper to calculate remaining cooldown time
  const getCooldownInfo = () => {
    if (!lastFetchTime) return { isInCooldown: false, remainingMs: 0 };
    const cooldownPeriod = 1000 * 60 * 60; // 1 hour
    const elapsed = currentTime - lastFetchTime;
    const remainingMs = cooldownPeriod - elapsed;
    return {
      isInCooldown: remainingMs > 0,
      remainingMs: Math.max(0, remainingMs)
    };
  };

  const { isInCooldown, remainingMs } = getCooldownInfo();
  const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
  const remainingSeconds = Math.ceil((remainingMs % (1000 * 60)) / 1000);

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 md:px-8">
      <Header 
        onRefresh={fetchLeaderboard} 
        isInCooldown={isInCooldown}
        remainingMinutes={remainingMinutes}
        remainingSeconds={remainingSeconds}
      />
      {loading && <Loader message={loading} />}
      {error && (
        <div className="bg-red-600/20 border border-red-600 text-red-300 p-4 rounded mt-4">
          {error}
        </div>
      )}
      {users && (
        <>
          {lastFetchTime && (
            <div className="text-center text-gray-400 text-sm mb-4">
              Last updated: {new Date(lastFetchTime).toLocaleString()}
            </div>
          )}
          <ResultsTable users={users} />
        </>
      )}
      {analysis && <CommunityAnalysis text={analysis} />}
      {!users && !loading && (
        <button onClick={fetchLeaderboard} className="self-center bg-rip-green text-black font-bold px-4 py-2 mt-8 rounded shadow hover:scale-105 transition">
          Fetch Community Members
        </button>
      )}
    </div>
  );
}
