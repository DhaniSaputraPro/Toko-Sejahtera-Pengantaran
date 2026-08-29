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
              borderRadius: 980,
              background: "var(--biru-lembut)",
              color: "var(--biru)",
            }}
          >
            <IkonOrang ukuran={24} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="judul" style={{ display: "block" }}>
              {profil?.nama ?? "—"}
            </span>
            <span className="lembut angka">
              {profil?.telepon ? tampilTelepon(profil.telepon) : ""}
            </span>
          </span>
        </div>

        <div className="baris" style={{ gap: 8, marginTop: 12 }}>
          {(profil?.jenis_kendaraan || profil?.plat) && (
            <span className="baris lembut" style={{ gap: 7, flex: 1 }}>
              <IkonTruk ukuran={17} />
              {[profil?.jenis_kendaraan, profil?.plat].filter(Boolean).join(" · ")}
            </span>
          )}
          {/* "Sampai", bukan "selesai": pekerjaan kurir habis begitu ia
              menyerahkan barangnya, dan yang menyatakan selesai adalah pembeli
              di aplikasinya sendiri — kadang berhari-hari kemudian.
              Hijau hanya kalau memang ada. Nol berlencana hijau memberi selamat
              atas sesuatu yang belum terjadi. */}
          <span className={`lencana angka ${hariIni.length > 0 ? "lencana-hijau" : "lencana-abu"}`}>
            {hariIni.length} sampai hari ini
          </span>
        </div>
      </div>

      {/* Surat jalan sampai ke tangan kurir SETELAH ia masuk — dititipkan staf
          gudang, kadang di tengah rute. Tanpa tombol ini ia harus keluar dari
          aplikasi, membuka kamera bawaan, dan kembali lewat peramban ke tempat
          yang sedang dipegangnya. Tombolnya berdiri sendiri tanpa kartu dan
          tanpa keterangan: yang ditulisnya sudah menyebutkan seluruh isinya. */}
      {kameraAda() && (
        <button className="tombol tombol-penuh" onClick={() => setPindai(true)}>
          <IkonQr ukuran={18} />
          Pindai surat jalan
        </button>
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
          <div className="lembut">Belum ada yang sampai.</div>
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

      {/* Dua ketukan, bukan dialog: keluar berarti memindai QR baru dari admin,
          dan itu terlalu mahal untuk terjadi karena jari yang meleset. */}
      <button
        className="tombol tombol-bahaya tombol-penuh"
        style={{ marginTop: 6 }}
        onClick={() => (pastikan ? keluar() : setPastikan(true))}
        onBlur={() => setPastikan(false)}
      >
        <IkonKeluar ukuran={18} />
        {pastikan ? "Ketuk sekali lagi untuk keluar" : "Keluar"}
      </button>

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
