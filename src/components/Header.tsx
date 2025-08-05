import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-rip-green drop-shadow">
          RIP.fun Community Leaderboard
        </h1>
        <button
          onClick={onRefresh}
          className="bg-rip-green text-black font-bold px-4 py-2 rounded shadow hover:scale-105 transition disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <p className="mt-3 text-gray-300 text-sm md:text-base leading-relaxed max-w-3xl">
        <a href="https://rip.fun" target="_blank" rel="noreferrer" className="text-rip-green hover:underline">Rip.fun</a> is a blockchain-based digital trading-card platform where collectors can <strong>Rip</strong> packs, <strong>Collect</strong> &amp; trade, <strong>Redeem</strong>, then <strong>Repeat</strong> the thrill. It currently focuses on fan-favorites like Pokémon&nbsp;TCG and is running an invite-only beta. This site ranks the most pack buyers. <br></br><br></br>Built with ❤️ by <a href="https://x.com/CryptoNdee" target="_blank" rel="noreferrer" className="hover:underline text-rip-green">@CryptoNdee</a>. Follow the project on <a href="https://x.com/ripdotfun" target="_blank" rel="noreferrer" className="hover:underline text-rip-green">@ripdotfun</a>.
      </p>
    </header>
  );
}
