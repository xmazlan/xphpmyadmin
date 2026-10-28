#!/usr/bin/env bash
set -euo pipefail

# Direktori proyek (app-desktop)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  xphpMyAdmin Desktop — Installer Windows 64-bit (x64)   "
echo "========================================================"
echo "➜ Target: Windows x64"
echo "➜ Directory: $ROOT_DIR"
echo ""

# Pastikan dependensi terpasang
if [ ! -d "node_modules" ]; then
  echo "➜ Memasang dependensi via Yarn..."
  yarn install --frozen-lockfile
fi

# Jika di Windows, buat Setup.exe penuh; jika di sistem lain, gunakan MakerZIP
echo "➜ Memulai pembuatan paket distribusi Windows..."
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32"* ]] || command -v mono >/dev/null 2>&1; then
  yarn electron-forge make --platform=win32 --arch=x64
else
  yarn electron-forge make --targets @electron-forge/maker-zip --platform=win32 --arch=x64
fi

echo ""
echo "✔ Paket Distribusi / Installer Windows berhasil dibuat!"
echo "➜ Berkas siap pakai tersedia di:"
find "$ROOT_DIR/out/make" -type f | grep -E "win32.*x64" || true
echo "========================================================"
