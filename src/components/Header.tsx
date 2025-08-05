import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
  isInCooldown: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
}

export default function Header({ onRefresh, isInCooldown, remainingMinutes, remainingSeconds }: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-rip-green drop-shadow">
          RIP.fun Community Leaderboard
        </h1>
        <div className="flex flex-col items-center">
          <button
            onClick={isInCooldown ? undefined : onRefresh}
            disabled={isInCooldown}
            className={`px-4 py-2 rounded shadow font-bold transition ${
              isInCooldown 
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                : 'bg-rip-green text-black hover:scale-105'
            }`}
          >
            Refresh
          </button>
          {isInCooldown && (
            <div className="text-gray-400 text-xs mt-1">
              {remainingMinutes}m {remainingSeconds}s
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-gray-300 text-sm md:text-base leading-relaxed max-w-3xl">
        <a href="https://rip.fun" target="_blank" rel="noreferrer" className="text-rip-green hover:underline">Rip.fun</a> is a blockchain-based digital trading-card platform where collectors can <strong>Rip</strong> packs, <strong>Collect</strong> &amp; trade, <strong>Redeem</strong>, then <strong>Repeat</strong> the thrill. It currently focuses on fan-favorites like Pokémon&nbsp;TCG and is running an invite-only beta. This site ranks the most pack buyers. <br></br><br></br>Built with ❤️ by <a href="https://x.com/CryptoNdee" target="_blank" rel="noreferrer" className="hover:underline text-rip-green">@CryptoNdee</a>. Follow the project on <a href="https://x.com/ripdotfun" target="_blank" rel="noreferrer" className="hover:underline text-rip-green">@ripdotfun</a>.
      </p>
    </header>
  );
}
