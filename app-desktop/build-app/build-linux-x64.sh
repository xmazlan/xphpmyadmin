#!/usr/bin/env bash
set -euo pipefail

# Direktori proyek (app-desktop)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  xphpMyAdmin Desktop — Installer Linux 64-bit (.deb)   "
echo "========================================================"
echo "➜ Target: Linux x64 (.deb Debian/Ubuntu/Mint & .zip)"
echo "➜ Directory: $ROOT_DIR"
echo ""

# Pastikan dependensi terpasang
if [ ! -d "node_modules" ]; then
  echo "➜ Memasang dependensi via Yarn..."
  yarn install --frozen-lockfile
fi

# Pembuatan installer Debian/Ubuntu (.deb) dan paket mandiri (.zip)
echo "➜ Memulai pembuatan installer .deb dan paket distribusi..."
yarn electron-forge make --targets @electron-forge/maker-deb,@electron-forge/maker-zip --platform=linux --arch=x64

echo ""
echo "✔ Installer Linux .deb berhasil dibuat!"
echo "➜ Berkas siap pasang tersedia di:"
find "$ROOT_DIR/out/make" -type f | grep -E "deb.*x64" || true
echo "========================================================"
echo "➜ Catatan: Pasang di Ubuntu/Debian/Mint dengan perintah:"
echo "   sudo dpkg -i out/make/deb/x64/xphpmyadmin-desktop_*.deb"
echo "========================================================"
