import { useState } from "react";
import { IkonQr, IkonTruk } from "@/komponen/Ikon";

/**
 * Layar sebelum ada sesi apa pun.
 *
 * Selain menerangkan cara masuk, ia menyediakan satu jalan cadangan: menempel
 * tautan undangan. Itu bukan kemewahan — kamera bawaan sebagian HP membuka
 * tautan hasil pindaian di peramban dalam-aplikasi (Instagram, WhatsApp,
 * Google Lens) yang punya penyimpanan sendiri. Sesinya tersimpan di sana, lalu
 * hilang begitu peramban itu ditutup. Menempel tautannya ke peramban biasa
 * membuat masuknya menempel di tempat yang benar.
 */
export function LayarBelumMasuk({ buka }: { buka: (jalur: string) => void }) {
  const [tautan, setTautan] = useState("");

  const tujuan = jalurDari(tautan);

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
            <li>Pindai QR itu dengan kamera HP Anda — aplikasi ini akan terbuka sendiri.</li>
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
            className="tombol tombol-utama tombol-penuh"
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
    </div>
  );
}

/**
 * Ubah apa pun yang ditempel jadi jalur yang benar.
 *
 * Ada DUA bentuk tautan yang sah, dan keduanya berujung di layar yang berbeda:
 * `/masuk/<token>` untuk undangan dari halaman Kurir, `/rit/<token>` untuk QR
 * pada surat jalan cetak. Menebak salah satu berarti mitra dibawa ke layar yang
 * menolak tokennya dengan alasan yang tidak masuk akal baginya.
 *
 * Kalau yang ditempel cuma tokennya saja — tanpa jalur — tidak ada cara
 * membedakannya, dan `/masuk/` dipilih karena itulah bentuk yang dibagikan
 * lewat tombol "Salin tautan" di halaman Kurir.
 *
 * Sengaja tidak memakai `new URL()` sebagai satu-satunya jalan: yang tertempel
 * sering sudah terpotong, dan potongannya masih bisa dipakai.
 */
function jalurDari(teks: string): string | null {
  const bersih = teks.trim();
  const cocok = bersih.match(/[0-9a-f]{64}/i);
  if (!cocok) return null;
  const token = cocok[0].toLowerCase();
  return /\/rit\//i.test(bersih) ? `/rit/${token}` : `/masuk/${token}`;
}
