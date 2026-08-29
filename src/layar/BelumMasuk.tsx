import { useState } from "react";
import { Pemindai } from "@/komponen/Pemindai";
import { PilihTema } from "@/komponen/PilihTema";
import { LogoToko } from "@/komponen/LogoToko";
import { jalurDari, kameraAda } from "@/lib/pindai";
import { IkonQr } from "@/komponen/Ikon";

/**
 * Layar sebelum ada sesi apa pun.
 *
 * Satu tombol besar, satu kolom tautan, satu pengatur tema. Tidak ada kalimat
 * yang menerangkan tombol yang sudah menyebut dirinya sendiri: yang membaca
 * layar ini sedang berdiri di depan admin yang menampilkan QR-nya.
 */
export function LayarBelumMasuk({ buka }: { buka: (jalur: string) => void }) {
  const [tautan, setTautan] = useState("");
  const [pindai, setPindai] = useState(false);

  const tujuan = jalurDari(tautan);
  const bisaPindai = kameraAda();

  return (
    <div className="layar">
      <div className="isi" style={{ justifyContent: "center", gap: 16 }}>
        <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
          <LogoToko ukuran={64} />
          <div className="judul-besar">Pengantaran Toko Sejahtera</div>
        </div>

        {bisaPindai && (
          <button className="tombol tombol-utama tombol-penuh" onClick={() => setPindai(true)}>
            <IkonQr ukuran={20} />
            Pindai QR
          </button>
        )}

        {/* Terbuka apa adanya, tidak dilipat. Yang datang lewat jalan ini
            biasanya sudah memegang tautannya di papan tempel — menyembunyikan
            kolomnya di balik satu ketukan lagi cuma menambah satu ketukan. */}
        <div className="kartu">
          <input
            className="medan"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
            placeholder="Tempel tautan undangan"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="tombol tombol-penuh"
            style={{ marginTop: 10 }}
            disabled={!tujuan}
            onClick={() => tujuan && buka(tujuan)}
          >
            Masuk dengan tautan
          </button>
          {tautan.trim() !== "" && !tujuan && (
            <div className="samar" style={{ marginTop: 8, color: "var(--merah)" }}>
              Tautan itu tidak memuat kode undangan.
            </div>
          )}
        </div>

        <PilihTema className="segmen-tengah" />
      </div>

      {pindai && (
        <Pemindai
          judul="Pindai QR"
          petunjuk="Arahkan ke QR di layar admin atau di lembar rit."
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
