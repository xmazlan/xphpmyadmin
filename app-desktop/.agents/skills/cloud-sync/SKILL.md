---
name: cloud-sync
description: "Panduan dan spesifikasi arsitektur Cloud Sync & State Journaling untuk xphpMyAdmin Desktop yang terintegrasi langsung dengan backend /home/roby/Documents/PROJECT/er-suit/er-backend (Hono Serverless + Neon PostgreSQL db_ajoroby/db_luluax). Mengatur serialisasi resmi JSON, integrasi API /api/sync (push, pull, merge), autentikasi pelanggan Pro, Team, dan Business /api/auth (login, register, plan upgrade), serta aturan AI Agent dalam mereplikasi state lintas perangkat bagi pelanggan berlangganan."
metadata:
  version: "1.2.0"
  backend_path: "/home/roby/Documents/PROJECT/er-suit/er-backend"
  backend_stack: "Hono + Neon PostgreSQL (Drizzle ORM)"
  framework: "React 19 + TypeScript + Zod"
  category: "cloud-sync-architecture"
  tags:
    - cloud-sync
    - er-backend
    - neon-postgres
    - hono
    - official-json-snapshot
    - business-subscription
    - annual-billing
---

# Cloud Sync & State Journaling (er-backend Integration) — Panduan AI Agent

> **KEBIJAKAN WAJIB DIEKSEKUSI (MANDATORY POLICY FOR AI AGENTS)**:  
> Seluruh sinkronisasi cloud xphpMyAdmin Desktop dialokasikan ke backend resmi di:  
> **`/home/roby/Documents/PROJECT/er-suit/er-backend`**  
> Backend ini menggunakan framework **Hono Serverless**, **Neon Cloud PostgreSQL**, dan **Drizzle ORM**, melayani endpoint lokal di `http://127.0.0.1:4000` dan produksi di `https://www.er-service.duckdns.org`.  
> Seluruh konfigurasi pengguna (profil host database, SSH tunnel, riwayat kueri, dan jurnal audit aksi) wajib diserialisasikan ke format JSON resmi (`CloudSyncSnapshot`) dan disinkronkan ke tabel `sync_profiles` di Neon database.

---

## 1. Topologi & Lokasi Backend

- **Path Repositori Backend**: `/home/roby/Documents/PROJECT/er-suit/er-backend`
- **Database Backend**: Neon Serverless PostgreSQL (`db_ajoroby` / `db_luluax`)
- **Port Lokal**: `4000` (`http://127.0.0.1:4000`)
- **Port Produksi**: `https://www.er-service.duckdns.org`
- **Tabel Pengguna & Langganan Cloud (`users`)**:
  - `plan VARCHAR(32) DEFAULT 'pro'` (`pro`, `team`, `business`)
  - `billing_cycle VARCHAR(16) DEFAULT 'annual'` (`monthly`, `annual`)
  - `plan_expires_at BIGINT`
  - `max_vaults INT` (Pro: 10, Team: 20, Business: 50, Admin: 100)
- **Tabel Penyimpanan Cloud (`sync_profiles`)**:
  ```sql
  CREATE TABLE sync_profiles (
    sync_key VARCHAR(255) PRIMARY KEY,
    last_device TEXT,
    data JSONB NOT NULL,
    updated_at BIGINT
  );
  ```

---

## 2. Struktur Paket Langganan Cloud (Subscription Tiers & Billing Cycles)

Sesuai spesifikasi desain produk pada menu "Upgrade your plan":

### Billing Cycles
- **Monthly**: Tagihan bulanan standar.
- **Annual • up to 33% off**: Tagihan tahunan hemat hingga 33%.

### Tingkatan Paket (Tiers):
1. **Pro**:
   - **Harga**: US$10/bulan (Annual, ditagih tahunan) atau US$15/bulan (Monthly).
   - **Kapasitas**: 10 Cloud Vaults.
   - **Fitur**:
     - Personal cloud vault
     - Sync across mobile and desktop
     - Session logs
     - Snippets automation
