// Terang, gelap, atau ikut peranti.
//
// Pilihannya disimpan di peranti, bukan di server: ini soal MATA orang yang
// sedang memegang HP-nya — siang di jalan, malam di gudang — bukan soal akun.
// Kurir yang berganti HP tidak sedang berpindah preferensi.

export type Tema = "sistem" | "terang" | "gelap";

const KUNCI = "kurir.tema";

export function temaTersimpan(): Tema {
  try {
    const t = localStorage.getItem(KUNCI);
    return t === "terang" || t === "gelap" ? t : "sistem";
  } catch {
    return "sistem";
  }
}

/**
 * Tema yang BENAR-BENAR tampil sekarang.
 *
 * Yang disimpan boleh `sistem`; yang dilihat mata tidak pernah "sistem". Sakelar
 * matahari/bulan menyalakan salah satunya, jadi ia perlu tahu yang mana yang
 * sedang menyala — termasuk sebelum kurir pernah memilih apa pun.
 */
export function temaTampil(): "terang" | "gelap" {
  const t = temaTersimpan();
  if (t !== "sistem") return t;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "gelap" : "terang";
}

/**
 * Pasang temanya ke dokumen.
 *
 * Yang ditulis cuma satu atribut di `<html>`; sisanya urusan CSS. `sistem`
 * MENGHAPUS atributnya, bukan mengisinya dengan "sistem" — dengan begitu
 * `prefers-color-scheme` kembali memegang kendali tanpa aturan tambahan.
 */
export function pasangTema(tema: Tema): void {
  const akar = document.documentElement;
  if (tema === "sistem") delete akar.dataset.tema;
  else akar.dataset.tema = tema;

  try {
    if (tema === "sistem") localStorage.removeItem(KUNCI);
    else localStorage.setItem(KUNCI, tema);
  } catch {
    // Mode penyamaran menolak menulis; temanya tetap berlaku selama tab hidup.
  }

  warnaBilah(tema);
}

/**
 * Warna bilah peramban mengikuti tema yang BENAR-BENAR tampil.
 *
 * `<meta name="theme-color">` tidak mengenal atribut di `<html>`; tanpa baris
 * ini, kurir yang memilih gelap sementara HP-nya terang mendapat bilah putih
 * di atas aplikasi hitam.
 */
function warnaBilah(tema: Tema): void {
  const gelap =
    tema === "gelap" ||
    (tema === "sistem" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = gelap ? "#000000" : "#f5f5f7";
}

/** Dipanggil sekali sebelum React menggambar apa pun. */
export function mulaiTema(): void {
  pasangTema(temaTersimpan());
  // Peranti yang berpindah terang/gelap sendiri (mis. terjadwal saat magrib)
  // hanya menyentuh bilahnya; warna aplikasinya sudah diurus CSS.
  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => warnaBilah(temaTersimpan()));
}
