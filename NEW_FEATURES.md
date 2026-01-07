# Fitur Baru dari kubi-backend (dev-mantle)

Dokumentasi ini menjelaskan fitur-fitur baru yang telah diimplementasikan dari kubi-backend branch `dev-mantle` ke kubi-main-app.

## Daftar Fitur

### 1. Scheduler Rebase Yield ✅

Scheduler otomatis untuk melakukan rebase pada yield token berdasarkan konfigurasi APR/APY.

#### Lokasi File
- `src/workers/rebase-scheduler.ts`

#### Cara Menjalankan

```bash
# Development mode (dengan auto-reload)
pnpm run dev:scheduler

# Production mode
pnpm run start:scheduler
```

#### Environment Variables yang Dibutuhkan

```bash
# RPC URL untuk chain tempat yield token dideploy
RPC_URL=https://rpc.sepolia.mantle.xyz

# Private key dari akun owner (dengan prefix 0x)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Chain ID (contoh: 5003 untuk Mantle Sepolia)
CHAIN_ID=5003

# Cron expression untuk scheduler (default: setiap 30 menit)
# Format: detik menit jam hari bulan hari_dalam_minggu
CRON_EXPR=0 */30 * * * *
```

#### Cara Kerja

1. Scheduler membaca konfigurasi yield provider dari database (tabel `YieldProvider`)
2. Untuk setiap yield token yang aktif, scheduler menghitung scaling factor baru berdasarkan APR/APY
3. Transaction rebase dikirim ke smart contract
4. Timestamp `aprUpdatedAt` di-update di database

#### Konfigurasi Yield Provider

Setiap yield provider dapat dikonfigurasi melalui field `extraData` di database:

```json
{
  "mode": "apr",           // atau "apy"
  "percent": 12.5,         // APR/APY dalam persen
  "active": true,          // apakah scheduler aktif
  "skipIfZero": false,     // skip jika APR = 0
  "name": "Kubi staked"    // nama kustom (opsional)
}
```

---

### 2. Donation Queue Processing ✅ (Tanpa RabbitMQ)

Enhanced donation flow dengan support untuk media (TEXT/AUDIO/VIDEO), USD values. Menggunakan **Database-based Queue** (Postgres) - tidak perlu RabbitMQ!

#### Lokasi File
- `src/workers/event-listener.ts` - Event listener untuk on-chain events
- `src/workers/donation-queue-processor.ts` - Queue processor untuk overlay broadcast
- `src/app/api/save-donation/[channel]/route.ts` - API untuk menyimpan donation

#### Cara Menjalankan

```bash
# Jalankan event listener (untuk on-chain events) + queue processor
pnpm run dev

# Atau jalankan secara terpisah:
pnpm run dev:listener      # Event listener
pnpm run dev:processor    # Queue processor
```

#### Environment Variables yang Dibutuhkan

```bash
# Database (sudah ada)
DATABASE_URL=postgresql://user:password@host:5432/database

# Pusher (untuk overlay broadcast)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap1
```

#### Cara Kerja (Tanpa RabbitMQ)

```
┌─────────────────────┐
│ On-Chain Event      │ (donation terdeteksi di blockchain)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ event-listener      │
│ 1. Create Donation  │ (di DB)
│ 2. Create QueueOverlay │ (di DB - status: PENDING)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ QueueOverlay Table  │ ← Database sebagai queue
│ (status: PENDING)   │
└──────────┬──────────┘
           │
           ▼ Polling setiap 1 detik
┌─────────────────────────┐
│ donation-queue-processor│
│ 1. Enrich with metadata │
│ 2. Broadcast ke Pusher  │
│ 3. Update status: DISPLAYED│
└─────────────────────────┘
```

#### Keunggulan Database Queue vs RabbitMQ

| Aspect | RabbitMQ | Database Queue |
|--------|----------|----------------|
| Deployment | Perlu service tambahan | ❌ Tidak perlu (Postgres sudah ada) |
| Maintenance | Perlu monitor RabbitMQ | ❌ Tidak perlu (sudah di DB) |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Latency | ⭐⭐⭐⭐⭐ Real-time | ⭐⭐⭐⭐ Polling 1s |
| Complexity | ⭐⭐ Rumit | ⭐ Simple |
| Setup | ⭐⭐ Ribet | ⭐⭐⭐⭐⭐ Mudah |

#### Struktur Database Queue

**QueueOverlay Table:**
```typescript
{
  id: string
  streamerId: string
  tokenInId: string
  amountInRaw: string
  txHash: string
  timestamp: DateTime
  message?: string
  mediaType: "TEXT" | "AUDIO" | "VIDEO"
  mediaUrl?: string
  mediaDuration?: number
  status: "PENDING" | "ON_PROCESS" | "DISPLAYED"
}
```

---

### 3. Docker Support ✅

Docker support untuk menjalankan seluruh aplikasi dalam container.

#### Lokasi File
- `Dockerfile` - Docker configuration untuk Next.js app
- `docker-compose.yml` - Docker Compose configuration

#### Services yang Tersedia

1. **app** - Next.js application (port 3000)
2. **postgres** - PostgreSQL database (port 5432)
3. **minio** - S3-compatible storage (port 9000, 9001)

#### Cara Menjalankan

```bash
# Build dan jalankan semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f app

# Stop semua services
docker-compose down

# Stop dan hapus volumes
docker-compose down -v
```

#### Management UIs

- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

---

## Skrip NPM Baru

Berikut adalah skrip-skrip baru yang telah ditambahkan:

