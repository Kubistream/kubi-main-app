<p align="center">
  <img src="./public/assets/brand/logo_big.png" alt="Kubi logo" width="160" />
</p>

<h1 align="center">Kubi - Stream Smarter, Earn Onchain</h1>

<p align="center">
  <strong>A multichain creator platform with Mantle as the hub chain — receive onchain tips from any supported chain with automatic cross-chain bridging, auto-yield aggregation, and interactive OBS overlays</strong>
</p>

<p align="center">
  <a href="#highlights">Highlights</a> •
  <a href="#supported-networks">Networks</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## ✨ Highlights

- 🔗 **Multichain Donations with Auto-Bridge** – Supporters can donate from **any supported chain**. All donations are automatically bridged to **Mantle** (hub chain) — creators receive everything in one place!
- 🌉 **Mantle as Hub Chain** – Mantle Sepolia serves as the central hub. Cross-chain donations from Base Sepolia are automatically routed and consolidated on Mantle.
- 💰 **Non-Custodial Tipping** – Transactions verified directly from contract logs before persisting to Postgres.
- 📊 **Creator Dashboard** – Donation link + QR generator, multi-range earnings sparkline, and per-supporter token breakdown.
- 📈 **Auto-Yield Aggregation** – Reads representative token subscriptions and surfaces protocol growth percentages.
- 🎬 **Real-Time OBS Overlay** – Pusher-powered overlays with queued audio clips and animated gradients.
- 🔐 **SIWE Authentication** – Iron Session + RainbowKit/wagmi; creators onboard automatically after wallet connection.
- 🖼️ **Avatar Uploads** – S3-compatible storage for personalized leaderboard presence.

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **Web3** | Wagmi 2, Viem 2, RainbowKit 2, Ethers.js 6, SIWE 3 |
| **Database** | Prisma 6 ORM, PostgreSQL 16 |
| **Storage** | AWS S3 Compatible (MinIO support) |
| **Real-Time** | Pusher Channels |
| **Auth** | Iron Session, Sign-In With Ethereum (SIWE) |
| **Infrastructure** | Docker Compose, Node.js 20+ |
| **Dev Tools** | pnpm, ESLint, Concurrently, tsx |

### Key Dependencies

```
├── @rainbow-me/rainbowkit  # Wallet connection UI
├── wagmi                   # React hooks for Ethereum
├── viem                    # TypeScript Ethereum library
├── ethers                  # Ethereum utilities
├── siwe                    # Sign-In With Ethereum
├── @prisma/client          # Database ORM
├── pusher / pusher-js      # Real-time notifications
├── iron-session            # Encrypted session cookies
├── @aws-sdk/client-s3      # S3-compatible storage
├── node-cron               # Scheduler for yield rebase
├── lucide-react            # Icon library
└── qrcode.react            # QR code generation
```

---

## 🌐 Supported Networks

<table>
  <thead>
    <tr>
      <th>Network</th>
      <th>Chain ID</th>
      <th>Status</th>
      <th>Environment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="https://cryptologos.cc/logos/mantle-mnt-logo.svg?v=040" height="16" style="vertical-align:middle" /> <strong>Mantle Sepolia</strong></td>
      <td><code>5003</code></td>
      <td>✅ Primary</td>
      <td>Testnet</td>
    </tr>
    <tr>
      <td><img src="https://avatars.githubusercontent.com/u/108554348?s=200&v=4" height="16" style="vertical-align:middle" /> <strong>Base Sepolia</strong></td>
      <td><code>84532</code></td>
      <td>✅ Supported</td>
      <td>Testnet</td>
    </tr>
    <tr>
      <td><img src="https://cryptologos.cc/logos/mantle-mnt-logo.svg?v=040" height="16" style="vertical-align:middle" /> <strong>Mantle</strong></td>
      <td><code>5000</code></td>
      <td>🚧 Planned</td>
      <td>Mainnet</td>
    </tr>
    <tr>
      <td><img src="https://avatars.githubusercontent.com/u/108554348?s=200&v=4" height="16" style="vertical-align:middle" /> <strong>Base</strong></td>
      <td><code>8453</code></td>
      <td>🚧 Planned</td>
      <td>Mainnet</td>
    </tr>
  </tbody>
