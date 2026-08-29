import { useEffect, useState } from "react";
import { ikonToko } from "@/lib/favikon";
import { IkonTruk } from "@/komponen/Ikon";

/**
 * Logo aplikasi: ikon toko yang sama dengan yang dipasang di tab peramban,
 * diatur staf di halaman Identitas pada admin.
 *
 * Truk bawaan tetap ada sebagai jaring: ia yang tampil selama ikonnya belum
 * sampai, saat kolomnya memang kosong, dan saat berkasnya gagal dimuat. Logo
 * yang kadang-kadang jadi kotak kosong lebih buruk daripada logo yang sama
 * untuk semua toko.
 */
export function LogoToko({ ukuran, kotak }: { ukuran: number; kotak: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    void ikonToko().then((u) => hidup && setUrl(u));
    return () => {
      hidup = false;
    };
  }, []);

  const pakaiIkon = url && !gagal;

  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        flex: "none",
        width: kotak,
        height: kotak,
        borderRadius: kotak >= 56 ? 20 : 980,
        background: pakaiIkon ? "var(--kartu)" : "var(--biru)",
        border: pakaiIkon ? "1px solid var(--garis)" : undefined,
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {pakaiIkon ? (
        <img
          src={url}
          alt=""
          width={ukuran}
          height={ukuran}
          onError={() => setGagal(true)}
          style={{ width: ukuran, height: ukuran, objectFit: "contain", display: "block" }}
        />
      ) : (
        <IkonTruk ukuran={ukuran} />
      )}
    </span>
  );
}