```json
{
  "dev": "concurrently \"next dev\" \"tsx watch src/workers/event-listener.ts\" \"tsx watch src/workers/donation-queue-processor.ts\"",
  "dev:listener": "tsx watch src/workers/event-listener.ts",
  "dev:processor": "tsx watch src/workers/donation-queue-processor.ts",
  "dev:scheduler": "tsx watch src/workers/rebase-scheduler.ts",
  "start:listener": "tsx src/workers/event-listener.ts",
  "start:processor": "tsx src/workers/donation-queue-processor.ts",
  "start:scheduler": "tsx src/workers/rebase-scheduler.ts"
}
```

---

## Dependencies Baru

Dependencies yang telah ditambahkan:

```json
{
  "dependencies": {
    "node-cron": "^4.2.1"  // Scheduler
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11"
  }
}
```

Install dependencies:
```bash
pnpm install
```

---

## Schema Database

### Donation Model Enhancement

Field-field berikut sudah ada di model Donation:

```prisma
model Donation {
  // ... existing fields

  // Media support
  mediaType     MediaType     @default(TEXT)
  mediaUrl      String?
  mediaDuration Int?          @default(0)

  // USD values
  amountInUsd   Decimal?      @db.Decimal(300, 8)
  amountOutUsd  Decimal?      @db.Decimal(300, 8)
  amountInIdr   Decimal?      @db.Decimal(300, 8)
  amountOutIdr  Decimal?      @db.Decimal(300, 8)

  // ... rest of fields
}

enum MediaType {
  TEXT
  AUDIO
  VIDEO
}
```

### QueueOverlay Model

Model ini digunakan untuk database-based queue:

```prisma
model QueueOverlay {
  id            String        @id @default(cuid())
  linkId        String?
  link          DonationLink? @relation(fields: [linkId], references: [id], onDelete: SetNull)
  tokenInId     String
  tokenIn       Token         @relation("QueueOverlayTokenIn", fields: [tokenInId], references: [id])
  streamerId    String?
  streamer      Streamer?     @relation(fields: [streamerId], references: [id], onDelete: Cascade)
  amountInRaw   String
  txHash        String
  timestamp     DateTime
  message       String?       @db.Text
  mediaType     MediaType     @default(TEXT)
  mediaUrl      String?
  mediaDuration Int?          @default(0)
  status        OverlayStatus @default(PENDING)

  @@index([linkId])
  @@index([txHash])
}

enum OverlayStatus {
  PENDING
  ON_PROCESS
  DISPLAYED
}
```

---

## Testing

### Test Scheduler Rebase

1. Setup yield provider di database dengan APR > 0
2. Set environment variables untuk RPC dan private key
3. Jalankan scheduler: `pnpm run dev:scheduler`
4. Scheduler akan menjalankan rebase setiap interval yang ditentukan

### Test Donation Queue

1. Pastikan Postgres berjalan: `docker-compose up -d postgres`
2. Jalankan processor: `pnpm run dev:processor`
3. Trigger donation event via smart contract
4. Cek table QueueOverlay - harusnya ada record baru
5. Tunggu 1-2 detik - processor akan memproses dan broadcast

### Test Docker

```bash
# Jalankan semua services
docker-compose up -d

# Cek status semua services
docker-compose ps

# Lihat logs
docker-compose logs -f

# Test app
curl http://localhost:3000
```

---

## Perbandingan dengan kubi-backend

| Aspect | kubi-backend (Go) | kubi-main-app (TypeScript) |
|--------|-------------------|----------------------------|
| Bahasa | Go | TypeScript/Node.js |
| Framework | Gin | Next.js |
| Database ORM | GORM | Prisma |
| Blockchain Library | go-ethereum | viem |
| Scheduler | robfig/cron | node-cron |
| Queue | RabbitMQ (amqp091) | **Database Queue** (Postgres) ✨ |

---

## Troubleshooting

### Scheduler tidak berjalan

- Pastikan `PRIVATE_KEY` valid dan memiliki sufficient gas
- Pastikan `RPC_URL` dapat diakses
- Cek logs untuk error message

### Donation tidak terbroadcast ke overlay

- Pastikan Pusher credentials benar
- Cek table `QueueOverlay` - harusnya ada records
- Cek logs donation queue processor
- Pastikan processor berjalan: `pnpm run dev:processor`

### QueueOverlay stuck di PENDING

- Pastikan donation-queue-processor berjalan
- Cek logs untuk error
- Pastikan Pusher credentials valid

---

## Keunggulan Arsitektur Baru

### ✅ No RabbitMQ = Simpler Deployment
- Tidak perlu deploy dan manage RabbitMQ service
- Tidak perlu monitoring RabbitMQ
- Tidak perlu additional infrastructure

### ✅ Database Queue = Reliable
- Queue tersimpan di Postgres (sudah ada)
- Persistent - tidak hilang kalau server restart
- Dapat diquery dan dimonitor via SQL
- Backup otomatis dengan DB backup

### ✅ Polling = Good Enough
- 1 second polling = negligible latency
- No additional complexity
- Easy to debug and monitor

---

## Next Steps

1. **Setup Yield Providers**: Buat yield provider records di database
2. **Configure APR/APY**: Set `extraData` untuk setiap provider
3. **Test Rebase**: Jalankan scheduler dan verifikasi transaction
4. **Test Donation Queue**: Trigger donation dan verifikasi broadcast
5. **Deploy ke Production**: Setup Docker Compose di production server

---

## References

- [kubi-backend repository](../kubi-backend)
- [dev-mantle branch](../kubi-backend/tree/dev-mantle)
- [Prisma Schema](./prisma/schema.prisma)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
