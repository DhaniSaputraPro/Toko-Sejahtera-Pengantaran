# Kurir Toko Sejahtera

Aplikasi yang dipegang mitra kurir saat mengantar pesanan tokosejahtera.id.
Dibuka dari HP, dipakai sambil berdiri di tepi jalan.

Pasangannya `Toko-Sejahtera-Platform` — aplikasi admin. Keduanya memakai basis
data Supabase yang sama; **kalau `VITE_SUPABASE_URL` di sini berbeda dengan yang
di admin, QR dari admin tidak akan pernah dikenali.**

Mekanisme lengkapnya, termasuk sisi admin dan alasan tiap keputusan basis data,
ada di `docs/KURIR-DAN-PENGANTARAN.md` pada repo Platform.

## Dua jalur masuk

| | `/masuk/<token>` | `/rit/<token>` |
| --- | --- | --- |
| Dipindai dari | Layar admin | Lembar **surat jalan** yang dicetak |
| Data mitra diketik oleh | Admin, sebelumnya | Mitra sendiri, di layar ini |
| Umur token | 20 menit | 1 hari |
| Yang didapat | Sesi peranti saja | Sesi **dan** seluruh rit sekaligus |

Sengaja dua alamat, bukan satu: yang pertama sekadar membuka pintu untuk mitra
yang datanya sudah dikenal toko, yang kedua meminta mitra memperkenalkan diri
lalu menyerahkan seluruh perjalanan kepadanya. Satu alamat untuk dua maksud akan
memaksa `App.tsx` menebak yang mana yang dimaksud.

Pada jalur kedua, mitra dicocokkan lewat **nomor WhatsApp** — memindai surat
jalan kesepuluh tidak melahirkan akun kesepuluh.

## Yang bisa dilakukan kurir

- Masuk dengan **memindai QR** dari layar admin, atau dari surat jalan cetak —
  pemindainya ada **di dalam aplikasi**, tidak perlu keluar ke kamera bawaan.
- Mengambil **rit baru** di tengah rute dengan memindai surat jalan dari tab Saya.
- Melihat daftar antaran, **terurut dari yang paling dekat dengan posisinya**.
- Menekan **Navigasi** untuk membuka arahan belok-per-belok di Google Maps.
- Menandai **sudah dijemput** di toko, dan **selesai** di tujuan.
- Menerima uang **COD** dan menandainya lunas — pesanannya langsung lunas di toko.
- Mencatat **antaran gagal** beserta alasannya; paket kembali ke toko dan tugasnya
  lepas, lalu muncul lagi di layar admin tanpa kurir.
- Melampirkan **foto serah terima** (boleh dilewati).

## Menjalankan

```bash
npm install
cp .env.example .env      # isi dengan proyek Supabase yang sama dengan admin
npm run dev
```

| Skrip | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Berkas siap tayang di `dist/` |
| `npm run lint` | Pemeriksaan tipe (`tsc --noEmit`) |

## Menayangkan di Vercel

Preset **Vite**, tanpa penyetelan tambahan: `vercel.json` sudah memuat rewrite
SPA yang membuat `/masuk/<token>` — jalur yang dituju QR — tidak berakhir 404.

Dua variabel lingkungan wajib, dan keduanya harus **sama persis** dengan yang
dipakai aplikasi admin:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Setelah tayang, isikan domainnya ke `VITE_URL_KURIR` di repo **Platform**.
Itulah alamat yang ditulis admin ke dalam QR. Halaman Manajemen Kurir selalu
menampilkan alamat tujuan di bawah QR-nya, jadi salah domain bisa dilihat
langsung — bukan ditemukan seminggu kemudian.

## Keputusan yang perlu diketahui sebelum menyunting

### Tidak ada `@supabase/supabase-js`

Pustaka resminya 442 KB (127 KB terkompresi) dan membawa auth, realtime, dan
storage. Aplikasi ini memakai **dua** bentuk permintaan: satu RPC PostgREST dan
satu unggahan ke Edge Function. Keduanya muat di `src/lib/supabase.ts`, dan
bundelnya turun ke 70 KB terkompresi — separuh lebih ringan untuk diunduh lewat
jaringan seluler.

Yang paling tidak terpakai justru bagian auth-nya: kurir **tidak punya akun
Supabase**. Yang dipegangnya token sesi peranti yang dikirim sebagai argumen RPC.

### Pemindai QR ada di dalam aplikasi

Dulu seluruh pemindaian diserahkan ke kamera bawaan HP: QR memuat URL, kameranya
membuka URL itu. Tiga hal membuat cara itu gagal justru pada kurir yang sudah
memakai aplikasi ini:

1. Aplikasinya **terpasang sebagai PWA**. Tautan yang dibuka kamera bawaan
   mendarat di peramban, bukan di aplikasi terpasang — dan sesinya tersimpan di
   penyimpanan peramban itu, terpisah dari aplikasinya.
