#!/usr/bin/env bash
set -euo pipefail

# Direktori proyek (app-desktop)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  xphpMyAdmin Desktop — Build Seluruh Installer (All OS)"
echo "========================================================"
echo "➜ Target: Mac (Apple Silicon & Intel), Windows x64, Linux (.deb x64 & arm64)"
echo "➜ Directory: $ROOT_DIR"
echo ""

# Pastikan dependensi terpasang
if [ ! -d "node_modules" ]; then
  echo "➜ Memasang dependensi via Yarn..."
  yarn install --frozen-lockfile
fi

echo "--------------------------------------------------------"
echo "1/5 [Mac Apple Silicon] Membuat installer / distributable..."
"$SCRIPT_DIR/build-mac-apple-chip.sh"

echo ""
echo "--------------------------------------------------------"
echo "2/5 [Mac Intel] Membuat installer / distributable..."
"$SCRIPT_DIR/build-mac-intel.sh"

echo ""
echo "--------------------------------------------------------"
echo "3/5 [Windows x64] Membuat installer / distributable..."
"$SCRIPT_DIR/build-windows-x64.sh"

echo ""
echo "--------------------------------------------------------"
echo "4/5 [Linux x64] Membuat installer .deb & distributable..."
"$SCRIPT_DIR/build-linux-x64.sh"

echo ""
echo "--------------------------------------------------------"
echo "5/5 [Linux ARM64] Membuat installer .deb ARM64 & distributable..."
"$SCRIPT_DIR/build-linux-arm64.sh"

echo ""
echo "========================================================"
echo "  ✔ Seluruh Berkas Installer Berhasil Dibuat!          "
echo "========================================================"
echo "Daftar berkas installer siap pasang di out/make:"
find "$ROOT_DIR/out/make" -type f
echo "========================================================"
