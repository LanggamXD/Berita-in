# Berita-in

**Briefing berita harian minimalis berbasis Wikipedia Current Events dengan fitur interaktif terjemahan per kata (EN → ID) untuk latihan bahasa Inggris.**

*A minimalist daily news briefing web app powered by Wikipedia Current Events, featuring interactive word-by-word translation (EN → ID) for English vocabulary practice.*

---

## Tentang Proyek / About

**Berita-in** adalah pembaca ringkasan berita harian (*daily briefing*) bebas gangguan yang mengambil data langsung dari **Wikipedia Current Events** (`Portal:Current events`). Aplikasi ini dirancang agar membaca berita internasional berbahasa Inggris setiap hari terasa ringan, terstruktur, dan sekaligus menjadi sarana belajar kosakata secara kontekstual.

*Berita-in is a distraction-free daily news briefing reader powered by **Wikipedia Current Events**. It is designed to make reading daily global news in English effortless while doubling as a contextual vocabulary learning tool.*

---

## Fitur Utama / Key Features

### 1. Terjemahan Per Kata Interaktif (EN → ID) *(Fitur Utama / Core Highlight)*
* **Klik / Tap Kata untuk Arti Singkat:** Setiap kata bahasa Inggris pada ringkasan berita dapat diklik atau disentuh untuk memunculkan *pop-up* terjemahan singkat dalam Bahasa Indonesia tanpa merusak kenyamanan membaca paragraf utuh.
* **Terjemahan Cepat dengan Cache:** Hasil terjemahan kata disimpan sementara di *cache* klien maupun server sehingga kata yang pernah dicari muncul secara instan.
* *Click or tap any English word in a news summary to view a concise Indonesian translation pop-up, backed by client and server caching for instant repeat lookups.*

### 2. Terjemahkan Semua (EN ↔ ID) / Translate All Toggle
* **Satu Klik Ubah Bahasa Halaman:** Tersedia tombol pengalih bahasa di bagian atas untuk menerjemahkan seluruh judul *Trending Intelligence*, tajuk topik, dan ringkasan *Today's Briefing* ke Bahasa Indonesia secara serentak, lalu kembali ke Bahasa Inggris kapan saja.
* *One-click toggle to translate all visible Trending titles, headlines, and news summaries between English and Indonesian.*

### 3. Kurasi Berita Wikipedia Current Events / Curated Wikipedia News Feed
* **Trending Intelligence (*Topics in the news*):** Menampilkan sorotan topik utama yang sedang hangat dalam tampilan kartu ringkas dengan navigasi geser halaman.
* **Today's Briefing & Arsip 7 Hari:** Menyajikan ringkasan berita harian yang dikelompokkan berdasarkan kategori (seperti politik, ekonomi, sains & teknologi, konflik, dan peristiwa dunia) beserta akses arsip hingga **7 hari ke belakang**.
* *Displays top stories from **Topics in the news** alongside categorized **Today's Briefing** dispatches with a **7-day archive**.*

### 4. Personalisasi Tampilan / Display Customization
* **Mode Terang & Mode Gelap (*Light / Dark Mode*):** Pengalih tema yang nyaman di mata untuk membaca pagi maupun malam, tersimpan otomatis di `localStorage` perangkat.
* **Filter Kategori:** Menampilkan atau menyembunyikan kategori berita sesuai minat bacaan dan menyimpannya di peramban masing-masing perangkat.
* *Supports persistent Light/Dark theme switching and per-device category filtering via `localStorage`.*

### 5. Akses Privat & Pembaruan Terjadwal / Private Access & Smart Caching
* **Gerbang Akses Privat:** Dilindungi halaman masuk berbasis kata sandi (*password gate*) dengan sesi *cookie* selama **30 hari**.
* **Cache Server & Muat Ulang Manual:** Data Wikipedia di-*cache* secara berkala di server agar pemuatan halaman cepat, disertai tombol muat ulang manual (*refresh*) untuk mengambil pembaruan terbaru.
* *Protected by a private password gate with a 30-day session cookie, paired with server-side caching and manual refresh support.*

---

## Teknologi yang Digunakan / Tech Stack

* **Framework:** Next.js (App Router) & TypeScript
* **Styling:** Tailwind CSS
* **Sumber Data / Data Source:** Wikipedia MediaWiki API (`Portal:Current events`) & Cheerio HTML Parser
* **Hosting & Deployment:** Vercel

---

## Catatan / Notes

* Konten berita bersumber dari komunitas penyunting **Wikipedia Current Events** dan ditautkan langsung ke referensi berita aslinya.
* *News summaries are sourced from **Wikipedia Current Events** and link directly to their original news references.*
