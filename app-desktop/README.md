# xphpMyAdmin Desktop

<div align="center">

![xphpMyAdmin Desktop](https://img.shields.io/badge/xphpMyAdmin-Desktop%20v1.4.1-0284c7?style=for-the-badge&logo=mysql&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Platform: macOS | Windows | Linux](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=for-the-badge&logo=electron&logoColor=white)](https://github.com/xmazlan/xphpmyadmin)
[![Test Suite: Vitest](https://img.shields.io/badge/Tests-41%20Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](src/tests)

<p align="center">
  <strong>A modern, high-performance desktop client for MySQL & MariaDB database administration.</strong><br/>
  Featuring SSH Bastion Tunneling, Full phpMyAdmin Capabilities, Multi-Format Export/Import, Visual Table Operations, and Cloud Synchronization with Frictionless Local Vault Access.
</p>

</div>

---

## 🌟 Overview

**xphpMyAdmin Desktop** brings the power and familiarity of phpMyAdmin into a native, high-speed desktop application. Built with **Electron**, **React 19**, **Tailwind CSS 4**, and **Shadcn UI**, it eliminates the need to configure web servers or expose database ports publicly.

Whether you are connecting directly to local development servers or tunneling through remote bastion hosts via encrypted SSH, xphpMyAdmin provides a unified, secure, and eye-friendly workspace.

---

## 🚀 Key Features

### 1. 🛡️ Authentication & Cloud Sync Hub
- **External Browser OAuth Redirect**: Authenticate seamlessly via Google Workspace or GitHub. The app opens your default web browser for secure sign-in and automatically redirects back into the desktop app via ephemeral loopback server and `xphpmyadmin://` deep linking.
- **Frictionless Free Tier (Local Vault)**: New users can register and use the app completely free forever with a standalone local vault. No credit card or upfront plan selection required.
- **Tiered Cloud Subscriptions**: Upgrade to **Pro**, **Team**, or **Business** with monthly or annual billing (save up to 33%) for multi-device vault synchronization, team sharing, and audit logging.
- **Unified JSON Transaction Journaling**: Automatically records user activities (connection setups, query executions, maintenance tasks) with offline backup export and cloud sync.

### 2. 🗄️ Full phpMyAdmin Database Workspace
- **Complete Core Navigation**: Databases, SQL Query Editor, Server Status & Processes, User Accounts, Export, Import, Variables Explorer, Charsets, Storage Engines, and Plugins.
- **Table Structure & Operations**: Browse, inspect schemas, insert rows, modify collations, copy or rename tables, configure `AUTO_INCREMENT`, and execute maintenance commands (**Optimize**, **Analyze**, **Check**, **Repair**, and **Checksum**).
- **Interactive Data Grid**: Column sorting, fast client-side row filtering, row JSON copy, clipboard export, and safe single-row deletion.
- **Visual Data Protection**: Protective confirmation modals before destructive actions (table truncate, table drop, database drop) to prevent accidental data loss.

### 3. 📤 Multi-Format Export & Import
- **Multi-Format Export**: Back up entire schemas or specific table data into standard formats: **SQL Dump**, **CSV**, **JSON**, and **XML**.
- **Flexible Data Import**: Restore standard `.sql` script files, map `.csv` files directly to tables with custom delimiters, or import `.json` backups with real-time execution feedback.

### 4. 🔍 Deep Search & Stored Routines
- **Cross-Table Search**: Search across all database tables simultaneously with fuzzy keyword matching, exact matches, or regex patterns.
- **Routines & Triggers Management**: Inspect, call, and manage stored procedures, custom functions, and automated database triggers directly from the visual interface.

### 5. 🔐 SSH Tunneling & Multi-Session Connection Manager
- **SSH Bastion Tunnel**: Direct and SSH Tunnel connection methods supporting passwords or SSH private keys.
- **1-Click Terminal Command**: Copy ready-to-run terminal SSH tunneling commands configured for your host and port.
- **Multi-Tab Sessions**: Manage multiple database connections concurrently with independent tabs and isolated query contexts.

### 6. 🎨 Obsidian Dark Theme & Ergonomic UX
- Designed with high-contrast, eye-friendly **Obsidian Dark Mode** by default.
- Strict compliance with `shadcn/ui` semantic color tokens for seamless dark/light theme switching.
- Responsive layout adapting smoothly between windowed mode and maximized fullscreen.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime & Core** | [Electron 43](https://www.electronjs.org), [Vite 8](https://vitejs.dev), [Node.js](https://nodejs.org) |
| **Frontend Framework** | [React 19](https://react.dev), [TypeScript 6](https://www.typescriptlang.org) |
| **Styling & Components** | [Tailwind CSS 4](https://tailwindcss.com), [Shadcn UI](https://ui.shadcn.com), [Lucide Icons](https://lucide.dev) |
| **Database Drivers** | [mysql2](https://github.com/sidorares/node-mysql2), [ssh2](https://github.com/mscdex/ssh2) |
| **State & Data Flow** | [TanStack Router](https://tanstack.com/router), [TanStack Query](https://tanstack.com/query), [oRPC](https://orpc.unnoq.com), [Zod 4](https://zod.dev) |
| **Syntax Highlighting** | [Shiki](https://shiki.style) |
| **Packaging** | [Electron Forge](https://www.electronforge.io) (Vite Plugin + Fuses) |
| **Testing** | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com), [Playwright](https://playwright.dev) |

---

## 📂 Project Structure

```text
app-desktop/
├── build-app/            # Automated multi-platform build & packaging scripts
├── releases/             # Bilingual release notes (YYYY-MM-DD-*.json)
├── src/
│   ├── actions/          # IPC invocation actions (shell, window, database)
│   ├── components/       # UI components (auth, connection, workspace, modals)
│   │   ├── auth/         # AuthGate, OAuth browser flow, and plan upgrade dialogs
│   │   ├── connection/   # Connection cards, grid, filters, and inspector
│   │   ├── workspace/    # phpMyAdmin workspace tabs (Databases, SQL, Export, Import, etc.)
│   │   └── ui/           # Reusable shadcn/ui primitives
│   ├── constants/        # Cloud endpoints, IPC channels, local storage keys
│   ├── context/          # React contexts (ConnectionContext, CloudSyncContext)
│   ├── ipc/              # oRPC IPC handlers (database connection, query runner, shell)
│   ├── main/             # Electron main process modules (OAuth loopback & deep link handler)
│   ├── routes/           # TanStack file-based routing
│   ├── services/         # Database execution, SSH tunnel driver, cloud sync API client
│   ├── tests/            # Vitest unit & integration test suites
│   ├── types/            # TypeScript schemas and definitions
│   ├── main.ts           # Electron main process entrypoint
│   └── preload.ts        # Secure context bridge and renderer bindings
├── forge.config.ts       # Electron Forge multi-platform distribution configuration
├── tsconfig.json         # TypeScript compiler configuration
└── package.json          # Project dependencies and build scripts
```

---

## 💻 Getting Started

### Prerequisites

- **Node.js**: `v20` or `v22+`
- **Package Manager**: `yarn` (`v1.22+`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/xmazlan/xphpmyadmin.git
cd xphpmyadmin/app-desktop
yarn install
```

### 2. Environment Variables

Create a `.env` file in `app-desktop/` (or copy from `.env.example`):

```bash
cp .env.example .env
```

```env
# Backend Cloud Services
VITE_BACKEND_URL=https://www.er-service.duckdns.org
VITE_CLOUD_API_URL=https://www.er-service.duckdns.org/api/sync
VITE_CLOUD_AUTH_URL=https://www.er-service.duckdns.org/api/auth
```

### 3. Run Development Server

```bash
yarn start
```

---

## 📦 Building & Distribution

Build cross-platform packages using Electron Forge:

```bash
# Package for current operating system
yarn package

# Platform-specific packaging
yarn package:mac        # macOS Apple Silicon (arm64)
yarn package:mac-intel  # macOS Intel (x64)
yarn package:win        # Windows (x64)
yarn package:linux      # Linux (x64)
yarn package:linux-arm  # Linux (arm64)

# Create installers / distributions (DMG, DEB, RPM, Squirrel)
yarn make:mac           # macOS DMG & ZIP
yarn make:win           # Windows Squirrel Installer (.exe) & ZIP
yarn make:linux         # Linux .deb & .rpm
```

Distribution artifacts will be placed in the `out/` directory.

---

## 🧪 Testing

We enforce high test coverage across database schemas, authentication flows, and workspace components:

```bash
# Run Vitest unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run TypeScript type-check
yarn tsc --noEmit
```

All 41 test suites pass with full assertion integrity:
- `auth-gate.test.tsx` (OAuth external browser flow & free tier policy)
- `cloud-sync.test.ts` (JSON serialization, rate limits, tier restrictions)
- `database-schemas.test.ts` (SSH tunnel credentials, import/export schema validation)
- `workspace-components.test.tsx` (Workspace header, navigation tabs, SQL runner, maintenance)
- `toggle-theme.test.tsx` (Theme toggle and contrast)
- `routes.test.tsx` (Multi-tab connection navigation)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
