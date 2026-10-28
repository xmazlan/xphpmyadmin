# Skrip Pembuatan Installer Multi-Platform xphpMyAdmin Desktop

Direktori ini berisi skrip otomatisasi bash (`.sh`) untuk membuat **installer siap pasang** (`.deb`, `.dmg`/`.zip`, `.exe`/`.zip`) bagi aplikasi **xphpMyAdmin Desktop**.

## Daftar Skrip & Jenis Installer Yang Dihasilkan

| Skrip | Target Sistem Operasi | Format Installer / Paket Siap Pasang | Lokasi Output (`out/make/`) |
| :--- | :--- | :--- | :--- |
| [`build-mac-apple-chip.sh`](./build-mac-apple-chip.sh) | **macOS Apple Silicon** (M1/M2/M3/M4) | `.dmg` (di macOS) atau `.zip` (drag-and-drop ke `/Applications`) | `out/make/zip/darwin/arm64/*.zip` atau `out/make/*.dmg` |
| [`build-mac-intel.sh`](./build-mac-intel.sh) | **macOS Intel** (x64) | `.dmg` (di macOS) atau `.zip` (drag-and-drop ke `/Applications`) | `out/make/zip/darwin/x64/*.zip` atau `out/make/*.dmg` |
| [`build-windows-x64.sh`](./build-windows-x64.sh) | **Windows 64-bit** (x64) | `xphpmyadmin-Setup.exe` (di Windows) atau `.zip` mandiri siap jalankan | `out/make/squirrel.windows/x64/*.exe` atau `out/make/zip/win32/x64/*.zip` |
| [`build-linux-x64.sh`](./build-linux-x64.sh) | **Linux 64-bit** (Debian / Ubuntu / Mint) | Paket installer `.deb` (pasang dengan `sudo dpkg -i`) | `out/make/deb/x64/xphpmyadmin-desktop_*.deb` |
| [`build-linux-arm64.sh`](./build-linux-arm64.sh) | **Linux ARM64** (Ubuntu ARM / Raspberry Pi) | Paket installer `.deb` ARM64 | `out/make/deb/arm64/xphpmyadmin-desktop_*.deb` |
| [`build-all.sh`](./build-all.sh) | **Seluruh Platform Sekaligus** | Membuat seluruh paket distribusi di atas | `out/make/**/*` |

## Cara Menjalankan

Beri izin eksekusi jika diperlukan (sudah diatur secara bawaan):
```bash
chmod +x build-app/*.sh
```

Jalankan skrip sesuai target installer:
```bash
# 1. Buat installer .deb untuk Linux (Ubuntu/Debian/Mint):
./build-app/build-linux-x64.sh
# Pasang ke sistem:
sudo dpkg -i out/make/deb/x64/xphpmyadmin-desktop_*.deb

# 2. Buat paket installer untuk Mac Apple Chip:
./build-app/build-mac-apple-chip.sh

# 3. Buat installer untuk Windows:
./build-app/build-windows-x64.sh

# 4. Buat seluruh installer sekaligus:
./build-app/build-all.sh
```
