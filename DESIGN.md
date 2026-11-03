# DESIGN.md — Personal OS (Warm Bento Fintech)
**Project Code:** `nexus-os` / `chemicvll`  
**User:** Ferrel (`chemicv11`)  
**Design Paradigm:** Warm Bento Grid Fintech (Inspired by MoneyBoard & Stitch Mockups)

---

## 1. Design Direction & Philosophy

Personal OS menggabungkan ergonomi visual fintech modern dengan efisiensi workstation developer:
- **Pendekatan:** *Warm Bento Grid Architecture* dengan *Soft Neoclassical Minimalism*.
- **Karakter:** Hangat, bersih, modular, dan taktil. Menghindari kesan kaku (*cold corporate blue*) dan beralih ke kanvas batu gamping hangat (*warm stone/linen*), dipadukan dengan kartu putih bersih, aksen oranye energik (*warm citrus*), dan tombol arang hitam (*charcoal pills*).
- **Hierarki:** Modul bento berbingkai halus (`border: 1px solid #ECEAE2`), sudut membulat ramah (`rounded-2xl` / `rounded-3xl` 20px–24px), dan bayangan mikro ambien lembut.

---

## 2. Color System Tokens

### Canvas & Surface Foundations
- **Base App Canvas:** `#FAF9F4` (Warm Stone / Linen Off-White)
- **Card & Container Surface:** `#FFFFFF` (Pure Optical White)
- **Subtle Low Surface:** `#F5F4EF`
- **Muted Inset Surface:** `#ECEAE2`
- **Hairline Border & Dividers:** `#E8E6DF` / `#ECEAE2`

### Brand & Accents
- **Primary Accent:** `#FF6B00` (Energetic Warm Citrus Orange — untuk highlight nama, status aktif, progress bar utama)
- **Primary Inset / Dark:** `#A04100` / `#572000`
- **Dark Neutral Primary:** `#18181B` / `#1B1C19` (Deep Charcoal Ink — untuk tombol pill utama, navigasi aktif, tooltip)
- **Secondary Accent:** `#7C3AED` / `#674BB5` (Soft Lavender / Bank Jago Purple)
- **Category & Pastel Matrix:**
  - Soft Lavender: Surface `#E3DBFF` • Text/Icon `#5B3FD3`
  - Mint Spring: Surface `#D1FADF` • Text/Icon `#027A48`
  - Warm Peach / Rose: Surface `#FFE4D6` • Text/Icon `#C4320A`
  - Warning / Alert: Surface `#FEF08A` • Text `#854D0E`
  - Soft Rose Red (Negative metric / danger): Surface `#FEE4E2` • Text `#D92D20`

### Text & Content Hierarchy
- **Primary Text:** `#1B1C19` / `#18181B`
- **Secondary / Supporting Text:** `#5A4136` / `#71717A`
- **Muted / Placeholder:** `#8E7164` / `#A1A1AA`

---

## 3. Typography (Plus Jakarta Sans)

Font tunggal yang digunakan pada seluruh desain Personal OS ini adalah **Plus Jakarta Sans** (khususnya variasi bobot Regular 400, Medium 500, SemiBold 600, dan Bold 700).

### Alasan Pemilihan:
1. **Karakter Modern & Geometrik Bersih:** Menghadirkan kesan tech & fintech kontemporer yang elegan mirip referensi MoneyBoard.
2. **Keterbacaan Tinggi (High Legibility):** Sangat tajam dan mudah dibaca baik untuk angka finansial (metrik saldo & KPI), teks kode terminal berbobot kecil, hingga tampilan mobile 390px.
3. **Kesesuaian Warm Bento:** Padu padan kurva hurufnya serasi dengan sudut kartu membulat (`rounded-3xl` / pill buttons).

### Aturan Tipografi:
- **Font Utama:** `Plus Jakarta Sans`
- **Font Monospace (Snippet Kode & Port Listening):** `SF Mono`, `IBM Plex Mono`, `Menlo`, `Consolas`
- **Numerics:** Wajib `font-variant-numeric: tabular-nums` pada saldo, tanggal, dan metrik uang agar tidak bergeser horizontal.

### Type Scale
- **Display Hero:** 36px / Line Height 44px / Bold 700 / Tracking -0.02em
- **Headline Lg:** 28px / Line Height 36px / Bold 700 / Tracking -0.02em
- **Headline Md:** 22px / Line Height 28px / SemiBold 600
- **Metric Display:** 26px / Line Height 32px / Bold 700 / Tracking -0.03em
- **Title Sm:** 16px / Line Height 22px / SemiBold 600
- **Body Md:** 14px / Line Height 20px / Regular 400
- **Body Sm:** 12px / Line Height 16px / Regular 400
- **Label Md:** 13px / Line Height 18px / SemiBold 600
- **Label Sm:** 11px / Line Height 14px / SemiBold 600 / Tracking 0.02em

---

## 4. Shapes, Geometry & Elevation

- **Bento Modules & White Cards:** `rounded-2xl` hingga `rounded-3xl` (20px–24px).
- **Interactive Buttons & Badges:** Full pill-shapes (`rounded-full` / `border-radius: 9999px`).
- **Feature Icons & Micro Tiles:** Squircle halus (`rounded-xl` / 12px–14px).
- **Elevation / Shadow:**
  - Ambient lift: `box-shadow: 0 1px 3px rgba(24, 24, 27, 0.03), 0 4px 12px rgba(24, 24, 27, 0.02);`
  - Border garis halus: `1px solid #ECEAE2` di setiap kartu putih.
  - Floating Tooltip: Obsidian black `#18181B` dengan `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);`.

---

## 5. Master Layout Architecture

### Desktop Layout (1440px+):
1. **Persistent Left Sidebar (Width 256px / `w-64`):**
   - Brand logo: Huruf `P` dalam lingkaran oranye `#FF6B00`.
   - Nav items: *Dashboard Utama*, *Karir & Magang*, *Tugas & Fokus*, *Keuangan*, *Dev Server*, *Dropzone*.
   - Nav item aktif: background `#18181B`, text `#FFFFFF`, full rounded pill.
   - Status bawah: *Personal Engine* pill dengan indicator pulse oranye.
2. **Sticky Header (Height 64px / `h-16`):**
   - Search bar input capsule dengan shortcut `⌘K`.
   - Status *Cloud Sync Aktif* pill.
   - Notifikasi bell button (lingkaran putih).
   - Profil avatar *Ferrel* (`Administrator`).
3. **Cockpit Main View:**
   - Welcome banner: *"Welcome Back, Ferrel (chemicv11)"*.
   - Bento Grid dinamis dengan kartu-kartu modular.

### Mobile Layout (PWA):
1. Top bar ringkas dengan menu toggle dan search.
2. 2x2 Bento grid cards.
3. Fixed Bottom Navigation Bar (5 tab utama).

---

## 6. Anti-Slop Implementation Locks
- **Bukan Template AI:** Tidak ada gradien ungu-biru neon, tidak ada kartu serba lonjong tanpa tujuan.
- **Konsistensi Aksen:** Oranye `#FF6B00` sebagai signature brand Ferrel, dipadukan pastel lembut pada status kategorial.
- **Interaktivitas Penuh:** Semua tombol memiliki feedback visual dan state aktif yang nyata.

