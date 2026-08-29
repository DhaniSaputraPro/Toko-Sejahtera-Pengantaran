import { useState } from "react";
import { pasangTema, temaTampil } from "@/lib/tema";
import { IkonBulan, IkonMatahari } from "@/komponen/Ikon";

/**
 * Sakelar terang/gelap: dua ikon, dan yang menyala adalah yang sedang tampil.
 *
 * Pilihan "ikut HP" dibuang dari layar, bukan dari kode. Sebelum kurir menyentuh
 * apa pun, aplikasinya MEMANG masih ikut HP — dan sakelar ini cuma menunjukkan
 * hasilnya. Yang ditawarkan ke orang yang sedang berdiri di tepi jalan adalah
 * dua keadaan yang bisa ia lihat, bukan tiga kata yang harus ia bandingkan.
 */
export function PilihTema({ className }: { className?: string }) {
  const [tampil, setTampil] = useState<"terang" | "gelap">(temaTampil);

  const pilih = (t: "terang" | "gelap") => {
    pasangTema(t);
    setTampil(t);
  };

  return (
    <div className={`segmen segmen-ikon${className ? ` ${className}` : ""}`} role="group">
      <button
        type="button"
        className="segmen-butir"
        aria-pressed={tampil === "terang"}
        aria-label="Tampilan terang"
        onClick={() => pilih("terang")}
      >
        <IkonMatahari ukuran={17} />
      </button>
      <button
        type="button"
        className="segmen-butir"
        aria-pressed={tampil === "gelap"}
        aria-label="Tampilan gelap"
        onClick={() => pilih("gelap")}
      >
        <IkonBulan ukuran={17} />
      </button>
    </div>
  );
}
