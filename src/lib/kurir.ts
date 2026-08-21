// Seluruh percakapan aplikasi ini dengan basis data.
//
// Semua lewat RPC bertoken. Tidak ada satu pun `select` ke tabel `pesanan` dari
// sini — dan memang tidak bisa: tabelnya tertutup untuk anon, dan itulah yang
// membuat token sesi berarti sesuatu.

import { fungsi, rpc } from "./supabase";
import { ambilToken, type ProfilKurir } from "./sesi";

export interface BarangRingkas {
  nama: string;
  jumlah: number;
}

export interface Tugas {
  id: string;
  nomor: string;
  nama_penerima: string;
  telepon: string;
  alamat: string;
  patokan: string;
  foto_alamat_url: string;
  lat: number | null;
  lng: number | null;
  /** Jarak dari TOKO saat pesanan dibuat — bukan dari posisi kurir sekarang. */
  jarak_km: number | null;
  subtotal: number;
  ongkir: number;
  total: number;
  metode_bayar: string;
  status_bayar: "menunggu" | "dibayar" | "gagal";
  status: string;
  catatan: string;
  siap_jemput_pada: string | null;
  dijemput_pada: string | null;
  dibuat: string;
  barang: BarangRingkas[];
}

export interface Riwayat {
  id: string;
  nomor: string;
  nama_penerima: string;
  alamat: string;
  total: number;
  metode_bayar: string;
  status: string;
  selesai_pada: string | null;
  bukti_antar_url: string;
  catatan_antar: string;
}

/** Dilempar saat token ditolak, supaya pemanggil bisa membedakannya dari galat jaringan. */
export class SesiTidakBerlaku extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "SesiTidakBerlaku";
  }
}

function token(): string {
  const t = ambilToken();
  if (!t) throw new SesiTidakBerlaku("Belum masuk.");
  return t;
}

/**
 * Penolakan token dari basis data selalu berbunyi sama, apa pun sebabnya.
 * Di sini bunyinya diubah jadi jenis galat tersendiri supaya layar bisa
 * memindahkan kurir ke halaman "pindai ulang", bukan sekadar menampilkan pesan
 * merah yang tidak bisa ditindaklanjuti.
 */
function terjemahkan(pesan: string): Error {
  return /sesi kurir tidak berlaku/i.test(pesan)
    ? new SesiTidakBerlaku(pesan)
    : new Error(pesan);
}

async function panggil<T>(nama: string, arg: Record<string, unknown>): Promise<T> {
  try {
    return await rpc<T>(nama, arg);
  } catch (e) {
    throw terjemahkan(e instanceof Error ? e.message : String(e));
  }
}

/** Tukar token undangan dari QR dengan sesi peranti. */
export const masuk = (undangan: string): Promise<{ token: string; kurir: ProfilKurir }> =>
  rpc("kurir_masuk", {
    p_undangan: undangan,
    // Sekadar penanda supaya admin bisa mengenali peranti mana yang dicabut.
    p_peranti: navigator.userAgent.slice(0, 180),
  });

export const profilSaya = (): Promise<ProfilKurir> =>
  panggil<ProfilKurir>("kurir_saya", { p_token: token() });

export const ambilTugas = (): Promise<Tugas[]> =>
  panggil<Tugas[]>("kurir_tugas", { p_token: token() }).then((t) => t ?? []);

export const ambilRiwayat = (batas = 30): Promise<Riwayat[]> =>
  panggil<Riwayat[]>("kurir_riwayat", { p_token: token(), p_batas: batas }).then((t) => t ?? []);

export const jemput = (pesananId: string): Promise<unknown> =>
  panggil("kurir_jemput", { p_token: token(), p_pesanan_id: pesananId });

export const selesaikan = (
  pesananId: string,
  opsi: { catatan?: string; buktiUrl?: string; codDiterima?: boolean } = {},
): Promise<unknown> =>
  panggil("kurir_selesai", {
    p_token: token(),
    p_pesanan_id: pesananId,
    p_catatan: opsi.catatan ?? "",
    p_bukti_url: opsi.buktiUrl ?? "",
    p_cod_diterima: opsi.codDiterima ?? false,
  });

export const gagalkan = (pesananId: string, alasan: string): Promise<unknown> =>
  panggil("kurir_gagal", { p_token: token(), p_pesanan_id: pesananId, p_alasan: alasan });

/**
 * Laporkan posisi. Sengaja tidak melempar galat.
 *
 * Ini pekerjaan latar untuk kenyamanan admin, bukan bagian dari tugas kurir.
 * Kegagalannya tidak boleh muncul sebagai pesan merah di atas daftar antar —
 * kurir tidak bisa berbuat apa pun tentangnya, dan sedang menyetir.
 */
export async function laporPosisi(lat: number, lng: number): Promise<void> {
  try {
    const t = ambilToken();
    if (!t) return;
    await rpc("kurir_posisi", { p_token: t, p_lat: lat, p_lng: lng });
  } catch {
    /* diam */
  }
}

/**
 * Unggah foto serah terima lewat Edge Function.
 *
 * Bukan langsung ke storage: bucket `bukti` hanya mengizinkan staf mengunggah,
 * dan melonggarkannya untuk anon berarti membukanya untuk siapa pun yang
 * memegang kunci publikasi.
 */
export async function unggahBukti(pesananId: string, berkas: Blob): Promise<string> {
  const form = new FormData();
  form.append("token", token());
  form.append("pesanan_id", pesananId);
  form.append("foto", berkas, "bukti.jpg");

  const { url } = await fungsi<{ url?: string }>("kurir-bukti", form);
  if (!url) throw new Error("Foto terunggah tapi alamatnya tidak dikembalikan.");
  return url;
}
