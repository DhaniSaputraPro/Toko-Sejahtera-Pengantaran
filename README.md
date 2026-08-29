# Pengantaran Toko Sejahtera

Aplikasi yang dipegang mitra pengantar saat mengantar pesanan tokosejahtera.id.
Dibuka dari HP, dipakai sambil berdiri di tepi jalan.

Pasangannya `Toko-Sejahtera-Platform` — aplikasi admin. Keduanya memakai basis
data Supabase yang sama; **kalau `VITE_SUPABASE_URL` di sini berbeda dengan yang
di admin, QR dari admin tidak akan pernah dikenali.**

Mekanisme lengkapnya, termasuk sisi admin dan alasan tiap keputusan basis data,
ada di `docs/KURIR-DAN-PENGANTARAN.md` pada repo Platform.

## Dua jalur masuk

| | `/masuk/<token>` | `/rit/<token>` |
| --- | --- | --- |
| Dipindai dari | Layar admin | Lembar **rit** yang dicetak |
| Data mitra diketik oleh | Admin, sebelumnya | Mitra sendiri, di layar ini |
| Umur token | 20 menit | 1 hari |
| Yang didapat | Sesi peranti saja | Sesi **dan** seluruh rit sekaligus |

Sengaja dua alamat, bukan satu: yang pertama sekadar membuka pintu untuk mitra
yang datanya sudah dikenal toko, yang kedua meminta mitra memperkenalkan diri
lalu menyerahkan seluruh perjalanan kepadanya. Satu alamat untuk dua maksud akan
memaksa `App.tsx` menebak yang mana yang dimaksud.

Pada jalur kedua, mitra dicocokkan lewat **nomor WhatsApp** — memindai lembar
rit kesepuluh tidak melahirkan akun kesepuluh.

## Yang bisa dilakukan pengantar

- Masuk dengan **memindai QR** dari layar admin, atau dari lembar rit cetak —
  pemindainya ada **di dalam aplikasi**, tidak perlu keluar ke kamera bawaan.
- Mengambil **rit baru** di tengah rute dengan memindai lembarnya dari tab Saya.
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

### Cabang produksi: `main`

Vercel membangun ulang **hanya saat ada push**, dan hanya dari cabang yang
tercantum di Settings → Environments → Production → Branch Tracking. Cabang itu
`main`.

Dua hal yang tidak memicu build, dan keduanya pernah menyesatkan:

- **Mengganti nama cabang.** GitHub tidak mengirim event push untuk itu, jadi
  cabang yang barusan dinamai `main` tetap tidak dibangun sampai ada push
  berikutnya.
- **Tombol Redeploy** pada sebuah deployment. Yang dibangunnya commit milik
  deployment ITU, bukan commit terbaru — kalau baris teratas masih commit lama,
  hasilnya kode lama lagi.

Cara memastikan yang tayang memang build terbaru tanpa membuka dasbor: buka
aplikasinya, judulnya harus berbunyi **Pengantaran Toko Sejahtera** dengan ikon
toko di atasnya. Aplikasi ini tidak memasang service worker, jadi muat ulang
biasa sudah cukup — tidak ada cache yang perlu dibersihkan lebih dulu.

## Keputusan yang perlu diketahui sebelum menyunting

### Tidak ada `@supabase/supabase-js`

Pustaka resminya 442 KB (127 KB terkompresi) dan membawa auth, realtime, dan
storage. Aplikasi ini memakai **dua** bentuk permintaan: satu RPC PostgREST dan
satu unggahan ke Edge Function. Keduanya muat di `src/lib/supabase.ts`, dan
bundelnya turun ke 70 KB terkompresi — separuh lebih ringan untuk diunduh lewat
jaringan seluler.

Yang paling tidak terpakai justru bagian auth-nya: kurir **tidak punya akun
Supabase**. Yang dipegangnya token sesi peranti yang dikirim sebagai argumen RPC.

### Logo mengikuti ikon toko

Logo di bilah atas dan di layar masuk adalah **ikon toko yang sama dengan ikon
tab peramban** — kolom `favicon_pengantaran_url` pada `pengaturan_toko.identitas`,
yang diisi staf di halaman Identitas pada admin. Satu tempat menentukan
keduanya; tidak ada logo terpisah yang harus diingat untuk diganti.

Alamatnya dibaca sekali lalu dibagikan (`ikonToko()` di `src/lib/favikon.ts`):
pemasang ikon tab, bilah atas, dan layar masuk menanyakan hal yang sama, dan
tiga permintaan untuk satu jawaban adalah tiga permintaan di jaringan seluler
yang sedang dipakai memuat daftar antar.

Digambar apa adanya, tanpa kotak putih di belakangnya: ikon toko sudah punya
bentuk dan warnanya sendiri, dan membingkainya lagi berarti menggambar dua
bentuk untuk satu benda.

Truk bawaan tetap ada sebagai jaring — tampil selama ikonnya belum sampai, saat
kolomnya kosong, dan saat berkasnya gagal dimuat.

### Terang atau gelap, satu sakelar di bilah atas

Dua ikon — matahari dan bulan — di bilah atas, dan yang menyala adalah yang
sedang tampil. Pilihan "ikut HP" ada di KODE tapi tidak di layar: sebelum
pengantar menyentuh apa pun, aplikasinya memang masih ikut HP, dan sakelar itu
cuma menunjukkan hasilnya. Yang ditawarkan ke orang yang sedang berdiri di tepi
jalan adalah dua keadaan yang bisa ia lihat, bukan tiga kata yang harus ia
bandingkan.

