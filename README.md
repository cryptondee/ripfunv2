# Rip.fun Community Leaderboard

Sleek cyber-retro leaderboard that ranks pack-buyers (NFT recipients) of the **Rip.fun** closed-beta community.

Live UI ➜ client-side React (Vite + Tailwind)  ·  Data ➜ on-chain via Alchemy RPC  ·  Profile enrichment ➜ Rip.fun API  ·  Optional AI vibe check ➜ Gemini 2.5.

---

## ✨ Features

| 🛠  | Description |
|-----|-------------|
| NFT aggregation | Fetches all *ERC-721 / 1155* transfers from the **Mint wallet → Collection contract** on Base using `alchemy_getAssetTransfers` (automatically paginated). |
| Profile enrichment | Batches addresses → `https://www.rip.fun/api/auth/{address}` (via CORS proxy) to retrieve username, avatar & profile link (`/profile/{username}`). |
| Leaderboard UI | Rank #, avatar, username, transfer count, wallet address & links (Basescan + Rip.fun profile). Responsive & glass-morphic table built with Tailwind. |
| Local/Server cache | Results cached for 1 h (LocalStorage). If you deploy a backend (see Railway section) the cache lives on the server. |
| Optional AI analysis | Google Gemini 2.5 summarises community „vibe“ from usernames. |
| Zero-backend static build | Works from any static host (Vercel, Netlify, GitHub Pages, IPFS). |

---

## 🗂  Project Structure

```
├─ index.html              # Tailwind CDN + custom neon theme + Google font
├─ src
│  ├─ App.tsx              # Main state machine / UI
│  ├─ main.tsx             # React 19 entry (do not edit runtime)
│  ├─ main.css             # Global pixel-grid + neon blob background
│  ├─ components/
│  │   ├─ Header.tsx
│  │   ├─ Loader.tsx
│  │   ├─ ResultsTable.tsx
│  │   └─ CommunityAnalysis.tsx
│  └─ services/
│      ├─ alchemyService.ts   # On-chain transfer aggregation (paginated)
│      ├─ ripfunService.ts    # Profile batching + retries
│      └─ geminiService.ts    # Optional AI wrapper
├─ vite.config.ts          # Exposes env vars + React plugin
├─ tsconfig.json
└─ .env.example            # Copy ➜ `.env` for local dev
```

---

## 🔑 Environment Variables

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `VITE_ALCHEMY_API_KEY` | Alchemy Base L1 API key | yes | **client** & server |
| `GEMINI_API_KEY` | Google AI key for vibe-check | optional | **server-side** only |

Create `.env` (not committed):

```env
VITE_ALCHEMY_API_KEY=your_key_here
GEMINI_API_KEY=optional_server_key
```

---

## 🧑‍💻 Local Development

```bash
# install deps
npm install

# start Vite dev server
npm run dev
```

Open http://localhost:5173 and click **Fetch Community Members**.

---

## 🚀 Production Build

```bash
npm run build      # output in dist/
```
Deploy `dist/` to any static host.

---

## 🚂 Railway Deployment (Recommended)

1. **Backend service** – `server/index.ts` (Express / Fastify)
   * Endpoint `GET /leaderboard` executes `alchemyService + ripfunService` once per hour.
   * Store `VITE_ALCHEMY_API_KEY` (and `GEMINI_API_KEY`) as private Railway variables.
   * Cache result in memory **or** Railway Postgres / KV.

2. **Frontend service** – this repo.
   * Build command: `npm run build`
   * Serve static files (Nginx buildpack or Railway Static).
   * Set env `VITE_API_BASE=https://<backend-service>.railway.app` and change `fetchLeaderboard` to call server.

> 📎  See `docs/railway-example` folder (coming soon) for ready-to-deploy Express script.

---

## 🏗  Roadmap

- [ ] Ship Express backend template
- [ ] Migrate cache to Railway KV
- [ ] Add pagination UI (>1000 addresses)
- [ ] Collector address search / filter
- [ ] Dark-/Light-mode toggle (cyber-retro green by default)

---

## 📝 License

MIT © 2025 [@CryptoNdee](https://x.com/CryptoNdee)

---

## 🙏 Acknowledgements

* **Rip.fun** team and community
* **Alchemy** for reliable Base RPC
* **Google Gemini 2.5** for optional vibe-check analysis
