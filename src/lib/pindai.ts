// Membaca QR dari bingkai kamera, di dalam aplikasi.
//
// ── Kenapa aplikasinya perlu memindai sendiri ──────────────────────────────
//
// Sebelumnya seluruh pemindaian diserahkan ke kamera bawaan HP: QR memuat URL,
// kameranya membuka URL itu. Cara itu punya tiga lubang yang semuanya berakhir
// pada kurir yang berdiri di depan admin tanpa bisa masuk:
//
// 1. Aplikasi ini dipasang sebagai PWA. Tautan yang dibuka kamera bawaan
//    mendarat di PERAMBAN, bukan di aplikasi yang sudah terpasang — dan sesinya
//    tersimpan di penyimpanan peramban itu, bukan di aplikasinya.
// 2. Sebagian kamera bawaan membuka hasil pindaian di peramban dalam-aplikasi
//    (Lens, WhatsApp, Instagram) yang penyimpanannya dibuang saat ditutup.
// 3. Surat jalan dipindai kurir yang aplikasinya SUDAH terbuka. Menyuruhnya
//    keluar dulu ke aplikasi kamera untuk kembali ke tempat yang sama adalah
//    jalan memutar yang tidak dibutuhkan siapa pun.
//
// ── Dua jalan membaca, dan yang pertama gratis ─────────────────────────────
//
// `BarcodeDetector` sudah ada di dalam Chrome Android — peramban hampir semua
// kurir — dan pembacaannya dikerjakan kode asli peramban, bukan JavaScript.
// iOS Safari belum punya, jadi jsQR diunduh SAAT pemindai dibuka dan hanya bila
// dibutuhkan (`import()` dinamis). Kurir Android tidak ikut mengunduh 13 KB
// yang tidak akan pernah dijalankan peramban-nya.

/** Sisi terpanjang bingkai yang diserahkan ke jsQR. */
const SISI_MAKS = 640;

interface HasilPindai {
  rawValue: string;
}

interface DetektorQr {
  detect(sumber: CanvasImageSource): Promise<HasilPindai[]>;
}

type PembuatDetektor = new (opsi: { formats: string[] }) => DetektorQr;

/** Baca satu bingkai. `null` berarti tidak ada QR di sana — keadaan yang wajar. */
export type Pembaca = (video: HTMLVideoElement) => Promise<string | null>;

