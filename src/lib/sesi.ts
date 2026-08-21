// Token sesi kurir di peranti ini.
//
// Disimpan di localStorage, bukan cookie: tidak ada server milik aplikasi ini
// yang perlu membacanya — seluruh pemeriksaan terjadi di Postgres, dan tokennya
// dikirim sebagai argumen RPC.

const KUNCI = "kurir.sesi";
const KUNCI_PROFIL = "kurir.profil";

export interface ProfilKurir {
  id: string;
  nama: string;
  telepon: string;
  plat: string;
  jenis_kendaraan: string;
  toko: { nama: string; lat: number | null; lng: number | null };
}

export function ambilToken(): string | null {
  try {
    const t = localStorage.getItem(KUNCI);
    // Token selalu 64 hex. Apa pun yang lain sisa percobaan atau suntingan
    // manual, dan mengirimkannya cuma menghasilkan penolakan yang bisa dihindari.
    return t && t.length === 64 ? t : null;
  } catch {
    return null;
  }
}

export function simpanSesi(token: string, profil: ProfilKurir): void {
  try {
    localStorage.setItem(KUNCI, token);
    localStorage.setItem(KUNCI_PROFIL, JSON.stringify(profil));
  } catch {
    // Mode penyamaran menolak menulis. Sesinya tetap hidup selama tab terbuka.
  }
}

/**
 * Profil yang terakhir diketahui, dipakai menggambar layar SEBELUM jawaban
 * server datang. Di jaringan buruk itu selisih antara layar kosong beberapa
 * detik dan aplikasi yang langsung terlihat siap.
 */
export function profilTersimpan(): ProfilKurir | null {
  try {
    const t = localStorage.getItem(KUNCI_PROFIL);
    return t ? (JSON.parse(t) as ProfilKurir) : null;
  } catch {
    return null;
  }
}

export function hapusSesi(): void {
  try {
    localStorage.removeItem(KUNCI);
    localStorage.removeItem(KUNCI_PROFIL);
  } catch {
    /* tidak ada yang bisa dilakukan, dan tidak ada yang perlu dilakukan */
  }
}
