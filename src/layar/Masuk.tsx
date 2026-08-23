import { useEffect, useRef, useState } from "react";
import { masuk } from "@/lib/kurir";
import { simpanSesi, type ProfilKurir } from "@/lib/sesi";
import { IkonPeringatan, IkonTruk } from "@/komponen/Ikon";

/**
 * Layar yang terbuka begitu QR dipindai: `/masuk/<token>`.
 *
 * Penukarannya dijalankan sekali saja, dijaga `ref` — bukan hanya oleh daftar
 * dependensi `useEffect`. Dalam StrictMode React sengaja menjalankan efek dua
 * kali saat pengembangan, dan undangan ini SEKALI PAKAI: penukaran kedua akan
 * menghanguskan sesi yang barusan berhasil dibuat dan memulangkan kurir ke
 * layar galat dengan alasan yang tidak masuk akal baginya.
 */
export function LayarMasuk({
  token,
  selesai,
}: {
  token: string;
  selesai: (profil: ProfilKurir) => void;
}) {
  const [galat, setGalat] = useState("");
  const sudah = useRef(false);

  useEffect(() => {
    if (sudah.current) return;
    sudah.current = true;

    void (async () => {
      try {
        const hasil = await masuk(token);
        simpanSesi(hasil.token, hasil.kurir);
        selesai(hasil.kurir);
      } catch (e) {
        setGalat(e instanceof Error ? e.message : "Gagal masuk.");
      }
    })();
  }, [token, selesai]);

  return (
    <div className="layar">
      <div
        className="isi"
        style={{ justifyContent: "center", alignItems: "center", textAlign: "center", gap: 18 }}
      >
        {galat ? (
          <>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 64,
                height: 64,
                borderRadius: 22,
                background: "var(--merah-lembut)",
                color: "var(--merah)",
              }}
            >
              <IkonPeringatan ukuran={30} />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Belum bisa masuk</div>
              <div className="lembut" style={{ maxWidth: 320 }}>
                {galat}
              </div>
            </div>
            <div className="samar" style={{ maxWidth: 320 }}>
              QR berlaku 20 menit dan sekali pakai. Minta yang baru ke admin.
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 64,
                height: 64,
                borderRadius: 22,
                background: "var(--biru-lembut)",
                color: "var(--biru)",
              }}
            >
              <IkonTruk ukuran={30} />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>Menyiapkan akun…</div>
            </div>
            <div className="putar" />
          </>
        )}
      </div>
    </div>
  );
}
