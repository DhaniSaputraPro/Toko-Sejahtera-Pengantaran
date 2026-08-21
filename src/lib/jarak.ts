/** Jari-jari rata-rata Bumi, km. */
const R = 6371;

const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Jarak garis lurus antara dua titik, km (haversine).
 *
 * Bukan jarak tempuh — jalan sebenarnya selalu lebih panjang. Yang dibutuhkan
 * daftar antar cuma URUTAN, dan untuk itu garis lurus hampir selalu memberi
 * urutan yang sama dengan rute sebenarnya di dalam satu kota. Meminta jarak
 * tempuh yang benar berarti memanggil Distance Matrix API sekali per tujuan,
 * setiap kali kurir bergerak — berbayar, dan lambat justru di jaringan yang
 * paling buruk.
 */
export function jarakKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** "820 m" di bawah satu kilometer, "3,2 km" di atasnya — sebagaimana orang menyebutnya. */
export function tampilJarak(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}
