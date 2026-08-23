import { useState } from "react";
import { Pemindai } from "@/komponen/Pemindai";
import { jalurDari, kameraAda } from "@/lib/pindai";
import { IkonQr, IkonTruk } from "@/komponen/Ikon";

/**
 * Layar sebelum ada sesi apa pun.
 *
 * Satu tombol, dan satu kalimat yang menerangkannya. Layar ini dulu memuat
 * daftar tiga langkah "cara masuk" — tetapi yang membacanya sudah berdiri di
 * depan admin yang sedang menampilkan QR-nya, dan tidak ada satu pun dari tiga
 * langkah itu yang belum ia jalani.
 *
 * Tempel-tautan tetap ada, dilipat: jalan cadangan untuk peranti yang kameranya
 * tidak bisa dipakai peramban.
 */
export function LayarBelumMasuk({ buka }: { buka: (jalur: string) => void }) {
  const [tautan, setTautan] = useState("");
  const [pindai, setPindai] = useState(false);
  const [pakaiTautan, setPakaiTautan] = useState(false);

  const tujuan = jalurDari(tautan);
  const bisaPindai = kameraAda();

  return (
    <div className="layar">
      <div className="isi" style={{ justifyContent: "center", gap: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 64,
              height: 64,
              borderRadius: 22,
              background: "var(--biru-lembut)",
              color: "var(--biru)",
              marginBottom: 14,
            }}
          >
            <IkonTruk ukuran={30} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 700 }}>Kurir Toko Sejahtera</div>
          <div className="lembut" style={{ marginTop: 6 }}>
            Pindai QR dari admin toko atau dari surat jalan.
          </div>
        </div>

        {bisaPindai && (
          <button className="tombol tombol-utama tombol-penuh" onClick={() => setPindai(true)}>
            <IkonQr ukuran={20} />
            Pindai QR
          </button>
        )}

        {/* Jalan cadangan, dan memang cadangan: dilipat sampai diminta.
            Sebagian kamera bawaan membuka hasil pindaian di peramban
            dalam-aplikasi yang penyimpanannya dibuang saat ditutup, dan dari
            sanalah tautan itu ditempel ke sini. Jarang dipakai, tapi tanpa itu
            kurirnya tidak punya jalan lain sama sekali. */}
        {!pakaiTautan ? (
          <button
            className="tombol tombol-kecil"
            onClick={() => setPakaiTautan(true)}
            style={{ alignSelf: "center", background: "none", border: 0, color: "var(--biru)" }}
          >
            {bisaPindai ? "Punya tautan undangan?" : "Masuk dengan tautan undangan"}
          </button>
        ) : (
          <div className="kartu">
            <input
              className="medan"
              value={tautan}
              onChange={(e) => setTautan(e.target.value)}
              placeholder="Tempel tautan dari admin"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
            <button
              className="tombol tombol-penuh"
              style={{ marginTop: 10 }}
              disabled={!tujuan}
              onClick={() => tujuan && buka(tujuan)}
            >
              Masuk
            </button>
            {tautan.trim() !== "" && !tujuan && (
              <div className="samar" style={{ marginTop: 8, color: "var(--merah)" }}>
                Tautan itu tidak memuat kode undangan.
              </div>
            )}
          </div>
        )}
      </div>

      {pindai && (
        <Pemindai
          judul="Pindai QR"
          petunjuk="Arahkan ke QR di layar admin atau di surat jalan."
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
