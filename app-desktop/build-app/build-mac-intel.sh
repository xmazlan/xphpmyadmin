#!/usr/bin/env bash
set -euo pipefail

# Direktori proyek (app-desktop)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  xphpMyAdmin Desktop — Installer Mac Intel (x64)        "
echo "========================================================"
echo "➜ Target: macOS Intel Architecture (x64)"
echo "➜ Directory: $ROOT_DIR"
echo ""

# Pastikan dependensi terpasang
if [ ! -d "node_modules" ]; then
  echo "➜ Memasang dependensi via Yarn..."
  yarn install --frozen-lockfile
fi

# Pembuatan installer / distributable (make)
echo "➜ Memulai pembuatan paket distribusi installer (make)..."
yarn electron-forge make --platform=darwin --arch=x64

echo ""
echo "✔ Installer / Paket Distribusi Mac Intel berhasil dibuat!"
echo "➜ Berkas siap pasang tersedia di:"
find "$ROOT_DIR/out/make" -type f | grep -E "darwin.*x64" || true
echo "========================================================"
