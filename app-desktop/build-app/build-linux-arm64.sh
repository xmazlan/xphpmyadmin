#!/usr/bin/env bash
set -euo pipefail

# Direktori proyek (app-desktop)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  xphpMyAdmin Desktop — Installer Linux ARM64 (.deb)     "
echo "========================================================"
echo "➜ Target: Linux ARM64 (.deb Debian/Ubuntu/Raspberry Pi)"
echo "➜ Directory: $ROOT_DIR"
echo ""

# Pastikan dependensi terpasang
if [ ! -d "node_modules" ]; then
  echo "➜ Memasang dependensi via Yarn..."
  yarn install --frozen-lockfile
fi

# Pembuatan installer Debian/Ubuntu ARM64 (.deb) dan paket mandiri (.zip)
echo "➜ Memulai pembuatan installer .deb ARM64 dan paket distribusi..."
yarn electron-forge make --targets @electron-forge/maker-deb,@electron-forge/maker-zip --platform=linux --arch=arm64

echo ""
echo "✔ Installer Linux ARM64 .deb berhasil dibuat!"
echo "➜ Berkas siap pasang tersedia di:"
find "$ROOT_DIR/out/make" -type f | grep -E "deb.*arm64" || true
echo "========================================================"
echo "➜ Catatan: Pasang di perangkat Linux ARM64 dengan perintah:"
echo "   sudo dpkg -i out/make/deb/arm64/xphpmyadmin-desktop_*.deb"
echo "========================================================"
