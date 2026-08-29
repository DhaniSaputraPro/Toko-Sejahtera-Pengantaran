import { useEffect, useState } from "react";
import { ikonToko } from "@/lib/favikon";
import { IkonTruk } from "@/komponen/Ikon";

/**
 * Logo aplikasi: ikon toko yang sama dengan yang dipasang di tab peramban,
 * diatur staf di halaman Identitas pada admin.
 *
 * Digambar apa adanya, tanpa kotak putih di belakangnya. Ikon toko sudah punya
 * bentuk dan warnanya sendiri; membingkainya lagi berarti menggambar dua bentuk
 * untuk satu benda, dan yang kedua bukan milik siapa pun.
 *
 * Truk bawaan tetap ada sebagai jaring: ia yang tampil selama ikonnya belum
 * sampai, saat kolomnya memang kosong, dan saat berkasnya gagal dimuat. Logo
 * yang kadang-kadang jadi kotak kosong lebih buruk daripada logo yang sama
 * untuk semua toko.
 */
export function LogoToko({ ukuran }: { ukuran: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    void ikonToko().then((u) => hidup && setUrl(u));
    return () => {
      hidup = false;
    };
  }, []);

  if (url && !gagal) {
    return (
      <img
        src={url}
        alt=""
        width={ukuran}
        height={ukuran}
        onError={() => setGagal(true)}
        style={{
          width: ukuran,
          height: ukuran,
          objectFit: "contain",
          flex: "none",
          display: "block",
        }}
      />
    );
  }

  return (
    <span style={{ display: "grid", placeItems: "center", flex: "none", color: "var(--biru)" }}>
      <IkonTruk ukuran={ukuran} />
    </span>
  );
}