2. **Team**:
   - **Harga**: US$20/seat/bulan (Annual, ditagih tahunan) atau US$30/seat/bulan (Monthly).
   - **Kapasitas**: 20 Cloud Vaults.
   - **Fitur**:
     - *Semua fitur Pro*, plus:
     - One team vault for secure sharing
     - Real-time collaboration
     - Shared session logs for collaboration
     - Consolidated billing
3. **Business** (Enterprise Status):
   - **Harga**: US$30/seat/bulan (Annual, ditagih tahunan) atau US$45/seat/bulan (Monthly).
   - **Kapasitas**: 50 Cloud Vaults.
   - **Fitur**:
     - *Semua fitur Team*, plus:
     - Multiple team vaults for advanced sharing control
     - Granular access control for vaults
     - SAML SSO (Add-on Enterprise)

---

## 3. Akun Pengujian Tersedia (Seeded di Neon Database)

Untuk pengujian otomatis maupun manual via `app-desktop`:
- **Akun Pengujian Business**:
  - Email: `business@xphpmyadmin.dev`
  - Password: `Password@123`
  - Status: **Business** • **Annual** (50 Cloud Vaults)
- **Akun Pengujian Team**:
  - Email: `team@xphpmyadmin.dev`
  - Password: `Password@123`
  - Status: **Team** • **Monthly** (20 Cloud Vaults)
- **Akun Pengujian Pro**:
  - Email: `pro@xphpmyadmin.dev`
  - Password: `Password@123`
  - Status: **Pro** • **Annual** (10 Cloud Vaults)
- **Akun Admin Enterprise**:
  - Email: `robyfull.dev@gmail.com`
  - Password: `Password@123`
  - Status: **Business / Admin** • **Annual** (100 Cloud Vaults)

---

## 4. Kontrak Endpoint API

### 1. `POST /api/sync/push`
- **Fungsi**: Mengunggah snapshot JSON lengkap dari desktop ke cloud database Neon.
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <API_TOKEN / SYNC_KEY>`
  - `X-Sync-Key: <SYNC_KEY>`

### 2. `POST /api/sync/pull`
- **Fungsi**: Menarik konfigurasi host dan preferensi terbaru dari cloud database.

### 3. `POST /api/sync/merge`
- **Fungsi**: Smart-merge data profil lokal dan cloud tanpa menimpa data yang telah ada.

### 4. `POST /api/auth/login`
- **Fungsi**: Autentikasi email & password, mengembalikan profil pengguna beserta `plan`, `billingCycle`, dan `maxVaults`.

### 5. `PATCH /api/auth/plan`
- **Fungsi**: Mengubah atau meng-upgrade paket langganan (`pro`, `team`, `business`) dan siklus tagihan (`monthly`, `annual`).

---

## 5. Keuntungan Pelanggan Cloud Berlangganan

1. **Replikasi Otomatis Multi-Perangkat**:
   - Pengguna dapat membuka xphpMyAdmin di Mac (Apple Silicon), Windows, maupun Linux; seluruh server host, konfigurasi SSH tunnel, dan bookmark database langsung tersedia seketika tanpa input ulang manual.
2. **Cloud Vault Terenkripsi**:
   - Password sensitif diisolasi ke OS Keychain lokal; token otorisasi cloud dikelola aman di `sync_profiles`.
3. **Audit Log & Riwayat Kueri Tak Terbatas**:
   - Pelanggan Business/Pro dapat melacak seluruh aksi perbaikan, ekspor/impor data, dan riwayat query di penyimpanan cloud Neon.
4. **Offline Resilience & Instant Restore**:
   - Jika offline, transaksi dicatat dalam buffer jurnal antrean (`pending`). Saat online kembali, sistem otomatis mengirim delta transaksi ke `er-backend`.
