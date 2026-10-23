# Panduan & Konvensi AI Agent 

> **PERINGATAN WAJIB DIPATUHI (MANDATORY POLICY)**:  
> Seluruh AI Agent yang bekerja pada repositori ini **WAJIB MEMATUHI** seluruh aturan arsitektur, standar teknis, dan prosedur kerja yang tertera pada berkas ini serta direktori [`.agents/skills/`](file:///.agents/skills/). Pelanggaran terhadap invarian teknis (seperti penulisan berkas di dalam bundle ASAR, pemaksaan rebuild modul C++ native, pembocoran istilah teknis internal pada rilis publik, atau pelanggaran port) dapat merusak kestabilan aplikasi.

---

## 1. Kepatuhan Skill Wajib (.agents/skills/)

Aplikasi ini memiliki 5 skill inti yang **wajib dipatuhi**:

1. **`shadcn-ui`** ([`.agents/skills/shadcn-ui/SKILL.md`](file:///.agents/skills/shadcn-ui/SKILL.md)): Standar arsitektur komponen UI, pustaka 62+ komponen di `@/components/ui/`, integrasi Tailwind v4 + Radix, preset styling Termius Midnight Navy, serta aturan baku penggunaan shadcn CLI via npm.
---