`src/lib/tema.ts` menulis satu atribut di `<html>`; sisanya urusan CSS. Pilihan
`sistem` MENGHAPUS atributnya, bukan mengisinya — dengan begitu
`prefers-color-scheme` kembali memegang kendali tanpa aturan tambahan.

Dipasang di `main.tsx` **sebelum React menggambar apa pun**. Tema yang dipasang
setelah layar tergambar terlihat sebagai kedipan putih di tangan orang yang
justru memilih gelap.

Token gelapnya ditulis dua kali di CSS — sekali di dalam
`@media (prefers-color-scheme: dark)` untuk yang membiarkan aplikasinya ikut
peranti, sekali di `:root[data-tema="gelap"]` untuk yang memilih sendiri. CSS
tidak punya cara memakai ulang satu blok untuk dua pemicu.

`<meta name="theme-color">` ditulis ulang dari JavaScript, bukan dua meta
bermedia: tanpa itu, kurir yang memilih gelap sementara HP-nya terang mendapat
bilah peramban putih di atas aplikasi hitam.

### Temanya mengikuti macOS/iOS

Seluruh warna, bentuk, dan bobot huruf ada di `src/index.css` sebagai peubah —
tidak ada satu pun warna yang ditulis langsung di dalam komponen. Menggantinya
di satu tempat mengganti seluruh aplikasi, **termasuk mode gelapnya**.

Empat hal yang dipinjam dari sana, dan alasannya bukan gaya-gayaan:

| Yang dipinjam | Kenapa untuk aplikasi ini |
| --- | --- |
| Warna semantik (`--teks`, `--teks-lembut`, `--garis`) | Mode gelap tinggal menukar isinya, bukan menulis ulang tiap layar |
| Garis rambut + bayangan nyaris nol | Yang memisahkan isi adalah ruang kosong; kotak bertumpuk memakan layar |
| Bahan buram di bilah atas dan bawah | Kurir tetap tahu daftarnya masih bergulir di baliknya |
| Bobot huruf 590–680, bukan 700–800 | Di layar kecil di bawah matahari, huruf tebal jadi gumpalan tinta |

Dua tempat sengaja **menyimpang** dari palet Apple, dan keduanya soal keterbacaan
di bawah sinar langsung:

- Birunya `#0071e3`, bukan `#007aff` bawaan iOS. Di sini biru sering jadi
  **tulisan** di atas putih, dan yang bawaan itu cuma 3,6:1 — tidak lolos.
- Hijau untuk tulisan dan hijau untuk latar tombol dipisah (`--hijau` dan
  `--hijau-isi`). Tulisan putih di atas hijau terang iOS cuma 1,9:1; tombol
  "Sudah saya jemput" akan hilang di tangan kurir yang berdiri di terik.

Mode gelap ikut karena pengantar juga bekerja setelah magrib — dan bisa dipilih
sendiri; lihat bagian di atas.

### Layarnya irit kata, dan itu aturan

Yang membaca layar ini sedang berdiri di tepi jalan, sering di bawah matahari,
kadang dengan satu tangan memegang paket. Kalimat yang menerangkan sesuatu yang
sudah jelas dari tombolnya bukan bantuan — ia mendorong kartu berikutnya keluar
dari layar.

Aturan yang dipakai saat menyunting layar mana pun di sini:

- **Satu kartu, satu pertanyaan.** Ringkasan di puncak daftar antaran cuma dua
  angka: berapa antaran, dan berapa uang COD yang harus pulang bersama kurir.
- **Tidak ada dua tombol untuk satu maksud.** Kartu antaran dulu punya tombol
  "Rincian" padahal mengetuk kartunya sendiri sudah membukanya. Yang tersisa
  Navigasi.
- **Keterangan hanya untuk yang tidak bisa ditebak.** "Foto bukti (boleh
  dilewati)" jadi "Foto bukti"; tombol yang bisa dilewati memang tidak menahan
  siapa pun. Tapi "Patokan" tetap ditulis penuh — kurir membacanya di depan
  pagar, dan salah rumah lebih mahal daripada satu baris teks.
- **Nol tidak dirayakan.** Lencana "selesai hari ini" hijau hanya kalau ada yang
  selesai; nol berlencana hijau memberi selamat atas sesuatu yang belum terjadi.

Daftar antaran diberi **nomor urut**. Urutannya sudah dihitung dari jarak, dan
angka itulah yang membuatnya terbaca sebagai rute, bukan sebagai tumpukan kartu
yang kebetulan berurutan.

### Pemindai QR ada di dalam aplikasi

Dulu seluruh pemindaian diserahkan ke kamera bawaan HP: QR memuat URL, kameranya
membuka URL itu. Tiga hal membuat cara itu gagal justru pada kurir yang sudah
memakai aplikasi ini:

1. Aplikasinya **terpasang sebagai PWA**. Tautan yang dibuka kamera bawaan
   mendarat di peramban, bukan di aplikasi terpasang — dan sesinya tersimpan di
   penyimpanan peramban itu, terpisah dari aplikasinya.
2. Sebagian kamera bawaan membuka hasil pindaian di **peramban dalam-aplikasi**
   (Lens, WhatsApp) yang penyimpanannya dibuang begitu ditutup.
3. **Lembar rit** sampai ke tangan pengantar setelah ia masuk, kadang di tengah
   rute. Menyuruhnya keluar ke aplikasi kamera untuk kembali ke tempat yang
   sedang dipegangnya adalah jalan memutar tanpa alasan.

Tombol **Pindai QR** ada di layar masuk, dan **Pindai rit** di tab Saya.
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
