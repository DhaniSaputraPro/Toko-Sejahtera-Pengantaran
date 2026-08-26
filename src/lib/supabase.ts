// Pemanggil Supabase seadanya: RPC dan satu Edge Function, lewat fetch biasa.
//
// ── Kenapa bukan @supabase/supabase-js ─────────────────────────────────────
//
// Pustaka resminya membawa auth, realtime, storage, dan PostgREST sekaligus:
// 442 KB mentah, 127 KB terkompresi. Aplikasi ini memakai DUA di antaranya —
// satu panggilan RPC dan satu unggahan ke Edge Function — dan sisanya diunduh
// oleh kurir lewat jaringan seluler di tepi jalan tanpa pernah dijalankan.
//
// Yang paling tidak terpakai justru bagian auth-nya. Kurir TIDAK punya akun
// Supabase; yang dipegangnya token sesi peranti yang dikirim sebagai argumen
// RPC. Seluruh mesin penyimpan-dan-menyegarkan sesi di pustaka itu menjaga
// sesuatu yang tidak pernah ada.
//
// Yang tersisa cuma dua bentuk permintaan HTTP, dan keduanya di bawah.

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const kunci = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const konfigurasiLengkap = Boolean(url && kunci);

/** Bentuk galat PostgREST. Pesannya ditulis RPC untuk dibaca orang, jadi dipakai apa adanya. */
interface GalatPostgrest {
  message?: string;
  hint?: string;
  details?: string;
}

function siap(): { url: string; kunci: string } {
  if (!url || !kunci) throw new Error("Aplikasi belum dikonfigurasi (VITE_SUPABASE_*).");
  return { url, kunci };
}

/**
 * Panggil fungsi Postgres.
 *
 * `Authorization` diisi kunci publikasi yang sama dengan `apikey` — itulah
 * yang membuat permintaannya berjalan sebagai peran `anon`, yang memang satu-
 * satunya peran yang dipakai aplikasi ini. Yang menentukan boleh-tidaknya
 * bukan header ini melainkan token sesi di dalam badan permintaan.
 */
export async function rpc<T>(nama: string, arg: Record<string, unknown>): Promise<T> {
  const { url, kunci } = siap();

  let jawaban: Response;
  try {
    jawaban = await fetch(`${url}/rest/v1/rpc/${nama}`, {
      method: "POST",
      headers: {
        apikey: kunci,
        Authorization: `Bearer ${kunci}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(arg),
    });
  } catch {
    // Satu-satunya galat yang benar-benar sering terjadi di HP yang bergerak,
    // dan satu-satunya yang bisa ditindaklanjuti kurir.
    throw new Error("Tidak ada sambungan. Periksa sinyal, lalu coba lagi.");
  }

  const teks = await jawaban.text();
  if (!jawaban.ok) {
    let pesan = `Permintaan ditolak (${jawaban.status}).`;
    try {
      const g = JSON.parse(teks) as GalatPostgrest;
      if (g.message) pesan = g.message;
    } catch {
      /* jawaban bukan JSON — pakai pesan bawaan di atas */
    }
    throw new Error(pesan);
  }

  // Fungsi `returns void` menjawab dengan badan kosong.
  return (teks ? (JSON.parse(teks) as T) : (null as T));
}

/**
 * Baca tabel lewat PostgREST.
 *
 * Ada karena satu hal yang dibutuhkan aplikasi ini memang cuma bisa dibaca dari
 * tabel: ikon toko, yang diatur staf di admin. Tetap `anon` seperti `rpc`, dan
 * yang boleh terbaca ditentukan RLS — tabel yang tidak dibuka untuk publik
 * menjawab dengan larik kosong, bukan dengan datanya.
 *
 * Galatnya dikembalikan sebagai `null`, tidak dilempar: satu-satunya pemakainya
 * sekarang adalah hal yang boleh gagal tanpa ada yang perlu tahu.
 */
export async function baca<T>(jalur: string): Promise<T[] | null> {
  if (!url || !kunci) return null;
  try {
    const jawaban = await fetch(`${url}/rest/v1/${jalur}`, {
      headers: {
        apikey: kunci,
        Authorization: `Bearer ${kunci}`,
        Accept: "application/json",
      },
    });
    if (!jawaban.ok) return null;
    return (await jawaban.json()) as T[];
  } catch {
    return null;
  }
}

/** Kirim FormData ke Edge Function dan kembalikan jawabannya. */
export async function fungsi<T>(nama: string, form: FormData): Promise<T> {
  const { url, kunci } = siap();

  let jawaban: Response;
  try {
    jawaban = await fetch(`${url}/functions/v1/${nama}`, {
      method: "POST",
      // Content-Type sengaja TIDAK diisi: peramban yang menyusunnya sendiri
      // lengkap dengan boundary multipart. Mengisinya manual merusak itu.
      headers: { apikey: kunci, Authorization: `Bearer ${kunci}` },
      body: form,
    });
  } catch {
    throw new Error("Tidak ada sambungan. Periksa sinyal, lalu coba lagi.");
  }

  const isi = (await jawaban.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!jawaban.ok) throw new Error(isi?.error ?? `Gagal (${jawaban.status}).`);
  if (!isi) throw new Error("Jawaban server tidak terbaca.");
  return isi;
}
