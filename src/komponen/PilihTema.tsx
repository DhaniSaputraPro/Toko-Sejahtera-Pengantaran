import { useState } from "react";
import { PILIHAN, pasangTema, temaTersimpan, type Tema } from "@/lib/tema";

/**
 * Pengatur tema, berbentuk kendali bersegmen — bentuk yang dipakai macOS untuk
 * pertanyaan yang jawabannya sedikit dan saling meniadakan.
 *
 * Tiga pilihan, bukan satu sakelar. "Ikut HP" bukan kemewahan: itulah yang
 * membuat aplikasinya gelap sendiri saat HP kurir gelap sendiri di malam hari,
 * dan itu yang benar untuk hampir semua orang. Dua yang lain untuk yang
 * matanya berkata lain.
 */
export function PilihTema() {
  const [tema, setTema] = useState<Tema>(temaTersimpan);

  return (
    <div className="segmen" role="group" aria-label="Tema tampilan">
      {PILIHAN.map((p) => (
        <button
          key={p.nilai}
          type="button"
          className="segmen-butir"
          aria-pressed={tema === p.nilai}
          onClick={() => {
            pasangTema(p.nilai);
            setTema(p.nilai);
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
