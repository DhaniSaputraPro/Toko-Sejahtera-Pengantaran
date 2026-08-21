/**
 * Tautan navigasi Google Maps.
 *
 * Memakai bentuk `dir/` — arahan belok-per-belok dari posisi kurir sekarang —
 * bukan `search/` yang cuma menaruh pin di peta. Bedanya nyata bagi orang yang
 * sedang memegang setang: yang satu bisa langsung dijalankan, yang lain masih
 * menuntut satu ketukan lagi untuk memulai rute.
 *
 * Titik pin dipakai bila ada. Itu satu koordinat pasti dari pembeli, bukan
 * tebakan Google atas tulisan bebas. Tanpa titik, jatuh ke teks alamatnya.
 *
 * Menautkan seperti ini tidak menuntut kunci API dan tidak berbiaya; yang
 * berbayar adalah peta yang ditanam di dalam aplikasi.
 */
export function tautanNavigasi(
  alamat: string,
  lat?: number | null,
  lng?: number | null,
): string | null {
  const tujuan = lat != null && lng != null ? `${lat},${lng}` : alamat.trim();
  if (!tujuan) return null;
  return (
    "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" +
    encodeURIComponent(tujuan)
  );
}

/** Nomor apa pun → bentuk 62… yang diterima wa.me. */
export function tautanWa(telepon: string, pesan = ""): string {
  const angka = telepon.replace(/\D/g, "");
  const no = angka.startsWith("62") ? angka : angka.startsWith("0") ? "62" + angka.slice(1) : angka;
  return `https://wa.me/${no}${pesan ? `?text=${encodeURIComponent(pesan)}` : ""}`;
}

export const tautanTelepon = (telepon: string): string =>
  `tel:${telepon.replace(/[^\d+]/g, "")}`;
