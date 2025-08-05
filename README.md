# Rip.fun Community Leaderboard

Sleek cyber-retro leaderboard that ranks pack-buyers (NFT recipients) of the **Rip.fun** closed-beta community.

**Backend-first architecture** ➜ Express server with server-side caching and profile enrichment  ·  **Frontend** ➜ React (Vite + Tailwind)  ·  **Data** ➜ on-chain via Alchemy RPC  ·  **Profiles** ➜ Rip.fun API  ·  **Optional AI** ➜ Gemini 2.5.

---

## ✨ Features

| 🛠  | Description |
|-----|-------------|
| **Backend-first architecture** | Primary data flow through Express server (`server/simple.ts`) with 1-hour server-side caching |
| **Auto-loading** | Data loads immediately on page visit (incognito mode) from server cache |
| **Smart refresh controls** | Gray button with countdown timer during cooldown, server-time synchronized |
| **NFT aggregation** | Server fetches all *ERC-721 / 1155* transfers from **Mint wallet → Collection contract** on Base using Alchemy SDK with pagination |
| **Profile enrichment** | Server-side batch requests to `https://www.rip.fun/api/auth/{address}` with ERC-55 checksum addresses (no CORS issues) |
| **Leaderboard UI** | Rank #, avatar, username, transfer count, wallet address & links (Basescan + Rip.fun profile). Responsive glass-morphic table |
| **Timestamp display** | Shows "Last updated" time based on server data refresh |
| **Client-side fallback** | Falls back to client-side aggregation if backend unavailable |
| **Optional AI analysis** | Google Gemini 2.5 summarizes community "vibe" from usernames (server-side only) |

---

## 🗂  Project Structure

```
├─ index.html              # Tailwind CDN + custom neon theme + Google font
├─ src/
│  ├─ App.tsx              # Main React app with backend-first data flow
│  ├─ main.tsx             # React 19 entry point
│  ├─ main.css             # Global pixel-grid + neon blob background
│  ├─ components/
│  │   ├─ Header.tsx       # Header with smart refresh button + timer
│  │   ├─ Loader.tsx       # Loading states
│  │   ├─ ResultsTable.tsx # Leaderboard table
│  │   └─ CommunityAnalysis.tsx # AI vibe display
│  └─ services/
│      ├─ alchemyService.ts    # Client-side blockchain fallback
│      ├─ ripfunService.ts     # Client-side profile fallback
│      ├─ geminiService.ts     # Client-side AI wrapper (unused)
│      └─ leaderboardService.ts # Backend API integration
├─ server/
│  └─ simple.ts            # **Production backend** (Express + Alchemy SDK)
├─ vite.config.ts          # React plugin configuration
├─ tsconfig.json
├─ .env                    # Environment variables (gitignored)
└─ .gitignore              # Updated with security-focused entries
```

---

## 🔑 Environment Variables

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `VITE_ALCHEMY_API_KEY` | Alchemy Base mainnet API key | yes | **client** (fallback only) |
| `ALCHEMY_API_KEY` | Alchemy Base mainnet API key | yes | **server** (primary) |
| `VITE_API_BASE` | Backend server URL | yes | **client** |
| `GEMINI_API_KEY` | Google AI key for community analysis | optional | **server-side** only |
| `PORT` | Backend server port | optional | **server** (default: 8080) |
| `CACHE_TTL_MINUTES` | Server cache duration | optional | **server** (default: 60) |

Create `.env` file:

```env
# Backend server API keys (primary)
ALCHEMY_API_KEY=your_alchemy_api_key_here
GEMINI_API_KEY=optional_google_ai_key

# Frontend configuration
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_API_BASE=http://localhost:8081

# Server configuration (optional)
PORT=8081
CACHE_TTL_MINUTES=60
```

**🔒 Security Note:** The same Alchemy API key is used for both client and server, but the backend handles all primary operations. Client-side key is only used as fallback when backend is unavailable.

---

## 🧑‍💻 Local Development

### Full Stack (Recommended)

```bash
# Install dependencies
npm install

# Terminal 1: Start backend server
npx ts-node server/simple.ts

# Terminal 2: Start frontend dev server
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8081/leaderboard

### Frontend Only (Fallback Mode)

```bash
# Set VITE_API_BASE to empty or invalid URL
# Frontend will use client-side aggregation
npm run dev
```

---

## 🚀 Production Build

```bash
npm run build      # output in dist/
npm run preview    # test production build locally
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages).

---

## 🚂 Railway Deployment (Recommended)

### Backend Service (Primary)

1. **Deploy backend** using `server/simple.ts`:
   ```bash
   # Railway will run: npx ts-node server/simple.ts
   ```