</table>

### 🏗️ Hub & Spoke Architecture

Kubi implements a **Hub & Spoke** cross-chain architecture with **Mantle as the Hub Chain**:

```mermaid
flowchart BT
    subgraph hub["🎯 MANTLE (Hub Chain)"]
        H["All donations consolidated here<br/>Creators withdraw from Mantle"]
    end

    subgraph bridge["🌉 Auto-Bridge Layer"]
        B["Cross-chain routing"]
    end

    subgraph spokes["Spoke Chains"]
        S1["🔵 Base Sepolia<br/>Donate here → Auto-bridge ✓"]
        S2["🟣 Mantle Sepolia<br/>Donate here → Direct ✓"]
        S3["🔮 Future Chains<br/>Arbitrum, Polygon, etc."]
    end

    S1 --> B
    S3 --> B
    B --> H
    S2 --> H

    style hub fill:#4ade80,stroke:#22c55e,stroke-width:2px,color:#000
    style bridge fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#000
    style spokes fill:#f472b6,stroke:#ec4899,stroke-width:2px,color:#000
```

**How it works:**

1. **Donation on Hub (Mantle)** — Direct deposit to the streamer's contract. No bridging needed.
2. **Donation on Spoke (Base, etc.)** — The smart contract automatically initiates a cross-chain bridge to Mantle. The donation is routed to the streamer's Mantle address seamlessly.
3. **Unified Balance** — All donations, regardless of source chain, are consolidated on Mantle. Creators only need to manage one wallet on one chain.

> 💡 **Why Mantle?** Mantle offers low gas fees, fast finality, and excellent DeFi ecosystem integration — making it the perfect hub for creator economy applications.


---

## 📋 Table of Contents

