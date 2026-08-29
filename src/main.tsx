import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Aplikasi } from "./App";
import { terapkanFavikon } from "./lib/favikon";
import { mulaiTema } from "./lib/tema";
import "./index.css";

// Di luar React: ikonnya milik dokumen, bukan milik pohon komponen, dan tidak
// ada satu pun layar yang menunggunya. Dijalankan sekali saat modul dimuat,
// jadi StrictMode yang memasang-melepas komponen dua kali tidak ikut
// menggandakan permintaannya.
void terapkanFavikon();

// Sebelum React menggambar apa pun: tema yang dipasang setelah layar tergambar
// terlihat sebagai kedipan putih di tangan kurir yang memilih gelap.
mulaiTema();

const akar = document.getElementById("akar");
if (!akar) throw new Error("Elemen #akar tidak ditemukan.");

createRoot(akar).render(
  <StrictMode>
    <Aplikasi />
  </StrictMode>,
);
