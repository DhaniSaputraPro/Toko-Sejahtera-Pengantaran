import { useEffect, useRef, useState } from "react";
import { jarakKm } from "./jarak";
import { laporPosisi } from "./kurir";

export interface Titik {
  lat: number;
  lng: number;
  /** Ketelitian yang dilaporkan peranti, meter. */
  akurasi: number;
}

export type KeadaanPosisi = "diam" | "mencari" | "ada" | "ditolak" | "gagal";

/** Jangan kirim ulang posisi lebih sering dari ini. */
const JEDA_LAPOR_MS = 60_000;
/** …atau sebelum berpindah sejauh ini. */
const GESER_LAPOR_KM = 0.05;

/**
 * Posisi kurir, dipantau terus selama layar terbuka.
 *
 * `watchPosition`, bukan `getCurrentPosition` berkala: yang pertama memakai
 * pembaruan yang memang sudah dihasilkan peranti, yang kedua menyalakan GPS
 * dari nol setiap kali dan menghabiskan baterai yang harus bertahan seharian
 * di jalan.
 *
 * Izin TIDAK diminta saat aplikasi dibuka. Peramban menampilkan permintaan izin
 * satu kali saja per situs, dan menolaknya menutup pintu itu untuk seterusnya.
 * Meminta saat kurir belum tahu untuk apa hampir menjamin penolakan; jadi yang
 * memulainya ketukan pada kartu "urutkan dari yang terdekat".
 */
export function usePosisi() {
  const [titik, setTitik] = useState<Titik | null>(null);
  const [keadaan, setKeadaan] = useState<KeadaanPosisi>("diam");
  const [nyala, setNyala] = useState(false);
  const terakhirLapor = useRef<{ pada: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!nyala) return;
    if (!("geolocation" in navigator)) {
      setKeadaan("gagal");
      return;
    }

    setKeadaan((k) => (k === "ada" ? k : "mencari"));
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const t = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          akurasi: pos.coords.accuracy,
        };
        setTitik(t);
        setKeadaan("ada");

        // Dilaporkan ke toko hanya bila sudah cukup lama atau cukup jauh.
        // Tanpa penahan ini, satu jam berkendara berarti ribuan tulisan ke
        // baris yang sama untuk menjawab satu pertanyaan: di mana dia sekarang.
        const l = terakhirLapor.current;
        const cukupLama = !l || Date.now() - l.pada > JEDA_LAPOR_MS;
        const cukupJauh = !l || jarakKm(l.lat, l.lng, t.lat, t.lng) > GESER_LAPOR_KM;
        if (cukupLama && cukupJauh) {
          terakhirLapor.current = { pada: Date.now(), lat: t.lat, lng: t.lng };
          void laporPosisi(t.lat, t.lng);
        }
      },
      (e) => setKeadaan(e.code === e.PERMISSION_DENIED ? "ditolak" : "gagal"),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [nyala]);

  return { titik, keadaan, nyalakan: () => setNyala(true), nyala };
}
