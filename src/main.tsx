import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Aplikasi } from "./App";
import "./index.css";

const akar = document.getElementById("akar");
if (!akar) throw new Error("Elemen #akar tidak ditemukan.");

createRoot(akar).render(
  <StrictMode>
    <Aplikasi />
  </StrictMode>,
);
