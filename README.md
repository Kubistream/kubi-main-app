This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

1. Copy the template to create your base env: `cp env/.env.example .env`.
2. Copy it again for local overrides: `cp env/.env.example env/.env.local`.
3. Fill the variables in each file:
   - `DATABASE_URL` (in `.env`) — connection string for your local Postgres instance. The default points at the Docker Compose service (`postgresql://kubi:kubi@localhost:5432/kubi?schema=public`). Update user/password/port if you changed them.
   - `SESSION_SECRET` (in `.env`) — a long random string (32+ characters) used to encrypt Iron Session cookies.
   - `APP_URL` and `NEXT_PUBLIC_APP_URL` (in `.env` / `env/.env.local`) — the canonical base URL for the app, e.g. `http://localhost:3000`. Both values should match so SIWE domain/origin checks succeed.
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` (in `env/.env.local`) — your WalletConnect project ID. Leave the placeholder or blank if you do not have one yet.

After updating Prisma models run `npm run prisma:generate` to refresh the generated client.

`next dev` and Prisma CLI commands load `.env` first and then `env/.env.local`, so values in the local file override the shared defaults while remaining out of git. Keep `.env.example` up to date whenever new variables are introduced.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication

- `GET /api/auth/nonce` — issues a one-time SIWE nonce tied to the current browser session.
- `POST /api/auth/verify` — verifies the signed SIWE message, upserts the user, and mints a session cookie.
- `GET /api/auth/me` — returns the hydrated user + session payload when a valid session cookie is present.
- `POST /api/auth/logout` — revokes the active session and clears the client cookie.

All authenticated API calls expect the Iron Session cookie provided during verification. Keep `SESSION_SECRET` in sync across environments to decrypt these cookies.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