function detektorBawaan(): DetektorQr | null {
  const Pembuat = (window as unknown as { BarcodeDetector?: PembuatDetektor }).BarcodeDetector;
  if (!Pembuat) return null;
  try {
    return new Pembuat({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

function pembacaJsQr(): Pembaca {
  const kanvas = document.createElement("canvas");
  // willReadFrequently: kanvas ini dibaca balik puluhan kali per detik. Tanpa
  // petunjuk ini peramban menaruhnya di GPU, dan tiap getImageData menariknya
  // kembali ke memori utama — persis kebalikan dari yang dibutuhkan di sini.
  const kuas = kanvas.getContext("2d", { willReadFrequently: true });
  let pustaka: Promise<typeof import("jsqr").default> | null = null;

  return async (video) => {
    if (!kuas) return null;

    const lebarAsli = video.videoWidth;
    const tinggiAsli = video.videoHeight;
    if (!lebarAsli || !tinggiAsli) return null;

    // Bingkai kamera 1280 px dikecilkan dulu. QR yang cukup besar untuk dibaca
    // orang tetap terbaca di 640 px, dan waktu pemeriksaan satu bingkai turun
    // empat kali lipat — di HP kelas menengah itu selisih antara pemindai yang
    // menjawab seketika dan pemindai yang tersendat.
    const skala = Math.min(1, SISI_MAKS / Math.max(lebarAsli, tinggiAsli));
    const lebar = Math.round(lebarAsli * skala);
    const tinggi = Math.round(tinggiAsli * skala);
    if (kanvas.width !== lebar) kanvas.width = lebar;
    if (kanvas.height !== tinggi) kanvas.height = tinggi;

    kuas.drawImage(video, 0, 0, lebar, tinggi);
    const bingkai = kuas.getImageData(0, 0, lebar, tinggi);

    pustaka ??= import("jsqr").then((m) => m.default);
    const jsQR = await pustaka;

    // dontInvert: QR yang dipindai aplikasi ini selalu gelap-di-atas-terang —
    // layar admin dan kertas surat jalan. Mencoba versi terbaliknya menggandakan
    // biaya tiap bingkai demi kemungkinan yang tidak ada di alur mana pun.
    const qr = jsQR(bingkai.data, bingkai.width, bingkai.height, {
      inversionAttempts: "dontInvert",
    });
    return qr?.data ?? null;
  };
}

export function buatPembaca(): Pembaca {
  let bawaan = detektorBawaan();
  const cadangan = pembacaJsQr();

  return async (video) => {
    if (bawaan) {
      try {
        const hasil = await bawaan.detect(video);
        const isi = hasil.find((h) => h.rawValue)?.rawValue;
        if (isi) return isi;
        return null;
      } catch {
        // Sebagian Android punya kelasnya tapi tidak punya modul pemindainya —
        // Play Services yang dipangkas vendor. Gagalnya baru terlihat di
        // panggilan pertama, bukan saat kelasnya dibuat. Pindah ke jsQR sekali,
        // lalu jsQR seterusnya; mencoba ulang tiap bingkai cuma membuang waktu
        // yang seharusnya dipakai membaca.
        bawaan = null;
      }
    }
    return cadangan(video);
  };
}

/**
 * Apakah peranti ini bisa memindai sama sekali.
 *
 * Dipakai untuk memutuskan menampilkan tombol Pindai atau tidak. Menawarkan
 * tombol yang pasti berujung galat lebih buruk daripada tidak menawarkannya:
 * jalan tempel-tautan tetap ada di layar yang sama.
 */
export const kameraAda = (): boolean => Boolean(navigator.mediaDevices?.getUserMedia);

/** Nyalakan kamera belakang. Galatnya sudah diterjemahkan jadi kalimat kurir. */
export async function bukaKamera(): Promise<MediaStream> {
  if (!kameraAda()) {
    throw new Error(
      window.isSecureContext
        ? "Peramban ini tidak mengizinkan aplikasi memakai kamera. Pakai Chrome atau Safari terbaru, atau masuk dengan menempel tautan."
        : "Kamera hanya bisa dipakai lewat alamat https. Buka aplikasi ini dari alamat resminya.",
    );
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      // ideal, bukan exact: di HP tanpa kamera belakang — atau di laptop admin
      // yang sedang mencoba — exact menolak sama sekali, sedangkan ideal
      // memberi kamera apa adanya. QR tetap terbaca dari kamera depan.
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (e) {
    throw new Error(pesanKamera(e));
  }
}

function pesanKamera(e: unknown): string {
  const nama = e instanceof DOMException ? e.name : "";
  switch (nama) {
    case "NotAllowedError":
    case "SecurityError":
      return "Izin kamera belum diberikan. Ketuk ikon gembok di sebelah alamat, nyalakan Kamera, lalu coba lagi.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Tidak ada kamera yang bisa dipakai di HP ini.";
    case "NotReadableError":
    case "AbortError":
      return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera atau panggilan video, lalu coba lagi.";
    default:
      return "Kamera tidak bisa dibuka. Coba tutup aplikasi lain yang memakainya, atau masuk dengan menempel tautan.";
  }
}

/**
 * Senter, bila lampunya bisa dikendalikan dari peramban.
 *
 * Bukan hiasan: surat jalan sering dipindai dari dalam bak, dan gudang toko
 * jam enam pagi lebih gelap daripada yang dibutuhkan kamera untuk mengunci
 * kontras hitam-putih.
 */
interface KemampuanSenter {
  torch?: boolean;
}

export function adaSenter(aliran: MediaStream): boolean {
  const jalur = aliran.getVideoTracks()[0];
  if (!jalur?.getCapabilities) return false;
  try {
    return Boolean((jalur.getCapabilities() as KemampuanSenter).torch);
  } catch {
    return false;
  }
}

export async function setelSenter(aliran: MediaStream, nyala: boolean): Promise<void> {
  const jalur = aliran.getVideoTracks()[0];
  if (!jalur) return;
  await jalur.applyConstraints({ advanced: [{ torch: nyala } as MediaTrackConstraintSet] });
}

/**
 * Ubah apa pun yang terbaca — ditempel maupun dipindai — jadi jalur yang benar.
 *
 * Ada DUA bentuk tautan yang sah, dan keduanya berujung di layar yang berbeda:
 * `/masuk/<token>` untuk undangan dari halaman Kurir, `/rit/<token>` untuk QR
 * pada surat jalan cetak. Menebak salah satu berarti mitra dibawa ke layar yang
 * menolak tokennya dengan alasan yang tidak masuk akal baginya.
 *
 * Kalau yang ditempel cuma tokennya saja — tanpa jalur — tidak ada cara
 * membedakannya, dan `/masuk/` dipilih karena itulah bentuk yang dibagikan
 * lewat tombol "Salin tautan" di halaman Kurir.
 *
 * Sengaja tidak memakai `new URL()` sebagai satu-satunya jalan: yang tertempel
 * sering sudah terpotong, dan potongannya masih bisa dipakai.
 */
export function jalurDari(teks: string): string | null {
  const bersih = teks.trim();
  const cocok = bersih.match(/[0-9a-f]{64}/i);
  if (!cocok) return null;
  const token = cocok[0].toLowerCase();
  return /\/rit\//i.test(bersih) ? `/rit/${token}` : `/masuk/${token}`;
}
