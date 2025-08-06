import React from 'react';
import type { UserRecord } from '../App';

interface Props {
  users: UserRecord[];
}

export default function ResultsTable({ users }: Props) {
  return (
    <div className="overflow-x-auto mt-8 animate-fadeInSlow">
      <table className="min-w-full text-sm md:text-base text-left border-collapse">
        <thead>
          <tr className="bg-gray-800/60 backdrop-blur">
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">User</th>
            <th className="py-3 px-4">Packs</th>
            <th className="py-3 px-4">Wallet</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr
              key={u.walletAddress}
              className="border-b border-gray-700 hover:bg-gray-800/40 transition group"
            >
              <td className="py-2 px-4 font-mono text-rip-green">{idx + 1}</td>
              <td className="py-2 px-4 flex items-center gap-3 min-w-[160px]">
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.username || 'Avatar'}
                    className="w-8 h-8 rounded-full border border-rip-green/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                )}
                {u.profileUrl ? (
                  <a
                    href={u.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rip-green underline hover:text-rip-green/80"
                  >
                    {u.username || u.walletAddress.slice(0, 6)}
                  </a>
                ) : (
                  <span>{u.username || u.walletAddress.slice(0, 6)}</span>
                )}
              </td>
              <td className="py-2 px-4 font-mono">{u.transferCount}</td>
              <td className="py-2 px-4 font-mono whitespace-nowrap">
                <a
                  href={`https://basescan.org/address/${u.walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {u.walletAddress.slice(0, 6)}…{u.walletAddress.slice(-4)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
