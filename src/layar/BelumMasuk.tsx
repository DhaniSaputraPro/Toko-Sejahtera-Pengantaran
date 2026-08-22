import { useState } from "react";
import { Pemindai } from "@/komponen/Pemindai";
import { jalurDari, kameraAda } from "@/lib/pindai";
import { IkonQr, IkonTruk } from "@/komponen/Ikon";

/**
 * Layar sebelum ada sesi apa pun.
 *
 * Tiga jalan masuk, dan urutannya di layar mengikuti seberapa sering dipakai:
 *
 * 1. **Memindai dari dalam aplikasi.** Jalan utama. Kamera bawaan HP membuka
 *    hasil pindaiannya di peramban, dan itu belum tentu tempat aplikasi ini
 *    berada — lihat `src/lib/pindai.ts`.
 * 2. Memindai dengan kamera bawaan HP. Tetap bekerja, dan tetap diterangkan:
 *    kurir yang belum memasang aplikasi ini memang harus lewat sana sekali.
 * 3. Menempel tautan undangan. Jalan cadangan untuk peranti yang kameranya
 *    tidak bisa dipakai peramban sama sekali.
 */
export function LayarBelumMasuk({ buka }: { buka: (jalur: string) => void }) {
  const [tautan, setTautan] = useState("");
  const [pindai, setPindai] = useState(false);

  const tujuan = jalurDari(tautan);
  const bisaPindai = kameraAda();

  return (
    <div className="layar">
      <div className="isi" style={{ justifyContent: "center", gap: 20 }}>
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
            Aplikasi ini dipakai mitra kurir untuk mengantar pesanan.
          </div>
        </div>

        {bisaPindai && (
          <button className="tombol tombol-utama tombol-penuh" onClick={() => setPindai(true)}>
            <IkonQr ukuran={20} />
            Pindai QR
          </button>
        )}

        <div className="kartu">
          <div className="baris" style={{ gap: 10, marginBottom: 10 }}>
            <span style={{ color: "var(--biru)" }}>
              <IkonQr ukuran={22} />
            </span>
            <strong>Cara masuk</strong>
          </div>
          <ol
            className="lembut"
            style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 7, lineHeight: 1.5 }}
          >
            <li>Datang ke toko dan sebutkan nama serta nomor WhatsApp Anda.</li>
            <li>Admin membuatkan akun dan menampilkan kode QR di layarnya.</li>
            <li>
              {bisaPindai
                ? "Ketuk Pindai QR di atas, lalu arahkan kamera ke layar admin."
                : "Pindai QR itu dengan kamera HP Anda — aplikasi ini akan terbuka sendiri."}
            </li>
          </ol>
          <div className="samar" style={{ marginTop: 10 }}>
            QR berlaku 20 menit dan hanya sekali pakai.
          </div>
        </div>

        <div className="kartu">
          <div className="judul-kecil" style={{ marginBottom: 8 }}>
            Sudah punya tautan undangan?
          </div>
          <input
            className="medan"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
            placeholder="Tempel tautan dari admin di sini"
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
              Tautan itu tidak memuat kode undangan yang benar.
            </div>
          )}
        </div>
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