2. **Set environment variables** in Railway dashboard:
   ```env
   ALCHEMY_API_KEY=your_key_here
   GEMINI_API_KEY=optional_google_ai_key
   PORT=8080
   CACHE_TTL_MINUTES=60
   ```

3. **Backend features**:
   - GET `/leaderboard` - Returns cached leaderboard with 1-hour TTL
   - GET `/` - Health check endpoint
   - Automatic pagination of blockchain data
   - Server-side profile enrichment with ERC-55 checksums
   - In-memory caching with configurable TTL

### Frontend Service

1. **Build command**: `npm run build`
2. **Set environment variables**:
   ```env
   VITE_ALCHEMY_API_KEY=your_key_here
   VITE_API_BASE=https://your-backend.railway.app
   ```
3. **Deploy**: Upload `dist/` folder or connect Railway to your repo

### Architecture Flow

```
User Browser → Frontend (Vite) → Backend (Express) → Alchemy API
                     ↓              ↓                    ↓
              Static Assets    Server Cache         Blockchain
                     ↓              ↓                    ↓
              LocalStorage     Rip.fun API         NFT Transfers
```

---

## 🔧 API Endpoints

### Backend (`server/simple.ts`)

#### `GET /leaderboard`
Returns cached leaderboard data with server-side profile enrichment.

**Response:**
```json
{
  "cached": true,
  "updatedAt": 1754420263571,
  "data": [
    {
      "walletAddress": "0x42d42A64B466c8D9BA0A6a575eafA57F5F701Fb5",
      "transferCount": 481,
      "username": "gamblingmeow",
      "avatar": "https://...",
      "profileUrl": "https://www.rip.fun/profile/gamblingmeow"
    }
  ]
}
```

#### `GET /`
Health check endpoint.

---

## 🛡️ Security & Production Notes

### ✅ Security Features
- **Backend-first architecture** - All sensitive operations on server
- **Server-side caching** - Reduces API calls and improves performance  
- **ERC-55 checksums** - Proper Ethereum address formatting
- **Environment separation** - Client/server environment variables
- **Rate limiting ready** - Architecture supports adding rate limits

### 🔒 Production Checklist

Before deploying:
- [ ] **Rotate API keys** if `.env` was ever committed to git
- [ ] **Set backend URL** in `VITE_API_BASE`
- [ ] **Use Railway environment variables** (not `.env` file)
- [ ] **Test backend health** at `/` endpoint
- [ ] **Verify CORS** if frontend/backend on different domains

### 🚨 Never Commit
- `.env` files (now in `.gitignore`)
- API keys in code
- Production credentials

---

## 🏗  Architecture Changes Made

### v2.0 Updates (Backend-First)
- ✅ **Server-side caching** with 1-hour TTL using `server/simple.ts`
- ✅ **Auto-loading data** on page visit (no manual fetch required)
- ✅ **Smart refresh controls** with server-time synchronized countdown
- ✅ **ERC-55 checksum addresses** for proper Rip.fun API compatibility
- ✅ **Server-side profile enrichment** (no CORS proxy needed)
- ✅ **Improved error handling** and loading states
- ✅ **Security hardening** with proper `.gitignore` and environment separation

### v1.0 (Client-Only)
- Client-side blockchain aggregation
- CORS proxy for Rip.fun API
- LocalStorage caching only
- Manual refresh button

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start frontend dev server
npm run start:backend    # Start backend server (server/simple.ts)
npx ts-node server/simple.ts  # Start main backend server

# Production
npm run build           # Build frontend for production
npm run preview         # Preview production build

# Testing
npx tsc --noEmit       # Type check without emitting files
```

---

## 🏗  Roadmap

### Completed ✅
- [x] Backend-first architecture with Express server
- [x] Server-side caching and profile enrichment
- [x] Auto-loading with smart refresh controls
- [x] ERC-55 checksum address support
- [x] Security hardening and production readiness

### Next Steps 🔜
- [ ] Add rate limiting middleware to backend
- [ ] Implement Redis/Railway KV for distributed caching
- [ ] Add comprehensive error boundaries
- [ ] Add pagination UI for >1000 addresses
- [ ] Collector address search/filter functionality
- [ ] Dark/Light mode toggle
- [ ] Health monitoring and metrics endpoints

---

## 📝 License

MIT © 2025 [@CryptoNdee](https://x.com/CryptoNdee)

---

## 🙏 Acknowledgements

* **Rip.fun** team and community for the amazing platform
* **Alchemy** for reliable Base blockchain RPC
* **Google Gemini 2.5** for optional community vibe analysis
* **Railway** for seamless backend deployment