- [Highlights](#-highlights)
- [Supported Networks](#-supported-networks)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Running the Services](#-running-the-services)
- [Environment Variables](#-environment-variables)
- [Core Features](#-core-features)
- [Architecture & Directories](#-architecture--directories)
- [pnpm Scripts](#-pnpm-scripts)
- [Deployment](#-deployment)
- [Docker Support](#-docker-support)
- [License](#-license)

---

## 📦 Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | `20+` | `20.11+` recommended for Next 15 compatibility |
| **pnpm** | Latest | The repo ships with `pnpm-lock.yaml` |
| **Docker** | Latest | Optional; for local Postgres/MinIO |
| **Wallet** | Any EVM wallet | Required for signing transactions |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/kubi-main-app.git
cd kubi-main-app
pnpm install
```

### 2. Configure Environment

```bash
cp env/.env.example .env
cp env/.env.example env/.env.local
```

Edit both files with your configuration (see [Environment Variables](#-environment-variables)).

### 3. Start Database

```bash
docker compose up -d postgres
```

### 4. Run Migrations

```bash
pnpm prisma:migrate dev
pnpm prisma:generate
```

### 5. Seed Data (Optional)

```bash
pnpm seed:tokens
pnpm seed:yield-tokens
```

### 6. Start Development Server

```bash
pnpm dev
```

🎉 The app lives at **http://localhost:3000**

---

## ▶️ Running the Services

The Kubi application consists of multiple workers that run alongside the Next.js app:

| Service | Command | Description |
|---------|---------|-------------|
| **Full Stack** | `pnpm dev` | Runs Next.js + all workers with hot reload |
| **Next.js Only** | `pnpm dev:next` | Just the web application |
| **Event Listener** | `pnpm dev:listener` | Blockchain event monitoring |
| **Queue Processor** | `pnpm dev:processor` | Overlay broadcast processor |
| **Rebase Scheduler** | `pnpm dev:scheduler` | Auto-yield rebase cron |

### Production Mode

```bash
pnpm build
pnpm start          # Runs Next.js + all workers
pnpm start:next     # Just the web application
```

---

## 🔧 Environment Variables

### Server-side (`.env`)

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://kubi:kubi@localhost:5432/kubi?schema=public` | Postgres connection string |
| `SESSION_SECRET` | `super-long-random-string-min-32-chars` | Iron Session cookie secret |
| `APP_URL` | `http://localhost:3000` | Base URL for SIWE domain validation |
| `CHAIN_ID` | `5003` | Primary chain ID (Mantle Sepolia) |
| `PRIVATE_KEY` | `0x...` | Owner key for rebase scheduler |

#### S3/MinIO Configuration

| Variable | Example | Description |
|----------|---------|-------------|
| `S3_ENDPOINT` | `http://127.0.0.1:9000` | S3-compatible endpoint |
| `S3_REGION` | `us-east-1` | Bucket region |
| `S3_ACCESS_KEY_ID` | `minio` | Access credential |
| `S3_SECRET_ACCESS_KEY` | `minio-secret` | Secret credential |
| `S3_PUBLIC_BASE_URL` | `https://cdn.example.com` | Public URL prefix |
| `S3_BUCKET_AVATARS` | `kubi-avatars` | Avatar bucket name |
| `S3_FORCE_PATH_STYLE` | `true` | Use path-style URLs (MinIO) |

#### Pusher Configuration

| Variable | Example | Description |
|----------|---------|-------------|
| `PUSHER_APP_ID` | `1234567` | Pusher application ID |
| `PUSHER_KEY` | `abc123` | Pusher key |
| `PUSHER_SECRET` | `secret` | Pusher secret |
| `PUSHER_CLUSTER` | `ap1` | Pusher cluster |

### Client-side (`env/.env.local`)

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Must match `APP_URL` |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `abcd1234...` | WalletConnect Project ID |
| `NEXT_PUBLIC_PUSHER_KEY` | `abc123` | Client-side Pusher key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap1` | Client-side Pusher cluster |
| `NEXT_PUBLIC_BASE_RPC_URL` | `https://sepolia.base.org` | Base Sepolia RPC |
| `NEXT_PUBLIC_MANTLE_RPC_URL` | `https://rpc.sepolia.mantle.xyz` | Mantle Sepolia RPC |
| `NEXT_PUBLIC_ARBITRUM_RPC_URL` | `https://sepolia-rollup.arbitrum.io/rpc` | Arbitrum Sepolia RPC |
| `NEXT_PUBLIC_CHAIN_ID` | `5003` | Primary chain ID |
| `NEXT_PUBLIC_DONATION_CONTRACT_ADDRESS` | `0xDb26Ba...` | Donation contract address |

---

## ⚡ Core Features

### 1. 💸 Donation & Supporter Flow

- `src/app/api/save-donation/[channel]/route.ts` validates onchain receipts before persisting.
- Donor identity resolved by wallet address; new donors created automatically.
- Supports multiple tokens per chain with real-time price conversion.

### 2. 📊 Creator Dashboard

- **Donation Link Card** – High-resolution QR generator ready to download.
- **Earnings Overview** – Interactive sparkline with timeframe toggles and USD/IDR switch.
- **Token History** – Auto-yield positions and provider whitelists.

### 3. 🎬 OBS Overlay

- `src/app/overlay/[streamerId]/page.tsx` – Full-screen gradient animations.
- Pusher subscription with sequential audio/message queue.
- Customizable assets in `public/overlay/` (mp3/gif).

### 4. 🔐 Authentication & Sessions

- SIWE flow: `/api/auth/nonce` → sign → `/api/auth/verify` → Iron Session cookie.
- Automatic routing based on profile completion status.

### 5. 📈 Token & Yield Management

- Contract helpers in `src/services/contracts/`.
- Prisma models: `StreamerTokenWhitelist`, `YieldProvider`.
- Admin endpoints for dashboard data.

### 6. 🖼️ Media Storage

- Avatar uploads via `/api/uploads/avatar`.
- Validation: <5MB, PNG/JPEG only.
- CDN-ready URLs saved to database.

---

## 📁 Architecture & Directories

```
kubi-main-app/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/                # API routes (auth, donation, admin)
│   │   ├── dashboard/          # Creator dashboard pages
│   │   ├── donate/             # Donation flow pages
│   │   └── overlay/            # OBS overlay pages
│   ├── components/             # UI primitives and features
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── landing/            # Landing page components
│   │   └── ui/                 # Reusable UI components
│   ├── config/                 # App configuration
│   │   ├── chain-id.ts         # Chain ID configuration
│   │   ├── rpc-config.ts       # RPC fallback configuration
│   │   └── web3.ts             # Wagmi/RainbowKit setup
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, auth, Prisma client
│   ├── providers/              # Context providers
│   ├── services/               # Contract, token, upload integrations
│   │   └── contracts/          # Smart contract interactions
│   └── workers/                # Background workers
│       ├── event-listener.ts   # Blockchain event monitoring
│       ├── donation-queue-processor.ts  # Overlay broadcast
│       └── rebase-scheduler.ts # Auto-yield rebase cron
├── prisma/                     # Database schema & migrations
├── public/
│   ├── assets/                 # Static assets
│   └── overlay/                # Overlay audio/visual assets
├── env/                        # Environment templates
├── scripts/                    # Utility scripts
├── tests/                      # Test scaffolding
└── docker-compose.yml          # Docker services
```

---

## 📜 pnpm Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Runs Next.js + all workers with hot reload |
| `pnpm dev:next` | Next.js development server only |
| `pnpm dev:listener` | Event listener with watch mode |
| `pnpm dev:processor` | Queue processor with watch mode |
| `pnpm dev:scheduler` | Rebase scheduler with watch mode |
| `pnpm build` | Production build (Prisma generate + Next.js) |
| `pnpm start` | Production server (Next.js + all workers) |
| `pnpm lint` | Run ESLint |
| `pnpm prisma:generate` | Regenerate Prisma Client |
| `pnpm prisma:migrate` | Create/apply dev migrations |
| `pnpm prisma:push` | Push schema changes to database |
| `pnpm prisma:studio` | Open Prisma Studio (visual DB editor) |
| `pnpm seed:tokens` | Seed token configuration |
| `pnpm seed:yield-tokens` | Seed yield token configuration |

---


## 🚀 Deployment

### 1. Production Environment Setup

```bash
# Required environment variables
DATABASE_URL=postgresql://...
SESSION_SECRET=...
APP_URL=https://your-domain.com
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...
```

### 2. Build & Start

```bash
pnpm build
pnpm start
```

### 3. Apply Migrations

```bash
pnpm prisma:migrate deploy
```

### 4. Verify Connectivity

- Pusher credentials accessible
- RPC endpoints reachable
- S3/MinIO storage configured

---

## 🐳 Docker Support

### Available Services

| Service | Port | Description |
|---------|------|-------------|
| `app` | 3000 | Next.js application |
| `postgres` | 5432 | PostgreSQL database |
| `minio` | 9000, 9001 | S3-compatible storage |

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Management UIs

- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Prisma Studio**: `pnpm prisma:studio`

---



## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the `dev` branch.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Happy building the onchain streaming ecosystem with Kubi! 🚀</strong>
</p>

<p align="center">
  <a href="https://github.com/your-org/kubi-main-app">
    <img src="https://img.shields.io/github/stars/your-org/kubi-main-app?style=social" alt="GitHub stars" />
  </a>
  <a href="https://twitter.com/kubistream">
    <img src="https://img.shields.io/twitter/follow/kubistream?style=social" alt="Twitter Follow" />
  </a>
</p>