2. Sebagian kamera bawaan membuka hasil pindaian di **peramban dalam-aplikasi**
   (Lens, WhatsApp) yang penyimpanannya dibuang begitu ditutup.
3. **Surat jalan** sampai ke tangan kurir setelah ia masuk, kadang di tengah
   rute. Menyuruhnya keluar ke aplikasi kamera untuk kembali ke tempat yang
   sedang dipegangnya adalah jalan memutar tanpa alasan.

Tombol **Pindai QR** ada di layar masuk, dan **Pindai surat jalan** di tab Saya.
Keduanya memakai `src/komponen/Pemindai.tsx`; yang menilai isi QR-nya bukan
pemindai melainkan layar pemanggilnya, lewat `terima` — QR asing tidak menutup
kamera, cuma dijawab satu kalimat sambil pemindaian terus berjalan.

Jalan lama tidak dicabut. Kamera bawaan tetap bekerja untuk kurir yang belum
memasang aplikasi ini, dan tempel-tautan tetap ada untuk peranti yang kameranya
tidak bisa dipakai peramban.

#### `BarcodeDetector` dulu, jsQR kalau tidak ada

Chrome Android — peramban hampir semua kurir — sudah memuat `BarcodeDetector`,
dan pembacaannya dikerjakan kode asli peramban. iOS Safari belum punya, jadi
`jsqr` diunduh lewat `import()` dinamis **saat pemindai dibuka dan hanya bila
dibutuhkan**: 47 KB terkompresi yang tidak pernah menyentuh HP Android. Bundel
utamanya naik 2,4 KB terkompresi (71,5 → 73,9 KB).

Sebagian Android punya kelas `BarcodeDetector` tapi tidak punya modul
pemindainya — Play Services yang dipangkas vendor — dan gagalnya baru terlihat
di panggilan `detect()` pertama, bukan saat kelasnya dibuat. `buatPembaca()`
pindah ke jsQR sekali di titik itu, lalu jsQR seterusnya.

### Tidak ada pustaka router

Ada satu jalur yang berarti — `/masuk/<token>`, tujuan QR — dan sisanya satu
layar bertab. `useJalur` di `src/App.tsx` menanganinya dalam tiga puluh baris.

### Urutan terdekat dihitung di sini, bukan di server

`kurir_tugas()` mengembalikan daftar menurut waktu diteruskan. Yang mengurutkan
menurut jarak adalah `urutkan()` di `src/layar/Tugas.tsx`, dari posisi GPS yang
berubah tiap kali kurir bergerak. Mengurutkannya di server berarti daftarnya
sudah basi sebelum layarnya sempat digambar.

Jaraknya garis lurus (haversine), bukan jarak tempuh. Yang dibutuhkan daftar ini
cuma **urutan**, dan di dalam satu kota garis lurus hampir selalu memberi urutan
yang sama dengan rute sebenarnya — tanpa memanggil Distance Matrix API sekali
per tujuan setiap kali kurir bergerak.

Antaran yang **sudah dijemput** selalu berada di kelompok bawah, betapa pun
dekatnya. Yang belum dijemput masih ada di toko; menyelipkannya di antara
tujuan-tujuan antar berarti menyuruh kurir bolak-balik ke toko di tengah rute.

Tugas tanpa titik pin jatuh ke dasar kelompoknya — jaraknya memang tidak
diketahui, dan menebaknya dari tulisan alamat akan menaruhnya di urutan yang
salah dengan percaya diri.

### Izin lokasi diminta lewat ketukan, bukan saat aplikasi dibuka

Peramban menampilkan permintaan izin sekali saja per situs; sekali ditolak,
pintunya tertutup dan hanya bisa dibuka dari pengaturan peramban — tempat yang
tidak akan ditemukan kurir. Meminta sebelum ia tahu untuk apa hampir menjamin
penolakan. Yang memulainya kartu "Urutkan dari yang terdekat".

### Foto dikecilkan sebelum diunggah

Kamera HP menghasilkan berkas 3–8 MB. `src/lib/gambar.ts` mengecilkannya ke sisi
terpanjang 1280 px. Mengunggah ukuran penuh dari tepi jalan berarti kurir
menunggu satu menit untuk sesuatu yang bisa selesai dalam tiga detik — dan
sering gagal di tengah.

Unggahannya lewat Edge Function `kurir-bukti`, bukan langsung ke storage: bucket
`bukti` hanya mengizinkan staf mengunggah, dan melonggarkannya untuk anon berarti
membukanya untuk siapa pun yang memegang kunci publikasi.

### Sesi bisa dicabut kapan saja

Admin boleh mencabut peranti atau menonaktifkan mitra. Setiap panggilan yang
ditolak karena itu melempar `SesiTidakBerlaku`, dan aplikasinya memulangkan kurir
ke layar pindai dengan keterangannya — bukan menampilkan pesan merah buntu di
tengah daftar.
