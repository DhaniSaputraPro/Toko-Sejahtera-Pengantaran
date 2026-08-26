// Ikon tab aplikasi ini, diambil dari baris pengaturan toko (`pengaturan_toko`,
// kolom `identitas`) — baris yang sama yang diisi staf di halaman Identitas
// pada admin.
//
// Ikon di `index.html` tetap ada dan tetap benar: ia yang tampil selama baris
// pengaturan belum terbaca, dan saat kolomnya memang kosong. Yang di sini
// menggantinya begitu barisnya sampai.
//
// Ikon PWA di `manifest.webmanifest` sengaja TIDAK ikut diganti. Ikon aplikasi
// terpasang dibaca sistem operasi saat dipasang, dari berkas manifest yang
// dilayani apa adanya; menukarnya saat aplikasi berjalan tidak mengubah ikon
// yang sudah menempel di layar utama kurir, cuma menambah bagian yang bisa
// gagal. Yang diganti di sini adalah ikon tab dan `apple-touch-icon`.

import { baca } from "./supabase";

/** Kolom yang dibaca aplikasi ini; sisanya milik keempat aplikasi lain. */
const KUNCI = "favicon_pengantaran_url";

/**
 * Pasang ikon, membuang tag ikon yang sudah ada lebih dulu.
 *
 * Dibuang, bukan diubah href-nya: `index.html` menuliskan
 * `type="image/svg+xml"` untuk `/ikon.svg` dan `apple-touch-icon` menunjuk PNG.
 * Mengganti href saja meninggalkan pernyataan tipe yang menempel pada berkas
 * yang berbeda, dan peramban yang mempercayainya menolak gambarnya lalu
 * kembali ke ikon bawaan.
 */
function pasang(url: string): void {
  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]',
    )
    .forEach((el) => el.remove());

  for (const rel of ["icon", "apple-touch-icon"]) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = url;
    // Admin hanya menerima SVG untuk favicon — di klien maupun di fungsi
    // unggahnya — jadi tipenya bisa dinyatakan tanpa menebak.
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }
}

interface BarisIdentitas {
  identitas: Record<string, unknown> | null;
}

/**
 * Baca ikon aplikasi ini lalu pasang.
 *
 * Tidak pernah melempar dan tidak pernah menahan apa pun: kurir yang membuka
 * daftar antar di tepi jalan tidak boleh menunggu satu ikon, dan tab yang
 * memakai ikon dari `index.html` bukan galat yang perlu dilihat siapa pun.
 */
export async function terapkanFavikon(): Promise<void> {
  const baris = await baca<BarisIdentitas>("pengaturan_toko?id=eq.1&select=identitas&limit=1");
  const i = baris?.[0]?.identitas;
  if (!i) return;
  // Ikon khusus aplikasi ini lebih dulu; `favicon_url` cadangan bersama untuk
  // aplikasi yang belum diberi ikonnya sendiri.
  const url = [i[KUNCI], i.favicon_url].find(
    (x): x is string => typeof x === "string" && x.trim() !== "",
  );
  if (url) pasang(url);
}
