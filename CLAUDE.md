# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Vite frontend application with an optional Express backend that creates a community leaderboard for Rip.fun NFT pack buyers. The application aggregates NFT transfers from the Rip.fun mint wallet to recipients, enriches the data with user profiles, and displays a ranked leaderboard with optional AI-powered community analysis.

## Architecture

### Frontend (Client-side)
- **Framework**: React 19 with Vite as build tool
- **Styling**: Tailwind CSS (loaded via CDN in `index.html`)
- **State Management**: React hooks with localStorage caching (1-hour TTL)
- **Data Flow**: Client-side blockchain aggregation → Profile enrichment → Optional AI analysis

### Backend (Optional)
Two backend implementations are available:
- `server/index.ts`: Basic Express server with in-memory caching using raw Viem RPC calls
- `server/simple.ts`: Feature-complete Express server using Alchemy SDK with profile enrichment

The backend provides a `/leaderboard` endpoint that aggregates data server-side and caches results for 1 hour.

### Data Sources
- **Blockchain Data**: Alchemy Base RPC for NFT transfer aggregation via `alchemy_getAssetTransfers`
- **Profile Data**: Rip.fun API (`https://www.rip.fun/api/auth/{address}`) for usernames/avatars
- **AI Analysis**: Google Gemini 2.5 API for community vibe analysis (server-side only)

## Development Commands

```bash
# Frontend development
npm run dev              # Start Vite dev server on http://localhost:5173

# Production build
npm run build           # Build to dist/ directory
npm run preview         # Preview production build

# Backend development (optional)
npm run start:backend   # Start Express server on port 8080
```

## Environment Variables

Required for client:
- `VITE_ALCHEMY_API_KEY`: Alchemy Base mainnet API key (exposed to client)

Optional for server:
- `GEMINI_API_KEY`: Google AI API key for community analysis (server-side only)
- `PORT`: Backend server port (default: 8080)
- `CACHE_TTL_MINUTES`: Cache duration in minutes (default: 60)

## Key Constants

Located in `src/App.tsx`:
- `NFT_CONTRACT_ADDRESS`: `0x6292bf78996e189bAd8f9CF3e3Cb31017bb70540`
- `MINT_FROM_ADDRESS`: `0xeBeA10BCd609d3F6fb2Ea104baB638396C037388`

## Service Architecture

### Alchemy Service (`src/services/alchemyService.ts`)
- Uses Viem with raw RPC calls to Alchemy
- Implements pagination via `pageKey` for complete transfer history
- Aggregates transfer counts by recipient address with checksum validation

### Rip.fun Service (`src/services/ripfunService.ts`)
- Batches profile requests with retry logic and exponential backoff
- Uses CORS proxy (`https://corsproxy.io/`) for client-side API access
- Handles rate limiting (429) and server errors gracefully

### Leaderboard Service (`src/services/leaderboardService.ts`)
- Optional backend integration for server-side data aggregation
- Falls back to client-side processing if backend unavailable

### Gemini Service (`src/services/geminiService.ts`)
- Server-side only AI analysis of community usernames
- Generates community "vibe" summaries

## Component Structure

- `App.tsx`: Main application state machine and data orchestration
- `Header.tsx`: Application header with refresh functionality
- `Loader.tsx`: Loading states with progress messages
- `ResultsTable.tsx`: Responsive leaderboard table with rankings, avatars, usernames, and links
- `CommunityAnalysis.tsx`: Optional AI-generated community insights display

## Data Flow Patterns

1. **Client-side Flow**: Alchemy → Profile enrichment (batched) → Cache → Display
2. **Backend Flow**: Backend API → Display (with fallback to client-side)
3. **Caching**: 1-hour localStorage cache with timestamp validation
4. **Profile Enrichment**: Processes addresses in batches of 20 to avoid rate limits

## Deployment Notes

- **Static Hosting**: Frontend can be deployed to any static host (Vercel, Netlify, GitHub Pages)
- **Backend Deployment**: Designed for Railway with environment variable configuration
- **CORS Handling**: Uses public CORS proxy for client-side Rip.fun API access

## Testing

No test framework is currently configured. When adding tests, follow the existing TypeScript and React patterns.