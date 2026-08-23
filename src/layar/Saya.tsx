import { useCallback, useEffect, useState } from "react";
import { SesiTidakBerlaku, ambilRiwayat, type Riwayat } from "@/lib/kurir";
import type { ProfilKurir } from "@/lib/sesi";
import { rp, tampilTelepon, tanggalJam } from "@/lib/format";
import { Pemindai } from "@/komponen/Pemindai";
import { jalurDari, kameraAda } from "@/lib/pindai";
import { IkonKeluar, IkonOrang, IkonPaket, IkonQr, IkonTruk } from "@/komponen/Ikon";

export function LayarSaya({
  profil,
  buka,
  keluar,
  keluarSesi,
}: {
  profil: ProfilKurir | null;
  buka: (jalur: string) => void;
  keluar: () => void;
  keluarSesi: () => void;
}) {
  const [riwayat, setRiwayat] = useState<Riwayat[] | null>(null);
  const [galat, setGalat] = useState("");
  const [pastikan, setPastikan] = useState(false);
  const [pindai, setPindai] = useState(false);

  const muat = useCallback(async () => {
    try {
      setRiwayat(await ambilRiwayat(30));
    } catch (e) {
      if (e instanceof SesiTidakBerlaku) keluarSesi();
      else setGalat(e instanceof Error ? e.message : "Gagal memuat riwayat.");
    }
  }, [keluarSesi]);

  useEffect(() => {
    void muat();
  }, [muat]);

  const hariIni = (riwayat ?? []).filter(
    (r) => r.selesai_pada && new Date(r.selesai_pada).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="isi">
      <div className="kartu">
        <div className="baris" style={{ gap: 12 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "var(--biru-lembut)",
              color: "var(--biru)",
            }}
          >
            <IkonOrang ukuran={24} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 18, fontWeight: 700 }}>
              {profil?.nama ?? "—"}
            </span>
            <span className="lembut angka">
              {profil?.telepon ? tampilTelepon(profil.telepon) : ""}
            </span>
          </span>
        </div>

        {(profil?.jenis_kendaraan || profil?.plat) && (
          <div className="baris lembut" style={{ gap: 8, marginTop: 12 }}>
            <IkonTruk ukuran={17} />
            {[profil?.jenis_kendaraan, profil?.plat].filter(Boolean).join(" · ")}
          </div>
        )}

        <div className="samar" style={{ marginTop: 10 }}>
          Mengantar untuk {profil?.toko.nama ?? "Toko Sejahtera"}. Data ini dibuat admin toko — bila
          ada yang keliru, mintalah admin mengubahnya.
        </div>
      </div>

      <div className="kartu">
        <div className="judul-kecil" style={{ marginBottom: 6 }}>
          Hari ini
        </div>
        <div style={{ fontSize: 26, fontWeight: 800 }} className="angka">
          {hariIni.length}
        </div>
        <div className="lembut">antaran sampai</div>
      </div>

      {/* Surat jalan sampai ke tangan kurir SETELAH ia masuk — dititipkan staf
          gudang, kadang di tengah rute. Tanpa tombol ini ia harus keluar dari
          aplikasi, membuka kamera bawaan, dan kembali lewat peramban ke tempat
          yang sedang dipegangnya. */}
      {kameraAda() && (
        <div className="kartu">
          <div className="judul-kecil" style={{ marginBottom: 6 }}>
            Surat jalan
          </div>
          <div className="lembut" style={{ marginBottom: 10 }}>
            Dapat lembar surat jalan dari toko? Pindai QR di lembarnya untuk mengambil seluruh
            ritnya sekaligus. Anda akan diminta mengisi nomor WhatsApp yang sama seperti sekarang.
          </div>
          <button className="tombol tombol-penuh" onClick={() => setPindai(true)}>
            <IkonQr ukuran={18} />
            Pindai surat jalan
          </button>
        </div>
      )}

      <div className="judul-kecil" style={{ padding: "4px 4px 0" }}>
        Riwayat antaran
      </div>

      {galat && <div className="pesan-galat">{galat}</div>}

      {riwayat === null && !galat ? (
        <div className="kartu" style={{ display: "grid", placeItems: "center", padding: 30 }}>
          <div className="putar" />
        </div>
      ) : (riwayat ?? []).length === 0 ? (
        <div
          className="kartu"
          style={{ textAlign: "center", padding: "30px 18px", color: "var(--teks-samar)" }}
        >
          <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}>
            <IkonPaket ukuran={26} />
          </div>
          <div className="lembut">Belum ada antaran yang sampai.</div>
        </div>
      ) : (
        (riwayat ?? []).map((r) => (
          <div key={r.id} className="kartu">
            <div className="baris" style={{ justifyContent: "space-between", gap: 8 }}>
              <strong>{r.nama_penerima}</strong>
              <span className="samar angka">{tanggalJam(r.selesai_pada)}</span>
            </div>
            <div className="lembut" style={{ marginTop: 2 }}>
              {r.alamat}
            </div>
            <div className="samar angka" style={{ marginTop: 4 }}>
              {r.nomor} · {rp(r.total)}
              {r.catatan_antar && ` · ${r.catatan_antar}`}
            </div>
          </div>
        ))
      )}

      <div className="kartu" style={{ marginTop: 6 }}>
        <div className="judul-kecil" style={{ marginBottom: 6 }}>
          Keluar
        </div>
        <div className="lembut" style={{ marginBottom: 10 }}>
          Aplikasi ini akan melupakan akun Anda di HP ini. Untuk masuk lagi, Anda perlu memindai QR
          baru dari admin toko.
        </div>
        <button
          className="tombol tombol-bahaya tombol-penuh"
          onClick={() => (pastikan ? keluar() : setPastikan(true))}
          onBlur={() => setPastikan(false)}
        >
          <IkonKeluar ukuran={18} />
          {pastikan ? "Ketuk sekali lagi untuk keluar" : "Keluar dari aplikasi"}
        </button>
      </div>

      {pindai && (
        <Pemindai
          judul="Pindai surat jalan"
          petunjuk="Arahkan ke QR di lembar surat jalan."
          tutup={() => setPindai(false)}
          terima={(teks) => {
            const jalur = jalurDari(teks);
            if (!jalur) return false;
            buka(jalur);
            return true;
          }}
        />
      )}
    </div>
  );
}
