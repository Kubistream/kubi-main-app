# Auth Test Coverage Plan

- Add route-handler tests for `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`, and `/api/auth/me` using `next-test-api-route-handler` or `supertest` to ensure the SIWE handshake enforces nonce expiry and session cookies.
- Mock Prisma using a transaction-scoped client (or `@quramy/prisma-fabbrica`) to validate session persistence and cleanup flows.
- Exercise `lib/auth/siwe` helpers to confirm domain/origin enforcement and nonce deduplication behaviour across success/failure cases.
- Add integration smoke tests that simulate the full SIWE round-trip: nonce -> signature -> verify -> authenticated `me` response.
- Extend CI to run `npm run lint` and the new auth test suite once implemented.
