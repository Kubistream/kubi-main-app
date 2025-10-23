# Kubi - Stream Smarter, Earn Onchain

<p align="center">
  <img src="./public/assets/brand/logo.png" alt="Kubi logo" width="128" />
</p>

> A creator platform for receiving onchain tips on Base, stitching in auto-yield, and broadcasting interactive overlays straight into OBS.

## Table of Contents
- [Highlights](#highlights)
- [Core Stack](#core-stack)
- [Prerequisites](#prerequisites)
- [Quick Installation](#quick-installation)
- [Running the Services](#running-the-services)
- [Environment Variables](#environment-variables)
- [Core Features](#core-features)
- [Architecture & Directories](#architecture--directories)
- [pnpm Scripts](#pnpm-scripts)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Additional Notes](#additional-notes)

## Highlights
- Non-custodial tipping on Base: transactions are verified directly from contract logs before persisting to Postgres.
- Creator dashboard bundles donation link + QR generator, multi-range earnings sparkline, and per-supporter token breakdown.
- Auto-yield aggregation reads representative token subscriptions and surfaces protocol growth percentages.
- Real-time streaming overlay via WebSocket with queued audio clips and animated gradients ready for OBS.
- SIWE + Iron Session with RainbowKit/wagmi; creators onboard automatically after connecting a wallet.
- Avatar uploads to S3-compatible storage let supporters personalize their presence on leaderboards.

## Core Stack
- Next.js 15 (App Router) + React 19, full TypeScript coverage.
- Tailwind CSS 4 with bespoke design components in `src/components`.
- Prisma 6 + PostgreSQL (see `prisma/schema.prisma` and `docker-compose.yml`).
- wagmi 2, RainbowKit, ethers 6, and viem for Base Sepolia integrations.
- Iron Session + SIWE for encrypted, httpOnly cookie sessions.
- AWS SDK S3 for avatar uploads and shareable public URLs.

## Prerequisites
- Node.js 20 or newer (20.11+ recommended for Next 15 compatibility).
- pnpm (the repo ships with `pnpm-lock.yaml`).
- Docker & Docker Compose if you want a quick local Postgres.
- Base Sepolia RPC access and a test wallet to sign transactions.

## Quick Installation
1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```
2. Prepare environment files:
   ```bash
   cp env/.env.example .env
   cp env/.env.example env/.env.local
   ```
   Populate the relevant variables (see [Environment Variables](#environment-variables)).
3. Spin up local Postgres (optional but recommended):
   ```bash
   docker compose up -d
   ```
4. Run database migrations and generate the Prisma Client:
   ```bash
   pnpm prisma:migrate dev
   pnpm prisma:generate
   ```
5. Start the development server:
   ```bash
   pnpm dev
   ```
   The app lives at http://localhost:3000.

## Running the Services
- Next.js app (dev): `pnpm dev`
- Production build: `pnpm build`
- Production server (uses the build output): `pnpm start`
- Prisma Studio (DB inspector): `pnpm prisma:studio`

The overlay WebSocket relay is expected to run separately. Point `NEXT_PUBLIC_OVERLAY_WS_URL` to that service so OBS overlays receive live donation events.

## Environment Variables
### Server-side (`.env`)
| Name | Example | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://kubi:kubi@localhost:5432/kubi?schema=public` | Postgres connection string for Prisma. |
| `SESSION_SECRET` | `super-long-random-string` | Iron Session cookie secret; minimum 32 characters. |
| `APP_URL` | `http://localhost:3000` | Base URL used for SIWE domain validation (must match deploy origin). |
| `S3_ENDPOINT` | `http://127.0.0.1:9000` | S3-compatible storage endpoint for avatars. |
| `S3_REGION` | `us-east-1` | Optional; defaults to `us-east-1`. |
| `S3_ACCESS_KEY_ID` | `minio` | Bucket access credential. |
| `S3_SECRET_ACCESS_KEY` | `minio-secret` | Bucket access credential. |
| `S3_PUBLIC_BASE_URL` | `https://cdn.example.com` | Public URL prefix stored in the DB. |
| `S3_BUCKET_AVATARS` | `kubi-avatars` | Avatar bucket name. |
| `S3_FORCE_PATH_STYLE` | `true` | Optional, use `true` for MinIO/LocalStack setups. |
| `CHAIN_ID` | `84532` | Override chain ID server-side if you diverge from Base Sepolia. |

### Client/Public (`env/.env.local`)
| Name | Example | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Must match `APP_URL` to satisfy SIWE origin checks. |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `abcd1234...` | WalletConnect Project ID (fallback provided if you don’t have one yet). |
| `NEXT_PUBLIC_OVERLAY_WS_URL` | `ws://localhost:8080` | WebSocket endpoint feeding OBS overlays. |
| `NEXT_PUBLIC_BASE_RPC_URL` | `https://base-sepolia.drpc.org` | Public Base Sepolia RPC for clients. |
| `NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS` | `0xabc...` | Optional override for the donation contract address. |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | Optional client-side chain ID override. |

`env/.env.local` loads after `.env`, so values there override the shared server config for local development.

## Core Features
### 1. Donation & Supporter Flow
- `src/app/api/save-donation/[channel]/route.ts` validates onchain receipts (Donation event ABI) before persisting to the `Donation` table.
- Donor identity is resolved by wallet address: existing profiles are updated, new donors are created automatically.
- USD/IDR conversion still uses a mock price map—swap in a real feed when ready for production.

### 2. Creator Dashboard
- `src/app/dashboard/page.tsx` renders the **Donation Link Card** with a high-resolution QR generator (`DonationLinkCard`) ready to download.
- **Earnings Overview Card** surfaces an interactive sparkline with timeframe toggles (`use-earnings-overview`) and currency switch (USD/IDR).
- Token history + yield growth is handled by `AutoYieldPositionsCard`, reading representative token contracts and provider whitelists.

### 3. OBS Overlay
- `src/app/overlay/[streamerId]/page.tsx` is a full-screen layout with gradient animation and mascot art.
- Connects to the WebSocket endpoint (`NEXT_PUBLIC_OVERLAY_WS_URL`) and queues audio/messages sequentially to avoid overlap.
- Supporting assets live in `public/overlay/` (mp3/gif) for easy customization.

### 4. Authentication & Sessions
- SIWE is implemented via `src/providers/auth-provider.tsx`, `src/lib/auth/siwe.ts`, and `src/lib/auth/session.ts`.
- Flow: `/api/auth/nonce` -> sign message -> `/api/auth/verify` -> Iron Session cookie `kubi.session`.
- The `useLaunchApp` hook routes users to onboarding or dashboard based on profile status.

### 5. Token & Yield Management
- Contract helpers live in `src/services/contracts/` (addresses, yield, erc20, provider).
- Prisma stores token whitelists, yield providers, and streamer relationships (`StreamerTokenWhitelist`, `YieldProvider`).
- Admin endpoints (e.g. `/api/admin/yield/providers`) supply dashboard data.

### 6. Media Storage
- Avatar uploads go through `/api/uploads/avatar` using the AWS SDK S3 client.
- Files are validated (<5MB, PNG/JPEG) before upload.
- `publicUrlForKey` generates CDN-ready URLs that are saved in the database.

## Architecture & Directories
```
src/
  app/                 // Next.js App Router routes (dashboard, donate, overlay, API)
  components/          // UI primitives and feature components (landing, dashboard, etc.)
  providers/           // Context providers (AuthProvider, Theme, ...)
  hooks/               // Custom hooks such as wallet, earnings
  services/            // Contract, token, upload, profile integrations
  lib/                 // Env helpers, Prisma client, utilities, auth helpers, S3
prisma/                // Database schema & migrations
public/overlay/        // Overlay assets (audio, sample visuals)
env/                   // Environment templates (.env.example, .env.local)
```

The database schema in `prisma/schema.prisma` covers `User`, `Streamer`, `Donation`, `Token`, `YieldProvider`, `QueueOverlay`, and other supporting models.

## pnpm Scripts
| Script | Description | Notes |
| --- | --- | --- |
| `pnpm dev` | Runs the Next.js dev server with hot reload. | Ensure env variables are set. |
| `pnpm build` | Produces a production build of Next.js. | Run before deployment. |
| `pnpm start` | Serves the production build. | Use in staging/prod behind a proxy. |
| `pnpm lint` | Executes ESLint. | Recommended pre-commit. |
| `pnpm prisma:generate` | Regenerates Prisma Client. | Run after schema changes. |
| `pnpm prisma:migrate` | Creates/apply dev migrations locally. | Requires Postgres running. |
| `pnpm prisma:studio` | Opens Prisma Studio. | Handy for visual data debugging. |

## Testing & Quality
- Automated test suites aren’t in place yet; `tests/` is scaffolded for future E2E coverage.
- Run `pnpm lint` before pushing to catch formatting/TypeScript issues.
- Use `pnpm prisma:studio` or `psql` to verify data after trial donation flows.

## Deployment
1. Ensure production env variables are provisioned (especially S3 credentials and public URLs).
2. Build the app: `pnpm build`.
3. Serve it: `pnpm start` (defaults to port 3000) behind HTTPS/reverse proxy.
4. Apply schema migrations on release: `pnpm prisma:migrate deploy`.
5. Confirm the overlay relay and Base Sepolia RPC are reachable from your deployment environment.

The sample CI/CD pipeline in `.github/workflows/deploy-dev.yaml` is a good starting point for automated deployments (Vercel or self-hosted).

## Additional Notes
- Token prices in the `save-donation` route are placeholders—swap for a live feed (Chainlink, Coingecko API, etc.) before going live.
- `docker-compose.yml` spins up Postgres 16 with a persistent `postgres-data` volume.
- Keep `env/.env.example` up to date whenever you introduce new variables to streamline onboarding.

Happy building the onchain streaming ecosystem with Kubi! 🚀
